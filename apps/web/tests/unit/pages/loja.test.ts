import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LojaPage from '~/pages/loja.vue'

describe('Loja Page (/loja)', () => {
  it('renders coming soon message', () => {
    const wrapper = mount(LojaPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ShoppingBagIcon: true,
          ClockIcon: true,
          BookOpenIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Loja & Catálogo')
    expect(wrapper.text()).toContain('Em breve.')
    expect(wrapper.text()).toContain('Acessar Minha Estante')
  })
})
