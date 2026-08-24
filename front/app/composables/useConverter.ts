import { ref } from 'vue'

export interface ConversionOptions {
  ocrEnabled: boolean
  extractImages: boolean
  chapterDetection: 'auto' | 'strict' | 'headings'
  cleanFootnotes: boolean
  customTitle?: string
}

export type ConversionStatus = 'idle' | 'analyzing' | 'extracting' | 'formatting' | 'packaging' | 'completed' | 'error'

export interface ConversionResult {
  fileName: string
  epubUrl: string
  fileSizeBytes: number
  chaptersCount: number
  processingTimeSec: number
}

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

    status.value = 'analyzing'
    progress.value = 15
    currentStep.value = 'Analisando estrutura e metadados do PDF...'
    errorMessage.value = ''

    try {
      // Etapa 1: Análise estrutural
      await new Promise((r) => setTimeout(r, 600))
      status.value = 'extracting'
      progress.value = 45
      currentStep.value = 'Extraindo texto e segmentando capítulos...'

      // Etapa 2: Extração & OCR
      await new Promise((r) => setTimeout(r, 800))
      status.value = 'formatting'
      progress.value = 75
      currentStep.value = 'Refinando tipografia editorial e notas de rodapé...'

      // Etapa 3: Empacotamento
      await new Promise((r) => setTimeout(r, 700))
      status.value = 'packaging'
      progress.value = 95
      currentStep.value = 'Gerando container EPUB3 compatível...'

      await new Promise((r) => setTimeout(r, 500))
      progress.value = 100
      status.value = 'completed'
      currentStep.value = 'Conversão concluída com sucesso!'

      const originalName = selectedFile.value.name.replace(/\.pdf$/i, '')
      result.value = {
        fileName: `${originalName}.epub`,
        epubUrl: URL.createObjectURL(new Blob([`Mock EPUB content for ${originalName}`], { type: 'application/epub+zip' })),
        fileSizeBytes: Math.round(selectedFile.value.size * 0.7),
        chaptersCount: 12,
        processingTimeSec: 2.6
      }
    } catch (err: any) {
      status.value = 'error'
      errorMessage.value = err?.message || 'Ocorreu um erro ao processar o PDF.'
    }
  }

  const reset = () => {
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
