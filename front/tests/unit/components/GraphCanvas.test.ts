import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GraphCanvas from '../../../app/components/GraphCanvas.vue'

describe('GraphCanvas Component', () => {
  it('renders SVG graph canvas and control toolbar', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 1, name: 'Filosofia', color: '#3B82F6', books: [] },
          { id: 2, name: 'Ficção Científica', color: '#10B981', books: [{ userBookId: 10, bookId: 1, title: 'Duna', status: 'LENDO', currentPage: 42 }] }
        ],
        edges: [
          { id: 1, source: 1, target: 2 }
        ]
      }
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
        edges: []
      }
    })

    const buttons = wrapper.findAll('button')
    const createBtn = buttons.find(b => b.text().includes('Novo Tema'))
    const connectBtn = buttons.find(b => b.text().includes('Conectar'))

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
