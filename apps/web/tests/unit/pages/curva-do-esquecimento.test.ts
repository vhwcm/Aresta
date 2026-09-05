import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CurvaEsquecimentoPage from '~/pages/curva-do-esquecimento.vue'

describe('Curva do Esquecimento Page', () => {
  it('renders title, D3 chart, formula and solution sections', () => {
    const wrapper = mount(CurvaEsquecimentoPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          EbbinghausChart: { template: '<div data-testid="ebbinghaus-chart-mock">Gráfico D3</div>' },
          ArrowLeftIcon: true,
          BrainIcon: true,
          CheckCircle2Icon: true
        }
      }
    })

    expect(wrapper.text()).toContain('A Curva do Esquecimento')
    expect(wrapper.text()).toContain('Hermann Ebbinghaus')
    expect(wrapper.text()).toContain('R = e')
    expect(wrapper.text()).toContain('Decaimento Exponencial')
    expect(wrapper.find('[data-testid="ebbinghaus-chart-mock"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Central de Revisão')
  })
})
