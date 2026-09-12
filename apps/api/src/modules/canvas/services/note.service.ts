import { prisma } from '../config/database'

export interface CreateNoteInput {
  title?: string
  content?: string
  folder?: string | null
  tags?: string[]
  canvasId?: string
  links?: Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }>
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  folder?: string | null
  tags?: string[]
  canvasId?: string
  links?: Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }>
}

export interface NoteQueryInput {
  folder?: string
  tag?: string
  search?: string
  page?: number
  limit?: number
}

function extractNoteLinks(content: string): Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }> {
  const links: Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }> = []
  const regex = /!\[\[(canvas|book|note):([a-zA-Z0-9_-]+)\]\]/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    const rawType = match[1]?.toUpperCase()
    const targetId = match[2]
    if (targetId && (rawType === 'CANVAS' || rawType === 'BOOK' || rawType === 'NOTE')) {
      links.push({
        target_type: rawType,
        target_id: targetId,
      })
    }
  }
  return links
}

export class NoteService {
  async getAllByUser(userId: number, query: NoteQueryInput = {}) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 50
    const skip = (page - 1) * limit

    const whereClause: any = {
      user_id: userId,
    }

    if (query.folder !== undefined) {
      whereClause.folder = query.folder
    }

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
      ]
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: whereClause,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
        include: {
          noteLinks: true,
        },
      }),
      prisma.note.count({ where: whereClause }),
    ])

    const formattedNotes = notes.map((n) => {
      let parsedTags: string[] = []
      try {
        parsedTags = JSON.parse(n.tags)
      } catch {
        parsedTags = []
      }
      return {
        id: n.id,
        userId: n.user_id,
        title: n.title,
        content: n.content,
        folder: n.folder,
        tags: parsedTags,
        linksCount: n.noteLinks.length,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }
    })

    // Se houver filtro por tag na memória se necessário
    const filtered = query.tag
      ? formattedNotes.filter((n) => n.tags.includes(query.tag!))
      : formattedNotes

    return {
      notes: filtered,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getById(id: string, userId: number) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        noteLinks: true,
      },
    })

    if (!note || note.user_id !== userId) {
      throw new Error('Nota não encontrada')
    }

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(note.tags)
    } catch {
      parsedTags = []
    }

    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: parsedTags,
      links: note.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }
  }

  async create(userId: number, input: CreateNoteInput) {
    const title = input.title || 'Nota sem título'
    const content = input.content || ''
    const folder = input.folder ?? null
    const tagsStr = JSON.stringify(input.tags || [])

    const extractedLinks = extractNoteLinks(content)
    if (input.canvasId) {
      if (!extractedLinks.some((l) => l.target_type === 'CANVAS' && l.target_id === input.canvasId)) {
        extractedLinks.push({ target_type: 'CANVAS', target_id: input.canvasId })
      }
    }
    if (input.links && Array.isArray(input.links)) {
      for (const l of input.links) {
        if (!extractedLinks.some((el) => el.target_type === l.target_type && el.target_id === l.target_id)) {
          extractedLinks.push(l)
        }
      }
    }

    const note = await prisma.note.create({
      data: {
        user_id: userId,
        title,
        content,
        folder,
        tags: tagsStr,
        noteLinks: {
          create: extractedLinks.map((l) => ({
            target_type: l.target_type,
            target_id: l.target_id,
          })),
        },
      },
      include: {
        noteLinks: true,
      },
    })

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(note.tags)
    } catch {
      parsedTags = []
    }

    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: parsedTags,
      links: note.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }
  }

  async update(id: string, userId: number, input: UpdateNoteInput) {
    const existing = await prisma.note.findUnique({
      where: { id },
    })

    if (!existing || existing.user_id !== userId) {
      throw new Error('Nota não encontrada')
    }

    const dataToUpdate: any = {}
    if (input.title !== undefined) dataToUpdate.title = input.title
    if (input.content !== undefined) dataToUpdate.content = input.content
    if (input.folder !== undefined) dataToUpdate.folder = input.folder
    if (input.tags !== undefined) dataToUpdate.tags = JSON.stringify(input.tags)

    if (input.content !== undefined || input.canvasId !== undefined || input.links !== undefined) {
      const contentToParse = input.content !== undefined ? input.content : existing.content
      const extractedLinks = extractNoteLinks(contentToParse)
      if (input.canvasId) {
        if (!extractedLinks.some((l) => l.target_type === 'CANVAS' && l.target_id === input.canvasId)) {
          extractedLinks.push({ target_type: 'CANVAS', target_id: input.canvasId })
        }
      }
      if (input.links && Array.isArray(input.links)) {
        for (const l of input.links) {
          if (!extractedLinks.some((el) => el.target_type === l.target_type && el.target_id === l.target_id)) {
            extractedLinks.push(l)
          }
        }
      }

      await prisma.noteLink.deleteMany({
        where: { source_note_id: id },
      })

      if (extractedLinks.length > 0) {
        dataToUpdate.noteLinks = {
          create: extractedLinks.map((l) => ({
            target_type: l.target_type,
            target_id: l.target_id,
          })),
        }
      }
    }

    const updated = await prisma.note.update({
      where: { id },
      data: dataToUpdate,
      include: {
        noteLinks: true,
      },
    })

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(updated.tags)
    } catch {
      parsedTags = []
    }

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      content: updated.content,
      folder: updated.folder,
      tags: parsedTags,
      links: updated.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }
  }

  async delete(id: string, userId: number) {
    const existing = await prisma.note.findUnique({
      where: { id },
    })

    if (!existing || existing.user_id !== userId) {
      throw new Error('Nota não encontrada')
    }

    // Exclusão em cascata: remover anotações e flashcards originados de trechos desta nota
    await prisma.annotation.deleteMany({
      where: { user_id: userId, cfi: { startsWith: `note:${id}` } },
    })

    await prisma.note.delete({
      where: { id },
    })

    return { message: 'Nota excluída com sucesso' }
  }

  async getFolders(userId: number) {
    const notes = await prisma.note.findMany({
      where: { user_id: userId, folder: { not: null } },
      select: { folder: true },
      distinct: ['folder'],
    })

    return notes.map((n) => n.folder).filter(Boolean) as string[]
  }
}

export const noteService = new NoteService()
