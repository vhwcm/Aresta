import { ref } from 'vue'

export interface ConversionOptions {
  ocrEnabled: boolean
  extractImages: boolean
  chapterDetection: 'auto' | 'strict' | 'headings'
  cleanFootnotes: boolean
  customTitle?: string
  dpi?: number
}

export type ConversionStatus = 'idle' | 'uploading' | 'analyzing' | 'extracting' | 'formatting' | 'packaging' | 'completed' | 'error'

export interface ConversionResult {
  fileName: string
  epubUrl: string
  fileSizeBytes: number
  chaptersCount: number
  pagesCount: number
  processingTimeSec: number
  classification: string
  isValid: boolean
}

const CONVERTER_API_URL = (typeof process !== 'undefined' && process.env?.PDF2EPUB_API_URL) ? process.env.PDF2EPUB_API_URL : 'http://localhost:8000'

const defaultOptions: ConversionOptions = {
  ocrEnabled: true,
  extractImages: true,
  chapterDetection: 'auto',
  cleanFootnotes: true,
  dpi: 150
}

// Module-level reactive singleton state to persist across page navigations
const selectedFile = ref<File | null>(null)
const status = ref<ConversionStatus>('idle')
const progress = ref(0)
const currentStep = ref('')
const errorMessage = ref('')
const result = ref<ConversionResult | null>(null)
const options = ref<ConversionOptions>({ ...defaultOptions })

export const useConverter = () => {

  const setFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      errorMessage.value = 'Por favor, selecione um arquivo no formato PDF.'
      return false
    }
    selectedFile.value = file
    errorMessage.value = ''
    status.value = 'idle'
    progress.value = 0
    result.value = null
    return true
  }

  const startConversion = async () => {
    if (!selectedFile.value) return

    status.value = 'uploading'
    progress.value = 20
    currentStep.value = 'Enviando PDF para o motor de conversão...'
    errorMessage.value = ''

    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (options.value.customTitle) {
        formData.append('title', options.value.customTitle)
      }
      formData.append('dpi', String(options.value.dpi || 150))
      formData.append('download', 'true')

      status.value = 'analyzing'
      progress.value = 45
      currentStep.value = 'Processando layout, extração determinística e gerando EPUB 3...'

      const response = await fetch(`${CONVERTER_API_URL}/convert/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorDetail = `Erro no servidor (HTTP ${response.status})`
        try {
          const errData = await response.json()
          if (errData.detail) errorDetail = errData.detail
        } catch {
          // Response was not JSON
        }
        throw new Error(errorDetail)
      }

      status.value = 'packaging'
      progress.value = 90
      currentStep.value = 'Validando conformidade do EPUB gerado...'

      const epubBlob = await response.blob()

      // Validação de assinatura de bytes PK\x03\x04 (ZIP / EPUB)
      const buffer = await epubBlob.slice(0, 4).arrayBuffer()
      const headerBytes = new Uint8Array(buffer)
      const isZipHeader = headerBytes.length >= 4 &&
        headerBytes[0] === 0x50 &&
        headerBytes[1] === 0x4B &&
        (headerBytes[2] === 0x03 || headerBytes[2] === 0x05 || headerBytes[2] === 0x07)

      if (!isZipHeader) {
        throw new Error('A resposta do servidor não é um arquivo EPUB válido (assinatura ZIP incorreta).')
      }

      // Extrai metadados dos headers da resposta
      const pagesCount = parseInt(response.headers.get('X-Pages-Count') || '1', 10)
      const chaptersCount = parseInt(response.headers.get('X-Chapters-Count') || '1', 10)
      const processingTimeSec = parseFloat(response.headers.get('X-Processing-Time') || '2.0')
      const classification = response.headers.get('X-Classification') || 'DIGITAL'
      const isValid = response.headers.get('X-Is-Valid') !== 'False'

      const originalName = selectedFile.value.name.replace(/\.pdf$/i, '')
      const epubUrl = URL.createObjectURL(epubBlob)

      progress.value = 100
      status.value = 'completed'
      currentStep.value = 'Conversão concluída com sucesso!'

      result.value = {
        fileName: `${originalName}.epub`,
        epubUrl,
        fileSizeBytes: epubBlob.size,
        chaptersCount,
        pagesCount,
        processingTimeSec,
        classification,
        isValid
      }
    } catch (err: any) {
      status.value = 'error'
      const msg = err?.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed') || err?.name === 'TypeError') {
        errorMessage.value = `Não foi possível conectar ao serviço de conversão em ${CONVERTER_API_URL}. Certifique-se de que o backend Python (pdf2epub) está em execução.`
      } else {
        errorMessage.value = msg || 'Ocorreu um erro ao converter o PDF para EPUB.'
      }
    }
  }

  const reset = () => {
    if (result.value?.epubUrl) {
      URL.revokeObjectURL(result.value.epubUrl)
    }
    selectedFile.value = null
    status.value = 'idle'
    progress.value = 0
    currentStep.value = ''
    errorMessage.value = ''
    result.value = null
  }

  return {
    selectedFile,
    options,
    status,
    progress,
    currentStep,
    errorMessage,
    result,
    setFile,
    startConversion,
    reset
  }
}
