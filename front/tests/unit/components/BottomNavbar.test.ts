import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomNavbar from '../../../app/components/BottomNavbar.vue'

describe('BottomNavbar Component', () => {
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
    expect(wrapper.text()).toContain('Conversor')
    expect(wrapper.text()).toContain('Livros')
    expect(wrapper.text()).toContain('Revisão')
    expect(wrapper.text()).toContain('Conta')
  })

  it('toggles collapse state and book menu', async () => {
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
    const booksButton = wrapper.find('button[aria-haspopup="true"]')
    expect(booksButton.exists()).toBe(true)
    await booksButton.trigger('click')

    expect(wrapper.text()).toContain('Meus Livros')
    expect(wrapper.text()).toContain('Grafo de Conhecimento')
    expect(wrapper.text()).toContain('Loja & Catálogo')
  })
})
