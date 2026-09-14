import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BeneficiosPage from '../../../app/pages/beneficios.vue'

describe('Beneficios Page', () => {
  it('renderiza o título principal e as seções de benefícios do Aresta', () => {
    const wrapper = mount(BeneficiosPage, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
          FeedbackCanvas: {
            template: '<div data-testid="feedback-canvas-stub" :data-open="isOpen" />',
            props: ['isOpen'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Por que o Aresta transforma a forma como você')
    expect(wrapper.text()).toContain('Leitura Imersiva & Virada de Página Tridimensional')
    expect(wrapper.text()).toContain('Derrotando a Curva do Esquecimento com Spaced Repetition (FSRS)')
    expect(wrapper.text()).toContain('Grafo Interdisciplinar & Método Zettelkasten')
    expect(wrapper.text()).toContain('Canvas Infinito & Livretos Didáticos com Inteligência Artificial')
  })

  it('possui link de retorno para a home', () => {
    const wrapper = mount(BeneficiosPage, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
          FeedbackCanvas: true,
        },
      },
    })

    const backLink = wrapper.find('[data-testid="beneficios-back-link"]')
    expect(backLink.exists()).toBe(true)
    expect(backLink.attributes('href')).toBe('/')
  })

  it('abre o canvas de feedback ao clicar no botão Enviar Sugestão', async () => {
    const wrapper = mount(BeneficiosPage, {
      global: {
        stubs: {
          NuxtLink: true,
          FeedbackCanvas: {
            template: '<div data-testid="feedback-canvas-stub" :data-open="isOpen" />',
            props: ['isOpen'],
          },
        },
      },
    })

    const feedbackBtn = wrapper.find('[data-testid="beneficios-open-feedback-btn"]')
    expect(feedbackBtn.exists()).toBe(true)

    await feedbackBtn.trigger('click')

    const canvasStub = wrapper.find('[data-testid="feedback-canvas-stub"]')
    expect(canvasStub.attributes('data-open')).toBe('true')
  })
})
