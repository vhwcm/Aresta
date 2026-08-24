import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema.js';

export class UserService {
  async getAll() {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    }));
  }

  async getById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(`Usuário não encontrado com ID: ${id}`, 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }

  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError('Já existe um usuário com este e-mail.', 400);
    }

    const rawPassword = input.password || 'default123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: hashedPassword,
        role: input.role || 'USER',
        is_active: input.isActive ?? true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.is_active,
      createdAt: created.created_at,
    };
  }

  async update(id: number, input: UpdateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(`Usuário não encontrado com ID: ${id}`, 404);
    }

    if (input.email && input.email !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailConflict) {
        throw new AppError('Este e-mail já está sendo utilizado por outro usuário.', 400);
      }
    }

    const dataToUpdate: any = {};
    if (input.name !== undefined) dataToUpdate.name = input.name;
    if (input.email !== undefined) dataToUpdate.email = input.email;
    if (input.role !== undefined) dataToUpdate.role = input.role;
    if (input.isActive !== undefined) dataToUpdate.is_active = input.isActive;
    if (input.password) {
      dataToUpdate.password_hash = await bcrypt.hash(input.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.is_active,
      createdAt: updated.created_at,
    };
  }

  async delete(id: number) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(`Usuário não encontrado para remoção: ${id}`, 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }
}

