import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LojaPage from '~/pages/loja.vue'

describe('Loja Page (/loja)', () => {
  it('renders curated catalog and book categories', () => {
    const wrapper = mount(LojaPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ShoppingBagIcon: true,
          BookOpenIcon: true,
          BookIcon: true,
          PlusIcon: true,
          XIcon: true,
          CheckCircle2Icon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Loja & Catálogo Aberto')
    expect(wrapper.text()).toContain('Destaque do Mês')
    expect(wrapper.text()).toContain('Todas as Obras Disponíveis')
  })
})
