import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateBookInput, AdminUploadBookInput } from '../schemas/book.schema.js';
import { aiClient } from './ai.client.js';

export class BookService {
  async getAll() {
    const books = await prisma.book.findMany({
      include: {
        publicInfo: true,
        bookThemes: {
          include: {
            theme: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.publicInfo?.author || 'Autor Desconhecido',
      summary: b.publicInfo?.summary || null,
      filePath: b.file_path,
      coverPath: b.cover_path,
      formatType: b.format_type,
      isAiGenerated: b.is_ai_generated,
      createdAt: b.created_at,
      themes: b.bookThemes.map((bt) => ({
        id: bt.theme.id,
        name: bt.theme.name,
        color: bt.theme.color,
        description: bt.theme.description,
      })),
    }));
  }

  async getById(id: number) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        publicInfo: true,
        bookThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!book) {
      throw new AppError(`Livro não encontrado com ID: ${id}`, 404);
    }

    return {
      id: book.id,
      title: book.title,
      author: book.publicInfo?.author || 'Autor Desconhecido',
      summary: book.publicInfo?.summary || null,
      filePath: book.file_path,
      coverPath: book.cover_path,
      formatType: book.format_type,
      isAiGenerated: book.is_ai_generated,
      createdAt: book.created_at,
      themes: book.bookThemes.map((bt) => ({
        id: bt.theme.id,
        name: bt.theme.name,
        color: bt.theme.color,
        description: bt.theme.description,
      })),
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

  async adminUpload(input: AdminUploadBookInput) {
    let filePath = input.filePath || '';
    let coverPath = input.coverPath || null;

    if (input.fileBase64 && input.fileName) {
      const isPdf = input.fileName.toLowerCase().endsWith('.pdf');
      const targetDir = isPdf ? env.PDFS_PATH : env.EPUBS_PATH;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const safeName = `${Date.now()}_${path.basename(input.fileName)}`;
      const fullPath = path.join(targetDir, safeName);
      const buffer = Buffer.from(input.fileBase64, 'base64');
      fs.writeFileSync(fullPath, buffer);
      filePath = isPdf ? `storage/pdfs/${safeName}` : `storage/epubs/${safeName}`;
    }

    if (input.coverBase64) {
      if (!fs.existsSync(env.COVERS_PATH)) {
        fs.mkdirSync(env.COVERS_PATH, { recursive: true });
      }
      const safeCoverName = `${Date.now()}_cover.png`;
      const fullCoverPath = path.join(env.COVERS_PATH, safeCoverName);
      const coverBuffer = Buffer.from(input.coverBase64, 'base64');
      fs.writeFileSync(fullCoverPath, coverBuffer);
      coverPath = `storage/covers/${safeCoverName}`;
    }

    if (!filePath) {
      filePath = `storage/epubs/${Date.now()}_book.epub`;
    }

    const createdBook = await prisma.book.create({
      data: {
        title: input.title,
        file_path: filePath,
        cover_path: coverPath,
        publicInfo: {
          create: {
            author: input.author,
            summary: input.summary || null,
          },
        },
      },
      include: {
        publicInfo: true,
      },
    });

    // Enriquecimento assíncrono via IA
    try {
      await this.enrichBook(createdBook.id);
    } catch (aiErr) {
      console.warn(`[BookService] Enriquecimento por IA falhou para o livro ${createdBook.id}:`, aiErr);
    }

    return this.getById(createdBook.id);
  }

  async enrichBook(bookId: number) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { publicInfo: true },
    });

    if (!book) {
      throw new AppError(`Livro não encontrado para enriquecimento: ${bookId}`, 404);
    }

    const author = book.publicInfo?.author || 'Autor Desconhecido';

    // 1. Obter temas existentes com seus embeddings
    const existingThemesFromDb = await prisma.theme.findMany();
    const existingThemesForAI = existingThemesFromDb.map((t) => {
      let emb: number[] = [];
      if (t.embedding) {
        try {
          emb = JSON.parse(t.embedding);
        } catch (_e) {}
      }
      return {
        id: t.id,
        name: t.name,
        embedding: emb,
      };
    });

    // 2. Chamar o microsserviço Go via gRPC
    const aiResult = await aiClient.analyzeBook(book.title, author, existingThemesForAI);

    // 3. Atualizar resumo se fornecido e se não foi definido manualmente
    if (aiResult.summary && !book.publicInfo?.summary) {
      await prisma.bookPublicInfo.upsert({
        where: { book_id: bookId },
        update: { summary: aiResult.summary },
        create: { book_id: bookId, author, summary: aiResult.summary },
      });
    }

    // 4. Vincular temas existentes que deram match
    for (const themeId of aiResult.matchedThemeIds) {
      await prisma.bookTheme.upsert({
        where: {
          book_id_theme_id: {
            book_id: bookId,
            theme_id: themeId,
          },
        },
        update: {},
        create: {
          book_id: bookId,
          theme_id: themeId,
        },
      });
    }

    // 5. Inserir novos temas e estruturar hierarquia de subtemas
    for (const nt of aiResult.newThemes) {
      const embeddingStr = nt.embedding && nt.embedding.length > 0 ? JSON.stringify(nt.embedding) : null;

      const createdOrFoundTheme = await prisma.theme.upsert({
        where: { name: nt.name },
        update: {
          description: nt.description || undefined,
          embedding: embeddingStr || undefined,
        },
        create: {
          name: nt.name,
          description: nt.description || null,
          color: nt.color || '#E57B55',
          embedding: embeddingStr,
        },
      });

      // Vincular livro ao novo tema
      await prisma.bookTheme.upsert({
        where: {
          book_id_theme_id: {
            book_id: bookId,
            theme_id: createdOrFoundTheme.id,
          },
        },
        update: {},
        create: {
          book_id: bookId,
          theme_id: createdOrFoundTheme.id,
        },
      });

      // Se possui tema pai, estabelecer relação hierárquica (subtema)
      if (nt.parent_theme_name && nt.parent_theme_name.trim() !== '') {
        const parentTheme = await prisma.theme.upsert({
          where: { name: nt.parent_theme_name.trim() },
          update: {},
          create: {
            name: nt.parent_theme_name.trim(),
            color: '#3B82F6',
            description: `Tema agregador para ${nt.name}`,
          },
        });

        if (parentTheme.id !== createdOrFoundTheme.id) {
          await prisma.themeHierarchy.upsert({
            where: {
              parent_theme_id_child_theme_id: {
                parent_theme_id: parentTheme.id,
                child_theme_id: createdOrFoundTheme.id,
              },
            },
            update: {},
            create: {
              parent_theme_id: parentTheme.id,
              child_theme_id: createdOrFoundTheme.id,
            },
          });
        }
      }
    }

    return this.getById(bookId);
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
