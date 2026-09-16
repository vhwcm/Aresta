import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnnotations, resetAnnotationsMemory } from '../../../app/composables/useAnnotations'
import { annotationRepo } from '../../../app/adapters/database/repositories/AnnotationRepository'

describe('useAnnotations composable (Local-First Architecture)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    resetAnnotationsMemory()
  })

  it('fetchAnnotations busca anotações do repositório local', async () => {
    await annotationRepo.save({
      id: 1,
      bookId: 10,
      cfi: 'page:1',
      selectedText: 'Trecho 1',
      note: 'Minha anotação',
    })

    const { fetchAnnotations, annotations } = useAnnotations()
    const items = await fetchAnnotations({ bookId: 10 })

    expect(items.length).toBeGreaterThanOrEqual(1)
    expect(annotations.value.some((a) => a.id === 1)).toBe(true)
  })

  it('createAnnotation persiste anotação localmente com cor e cfi codificados', async () => {
    const { createAnnotation, annotations } = useAnnotations()
    const result = await createAnnotation({
      bookId: 1,
      cfi: 'page:2',
      selectedText: 'Citação',
      note: 'Minha reflexão',
      color: '#10B981',
    })

    expect(result.id).toBeDefined()
    expect(result.color).toBe('#10B981')
    expect(result.cfi).toContain('#color=10B981')
    expect(annotations.value[0]?.id).toBe(result.id)

    const saved = await annotationRepo.getById(result.id)
    expect(saved).not.toBeNull()
    expect(saved?.selectedText).toBe('Citação')
  })

  it('updateAnnotationNote atualiza a anotação no banco local e na lista reativa', async () => {
    const { createAnnotation, updateAnnotationNote, annotations } = useAnnotations()
    const created = await createAnnotation({
      bookId: 1,
      cfi: 'page:1',
      selectedText: 'Original',
      note: 'Nota Velha',
    })

    const updated = await updateAnnotationNote(created.id, 'Nota Atualizada')
    expect(updated.note).toBe('Nota Atualizada')
    expect(annotations.value.find((a) => a.id === created.id)?.note).toBe('Nota Atualizada')

    const saved = await annotationRepo.getById(created.id)
    expect(saved?.note).toBe('Nota Atualizada')
  })

  it('deleteAnnotation remove anotação do banco local e da lista', async () => {
    const { createAnnotation, deleteAnnotation, annotations } = useAnnotations()
    const created = await createAnnotation({
      bookId: 1,
      cfi: 'p1',
      selectedText: 'Para deletar',
    })

    expect(annotations.value.some((a) => a.id === created.id)).toBe(true)

    await deleteAnnotation(created.id)

    expect(annotations.value.some((a) => a.id === created.id)).toBe(false)
    const saved = await annotationRepo.getById(created.id)
    expect(saved).toBeNull()
  })

  it('recupera a cor codificada no cfi em fetchAnnotations', async () => {
    await annotationRepo.save({
      id: 51,
      bookId: 10,
      cfi: 'page:3#color=3B82F6',
      selectedText: 'Texto Azul Celeste',
    })
    await annotationRepo.save({
      id: 52,
      bookId: 10,
      cfi: 'page:4#color=EC4899',
      selectedText: 'Texto Rosa Carmim',
    })

    const { fetchAnnotations } = useAnnotations()
    const items = await fetchAnnotations({ bookId: 10 })

    const blueItem = items.find((i) => i.id === 51)
    const roseItem = items.find((i) => i.id === 52)

    expect(blueItem?.color).toBe('#3B82F6')
    expect(roseItem?.color).toBe('#EC4899')
  })
})
