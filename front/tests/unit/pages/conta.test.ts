import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContaPage from '~/pages/conta.vue'

describe('Conta Page (/conta)', () => {
  it('renders user profile and reading metrics', () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          UserIcon: true,
          CrownIcon: true,
          BookOpenIcon: true,
          ClockIcon: true,
          NetworkIcon: true,
          CheckCircle2Icon: true,
          SparklesIcon: true,
          FileCode2Icon: true,
          ShieldCheckIcon: true,
          LogOutIcon: true,
          XIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Sua Conta')
    expect(wrapper.text()).toContain('Métricas de Leitura & Conhecimento')
    expect(wrapper.text()).toContain('Aresta Pro')
  })
})
