import { describe, it, expect, beforeEach } from 'vitest'
import { useFeedbackModal } from '../../../app/composables/useFeedbackModal'

describe('useFeedbackModal Composable', () => {
  beforeEach(() => {
    const modal = useFeedbackModal()
    modal.close()
  })

  it('inicia com isOpen false', () => {
    const modal = useFeedbackModal()
    expect(modal.isOpen.value).toBe(false)
  })

  it('permite abrir, fechar e alternar o modal de feedback', () => {
    const modal = useFeedbackModal()

    modal.open()
    expect(modal.isOpen.value).toBe(true)

    modal.close()
    expect(modal.isOpen.value).toBe(false)

    modal.toggle()
    expect(modal.isOpen.value).toBe(true)

    modal.toggle()
    expect(modal.isOpen.value).toBe(false)
  })
})
