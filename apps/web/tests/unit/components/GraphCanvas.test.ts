import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GraphCanvas from '../../../app/components/GraphCanvas.vue'

describe('GraphCanvas Component', () => {
  it('renders SVG graph canvas with theme and book nodes', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia', color: '#3B82F6', bookCount: 1 },
          { id: 'book-10', rawId: 10, type: 'book', name: 'O Programa...', fullTitle: 'O Programador Pragmático', author: 'Andy Hunt', coverPath: 'storage/covers/test.png' },
        ],
        edges: [
          { id: 'edge-1', source: 'theme-1', target: 'book-10', type: 'book-theme' },
        ],
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('.links-group').exists()).toBe(true)
    expect(wrapper.find('.nodes-group').exists()).toBe(true)
    expect(wrapper.text()).toContain('Novo Tema')
    expect(wrapper.text()).toContain('Conectar')
    // O texto do nó central foi removido a pedido do usuário (apenas o ícone permanece)
    expect(wrapper.html()).not.toContain('>Meu Conhecimento<')
  })

  it('emits openCreateNode and openConnectModal events from buttons', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [],
        edges: [],
      },
    })

    const buttons = wrapper.findAll('button')
    const createBtn = buttons.find((b) => b.text().includes('Novo Tema'))
    const connectBtn = buttons.find((b) => b.text().includes('Conectar'))

    if (createBtn) {
      await createBtn.trigger('click')
      expect(wrapper.emitted('openCreateNode')).toBeTruthy()
    }

    if (connectBtn) {
      await connectBtn.trigger('click')
      expect(wrapper.emitted('openConnectModal')).toBeTruthy()
    }
  })

  it('renders clean monochromatic vector icons with borders instead of emojis in theme nodes', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia', color: '#3B82F6', bookCount: 1 },
          { id: 'theme-2', rawId: 2, type: 'theme', name: 'Psicologia', color: '#10B981', bookCount: 1 },
        ],
        edges: [],
      },
    })

    const monochromeIcons = wrapper.findAll('.node-icon-monochrome')
    expect(monochromeIcons.length).toBeGreaterThanOrEqual(2)
    // Garantir que não contém emojis cartoon nos nós
    expect(wrapper.html()).not.toContain('🏛️')
    expect(wrapper.html()).not.toContain('🧠')
    // Garantir presença de caminhos vetoriais monocromáticos
    expect(wrapper.find('.node-icon-monochrome').find('line, path').exists()).toBe(true)
  })

  it('renders all 5 node types and layer filter chips', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia' },
          { id: 'book-1', rawId: 1, type: 'book', name: 'Livro Teste', fullTitle: 'Livro Teste' },
          { id: 'ann-1', rawId: 1, type: 'annotation', name: 'Trecho marcado', title: 'Trecho marcado' },
          { id: 'note-1', rawId: 'n1', type: 'note', name: 'Nota livre', title: 'Nota livre' },
          { id: 'canvas-1', rawId: 'c1', type: 'canvas', name: 'Quadro A', title: 'Quadro A' },
        ],
        edges: [],
      },
    })

    // Deve renderizar a barra de camadas
    expect(wrapper.text()).toContain('Camadas:')
    expect(wrapper.text()).toContain('Temas')
    expect(wrapper.text()).toContain('Livros')
    expect(wrapper.text()).toContain('Anotações')
    expect(wrapper.text()).toContain('Notas')
    expect(wrapper.text()).toContain('Quadros')

    // Deve renderizar nós de cada categoria no SVG
    expect(wrapper.findAll('.annotation-icon').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('.note-icon').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('.canvas-icon').length).toBeGreaterThanOrEqual(1)
  })
})
