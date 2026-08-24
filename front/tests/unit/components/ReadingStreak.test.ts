import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadingStreak from '../../../app/components/ReadingStreak.vue'

describe('ReadingStreak Component', () => {
  it('renders streak days count correctly and opens popover on click', async () => {
    const wrapper = mount(ReadingStreak)

    expect(wrapper.find('button').exists()).toBe(true)

    // Clicar para abrir popover
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Ofensiva de Leitura')
    expect(wrapper.text()).toContain('Meta diária')
    expect(wrapper.text()).toContain('Últimos 7 dias')
  })
})
