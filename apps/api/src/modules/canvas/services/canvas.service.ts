import { prisma } from '../config/database'

export interface CreateCanvasInput {
  title?: string
  description?: string | null
  folder?: string | null
  tags?: string[]
  data?: string
}

export interface UpdateCanvasInput {
  title?: string
  description?: string | null
  folder?: string | null
  tags?: string[]
  data?: string
}

export interface CanvasQueryInput {
  folder?: string
  tag?: string
  search?: string
}

export class CanvasService {
  async getAllByUser(userId: number, query: CanvasQueryInput = {}) {
    const whereClause: any = {
      user_id: userId,
    }

    if (query.folder !== undefined && query.folder !== '') {
      if (query.folder === '__uncategorized__') {
        whereClause.folder = null
      } else {
        whereClause.folder = query.folder
      }
    }

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ]
    }

    const canvases = await prisma.canvas.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        user_id: true,
        title: true,
        description: true,
        folder: true,
        tags: true,
        created_at: true,
        updated_at: true,
        data: true,
      },
    })

    const formatted = canvases.map((c) => {
      let nodeCount = 0
      let edgeCount = 0
      const noteIds: string[] = []
      try {
        const parsed = JSON.parse(c.data)
        nodeCount = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0
        edgeCount = Array.isArray(parsed.edges) ? parsed.edges.length : 0
        if (Array.isArray(parsed.nodes)) {
          for (const node of parsed.nodes) {
            if (node && node.type === 'note_embed' && node.noteId) {
              if (!noteIds.includes(node.noteId)) {
                noteIds.push(node.noteId)
              }
            }
          }
        }
      } catch {
        // ignore parse error for summary
      }

      let parsedTags: string[] = []
      try {
        parsedTags = JSON.parse(c.tags || '[]')
      } catch {
        parsedTags = []
      }

      return {
        id: c.id,
        userId: c.user_id,
        title: c.title,
        description: c.description,
        folder: c.folder,
        tags: parsedTags,
        nodeCount,
        edgeCount,
        noteIds,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }
    })

    if (query.tag) {
      return formatted.filter((c) => c.tags.includes(query.tag!))
    }

    return formatted
  }

  async getById(id: string, userId: number) {
    const canvas = await prisma.canvas.findUnique({ where: { id } })
    if (!canvas || canvas.user_id !== userId) {
      throw new Error('Quadro não encontrado')
    }

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(canvas.tags || '[]')
    } catch {
      parsedTags = []
    }

    const noteIds: string[] = []
    try {
      const parsed = JSON.parse(canvas.data)
      if (Array.isArray(parsed.nodes)) {
        for (const node of parsed.nodes) {
          if (node && node.type === 'note_embed' && node.noteId) {
            if (!noteIds.includes(node.noteId)) {
              noteIds.push(node.noteId)
            }
          }
        }
      }
    } catch {
      // ignore parse error
    }

    return {
      id: canvas.id,
      userId: canvas.user_id,
      title: canvas.title,
      description: canvas.description,
      folder: canvas.folder,
      tags: parsedTags,
      noteIds,
      data: canvas.data,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
    }
  }

  async create(userId: number, input: CreateCanvasInput) {
    let validData = input.data || '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}'
    try {
      JSON.parse(validData)
    } catch {
      validData = '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}'
    }

    const tagsStr = JSON.stringify(input.tags || [])

    const canvas = await prisma.canvas.create({
      data: {
        user_id: userId,
        title: input.title || 'Quadro sem título',
        description: input.description,
        folder: input.folder ?? null,
        tags: tagsStr,
        data: validData,
      },
    })

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(canvas.tags || '[]')
    } catch {
      parsedTags = []
    }

    return {
      id: canvas.id,
      userId: canvas.user_id,
      title: canvas.title,
      description: canvas.description,
      folder: canvas.folder,
      tags: parsedTags,
      data: canvas.data,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
    }
  }

  async update(id: string, userId: number, input: UpdateCanvasInput) {
    const existing = await prisma.canvas.findUnique({ where: { id } })
    if (!existing || existing.user_id !== userId) {
      throw new Error('Quadro não encontrado')
    }

    const dataToUpdate: Record<string, any> = {}
    if (input.title !== undefined) dataToUpdate.title = input.title
    if (input.description !== undefined) dataToUpdate.description = input.description
    if (input.folder !== undefined) dataToUpdate.folder = input.folder
    if (input.tags !== undefined) dataToUpdate.tags = JSON.stringify(input.tags)
    if (input.data !== undefined) {
      try {
        JSON.parse(input.data)
        dataToUpdate.data = input.data
      } catch {
        throw new Error('O campo data deve ser um JSON válido')
      }
    }

    const updated = await prisma.canvas.update({ where: { id }, data: dataToUpdate })

    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(updated.tags || '[]')
    } catch {
      parsedTags = []
    }

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      description: updated.description,
      folder: updated.folder,
      tags: parsedTags,
      data: updated.data,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }
  }

  async delete(id: string, userId: number) {
    const existing = await prisma.canvas.findUnique({ where: { id } })
    if (!existing || existing.user_id !== userId) {
      throw new Error('Quadro não encontrado')
    }
    await prisma.canvas.delete({ where: { id } })
    return { message: 'Quadro excluído com sucesso' }
  }

  async duplicate(id: string, userId: number) {
    const original = await this.getById(id, userId)
    const duplicated = await prisma.canvas.create({
      data: {
        user_id: userId,
        title: `${original.title} (Cópia)`,
        description: original.description,
        folder: original.folder,
        tags: JSON.stringify(original.tags || []),
        data: original.data,
      },
    })

    return {
      id: duplicated.id,
      userId: duplicated.user_id,
      title: duplicated.title,
      description: duplicated.description,
      folder: duplicated.folder,
      tags: original.tags || [],
      data: duplicated.data,
      createdAt: duplicated.created_at,
      updatedAt: duplicated.updated_at,
    }
  }

  async getFolders(userId: number) {
    const canvases = await prisma.canvas.findMany({
      where: { user_id: userId, folder: { not: null } },
      select: { folder: true },
      distinct: ['folder'],
    })

    return canvases.map((c) => c.folder).filter(Boolean) as string[]
  }
}

export const canvasService = new CanvasService()
