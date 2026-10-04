import { describe, it, expect, beforeEach } from 'vitest'
import { useArestaDialog } from '../../../app/composables/useArestaDialog'

describe('useArestaDialog', () => {
  let dialog: ReturnType<typeof useArestaDialog>

  beforeEach(() => {
    dialog = useArestaDialog()
    dialog.state.value.isOpen = false
  })

  it('deve inicializar com estado fechado', () => {
    expect(dialog.state.value.isOpen).toBe(false)
  })

  it('deve abrir diálogo com opções de confirmação e resolver true ao confirmar', async () => {
    const promise = dialog.confirm('Deseja realmente prosseguir?')

    expect(dialog.state.value.isOpen).toBe(true)
    expect(dialog.state.value.message).toBe('Deseja realmente prosseguir?')
    expect(dialog.state.value.showCancel).toBe(true)

    dialog.handleConfirm()

    const result = await promise
    expect(result).toBe(true)
    expect(dialog.state.value.isOpen).toBe(false)
  })

  it('deve resolver false ao cancelar confirmação', async () => {
    const promise = dialog.confirm({
      title: 'Atenção',
      message: 'Excluir nota?',
      variant: 'danger'
    })

    expect(dialog.state.value.isOpen).toBe(true)
    expect(dialog.state.value.title).toBe('Atenção')
    expect(dialog.state.value.variant).toBe('danger')

    dialog.handleCancel()

    const result = await promise
    expect(result).toBe(false)
    expect(dialog.state.value.isOpen).toBe(false)
  })

  it('deve abrir alerta sem botão de cancelar e resolver ao dispensar', async () => {
    const promise = dialog.alert('Operação concluída com sucesso!')

    expect(dialog.state.value.isOpen).toBe(true)
    expect(dialog.state.value.showCancel).toBe(false)
    expect(dialog.state.value.confirmText).toBe('Entendi')

    dialog.handleConfirm()

    await promise
    expect(dialog.state.value.isOpen).toBe(false)
  })
})
