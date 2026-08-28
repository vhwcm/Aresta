import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateCanvasInput, UpdateCanvasInput } from '../schemas/canvas.schema.js';

export class CanvasService {
  async getAllByUser(userId: number) {
    const canvases = await prisma.canvas.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        user_id: true,
        title: true,
        description: true,
        created_at: true,
        updated_at: true,
        data: true,
      },
    });

    return canvases.map((c) => {
      let nodeCount = 0;
      let edgeCount = 0;
      try {
        const parsed = JSON.parse(c.data);
        nodeCount = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
        edgeCount = Array.isArray(parsed.edges) ? parsed.edges.length : 0;
      } catch {
        // ignore parse error for summary
      }

      return {
        id: c.id,
        userId: c.user_id,
        title: c.title,
        description: c.description,
        nodeCount,
        edgeCount,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });
  }

  async getById(id: string, userId: number) {
    const canvas = await prisma.canvas.findUnique({
      where: { id },
    });

    if (!canvas || canvas.user_id !== userId) {
      throw new AppError('Quadro não encontrado', 404);
    }

    return {
      id: canvas.id,
      userId: canvas.user_id,
      title: canvas.title,
      description: canvas.description,
      data: canvas.data,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
    };
  }

  async create(userId: number, input: CreateCanvasInput) {
    // Validar se o data é um JSON válido se fornecido
    let validData = input.data || '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}';
    try {
      JSON.parse(validData);
    } catch {
      validData = '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}';
    }

    const canvas = await prisma.canvas.create({
      data: {
        user_id: userId,
        title: input.title || 'Quadro sem título',
        description: input.description,
        data: validData,
      },
    });

    return {
      id: canvas.id,
      userId: canvas.user_id,
      title: canvas.title,
      description: canvas.description,
      data: canvas.data,
      createdAt: canvas.created_at,
      updatedAt: canvas.updated_at,
    };
  }

  async update(id: string, userId: number, input: UpdateCanvasInput) {
    const existing = await prisma.canvas.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== userId) {
      throw new AppError('Quadro não encontrado', 404);
    }

    const dataToUpdate: any = {};
    if (input.title !== undefined) dataToUpdate.title = input.title;
    if (input.description !== undefined) dataToUpdate.description = input.description;
    if (input.data !== undefined) {
      try {
        JSON.parse(input.data);
        dataToUpdate.data = input.data;
      } catch {
        throw new AppError('O campo data deve ser um JSON válido', 400);
      }
    }

    const updated = await prisma.canvas.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      description: updated.description,
      data: updated.data,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async delete(id: string, userId: number) {
    const existing = await prisma.canvas.findUnique({
      where: { id },
    });

    if (!existing || existing.user_id !== userId) {
      throw new AppError('Quadro não encontrado', 404);
    }

    await prisma.canvas.delete({
      where: { id },
    });

    return { message: 'Quadro excluído com sucesso' };
  }

  async duplicate(id: string, userId: number) {
    const original = await this.getById(id, userId);

    const duplicated = await prisma.canvas.create({
      data: {
        user_id: userId,
        title: `${original.title} (Cópia)`,
        description: original.description,
        data: original.data,
      },
    });

    return {
      id: duplicated.id,
      userId: duplicated.user_id,
      title: duplicated.title,
      description: duplicated.description,
      data: duplicated.data,
      createdAt: duplicated.created_at,
      updatedAt: duplicated.updated_at,
    };
  }
}
