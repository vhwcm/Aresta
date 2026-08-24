import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '~/pages/index.vue'

describe('Index Page (Home)', () => {
  it('renders continue reading with cover, streak next to book, progress in %, daily flashcard above 3 notes', () => {
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
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.text()).toContain('Anotações')
    expect(wrapper.text()).not.toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Capítulo III')
    expect(wrapper.text()).toContain('Capítulo II')
    expect(wrapper.text()).toContain('Capítulo I')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
    expect(wrapper.find('img').exists() || wrapper.text().toContain('Aresta')).toBe(true)

    // Validar que o bloco de flashcards vem antes de anotações no DOM
    const html = wrapper.html()
    const flashcardIndex = html.indexOf('Flashcards do Dia')
    const notesIndex = html.indexOf('Anotações')
    expect(flashcardIndex).toBeLessThan(notesIndex)
  })
})
