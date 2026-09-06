import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import BottomNavbar from '../../../app/components/BottomNavbar.vue'
import * as authComposable from '../../../app/composables/useAuth'

describe('BottomNavbar Component', () => {
  const isLoggedInRef = ref(true)

  beforeEach(() => {
    isLoggedInRef.value = true
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      isLoggedIn: isLoggedInRef
    } as any)
  })
  it('renders navigation links and logo', () => {
    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: {
            template: '<div class="aresta-logo-mock" />'
          }
        }
      }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Livros')
    expect(wrapper.text()).toContain('Notas')
    expect(wrapper.text()).toContain('Revisão')
    expect(wrapper.text()).toContain('Conta')
  })

  it('toggles book menu and notes menu dropdowns', async () => {
    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: {
            template: '<div class="aresta-logo-mock" />'
          }
        }
      }
    })

    // Clicar no menu de Livros para abrir o dropdown
    const booksButton = wrapper.find('button[title="Menu de Livros"]')
    expect(booksButton.exists()).toBe(true)
    await booksButton.trigger('click')

    expect(wrapper.text()).toContain('Meus Livros')
    expect(wrapper.text()).toContain('Conversor')
    expect(wrapper.text()).toContain('Loja')

    // Clicar no menu de Notas para abrir o dropdown de notas
    const notesButton = wrapper.find('button[title="Menu de Notas"]')
    expect(notesButton.exists()).toBe(true)
    await notesButton.trigger('click')

    expect(wrapper.text()).toContain('Notas & Quadros')
    expect(wrapper.text()).toContain('Grafo de Conhecimento')
  })

  it('renders only unified Aresta icon in collapsed mode and expands when clicked', async () => {
    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: {
            template: '<div class="aresta-logo-mock" />'
          }
        }
      }
    })

    // Clicar no botão de colapsar para entrar no modo retraído
    const collapseBtn = wrapper.find('button[aria-label="Colapsar barra de navegação"]')
    expect(collapseBtn.exists()).toBe(true)
    await collapseBtn.trigger('click')

    // No modo colapsado, apenas o botão com o ícone do Aresta existe
    const expandBtn = wrapper.find('button[aria-label="Aresta - Início / Expandir Menu"]')
    expect(expandBtn.exists()).toBe(true)
    expect(expandBtn.find('.aresta-logo-mock').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Livros')
    expect(wrapper.text()).not.toContain('Notas')

    // Clicar para expandir novamente
    await expandBtn.trigger('click')
    expect(wrapper.text()).toContain('Livros')
    expect(wrapper.text()).toContain('Notas')
  })

  it('is hidden during book reading route (/reader) to preserve immersion', () => {
    const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any
    const originalUseRoute = g.useRoute
    g.useRoute = () => ({
      path: '/reader',
      params: {},
      query: { bookId: '1' },
      hash: '',
      fullPath: '/reader?bookId=1'
    })

    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: {
            template: '<div class="aresta-logo-mock" />'
          }
        }
      }
    })

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.find('[role="navigation"]').exists()).toBe(false)

    g.useRoute = originalUseRoute
  })

  it('is hidden on landing page (/) for unauthenticated visitors', () => {
    isLoggedInRef.value = false

    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: {
            template: '<div class="aresta-logo-mock" />'
          }
        }
      }
    })

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.find('[role="navigation"]').exists()).toBe(false)
  })
})
