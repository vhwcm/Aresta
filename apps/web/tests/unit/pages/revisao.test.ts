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

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: mockUserAnnotations,
    loading: ref(false),
    error: ref(null),
    fetchAnnotations: vi.fn().mockResolvedValue([]),
    deleteAnnotation: vi.fn().mockResolvedValue(true),
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
        },
      },
    })

    expect(wrapper.text()).toContain('Central de Revisão')
    expect(wrapper.text()).toContain('Flashcards')
    expect(wrapper.text()).toContain('Resumos & Anotações')
  })

  it('exibe anotações de livros na aba de Resumos & Anotações', async () => {
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
        },
      },
    })

    // Troca para a aba de Resumos & Anotações
    const buttons = wrapper.findAll('button')
    const summariesTabBtn = buttons.find((b) => b.text().includes('Resumos & Anotações'))
    expect(summariesTabBtn).toBeDefined()
    await summariesTabBtn!.trigger('click')

    // Deve exibir a anotação do livro
    expect(wrapper.text()).toContain('O Guia do Mochileiro das Galáxias')
    expect(wrapper.text()).toContain('Não entre em pânico.')
    expect(wrapper.text()).toContain('Princípio fundamental da obra.')
    expect(wrapper.text()).toContain('Ficção Científica')
    expect(wrapper.text()).toContain('Abrir Obra')
    expect(wrapper.text()).toContain('Criar Flashcard')
  })
})
