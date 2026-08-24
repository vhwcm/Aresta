import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '~/pages/index.vue'

describe('Index Page (Home)', () => {
  it('renders reading streak, continue reading, notes and daily flashcard', () => {
    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ReadingStreak: { template: '<div data-testid="reading-streak">Streak 5 dias</div>' },
          ArrowRightIcon: true,
          BrainIcon: true,
          SparklesIcon: true,
          FileCode2Icon: true,
          SearchIcon: true,
          FileTextIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('Pág. 42 / 128')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
    expect(wrapper.find('img').exists() || wrapper.text().toContain('Aresta')).toBe(true)
  })
})
