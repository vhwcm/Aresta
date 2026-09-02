import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateNoteInput, NoteQueryInput, UpdateNoteInput } from '../schemas/note.schema.js';

/**
 * Extrai referências compostas (![[canvas:id]], ![[book:id]], ![[note:id]]) do markdown da nota
 */
function extractNoteLinks(content: string): Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }> {
  const links: Array<{ target_type: 'CANVAS' | 'BOOK' | 'NOTE'; target_id: string }> = [];
  const regex = /!\[\[(canvas|book|note):([a-zA-Z0-9_-]+)\]\]/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawType = match[1]?.toUpperCase();
    const targetId = match[2];
    if (targetId && (rawType === 'CANVAS' || rawType === 'BOOK' || rawType === 'NOTE')) {
      links.push({
        target_type: rawType,
        target_id: targetId,
      });
    }
  }
  return links;
}

export class NoteService {
  async getAllByUser(userId: number, query: NoteQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      user_id: userId,
    };

    if (query.folder !== undefined) {
      whereClause.folder = query.folder;
    }

    if (query.tag) {
      whereClause.tags = {
        has: query.tag,
      };
    }

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
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
    ]);

    return {
      notes: notes.map((n) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        content: n.content,
        folder: n.folder,
        tags: n.tags,
        linksCount: n.noteLinks.length,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string, userId: number) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        noteLinks: true,
      },
    });

    if (!note || note.user_id !== userId) {
      throw new AppError('Nota não encontrada', 404);
    }

    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: note.tags,
      links: note.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  async create(userId: number, input: CreateNoteInput) {
    const title = input.title || 'Nota sem título';
    const content = input.content || '';
    const folder = input.folder ?? null;
    const tags = input.tags || [];

    const extractedLinks = extractNoteLinks(content);

    const note = await prisma.note.create({
      data: {
        user_id: userId,
        title,
        content,
        folder,
        tags,
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
    });

    return {
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: note.tags,
      links: note.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  async update(id: string, userId: number, input: UpdateNoteInput) {
    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== userId) {
      throw new AppError('Nota não encontrada', 404);
    }

    const dataToUpdate: any = {};
    if (input.title !== undefined) dataToUpdate.title = input.title;
    if (input.content !== undefined) dataToUpdate.content = input.content;
    if (input.folder !== undefined) dataToUpdate.folder = input.folder;
    if (input.tags !== undefined) dataToUpdate.tags = input.tags;

    // Se o conteúdo foi alterado, resincronizar os links
    if (input.content !== undefined) {
      const extractedLinks = extractNoteLinks(input.content);
      // Apagar links antigos e recriar
      await prisma.noteLink.deleteMany({
        where: { source_note_id: id },
      });

      if (extractedLinks.length > 0) {
        dataToUpdate.noteLinks = {
          create: extractedLinks.map((l) => ({
            target_type: l.target_type,
            target_id: l.target_id,
          })),
        };
      }
    }

    const updated = await prisma.note.update({
      where: { id },
      data: dataToUpdate,
      include: {
        noteLinks: true,
      },
    });

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      content: updated.content,
      folder: updated.folder,
      tags: updated.tags,
      links: updated.noteLinks.map((l) => ({
        id: l.id,
        targetType: l.target_type,
        targetId: l.target_id,
      })),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async delete(id: string, userId: number) {
    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== userId) {
      throw new AppError('Nota não encontrada', 404);
    }

    await prisma.note.delete({
      where: { id },
    });

    return { message: 'Nota excluída com sucesso' };
  }

  async getFolders(userId: number) {
    const notes = await prisma.note.findMany({
      where: { user_id: userId, folder: { not: null } },
      select: { folder: true },
      distinct: ['folder'],
    });

    return notes.map((n) => n.folder).filter(Boolean) as string[];
  }
}
