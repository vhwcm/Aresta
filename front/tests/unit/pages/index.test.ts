import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '~/pages/index.vue'

describe('Index Page (Home)', () => {
  it('renders continue reading with cover, streak next to book, progress in % and daily flashcard', () => {
    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ReadingStreak: { template: '<div data-testid="reading-streak">5</div>' },
          ArrowRightIcon: true,
          BrainIcon: true,
          SparklesIcon: true,
          FileTextIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).not.toContain('Pág. 42 / 128')
    expect(wrapper.text()).not.toContain('Converter PDF')
    expect(wrapper.text()).toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
    expect(wrapper.find('img').exists() || wrapper.text().toContain('Aresta')).toBe(true)
  })
})
