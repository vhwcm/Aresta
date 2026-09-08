import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CanvasActionModals from '~/components/canvas/CanvasActionModals.vue'

describe('CanvasActionModals - Busca e Seleção de Tags', () => {
  it('renderiza sugestões de tags existentes ao focar ou digitar no campo de tag', async () => {
    const wrapper = mount(CanvasActionModals, {
      props: {
        newCanvasModalOpen: true,
        moveModalOpen: false,
        tagsModalOpen: false,
        targetCanvas: null,
        folders: ['Filosofia', 'Estudos'],
        availableTags: ['filosofia', 'mente', 'epistemologia', 'neurociencia', 'ia', 'livros'],
        isCreating: false,
        initialFolder: null,
        initialTag: null
      }
    })

    const input = wrapper.find('input[placeholder="Adicionar ou buscar tag..."]')
    expect(input.exists()).toBe(true)

    // Foca no input para abrir o dropdown
    await input.trigger('focus')

    // Dropdown deve ser exibido com tags existentes
    const dropdownButtons = wrapper.findAll('.custom-scrollbar button')
    expect(dropdownButtons.length).toBe(6)
    expect(dropdownButtons[0]?.text()).toContain('#filosofia')
  })

  it('filtra tags existentes conforme o usuário digita', async () => {
    const wrapper = mount(CanvasActionModals, {
      props: {
        newCanvasModalOpen: true,
        moveModalOpen: false,
        tagsModalOpen: false,
        targetCanvas: null,
        folders: [],
        availableTags: ['filosofia', 'mente', 'epistemologia', 'neurociencia', 'ia'],
        isCreating: false,
        initialFolder: null,
        initialTag: null
      }
    })

    const input = wrapper.find('input[placeholder="Adicionar ou buscar tag..."]')
    await input.trigger('focus')
    await input.setValue('epis')

    const dropdownButtons = wrapper.findAll('.custom-scrollbar button')
    expect(dropdownButtons.length).toBe(1)
    expect(dropdownButtons[0]?.text()).toContain('#epistemologia')
  })

  it('adiciona tag ao clicar na sugestão do dropdown e limpa o campo', async () => {
    const wrapper = mount(CanvasActionModals, {
      props: {
        newCanvasModalOpen: true,
        moveModalOpen: false,
        tagsModalOpen: false,
        targetCanvas: null,
        folders: [],
        availableTags: ['filosofia', 'mente', 'ia'],
        isCreating: false,
        initialFolder: null,
        initialTag: null
      }
    })

    const input = wrapper.find('input[placeholder="Adicionar ou buscar tag..."]')
    await input.trigger('focus')

    const firstOption = wrapper.findAll('.custom-scrollbar button')[0]
    expect(firstOption).toBeDefined()
    await firstOption?.trigger('mousedown')

    // Tag selecionada deve ser exibida no formulário
    const tagsBadges = wrapper.findAll('span.bg-accent\\/20')
    expect(tagsBadges.length).toBe(1)
    expect(tagsBadges[0]?.text()).toContain('#filosofia')

    // Input deve ter sido limpo
    expect((input.element as HTMLInputElement).value).toBe('')

    // A tag selecionada não deve mais aparecer na lista de sugestões
    await input.trigger('focus')
    const remainingOptions = wrapper.findAll('.custom-scrollbar button')
    expect(remainingOptions.length).toBe(2)
    expect(remainingOptions.map((b) => b.text())).not.toContain('#filosofia')
  })

  it('suporta navegação pelo teclado (ArrowDown, ArrowUp e Enter) para selecionar tags', async () => {
    const wrapper = mount(CanvasActionModals, {
      props: {
        newCanvasModalOpen: true,
        moveModalOpen: false,
        tagsModalOpen: false,
        targetCanvas: null,
        folders: [],
        availableTags: ['filosofia', 'mente', 'ia'],
        isCreating: false,
        initialFolder: null,
        initialTag: null
      }
    })

    const input = wrapper.find('input[placeholder="Adicionar ou buscar tag..."]')
    await input.trigger('focus')

    // Pressiona ArrowDown para destacar o primeiro item
    await input.trigger('keydown', { key: 'ArrowDown' })
    // Pressiona ArrowDown novamente para destacar o segundo item ('mente')
    await input.trigger('keydown', { key: 'ArrowDown' })

    // Pressiona Enter para selecionar o item destacado
    await input.trigger('keydown', { key: 'Enter' })

    const tagsBadges = wrapper.findAll('span.bg-accent\\/20')
    expect(tagsBadges.length).toBe(1)
    expect(tagsBadges[0]?.text()).toContain('#mente')
  })

  it('permite criar nova tag customizada quando não existe nas sugestões', async () => {
    const wrapper = mount(CanvasActionModals, {
      props: {
        newCanvasModalOpen: true,
        moveModalOpen: false,
        tagsModalOpen: false,
        targetCanvas: null,
        folders: [],
        availableTags: ['filosofia'],
        isCreating: false,
        initialFolder: null,
        initialTag: null
      }
    })

    const input = wrapper.find('input[placeholder="Adicionar ou buscar tag..."]')
    await input.setValue('minha-nova-tag')
    await input.trigger('keydown', { key: 'Enter' })

    const tagsBadges = wrapper.findAll('span.bg-accent\\/20')
    expect(tagsBadges.length).toBe(1)
    expect(tagsBadges[0]?.text()).toContain('#minha-nova-tag')
  })
})
