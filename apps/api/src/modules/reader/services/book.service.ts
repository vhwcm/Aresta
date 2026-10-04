import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../config/database'
import { extractEpubLocations } from './epubLocations'

const STORAGE_PATH = process.env.STORAGE_PATH ?? './storage'

export class BookService {
  async findAll() {
    const books = await prisma.book.findMany({
      include: {
        publicInfo: true,
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
      totalLocations: b.total_locations ?? null,
      locationsPerSection: (b.locations_per_section as number[] | null) ?? null,
      createdAt: b.created_at,
      themes: [],
    }))
  }

  async findById(id: number) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        publicInfo: true,
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
      totalLocations: book.total_locations ?? null,
      locationsPerSection: (book.locations_per_section as number[] | null) ?? null,
      format_type: book.file_type === 'didactic' ? 'DIDACTIC' : undefined,
      is_ai_generated: book.file_type === 'didactic',
      createdAt: book.created_at,
      themes: [],
    }
  }

  async findByIdForUser(id: number, _userId: number) {
    return this.findById(id)
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
    let totalLocations: number | null = null
    let locationsPerSection: number[] | null = null

    const fileType = data.fileType ?? 'epub'
    if (fileType === 'epub') {
      try {
        const baseName = path.basename(data.filePath)
        const candidates = [
          path.resolve(STORAGE_PATH, data.filePath),
          path.resolve(STORAGE_PATH, 'epubs', baseName),
          path.resolve(STORAGE_PATH, 'books', baseName),
        ]
        const found = candidates.find(c => fs.existsSync(c))
        if (found) {
          const buffer = fs.readFileSync(found)
          const extracted = extractEpubLocations(new Uint8Array(buffer))
          totalLocations = extracted.totalLocations
          locationsPerSection = extracted.locationsPerSection
        }
      } catch (e) {
        console.warn('[BookService] Falha ao pré-calcular localizações do EPUB:', e)
      }
    }

    const book = await prisma.book.create({
      data: {
        title: data.title,
        file_path: data.filePath,
        cover_path: data.coverPath,
        file_type: fileType,
        total_locations: totalLocations,
        locations_per_section: locationsPerSection ?? undefined,
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
    if (!existing) throw Object.assign(new Error('Livro não encontrado'), { status: 404 })
    await prisma.book.delete({ where: { id } })
    return true
  }
}

export const bookService = new BookService()
