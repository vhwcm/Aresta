import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookAnnotationsDrawer from '../../../app/components/graph/BookAnnotationsDrawer.vue'

const mockFetchBookAnnotations = vi.fn()
const mockCreateLooseAnnotation = vi.fn()
const mockGetAllLocalAnnotations = vi.fn()
const mockSaveLocalAnnotation = vi.fn()

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    fetchBookAnnotations: mockFetchBookAnnotations,
    createLooseAnnotation: mockCreateLooseAnnotation,
  }),
}))

vi.mock('~/adapters/database/repositories/AnnotationRepository', () => ({
  annotationRepo: {
    getAll: (...args: any[]) => mockGetAllLocalAnnotations(...args),
    save: (...args: any[]) => mockSaveLocalAnnotation(...args),
  },
}))

// Mock global $fetch for book themes
;(globalThis as any).$fetch = vi.fn().mockResolvedValue({ themes: [{ id: 1, name: 'História' }] })

describe('BookAnnotationsDrawer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAllLocalAnnotations.mockResolvedValue([])
    mockFetchBookAnnotations.mockResolvedValue([])
  })

  it('exibe as anotações do livro e contagem correta quando o livro possui anotações', async () => {
    mockFetchBookAnnotations.mockResolvedValue([
      {
        id: 101,
        bookId: 5,
        cfi: 'epubcfi(/6/4!/4/2/10)',
        chapterTitle: 'Capítulo 1',
        selectedText: 'A espada foi cravada na rocha pelos deuses antigos.',
        note: 'Símbolo da nobreza e legitimidade do rei.',
        color: '#E57B55',
        themes: [{ id: 1, name: 'Lenda' }],
      },
      {
        id: 102,
        bookId: 5,
        cfi: null,
        chapterTitle: null,
        selectedText: null,
        note: 'Reflexão geral sobre o ciclo arturiano.',
        color: null,
        themes: [],
      },
    ])

    const wrapper = mount(BookAnnotationsDrawer, {
      props: {
        isOpen: true,
        book: {
          id: 'book-5',
          rawId: 5,
          type: 'book',
          name: 'Rei Artur',
          fullTitle: 'Rei Artur e os Cavaleiros',
          author: 'Howard Pyle',
          coverPath: 'storage/covers/artur.jpg',
        },
      },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    // Aguarda o carregamento das anotações
    await vi.waitFor(() => {
      expect(mockFetchBookAnnotations).toHaveBeenCalledWith(5)
      expect(wrapper.text()).toContain('Anotações deste livro (2)')
    })

    // Cabeçalho e Metadados do Livro
    expect(wrapper.text()).toContain('Rei Artur e os Cavaleiros')
    expect(wrapper.text()).toContain('Howard Pyle')

    // Link do Leitor
    const continueLink = wrapper.find('a[href="/reader?bookId=5"]')
    expect(continueLink.exists()).toBe(true)
    expect(continueLink.text()).toContain('Continuar Leitura')

    // Anotação 1: Destaque no leitor
    expect(wrapper.text()).toContain('A espada foi cravada na rocha pelos deuses antigos.')
    expect(wrapper.text()).toContain('Símbolo da nobreza e legitimidade do rei.')
    expect(wrapper.text()).toContain('Capítulo 1')
    expect(wrapper.text()).toContain('#Lenda')

    // Link para ver no texto
    const textLink = wrapper.findAll('a').find((a) => a.attributes('href')?.includes('/reader?bookId=5&cfi='))
    expect(textLink).toBeDefined()

    // Anotação 2: Anotação solta
    expect(wrapper.text()).toContain('Anotação Solta')
    expect(wrapper.text()).toContain('Reflexão geral sobre o ciclo arturiano.')
  })

  it('carrega anotações salvas localmente no IndexedDB mesmo se a API retornar vazia', async () => {
    mockGetAllLocalAnnotations.mockResolvedValue([
      {
        id: 201,
        bookId: 5,
        cfi: 'page:12',
        selectedText: 'Texto local offline',
        note: 'Nota gravada no dispositivo',
        color: '#10B981',
      },
    ])
    mockFetchBookAnnotations.mockResolvedValue([])

    const wrapper = mount(BookAnnotationsDrawer, {
      props: {
        isOpen: true,
        book: {
          bookId: 5,
          title: 'Rei Artur',
          name: 'Rei Artur',
        } as any,
      },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Anotações deste livro (1)')
      expect(wrapper.text()).toContain('Texto local offline')
      expect(wrapper.text()).toContain('Nota gravada no dispositivo')
    })
  })

  it('permite criar uma nova anotação solta vinculada ao livro', async () => {
    mockFetchBookAnnotations.mockResolvedValue([])
    mockCreateLooseAnnotation.mockResolvedValue({
      id: 301,
      bookId: 5,
      note: 'Nova anotação solta criada agora',
      cfi: null,
    })

    const wrapper = mount(BookAnnotationsDrawer, {
      props: {
        isOpen: true,
        book: {
          id: 'book-5',
          rawId: 5,
          name: 'Rei Artur',
        },
      },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: true,
        },
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('Nova anotação solta criada agora')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Anotação Solta'))
    expect(saveBtn).toBeDefined()
    await saveBtn?.trigger('click')

    expect(mockCreateLooseAnnotation).toHaveBeenCalledWith(5, 'Nova anotação solta criada agora', expect.any(Array))
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Nova anotação solta criada agora')
      expect(wrapper.text()).toContain('Anotações deste livro (1)')
    })
  })

  it('renderiza o texto da citação quando a anotação vem com snake_case (selected_text) e sem nota escrita (destaque puro)', async () => {
    mockFetchBookAnnotations.mockResolvedValue([
      {
        id: 401,
        bookId: 5,
        cfi: 'page:3#color=F59E0B',
        chapter_title: 'Página 3',
        selected_text: 'O Santo Graal apareceu sobre a távola redonda.',
        note: null,
      },
    ])

    const wrapper = mount(BookAnnotationsDrawer, {
      props: {
        isOpen: true,
        book: {
          id: 'book-5',
          rawId: 5,
          name: 'Rei Artur',
        },
      },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('O Santo Graal apareceu sobre a távola redonda.')
      expect(wrapper.text()).toContain('Página 3')
      expect(wrapper.text()).toContain('Anotações deste livro (1)')
    })
  })
})
