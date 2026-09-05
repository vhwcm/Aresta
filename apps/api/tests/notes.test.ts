import { describe, it, expect } from 'vitest'
import { noteService } from '../src/modules/canvas/services/note.service'

describe('NoteService in aresta-canvas', () => {
  it('cria e recupera nota com extração de links compostos', async () => {
    const created = await noteService.create(1, {
      title: 'Nota Desacoplada',
      content: '# Resumo\nVeja ![[canvas:canvas-uuid-1]] e o livro ![[book:10]].',
      folder: 'Filosofia',
      tags: ['mente', 'pensamento'],
    })

    expect(created).toHaveProperty('id')
    expect(created.title).toBe('Nota Desacoplada')
    expect(created.links).toHaveLength(2)
    expect(created.tags).toEqual(['mente', 'pensamento'])

    const fetched = await noteService.getById(created.id, 1)
    expect(fetched.title).toBe('Nota Desacoplada')
    expect(fetched.links).toHaveLength(2)

    await noteService.delete(created.id, 1)
  })

  it('lista notas e pastas por usuário', async () => {
    const created = await noteService.create(1, {
      title: 'Nota de Teste',
      content: 'Conteúdo...',
      folder: 'Pastas/Testes',
    })

    const list = await noteService.getAllByUser(1, { folder: 'Pastas/Testes' })
    expect(list.notes.length).toBeGreaterThanOrEqual(1)

    const folders = await noteService.getFolders(1)
    expect(folders).toContain('Pastas/Testes')

    await noteService.delete(created.id, 1)
  })

  it('cria nota vinculada a um canvas via canvasId', async () => {
    const created = await noteService.create(1, {
      title: 'Nota Criada no Canvas',
      content: 'Conteúdo da nota...',
      canvasId: 'canvas-999',
    })

    expect(created.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: 'CANVAS',
          targetId: 'canvas-999',
        }),
      ])
    )

    const fetched = await noteService.getById(created.id, 1)
    expect(fetched.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: 'CANVAS',
          targetId: 'canvas-999',
        }),
      ])
    )

    await noteService.delete(created.id, 1)
  })
})
