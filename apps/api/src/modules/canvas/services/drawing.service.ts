import { prisma } from '../config/database';
import { aiService } from '../../ai/services/ai.service';
import { CreateDrawingInput, UpdateDrawingInput, SynthesizeDrawingInput } from '../schemas/drawing.schema';

export interface DrawingQueryInput {
  folder?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class DrawingService {
  async getAllByUser(userId: number, query: DrawingQueryInput = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      user_id: userId,
    };

    if (query.folder !== undefined) {
      whereClause.folder = query.folder;
    }

    if (query.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { folder: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [drawings, total] = await Promise.all([
      prisma.drawingNote.findMany({
        where: whereClause,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.drawingNote.count({ where: whereClause }),
    ]);

    const formatted = drawings.map((d) => {
      let pagesCount = 1;
      try {
        const parsed = JSON.parse(d.pages_data);
        if (Array.isArray(parsed)) {
          pagesCount = parsed.length;
        }
      } catch {
        pagesCount = 1;
      }

      let tags: string[] = [];
      try {
        tags = JSON.parse(d.tags);
      } catch {
        tags = [];
      }

      return {
        id: d.id,
        title: d.title,
        folder: d.folder,
        tags,
        pagesCount,
        preview_url: d.preview_url,
        created_at: d.created_at,
        updated_at: d.updated_at,
      };
    });

    return {
      drawings: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string, userId: number) {
    const drawing = await prisma.drawingNote.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!drawing) {
      throw new Error('Nota de desenho não encontrada.');
    }

    let parsedPages = [];
    try {
      parsedPages = JSON.parse(drawing.pages_data);
    } catch {
      parsedPages = [];
    }

    let tags: string[] = [];
    try {
      tags = JSON.parse(drawing.tags);
    } catch {
      tags = [];
    }

    return {
      ...drawing,
      pages: parsedPages,
      tags,
    };
  }

  async create(userId: number, input: CreateDrawingInput) {
    const defaultPages = [
      {
        id: 'page-1',
        pageNumber: 1,
        width: 794,
        height: 1123,
        backgroundType: 'ruled',
        strokes: [],
      },
    ];

    const tagsJson = Array.isArray(input.tags)
      ? JSON.stringify(input.tags)
      : typeof input.tags === 'string'
      ? input.tags
      : '[]';

    const pagesDataJson = input.pages_data || JSON.stringify(defaultPages);

    const drawing = await prisma.drawingNote.create({
      data: {
        user_id: userId,
        title: input.title || 'Desenho sem título',
        folder: input.folder || null,
        tags: tagsJson,
        pages_data: pagesDataJson,
        preview_url: input.preview_url || null,
      },
    });

    return drawing;
  }

  async update(id: string, userId: number, input: UpdateDrawingInput) {
    const existing = await prisma.drawingNote.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new Error('Nota de desenho não encontrada para atualização.');
    }

    const dataToUpdate: any = {};

    if (input.title !== undefined) dataToUpdate.title = input.title;
    if (input.folder !== undefined) dataToUpdate.folder = input.folder;
    if (input.preview_url !== undefined) dataToUpdate.preview_url = input.preview_url;
    if (input.pages_data !== undefined) dataToUpdate.pages_data = input.pages_data;

    if (input.tags !== undefined) {
      dataToUpdate.tags = Array.isArray(input.tags)
        ? JSON.stringify(input.tags)
        : typeof input.tags === 'string'
        ? input.tags
        : '[]';
    }

    const updated = await prisma.drawingNote.update({
      where: { id },
      data: dataToUpdate,
    });

    return updated;
  }

  async delete(id: string, userId: number) {
    const existing = await prisma.drawingNote.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new Error('Nota de desenho não encontrada para exclusão.');
    }

    await prisma.drawingNote.delete({
      where: { id },
    });

    return { success: true, id };
  }

  async synthesize(id: string, userId: number, input: SynthesizeDrawingInput) {
    const drawing = await prisma.drawingNote.findFirst({
      where: { id, user_id: userId },
    });

    if (!drawing) {
      throw new Error('Nota de desenho não encontrada para síntese.');
    }

    const synthesis = await aiService.synthesizeDrawingToHtml({
      images: input.images,
      promptOverride: input.promptOverride,
    });

    return synthesis;
  }

  async convertToNote(
    id: string,
    userId: number,
    payload: { title?: string; htmlContent: string; deleteOriginal?: boolean; folder?: string }
  ) {
    const drawing = await prisma.drawingNote.findFirst({
      where: { id, user_id: userId },
    });

    if (!drawing) {
      throw new Error('Nota de desenho de origem não encontrada.');
    }

    const newNote = await prisma.note.create({
      data: {
        user_id: userId,
        title: payload.title || drawing.title || 'Nota Convertida de Desenho',
        content: payload.htmlContent,
        folder: payload.folder || drawing.folder || null,
        tags: drawing.tags,
      },
    });

    if (payload.deleteOriginal) {
      await prisma.drawingNote.delete({
        where: { id },
      });
    }

    return {
      note: newNote,
      originalDeleted: Boolean(payload.deleteOriginal),
    };
  }
}

export const drawingService = new DrawingService();
