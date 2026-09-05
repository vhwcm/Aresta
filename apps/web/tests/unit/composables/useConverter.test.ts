import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConverter } from '../../../app/composables/useConverter'

describe('useConverter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const { reset } = useConverter()
    reset()
  })

  it('inicializa com estado idle e opções padrão', () => {
    const { status, progress, selectedFile, options } = useConverter()

    expect(status.value).toBe('idle')
    expect(progress.value).toBe(0)
    expect(selectedFile.value).toBeNull()
    expect(options.value.ocrEnabled).toBe(true)
    expect(options.value.extractImages).toBe(true)
  })

  it('rejeita arquivo não PDF ao chamar setFile', () => {
    const { setFile, errorMessage, selectedFile } = useConverter()
    const nonPdf = new File(['hello'], 'document.txt', { type: 'text/plain' })

    const result = setFile(nonPdf)
    expect(result).toBe(false)
    expect(errorMessage.value).toContain('PDF')
    expect(selectedFile.value).toBeNull()
  })

  it('aceita arquivo PDF válido', () => {
    const { setFile, errorMessage, selectedFile } = useConverter()
    const pdfFile = new File(['%PDF-1.4'], 'livro.pdf', { type: 'application/pdf' })

    const result = setFile(pdfFile)
    expect(result).toBe(true)
    expect(errorMessage.value).toBe('')
    expect(selectedFile.value?.name).toBe('livro.pdf')
  })

  it('gerencia reset de estado corretamente', () => {
    const { setFile, reset, selectedFile, status, progress, errorMessage } = useConverter()
    const pdfFile = new File(['%PDF-1.4'], 'livro.pdf', { type: 'application/pdf' })

    setFile(pdfFile)
    expect(selectedFile.value).not.toBeNull()

    reset()
    expect(selectedFile.value).toBeNull()
    expect(status.value).toBe('idle')
    expect(progress.value).toBe(0)
    expect(errorMessage.value).toBe('')
  })

  it('persiste o estado entre múltiplas chamadas/navegações de páginas', () => {
    const page1 = useConverter()
    const pdfFile = new File(['%PDF-1.4'], 'meu-livro.pdf', { type: 'application/pdf' })
    page1.setFile(pdfFile)

    // Simulando navegação saindo da página e entrando novamente
    const page2 = useConverter()
    expect(page2.selectedFile.value).not.toBeNull()
    expect(page2.selectedFile.value?.name).toBe('meu-livro.pdf')
    expect(page2.status.value).toBe('idle')
  })
})

