import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateBookInput } from '../schemas/book.schema.js';

export class BookService {
  async getAll() {
    const books = await prisma.book.findMany({
      orderBy: { id: 'asc' },
    });

    return books.map((b) => ({
      id: b.id,
      title: b.title,
      filePath: b.file_path,
      coverPath: b.cover_path,
      createdAt: b.created_at,
    }));
  }

  async getById(id: number) {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new AppError(`Livro não encontrado com ID: ${id}`, 404);
    }

    return {
      id: book.id,
      title: book.title,
      filePath: book.file_path,
      coverPath: book.cover_path,
      createdAt: book.created_at,
    };
  }

  async getCoverPath(id: number) {
    const book = await this.getById(id);

    if (!book.coverPath || book.coverPath.trim() === '') {
      throw new AppError('Capa não cadastrada para este livro', 404);
    }

    const candidatePaths = [
      path.resolve(process.cwd(), book.coverPath),
      path.resolve(process.cwd(), '..', book.coverPath),
      path.resolve(process.cwd(), 'storage/covers', path.basename(book.coverPath)),
      path.resolve(process.cwd(), '..', 'storage/covers', path.basename(book.coverPath)),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new AppError(`Arquivo de capa não encontrado no servidor: ${book.coverPath}`, 404);
  }

  async getFilePath(id: number) {
    const book = await this.getById(id);

    if (!book.filePath || book.filePath.trim() === '') {
      throw new AppError('Caminho do arquivo não cadastrado para este livro', 404);
    }

    const baseName = path.basename(book.filePath);
    const candidatePaths = [
      path.resolve(process.cwd(), book.filePath),
      path.resolve(process.cwd(), '..', book.filePath),
      path.resolve(process.cwd(), 'storage/epubs', baseName),
      path.resolve(process.cwd(), '..', 'storage/epubs', baseName),
      path.resolve(process.cwd(), 'storage/pdfs', baseName),
      path.resolve(process.cwd(), '..', 'storage/pdfs', baseName),
      path.resolve(process.cwd(), 'storage/books', baseName),
      path.resolve(process.cwd(), '..', 'storage/books', baseName),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new AppError(`Arquivo do livro não encontrado no servidor: ${book.filePath}`, 404);
  }

  async create(input: CreateBookInput) {
    const created = await prisma.book.create({
      data: {
        title: input.title,
        file_path: input.filePath,
        cover_path: input.coverPath || null,
      },
    });

    return {
      id: created.id,
      title: created.title,
      filePath: created.file_path,
      coverPath: created.cover_path,
      createdAt: created.created_at,
    };
  }

  async delete(id: number) {
    const existing = await prisma.book.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(`Livro não encontrado para remoção com ID: ${id}`, 404);
    }

    await prisma.book.delete({
      where: { id },
    });

    return true;
  }
}

