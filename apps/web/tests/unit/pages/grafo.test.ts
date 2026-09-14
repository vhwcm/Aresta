import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GrafoPage from '~/pages/grafo.vue'

describe('Grafo Page Redirect (/grafo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redireciona imediatamente para o espaço de notas unificado /canvas?tab=notes', () => {
    const wrapper = mount(GrafoPage, {
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div data-testid="logo-graph" />' }
        }
      }
    })

    expect(navigateTo).toHaveBeenCalledWith(
      { path: '/canvas', query: { tab: 'notes' } },
      { replace: true }
    )
    expect(wrapper.text()).toContain('Carregando o grafo de conhecimento nas suas anotações...')
  })
})
