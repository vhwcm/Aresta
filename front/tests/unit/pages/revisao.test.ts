import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RevisaoPage from '~/pages/revisao.vue'

describe('Revisao Page (/revisao)', () => {
  it('renders flashcards section and tab switcher', async () => {
    const wrapper = mount(RevisaoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          LayersIcon: true,
          FileTextIcon: true,
          RotateCwIcon: true,
          ChevronLeftIcon: true,
          ChevronRightIcon: true,
          PlusIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Central de Revisão')
    expect(wrapper.text()).toContain('Flashcards')
    expect(wrapper.text()).toContain('Resumos & Anotações')
  })
})
