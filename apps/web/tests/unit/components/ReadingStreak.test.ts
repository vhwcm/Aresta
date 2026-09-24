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

  it('renderiza no modo compacto com alinhamento na sidebar', async () => {
    const wrapper = mount(ReadingStreak, {
      props: {
        compact: true,
        align: 'sidebar'
      }
    })

    const btn = wrapper.find('[data-testid="reading-streak-trigger-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('px-2')

    await btn.trigger('click')
    const popover = wrapper.find('.animate-in')
    expect(popover.exists()).toBe(true)
    expect(popover.classes()).toContain('fixed')
    expect(popover.classes()).toContain('md:absolute')
  })
})
