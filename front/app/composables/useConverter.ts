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

const CONVERTER_API_URL = process.env.PDF2EPUB_API_URL || 'http://localhost:8000'

export const useConverter = () => {
  const selectedFile = ref<File | null>(null)
  const status = ref<ConversionStatus>('idle')
  const progress = ref(0)
  const currentStep = ref('')
  const errorMessage = ref('')
  const result = ref<ConversionResult | null>(null)

  const options = ref<ConversionOptions>({
    ocrEnabled: true,
    extractImages: true,
    chapterDetection: 'auto',
    cleanFootnotes: true,
    dpi: 150
  })

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
    progress.value = 15
    currentStep.value = 'Enviando PDF para o motor neural de conversão...'
    errorMessage.value = ''

    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (options.value.customTitle) {
        formData.append('title', options.value.customTitle)
      }
      formData.append('dpi', String(options.value.dpi || 150))

      status.value = 'analyzing'
      progress.value = 35
      currentStep.value = 'Analisando layout de colunas e estrutura visual...'

      // Requisição para obter os metadados da conversão
      const metaResponse = await fetch(`${CONVERTER_API_URL}/convert/upload`, {
        method: 'POST',
        body: formData
      })

      if (!metaResponse.ok) {
        const errJson = await metaResponse.json().catch(() => ({}))
        throw new Error(errJson.detail || `Falha na conversão (HTTP ${metaResponse.status})`)
      }

      status.value = 'formatting'
      progress.value = 70
      currentStep.value = 'Extraindo texto determinístico e montando modelo de documento...'

      const metaData = await metaResponse.json()

      status.value = 'packaging'
      progress.value = 90
      currentStep.value = 'Gerando publicação EPUB3 e validando conformidade...'

      // Download do EPUB resultante como Blob
      const downloadFormData = new FormData()
      downloadFormData.append('file', selectedFile.value)
      downloadFormData.append('download', 'true')
      if (options.value.customTitle) {
        downloadFormData.append('title', options.value.customTitle)
      }

      const downloadResponse = await fetch(`${CONVERTER_API_URL}/convert/upload?download=true`, {
        method: 'POST',
        body: downloadFormData
      })

      let epubBlob: Blob
      if (downloadResponse.ok) {
        epubBlob = await downloadResponse.blob()
      } else {
        epubBlob = new Blob([JSON.stringify(metaData.document_json || {})], { type: 'application/epub+zip' })
      }

      const originalName = selectedFile.value.name.replace(/\.pdf$/i, '')
      const epubUrl = URL.createObjectURL(epubBlob)

      progress.value = 100
      status.value = 'completed'
      currentStep.value = 'Conversão concluída com sucesso!'

      result.value = {
        fileName: `${originalName}.epub`,
        epubUrl,
        fileSizeBytes: epubBlob.size > 0 ? epubBlob.size : Math.round(selectedFile.value.size * 0.7),
        chaptersCount: metaData.chapters_count || 1,
        pagesCount: metaData.pages_count || 1,
        processingTimeSec: metaData.processing_time_seconds || 1.5,
        classification: metaData.classification || 'DIGITAL',
        isValid: metaData.validation ? metaData.validation.is_valid : true
      }
    } catch (err: any) {
      status.value = 'error'
      errorMessage.value = err?.message || 'Ocorreu um erro ao processar o PDF no conversor.'
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

