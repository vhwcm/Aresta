import { describe, it, expect, vi } from 'vitest'
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
          BookOpenIcon: true,
          FileCode2Icon: true,
          SearchIcon: true,
          FileTextIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Continue sua última leitura')
    expect(wrapper.text()).toContain('Continuar Leitura')
    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('Machado de Assis')
    expect(wrapper.text()).toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard Agora')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
    expect(wrapper.find('img').exists() || wrapper.text().toContain('Aresta Acervo')).toBe(true)
  })
})
