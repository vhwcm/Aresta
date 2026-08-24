import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConverter } from '~/composables/useConverter'

describe('useConverter composable', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-epub')
    }
  })

  it('initializes with default options and idle status', () => {
    const { status, progress, options, selectedFile } = useConverter()
    expect(status.value).toBe('idle')
    expect(progress.value).toBe(0)
    expect(selectedFile.value).toBeNull()
    expect(options.value.ocrEnabled).toBe(true)
    expect(options.value.extractImages).toBe(true)
  })

  it('rejects non-pdf files and sets error message', () => {
    const { setFile, errorMessage, selectedFile } = useConverter()
    const invalidFile = new File(['dummy content'], 'document.txt', { type: 'text/plain' })
    const success = setFile(invalidFile)

    expect(success).toBe(false)
    expect(selectedFile.value).toBeNull()
    expect(errorMessage.value).toContain('PDF')
  })

  it('accepts valid PDF file and resets status', () => {
    const { setFile, selectedFile, errorMessage, status } = useConverter()
    const pdfFile = new File(['pdf dummy binary'], 'livro.pdf', { type: 'application/pdf' })
    const success = setFile(pdfFile)

    expect(success).toBe(true)
    expect(selectedFile.value?.name).toBe('livro.pdf')
    expect(errorMessage.value).toBe('')
    expect(status.value).toBe('idle')
  })

  it('resets converter state', () => {
    const { setFile, reset, selectedFile, status, progress } = useConverter()
    const pdfFile = new File(['pdf dummy'], 'artigo.pdf', { type: 'application/pdf' })
    setFile(pdfFile)

    reset()
    expect(selectedFile.value).toBeNull()
    expect(status.value).toBe('idle')
    expect(progress.value).toBe(0)
  })
})
