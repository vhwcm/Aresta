import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeKnowledgeGraphDemo from '~/components/HomeKnowledgeGraphDemo.vue'
import HomeBookReaderDemo from '~/components/HomeBookReaderDemo.vue'
import HomeCanvasNotesDemo from '~/components/HomeCanvasNotesDemo.vue'

describe('Home Page Interactive Demos', () => {
  const commonStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    SparklesIcon: true,
    RotateCcwIcon: true,
    XIcon: true,
    ArrowRightIcon: true,
    NetworkIcon: true,
    BookOpenIcon: true,
    ChevronLeftIcon: true,
    ChevronRightIcon: true,
    BrainIcon: true,
    FileTextIcon: true,
    LayersIcon: true,
    QuoteIcon: true,
    MoveIcon: true,
    CheckCircle2Icon: true
  }

  describe('HomeKnowledgeGraphDemo', () => {
    it('renders the interactive knowledge graph demo container, title, and filter buttons', () => {
      const wrapper = mount(HomeKnowledgeGraphDemo, {
        global: {
          stubs: commonStubs
        }
      })

      expect(wrapper.find('[data-testid="home-knowledge-graph-demo"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Grafo de Conhecimento Conectado')
      expect(wrapper.text()).toContain('Todos os Nós')
      expect(wrapper.text()).toContain('Filosofia')
      expect(wrapper.text()).toContain('Literatura')
      expect(wrapper.text()).toContain('Psicologia')
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('allows filtering graph nodes by category', async () => {
      const wrapper = mount(HomeKnowledgeGraphDemo, {
        global: {
          stubs: commonStubs
        }
      })

      const filoButton = wrapper.find('[data-testid="filter-cat-Filosofia"]')
      expect(filoButton.exists()).toBe(true)
      await filoButton.trigger('click')
      expect(filoButton.classes()).toContain('bg-accent')
    })
  })

  describe('HomeBookReaderDemo', () => {
    it('renders the interactive reader demo, book title, theme buttons, and pagination', () => {
      const wrapper = mount(HomeBookReaderDemo, {
        global: {
          stubs: commonStubs
        }
      })

      expect(wrapper.find('[data-testid="home-book-reader-demo"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Experiência de Leitura Sem Bordas & Imersiva')
      expect(wrapper.text()).toContain('Machado de Assis')
      expect(wrapper.text()).toContain('A Casa Verde')
      expect(wrapper.text()).toContain('Pág. 42')
      expect(wrapper.find('[data-testid="theme-dark-btn"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="theme-sepia-btn"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="theme-light-btn"]').exists()).toBe(true)
    })

    it('allows changing reader theme to sepia and light', async () => {
      const wrapper = mount(HomeBookReaderDemo, {
        global: {
          stubs: commonStubs
        }
      })

      const sepiaBtn = wrapper.find('[data-testid="theme-sepia-btn"]')
      await sepiaBtn.trigger('click')
      expect(wrapper.html()).toContain('bg-[#FBF0D9]')

      const lightBtn = wrapper.find('[data-testid="theme-light-btn"]')
      await lightBtn.trigger('click')
      expect(wrapper.html()).toContain('bg-[#FAFAFA]')
    })

    it('opens highlight popover and generates flashcard when clicking highlighted text', async () => {
      const wrapper = mount(HomeBookReaderDemo, {
        global: {
          stubs: commonStubs
        }
      })

      // Clicar no trecho destacado
      const highlightSpan = wrapper.find('.group\\/hl')
      expect(highlightSpan.exists()).toBe(true)
      await highlightSpan.trigger('click')

      // Verifica que o popover de reflexão abre
      expect(wrapper.find('[data-testid="highlight-popover"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Anotação Reflexiva & Vínculo ao Grafo')
      expect(wrapper.text()).toContain('#epistemologia')

      // Clicar em Gerar Flashcard
      const genBtn = wrapper.find('[data-testid="generate-flashcard-btn"]')
      expect(genBtn.exists()).toBe(true)
      await genBtn.trigger('click')

      // Verifica que o modal de flashcard abre
      expect(wrapper.find('[data-testid="flashcard-modal"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Repetição Espaçada Ebbinghaus')
    })
  })

  describe('HomeCanvasNotesDemo', () => {
    it('renders the interactive canvas notes demo, retention pipeline, and nodes', () => {
      const wrapper = mount(HomeCanvasNotesDemo, {
        global: {
          stubs: commonStubs
        }
      })

      expect(wrapper.find('[data-testid="home-canvas-notes-demo"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Do Livro à Maestria')
      expect(wrapper.text()).toContain('Notas Ativas & Canvas Espacial')
      expect(wrapper.text()).toContain('Retenção de Conhecimento na Prática')
      expect(wrapper.text()).toContain('Etapa 01')
      expect(wrapper.text()).toContain('Etapa 02')
      expect(wrapper.text()).toContain('Etapa 03')
      expect(wrapper.text()).toContain('Etapa 04')
      expect(wrapper.text()).toContain('Rápido e Devagar')
      expect(wrapper.text()).toContain('Nota Ativa (Markdown)')
      expect(wrapper.text()).toContain('Flashcard de Retenção')
    })

    it('allows selecting different knowledge scenarios and toggling flashcard answer', async () => {
      const wrapper = mount(HomeCanvasNotesDemo, {
        global: {
          stubs: commonStubs
        }
      })

      // Alternar para o cenário de Filosofia & Sanidade
      const filoScenarioBtn = wrapper.find('[data-testid="canvas-scenario-filosofia"]')
      expect(filoScenarioBtn.exists()).toBe(true)
      await filoScenarioBtn.trigger('click')

      expect(wrapper.text()).toContain('O Alienista')
      expect(wrapper.text()).toContain('A Arbitrariedade dos Critérios de Normalidade')

      // Verificar revelação da resposta do flashcard
      expect(wrapper.text()).not.toContain('Concluiu que se a maioria possuía desvios morais')
      const showAnswerBtn = wrapper.find('button.text-accent')
      expect(showAnswerBtn.exists()).toBe(true)
      await showAnswerBtn.trigger('click')
      expect(wrapper.text()).toContain('Concluiu que se a maioria possuía desvios morais')
    })
  })
})
