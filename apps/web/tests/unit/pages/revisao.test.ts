import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import RevisaoPage from '~/pages/revisao.vue'

const mockUserAnnotations = ref([
  {
    id: 99,
    userId: 1,
    bookId: 42,
    bookTitle: 'O Guia do Mochileiro das Galáxias',
    selectedText: 'Não entre em pânico.',
    note: 'Princípio fundamental da obra.',
    chapterTitle: 'Capítulo 1',
    createdAt: '2026-09-05T12:00:00.000Z',
    themes: [{ id: 1, name: 'Ficção Científica' }],
  },
])

const mockToggleAnnotationFlashcard = vi.fn().mockResolvedValue(true)

const mockDailyDeck = ref<any[]>([])

vi.mock('~/composables/useFlashcards', () => ({
  useFlashcards: () => ({
    dailyDeck: mockDailyDeck,
    isLoading: ref(false),
    isSubmitting: ref(false),
    fetchDailyDeck: vi.fn().mockResolvedValue([]),
    reviewFlashcard: vi.fn().mockResolvedValue(true),
    reviewedCount: ref(0),
    totalCards: ref(0),
  }),
}))

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: mockUserAnnotations,
    loading: ref(false),
    error: ref(null),
    fetchAnnotations: vi.fn().mockResolvedValue([]),
    deleteAnnotation: vi.fn().mockResolvedValue(true),
    toggleAnnotationFlashcard: mockToggleAnnotationFlashcard,
  }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: ref([
      { bookId: 42, title: 'O Guia do Mochileiro das Galáxias' },
    ]),
    fetchUserBooks: vi.fn().mockResolvedValue([]),
  }),
}))

describe('Revisao Page (/revisao)', () => {
  it('renders flashcards section and tab switcher', async () => {
    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
          AppSelect: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Central de Revisão')
    expect(wrapper.text()).toContain('Flashcards')
    expect(wrapper.text()).toContain('Resumos & Anotações')
  })

  it('exibe anotações de livros na aba de Resumos & Anotações e agrupa por tema', async () => {
    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
          AppSelect: true,
        },
      },
    })

    // Troca para a aba de Resumos & Anotações
    const buttons = wrapper.findAll('button')
    const summariesTabBtn = buttons.find((b) => b.text().includes('Resumos & Anotações'))
    expect(summariesTabBtn).toBeDefined()
    await summariesTabBtn!.trigger('click')

    // Deve exibir a seção do tema Ficção Científica
    expect(wrapper.text()).toContain('Ficção Científica')
    expect(wrapper.text()).toContain('O Guia do Mochileiro das Galáxias')
    expect(wrapper.text()).toContain('Não entre em pânico.')
    expect(wrapper.text()).toContain('Princípio fundamental da obra.')
    expect(wrapper.text()).toContain('Abrir Obra')
    expect(wrapper.text()).toContain('Criar Flashcard')
  })

  it('permite alternar flashcard de uma anotação com toggleAnnotationFlashcard', async () => {
    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
          AppSelect: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    const summariesTabBtn = buttons.find((b) => b.text().includes('Resumos & Anotações'))
    await summariesTabBtn!.trigger('click')

    const createFlashcardBtn = wrapper.findAll('button').find((b) => b.text().includes('Criar Flashcard'))
    expect(createFlashcardBtn).toBeDefined()
    await createFlashcardBtn!.trigger('click')

    expect(mockToggleAnnotationFlashcard).toHaveBeenCalledWith(99)
  })

  it('renderiza "Ver fonte" com apenas uma seta para cartão de livro', async () => {
    mockDailyDeck.value = [
      {
        id: 1,
        bookId: 42,
        bookTitle: 'O Guia do Mochileiro das Galáxias',
        question: 'Qual a resposta para tudo?',
        answer: '42',
        sourceType: 'book',
        repetitionLevel: 1,
      },
    ]

    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
          AppSelect: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Ver fonte')
    expect(wrapper.text()).not.toContain('Ver na Obra')
    expect(wrapper.text()).not.toContain('Ver fonte ↗')
  })

  it('renderiza "Ver Nota" com apenas uma seta para cartão de nota do canvas', async () => {
    mockDailyDeck.value = [
      {
        id: 2,
        noteId: 'note-123',
        question: 'O que é Aresta?',
        answer: 'Uma plataforma monólito.',
        sourceType: 'canvas_note',
        repetitionLevel: 2,
      },
    ]

    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
          AppSelect: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Ver Nota')
    expect(wrapper.text()).not.toContain('Ver Nota ↗')
  })

  it('integra AppSelect com as opções de livros disponíveis', async () => {
    mockDailyDeck.value = [
      {
        id: 1,
        bookId: 42,
        bookTitle: 'O Guia do Mochileiro das Galáxias',
        question: 'Qual a resposta para a vida?',
        answer: '42',
        repetitionLevel: 1,
      },
    ]

    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true,
          Trash2Icon: true,
          BookOpenIcon: true,
          SparklesIcon: true,
          ExternalLinkIcon: true,
          CheckCircle2Icon: true,
          TagIcon: true,
          BookMarkedIcon: true,
          ReaderAnnotationModal: true,
        },
      },
    })

    // AppSelect rendered
    const select = wrapper.findComponent({ name: 'AppSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('modelValue')).toBe('all')
    expect(select.props('options')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'all', label: 'Todas as Obras' }),
        expect.objectContaining({ value: '42', label: 'O Guia do Mochileiro das Galáxias' })
      ])
    )
  })
})
