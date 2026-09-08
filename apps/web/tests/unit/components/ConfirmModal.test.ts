import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmModal from '~/components/ConfirmModal.vue'

describe('ConfirmModal.vue', () => {
  it('renders modal content when isOpen is true', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Confirmar Ação Destrutiva',
        subtitle: 'Atenção',
        description: 'Tem certeza que deseja prosseguir?',
        confirmText: 'Excluir Item',
        cancelText: 'Voltar',
        variant: 'danger',
        actionType: 'delete'
      }
    })

    expect(wrapper.text()).toContain('Confirmar Ação Destrutiva')
    expect(wrapper.text()).toContain('Atenção')
    expect(wrapper.text()).toContain('Tem certeza que deseja prosseguir?')
    expect(wrapper.text()).toContain('Excluir Item')
    expect(wrapper.text()).toContain('Voltar')

    const confirmBtn = wrapper.find('[data-testid="confirm-modal-confirm-btn"]')
    expect(confirmBtn.classes()).toContain('bg-rose-600')
  })

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Sair da Conta',
        description: 'Deseja realmente sair?',
        confirmText: 'Sair da Conta',
        variant: 'danger',
        actionType: 'logout'
      }
    })

    const confirmBtn = wrapper.find('[data-testid="confirm-modal-confirm-btn"]')
    await confirmBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Remover Livro',
        description: 'Deseja remover o livro?',
        confirmText: 'Remover Livro',
        cancelText: 'Cancelar',
        variant: 'danger'
      }
    })

    const cancelBtn = wrapper.find('[data-testid="confirm-modal-cancel-btn"]')
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
