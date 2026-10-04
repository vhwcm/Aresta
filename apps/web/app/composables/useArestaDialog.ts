import { ref } from 'vue'

export type ArestaDialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'default'

export interface ArestaDialogOptions {
  title?: string
  message: string
  subtitle?: string
  confirmText?: string
  cancelText?: string
  variant?: ArestaDialogVariant
  showCancel?: boolean
  icon?: 'delete' | 'logout' | 'alert' | 'info' | 'check' | 'none'
  showLogo?: boolean
}

interface DialogState extends ArestaDialogOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

const state = ref<DialogState>({
  isOpen: false,
  title: '',
  message: '',
  subtitle: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  showCancel: true,
  icon: 'none',
  showLogo: true
})

export const useArestaDialog = () => {
  const open = (options: ArestaDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.value = {
        isOpen: true,
        title: options.title || (options.showCancel ? 'Confirmação' : 'Notificação'),
        message: options.message,
        subtitle: options.subtitle || '',
        confirmText: options.confirmText || (options.showCancel ? 'Confirmar' : 'OK'),
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || (options.showCancel ? 'default' : 'info'),
        showCancel: options.showCancel !== false,
        icon: options.icon || (options.variant === 'danger' ? 'delete' : 'none'),
        showLogo: options.showLogo !== false,
        resolve
      }
    })
  }

  const confirm = (optionsOrMessage: string | Partial<ArestaDialogOptions>): Promise<boolean> => {
    if (typeof optionsOrMessage === 'string') {
      const isDelete = /excluir|deletar|remover|apagar/i.test(optionsOrMessage)
      return open({
        title: isDelete ? 'Excluir Item' : 'Confirmação',
        message: optionsOrMessage,
        variant: isDelete ? 'danger' : 'default',
        confirmText: isDelete ? 'Excluir' : 'Confirmar',
        cancelText: 'Cancelar',
        showCancel: true,
        icon: isDelete ? 'delete' : 'none',
        showLogo: true
      })
    }

    return open({
      title: optionsOrMessage.title || 'Confirmação',
      message: optionsOrMessage.message || '',
      subtitle: optionsOrMessage.subtitle,
      variant: optionsOrMessage.variant || 'default',
      confirmText: optionsOrMessage.confirmText || 'Confirmar',
      cancelText: optionsOrMessage.cancelText || 'Cancelar',
      showCancel: true,
      icon: optionsOrMessage.icon || (optionsOrMessage.variant === 'danger' ? 'delete' : 'none'),
      showLogo: optionsOrMessage.showLogo !== false
    })
  }

  const alert = (optionsOrMessage: string | Partial<ArestaDialogOptions>): Promise<void> => {
    let opts: ArestaDialogOptions
    if (typeof optionsOrMessage === 'string') {
      opts = {
        title: 'Aresta',
        message: optionsOrMessage,
        variant: 'info',
        confirmText: 'Entendi',
        showCancel: false,
        icon: 'info',
        showLogo: true
      }
    } else {
      opts = {
        title: optionsOrMessage.title || 'Aresta',
        message: optionsOrMessage.message || '',
        subtitle: optionsOrMessage.subtitle,
        variant: optionsOrMessage.variant || 'info',
        confirmText: optionsOrMessage.confirmText || 'Entendi',
        showCancel: false,
        icon: optionsOrMessage.icon || 'info',
        showLogo: optionsOrMessage.showLogo !== false
      }
    }

    return open(opts).then(() => {})
  }

  const handleConfirm = () => {
    const res = state.value.resolve
    state.value.isOpen = false
    if (res) res(true)
  }

  const handleCancel = () => {
    const res = state.value.resolve
    state.value.isOpen = false
    if (res) res(false)
  }

  return {
    state,
    open,
    confirm,
    alert,
    handleConfirm,
    handleCancel
  }
}
