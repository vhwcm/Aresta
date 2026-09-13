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
    expect(wrapper.find('a[title="Início"]').exists()).toBe(true)
    expect(wrapper.find('button[title="Menu de Livros"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Anotações"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Revisão (Flashcards & Resumos)"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Sua Conta & Status Pro"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Início')
    expect(wrapper.text()).not.toContain('Livros')
    expect(wrapper.text()).not.toContain('Anotações')
    expect(wrapper.text()).not.toContain('Revisão')
    expect(wrapper.text()).not.toContain('Conta')
  })

  it('toggles book menu and has direct link to canvas in Anotações', async () => {
    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
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

    // Botão de Anotações é um link direto para /canvas
    const anotaçõesLink = wrapper.find('a[title="Anotações"]')
    expect(anotaçõesLink.exists()).toBe(true)
    expect(anotaçõesLink.attributes('href')).toBe('/canvas')
  })

  it('is always open without collapse button and renders all navigation items', async () => {
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

    // Não existe mais botão de colapsar
    const collapseBtn = wrapper.find('button[aria-label="Colapsar barra de navegação"]')
    expect(collapseBtn.exists()).toBe(false)

    // A barra está sempre aberta e exibe todos os itens sem rótulos de texto
    expect(wrapper.find('a[title="Início"]').exists()).toBe(true)
    expect(wrapper.find('button[title="Menu de Livros"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Anotações"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Revisão (Flashcards & Resumos)"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Sua Conta & Status Pro"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Início')
    expect(wrapper.text()).not.toContain('Livros')
    expect(wrapper.text()).not.toContain('Anotações')
    expect(wrapper.text()).not.toContain('Revisão')
    expect(wrapper.text()).not.toContain('Conta')
  })

  it('highlights the current active route properly', () => {
    const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any
    const originalUseRoute = g.useRoute

    // Testando rota de Início ('/')
    g.useRoute = () => ({ path: '/', params: {}, query: {} })
    let wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })
    const homeLink = wrapper.find('a[title="Início"]')
    expect(homeLink.classes()).toContain('nav-item-active')

    // Testando rota de Livros ('/library')
    g.useRoute = () => ({ path: '/library', params: {}, query: {} })
    wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })
    const booksButton = wrapper.find('button[title="Menu de Livros"]')
    expect(booksButton.classes()).toContain('nav-item-active')

    // Testando rota de Anotações ('/canvas')
    g.useRoute = () => ({ path: '/canvas', params: {}, query: {} })
    wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })
    const anotaçõesLink = wrapper.find('a[title="Anotações"]')
    expect(anotaçõesLink.classes()).toContain('nav-item-active')

    // Testando rota de Revisão ('/revisao')
    g.useRoute = () => ({ path: '/revisao', params: {}, query: {} })
    wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })
    const revisaoLink = wrapper.find('a[title="Revisão (Flashcards & Resumos)"]')
    expect(revisaoLink.classes()).toContain('nav-item-active')

    // Testando rota de Conta ('/conta')
    g.useRoute = () => ({ path: '/conta', params: {}, query: {} })
    wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })
    const contaLink = wrapper.find('a[title="Sua Conta & Status Pro"]')
    expect(contaLink.classes()).toContain('nav-item-active')

    g.useRoute = originalUseRoute
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

  it('is hidden inside a canvas board (/canvas/:id) so the canvas toolbar replaces it', () => {
    const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any
    const originalUseRoute = g.useRoute
    g.useRoute = () => ({
      path: '/canvas/board-abc-123',
      params: { id: 'board-abc-123' },
      query: {},
      hash: '',
      fullPath: '/canvas/board-abc-123'
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

  it('is hidden when user is not logged in on any route', () => {
    isLoggedInRef.value = false

    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.find('[role="navigation"]').exists()).toBe(false)
  })

  it('disappears immediately when user logs out', async () => {
    isLoggedInRef.value = true

    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('[role="navigation"]').exists()).toBe(true)

    // Simula o logout
    isLoggedInRef.value = false
    await wrapper.vm.$nextTick()

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.find('[role="navigation"]').exists()).toBe(false)
  })

  it('contains desktop and tablet horizontal positioning classes for vertical left alignment and rounded styling', () => {
    const wrapper = mount(BottomNavbar, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' }
        }
      }
    })

    const navWrapper = wrapper.find('.app-navbar-wrapper')
    expect(navWrapper.exists()).toBe(true)
    expect(navWrapper.classes()).toContain('lg:top-1/2')
    expect(navWrapper.classes()).toContain('lg:-translate-y-1/2')
    expect(navWrapper.classes()).toContain('lg:left-3')
    expect(navWrapper.classes()).toContain('lg:rounded-3xl')
    expect(navWrapper.classes()).toContain('md:landscape:top-1/2')
    expect(navWrapper.classes()).toContain('md:landscape:-translate-y-1/2')
    expect(navWrapper.classes()).toContain('md:landscape:left-3')
    expect(navWrapper.classes()).toContain('md:landscape:rounded-3xl')

    const nav = wrapper.find('.app-nav')
    expect(nav.exists()).toBe(true)
    expect(nav.classes()).toContain('lg:flex-col')
    expect(nav.classes()).toContain('md:landscape:flex-col')
  })
})
