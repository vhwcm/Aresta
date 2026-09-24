import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ManageThemesModal from '../../../app/components/ManageThemesModal.vue'

const mockCreateNode = vi.fn()
const mockUpdateNode = vi.fn()
const mockDeleteNode = vi.fn()

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    createNode: mockCreateNode,
    updateNode: mockUpdateNode,
    deleteNode: mockDeleteNode,
  })
}))

describe('ManageThemesModal.vue', () => {
  const sampleThemes = [
    { id: 1, name: 'Filosofia', color: '#E57B55', description: 'Obras de filosofia' },
    { id: 2, name: 'Tecnologia', color: '#3B82F6', description: 'Programação e IA' },
    { id: 3, name: 'Literatura', color: '#10B981', description: 'Ficção e contos' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateNode.mockResolvedValue({ id: 99, name: 'Novo Tema', color: '#E57B55' })
    mockUpdateNode.mockImplementation(async (id, name, color, description) => ({
      id,
      name,
      color,
      description
    }))
    mockDeleteNode.mockResolvedValue({ success: true })
  })

  it('não renderiza nada quando isOpen é false', () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: false,
        themes: sampleThemes,
      }
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renderiza título, lista de temas e contagem de livros quando isOpen é true', () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
        booksCountByTheme: (id) => (Number(id) === 1 ? 5 : 0)
      }
    })

    expect(wrapper.text()).toContain('Gerenciar Tags')
    expect(wrapper.text()).toContain('Filosofia')
    expect(wrapper.text()).toContain('5 livros')
    expect(wrapper.text()).toContain('Tecnologia')
    expect(wrapper.text()).toContain('0 livros')
    expect(wrapper.text()).toContain('Literatura')
  })

  it('filtra temas ao digitar no campo de busca', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    const searchInput = wrapper.find('input[placeholder="Buscar tags..."]')
    await searchInput.setValue('tec')

    expect(wrapper.text()).toContain('Tecnologia')
    expect(wrapper.text()).not.toContain('Filosofia')
    expect(wrapper.text()).not.toContain('Literatura')
  })

  it('permite criar novo tema', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    const nameInput = wrapper.find('input[placeholder="Nome da nova tag..."]')
    await nameInput.setValue('Psicologia')

    const createBtn = wrapper.find('[data-testid="create-theme-submit-btn"]')
    await createBtn.trigger('click')
    await flushPromises()

    expect(mockCreateNode).toHaveBeenCalledWith('Psicologia', '#E57B55')
    expect(wrapper.emitted('themeCreated')).toBeTruthy()
  })

  it('permite editar nome de um tema existente', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    // Clica no botão de editar do primeiro tema (Filosofia)
    const editBtn = wrapper.findAll('[data-testid="edit-theme-btn"]')[0]
    expect(editBtn).toBeDefined()
    await editBtn?.trigger('click')
    await nextTick()

    // Deve exibir o campo de edição de texto
    const editInput = wrapper.find('[data-testid="edit-theme-input"]')
    expect(editInput.exists()).toBe(true)
    await editInput.setValue('Filosofia Antiga')

    // Salva a alteração
    const saveBtn = wrapper.find('[data-testid="save-edit-theme-btn"]')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(mockUpdateNode).toHaveBeenCalledWith(
      1,
      'Filosofia Antiga',
      '#E57B55',
      'Obras de filosofia'
    )
    expect(wrapper.emitted('themeUpdated')).toBeTruthy()
  })

  it('solicita confirmação e permite deletar um tema', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
        booksCountByTheme: (id) => (Number(id) === 2 ? 3 : 0)
      }
    })

    // Clica na lixeira do segundo tema (Tecnologia)
    const deleteBtn = wrapper.findAll('[data-testid="delete-theme-btn"]')[1]
    expect(deleteBtn).toBeDefined()
    await deleteBtn?.trigger('click')

    // Deve exibir aviso com contagem de livros
    expect(wrapper.text()).toContain('Excluir tag «Tecnologia»?')
    expect(wrapper.text()).toContain('Esta tag está vinculada a 3 livros')

    // Confirma exclusão
    const confirmDeleteBtn = wrapper.find('[data-testid="confirm-delete-theme-btn"]')
    await confirmDeleteBtn.trigger('click')
    await flushPromises()

    expect(mockDeleteNode).toHaveBeenCalledWith(2)
    expect(wrapper.emitted('themeDeleted')).toBeTruthy()
    expect(wrapper.emitted('themeDeleted')![0]).toEqual([2])
  })

  it('emite close ao clicar no botão de fechar', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    const closeBtn = wrapper.find('[data-testid="close-manage-themes-btn"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('impede criação de tema com mais de 30 caracteres e exibe erro', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    const nameInput = wrapper.find('input[placeholder="Nome da nova tag..."]')
    await nameInput.setValue('Este nome de tema tem mais de trinta caracteres com certeza')

    const createBtn = wrapper.find('[data-testid="create-theme-submit-btn"]')
    await createBtn.trigger('click')
    await flushPromises()

    expect(mockCreateNode).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('30 caracteres')
  })

  it('impede edição de tema com mais de 30 caracteres e exibe erro', async () => {
    const wrapper = mount(ManageThemesModal, {
      props: {
        isOpen: true,
        themes: sampleThemes,
      }
    })

    const editBtn = wrapper.findAll('[data-testid="edit-theme-btn"]')[0]
    await editBtn?.trigger('click')
    await nextTick()

    const editInput = wrapper.find('[data-testid="edit-theme-input"]')
    await editInput.setValue('Nome de tema com mais de trinta caracteres com certeza')

    const saveBtn = wrapper.find('[data-testid="save-edit-theme-btn"]')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(mockUpdateNode).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('30 caracteres')
  })
})
