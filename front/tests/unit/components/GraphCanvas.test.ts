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
})
