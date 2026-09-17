import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteDetailDrawer from '../../../app/components/graph/NoteDetailDrawer.vue'

const mockUpdateNote = vi.fn().mockResolvedValue(true)
const mockDeleteNote = vi.fn().mockResolvedValue(true)

vi.mock('../../../app/composables/useNotes', () => ({
  useNotes: () => ({
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
  }),
}))

vi.mock('../../../app/adapters/database/repositories/NoteRepository', () => ({
  noteRepo: {
    getById: vi.fn().mockResolvedValue({
      id: 'note-1',
      title: 'Nota de Filosofia',
      content: '# Reflexão\nPenso, logo existo.',
      folder: 'Filosofia',
      tags: ['existencialismo', 'metafisica'],
      updated_at: '2026-09-16T12:00:00Z',
    }),
    delete: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('../../../app/adapters/database/repositories/DrawingNoteRepository', () => ({
  drawingNoteRepo: {
    getById: vi.fn().mockResolvedValue({
      id: 'draw-1',
      title: 'Esboço Mental',
      pages_data: JSON.stringify([{ id: 'p1' }, { id: 'p2' }]),
      preview_url: 'blob:preview',
      folder: 'Esboços',
      updated_at: '2026-09-16T12:00:00Z',
    }),
    delete: vi.fn().mockResolvedValue(true),
  },
}))

describe('NoteDetailDrawer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza nada quando isOpen é false', () => {
    const wrapper = mount(NoteDetailDrawer, {
      props: {
        isOpen: false,
        node: null,
      },
    })
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('renderiza título, pasta, tags e conteúdo ao abrir uma nota de texto', async () => {
    const wrapper = mount(NoteDetailDrawer, {
      props: {
        isOpen: true,
        node: {
          id: 'note-1',
          rawId: 'note-1',
          type: 'note',
          name: 'Nota de Filosofia',
          title: 'Nota de Filosofia',
          description: '# Reflexão\nPenso, logo existo.',
          folder: 'Filosofia',
          tags: ['existencialismo'],
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

    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nota de Filosofia')
    expect(wrapper.text()).toContain('Filosofia')
  })

  it('renderiza corretamente nota de desenho com link para editor de desenho', async () => {
    const wrapper = mount(NoteDetailDrawer, {
      props: {
        isOpen: true,
        node: {
          id: 'note-draw-1',
          rawId: 'draw-1',
          type: 'note',
          isDrawing: true,
          name: 'Esboço Mental',
          title: 'Esboço Mental',
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

    expect(wrapper.text()).toContain('Nota de Desenho')
    expect(wrapper.text()).toContain('Abrir Editor de Desenho')
    const link = wrapper.find('a[href="/canvas/drawing/draw-1"]')
    expect(link.exists()).toBe(true)
  })

  it('emite evento close ao clicar no botão de fechar', async () => {
    const wrapper = mount(NoteDetailDrawer, {
      props: {
        isOpen: true,
        node: {
          id: 'note-1',
          type: 'note',
          name: 'Nota 1',
        },
      },
      global: {
        stubs: {
          Teleport: true,
          NuxtLink: true,
        },
      },
    })

    const closeBtn = wrapper.find('button[title="Fechar"]')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
