import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EbbinghausChart from '~/components/EbbinghausChart.vue'

describe('EbbinghausChart Component', () => {
  it('renders chart controls, legend and svg container', () => {
    const wrapper = mount(EbbinghausChart)

    expect(wrapper.text()).toContain('Sem Revisão')
    expect(wrapper.text()).toContain('Com Repetição Espaçada')
    expect(wrapper.text()).toContain('Simulação:')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('allows changing active revision steps', async () => {
    const wrapper = mount(EbbinghausChart)

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)

    const firstButton = buttons[0]
    expect(firstButton).toBeDefined()
    if (firstButton) {
      await firstButton.trigger('click')
    }
    expect(wrapper.html()).toContain('1ª Rev')
  })
})
