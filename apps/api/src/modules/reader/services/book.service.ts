import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../config/database'

const STORAGE_PATH = process.env.STORAGE_PATH ?? './storage'

export class BookService {
  async findAll() {
    const books = await prisma.book.findMany({
      include: {
        publicInfo: true,
        bookThemes: { include: { theme: true } },
      },
      orderBy: { id: 'asc' },
    })

    return books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.publicInfo?.author || 'Autor Desconhecido',
      summary: b.publicInfo?.summary || null,
      filePath: b.file_path,
      coverPath: b.cover_path,
      fileType: b.file_type,
      createdAt: b.created_at,
      themes: b.bookThemes.map((bt) => ({
        id: bt.theme.id,
        name: bt.theme.name,
        color: bt.theme.color,
        description: bt.theme.description,
      })),
    }))
  }

  async findById(id: number) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        publicInfo: true,
        bookThemes: { include: { theme: true } },
      },
    })

    if (!book) throw new Error(`Livro não encontrado com ID: ${id}`)

    return {
      id: book.id,
      title: book.title,
      author: book.publicInfo?.author || 'Autor Desconhecido',
      summary: book.publicInfo?.summary || null,
      filePath: book.file_path,
      coverPath: book.cover_path,
      fileType: book.file_type,
      createdAt: book.created_at,
      themes: book.bookThemes.map((bt) => ({
        id: bt.theme.id,
        name: bt.theme.name,
        color: bt.theme.color,
        description: bt.theme.description,
      })),
    }
  }

  async getFilePath(id: number): Promise<string> {
    const book = await this.findById(id)
    if (!book.filePath) throw new Error('Caminho do arquivo não cadastrado para este livro')
    const baseName = path.basename(book.filePath)
    const candidates = [
      path.resolve(STORAGE_PATH, book.filePath),
      path.resolve(STORAGE_PATH, 'epubs', baseName),
      path.resolve(STORAGE_PATH, 'pdfs', baseName),
      path.resolve(STORAGE_PATH, 'books', baseName),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    throw new Error(`Arquivo do livro não encontrado: ${book.filePath}`)
  }

  async getCoverPath(id: number): Promise<string> {
    const book = await this.findById(id)
    if (!book.coverPath) throw new Error('Capa não cadastrada para este livro')
    const baseName = path.basename(book.coverPath)
    const candidates = [
      path.resolve(STORAGE_PATH, book.coverPath),
      path.resolve(STORAGE_PATH, 'covers', baseName),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    throw new Error(`Arquivo de capa não encontrado: ${book.coverPath}`)
  }

  async create(data: {
    title: string
    filePath: string
    coverPath?: string
    fileType?: string
    author?: string
    summary?: string
  }) {
    const book = await prisma.book.create({
      data: {
        title: data.title,
        file_path: data.filePath,
        cover_path: data.coverPath,
        file_type: data.fileType ?? 'epub',
        ...(data.author
          ? { publicInfo: { create: { author: data.author, summary: data.summary } } }
          : {}),
      },
      include: { publicInfo: true },
    })
    return this.findById(book.id)
  }

  async delete(id: number) {
    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) throw new Error(`Livro não encontrado para remoção com ID: ${id}`)
    await prisma.book.delete({ where: { id } })
    return true
  }
}

export const bookService = new BookService()

