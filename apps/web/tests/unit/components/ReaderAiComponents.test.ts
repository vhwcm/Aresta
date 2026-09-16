import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReaderSelectionTooltip from '../../../app/components/reader/ReaderSelectionTooltip.vue'
import ReaderAiOverlayCard from '../../../app/components/reader/ReaderAiOverlayCard.vue'
import ReaderCreateBookletModal from '../../../app/components/reader/ReaderCreateBookletModal.vue'

describe('Reader AI Components (ReaderSelectionTooltip & ReaderAiOverlayCard)', () => {
  it('1. ReaderSelectionTooltip renderiza botão IA sem emojis e emite eventos de Explicação Rápida e Livreto', async () => {
    const wrapper = mount(ReaderSelectionTooltip, {
      props: {
        visible: true,
        x: 200,
        y: 150,
        selectedText: 'Arquitetura Hexagonal',
        pageNumber: 2,
        isAbove: true,
      },
    })

    expect(wrapper.text()).toContain('IA')
    expect(wrapper.text()).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u) // Valida ausência estrita de emojis

    // Abre o submenu de IA
    const aiBtn = wrapper.find('.reader-selection-tooltip__btn--ai')
    expect(aiBtn.exists()).toBe(true)
    await aiBtn.trigger('click')

    expect(wrapper.text()).toContain('Explicação Rápida')
    expect(wrapper.text()).toContain('Livreto Estruturado')

    const items = wrapper.findAll('.reader-selection-tooltip__ai-item')
    expect(items.length).toBe(2)

    // Clica em Explicação Rápida
    await items[0]!.trigger('click')
    expect(wrapper.emitted('request-short-explanation')).toBeTruthy()
    expect(wrapper.emitted('request-short-explanation')![0]![0]).toMatchObject({
      text: 'Arquitetura Hexagonal',
      pageNumber: 2,
    })

    // Reabre menu e clica em Livreto Estruturado
    await aiBtn.trigger('click')
    const refreshedItems = wrapper.findAll('.reader-selection-tooltip__ai-item')
    await refreshedItems[1]!.trigger('click')
    expect(wrapper.emitted('request-booklet')).toBeTruthy()
    expect(wrapper.emitted('request-booklet')![0]![0]).toMatchObject({
      text: 'Arquitetura Hexagonal',
      pageNumber: 2,
    })
  })

  it('2. ReaderAiOverlayCard renderiza card glassmorphism, sem emojis, com conteúdo e emite ações', async () => {
    const wrapper = mount(ReaderAiOverlayCard, {
      props: {
        visible: true,
        x: 100,
        y: 150,
        selectedText: 'Injeção de Dependência',
        htmlContent: '<div class="aresta-short-explanation"><p>Conceito explicado.</p></div>',
        isLoading: false,
        errorMessage: null,
      },
    })

    expect(wrapper.text()).toContain('Explicação Contextual')
    expect(wrapper.text()).toContain('Conceito explicado.')
    expect(wrapper.text()).toContain('Aprofundar em Livreto')
    expect(wrapper.text()).toContain('Salvar Anotação')
    expect(wrapper.text()).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u) // Valida ausência estrita de emojis

    // Testa ação de salvar anotação
    const saveBtn = wrapper.findAll('footer button')[1]!
    await saveBtn.trigger('click')
    expect(wrapper.emitted('save-note')).toBeTruthy()
    expect(wrapper.emitted('save-note')![0]![0]).toMatchObject({
      text: 'Injeção de Dependência',
      explanation: '<div class="aresta-short-explanation"><p>Conceito explicado.</p></div>',
    })

    // Testa ação de aprofundar em livreto
    const bookletBtn = wrapper.findAll('footer button')[0]!
    await bookletBtn.trigger('click')
    expect(wrapper.emitted('create-booklet')).toBeTruthy()
    expect(wrapper.emitted('create-booklet')![0]![0]).toBe('Injeção de Dependência')
  })

  it('3. ReaderCreateBookletModal renderiza caixa sobreposta com tópico preenchido e fecha ou cria livreto', async () => {
    const wrapper = mount(ReaderCreateBookletModal, {
      props: {
        isOpen: true,
        initialTopic: 'Conceito sobre grafos e repetição espaçada',
        parentBookId: 5,
        parentBookTitle: 'Livro de Algoritmos',
      },
    })

    expect(wrapper.text()).toContain('Criar Livreto Didático com IA')
    expect(wrapper.text()).toContain('Contexto: Livro de Algoritmos')

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('Conceito sobre grafos e repetição espaçada')

    // Testa botão de fechar / cancelar
    const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Cancelar'))
    expect(cancelBtn?.exists()).toBe(true)
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
