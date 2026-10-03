import { describe, expect, it, beforeEach } from 'vitest'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { ThemeManagementService } from '~/services/ThemeManagementService'
import { loadGraphMeta, resetGraphMeta } from '~/utils/graphMeta'

describe('ThemeManagementService (Unified Theme & Tag Mutations)', () => {
  let db: InMemoryAdapter

  beforeEach(() => {
    db = new InMemoryAdapter()
    dbManager.setAdapter(db)
    resetGraphMeta()
  })

  it('1. createTheme gera tema no graph_meta com ID determinístico', async () => {
    const theme = await ThemeManagementService.createTheme('Filosofia Antiga', '#6366F1')
    expect(theme.name).toBe('Filosofia Antiga')
    expect(theme.color).toBe('#6366F1')
    expect(theme.id).toBeDefined()

    const meta = loadGraphMeta()
    expect(meta.themes.length).toBe(1)
    expect(meta.themes[0]?.name).toBe('Filosofia Antiga')
  })

  it('2. renameTheme propaga renomeação em cascata para livros, anotações, notas, quadros e links', async () => {
    await ThemeManagementService.createTheme('História', '#E57B55')

    await db.saveBook({
      id: 1,
      bookId: 1,
      title: 'Livro de História',
      themes: [{ id: 10, name: 'História', color: '#E57B55' }],
    })

    await db.saveNote({
      id: 'note-1',
      title: 'Nota 1',
      tags: ['História', 'Outro'],
      folder: 'História',
    })

    await db.saveCanvas({
      id: 'canvas-1',
      name: 'Quadro 1',
      tags: ['História'],
      folder: 'História',
    } as any)

    await ThemeManagementService.renameTheme('História', 'História Geral', '#10B981')

    const meta = loadGraphMeta()
    expect(meta.themes[0]?.name).toBe('História Geral')
    expect(meta.themes[0]?.color).toBe('#10B981')

    const book = await db.getBookById(1)
    expect(book?.themes?.[0]?.name).toBe('História Geral')
    expect(book?.themes?.[0]?.color).toBe('#10B981')

    const note = await db.getNoteById('note-1')
    expect(note?.tags).toEqual(['História Geral', 'Outro'])
    expect(note?.folder).toBe('História Geral')

    const canvas = await db.getCanvasById('canvas-1')
    expect((canvas as any)?.tags).toEqual(['História Geral'])
    expect((canvas as any)?.folder).toBe('História Geral')
  })

  it('3. deleteTheme aplica tombstone no meta e remove vínculos em todas as entidades', async () => {
    await ThemeManagementService.createTheme('Ciência', '#3B82F6')

    await db.saveBook({
      id: 2,
      bookId: 2,
      title: 'Livro de Ciência',
      themes: [{ id: 20, name: 'Ciência' }],
    })

    await db.saveNote({
      id: 'note-2',
      title: 'Nota 2',
      tags: ['Ciência'],
      folder: 'Ciência',
    })

    await ThemeManagementService.deleteTheme('Ciência')

    const meta = loadGraphMeta()
    expect(meta.themes[0]?.deleted_at).toBeDefined()
    expect(meta.themes[0]?.deleted_at).toBeGreaterThan(0)

    const book = await db.getBookById(2)
    expect(book?.themes).toEqual([])

    const note = await db.getNoteById('note-2')
    expect(note?.tags).toEqual([])
    expect(note?.folder).toBeNull()
  })

  it('4. linkEntityToTheme e unlinkEntityFromTheme operam na fonte de verdade correta', async () => {
    await db.saveNote({
      id: 'note-3',
      title: 'Nota 3',
      tags: [],
    })

    await db.saveBook({
      id: 3,
      bookId: 3,
      title: 'Livro 3',
      themes: [],
    })

    // Link
    await ThemeManagementService.linkEntityToTheme('note-3', 'Física')
    await ThemeManagementService.linkEntityToTheme('book-3', 'Física')

    const note = await db.getNoteById('note-3')
    expect(note?.tags).toContain('Física')

    const book = await db.getBookById(3)
    expect(book?.themes?.some((t) => t.name === 'Física')).toBe(true)

    // Unlink
    await ThemeManagementService.unlinkEntityFromTheme('note-3', 'Física')
    await ThemeManagementService.unlinkEntityFromTheme('book-3', 'Física')

    const noteAfter = await db.getNoteById('note-3')
    expect(noteAfter?.tags).toEqual([])

    const bookAfter = await db.getBookById(3)
    expect(bookAfter?.themes).toEqual([])
  })
})
