<template>
  <div class="flex flex-col gap-12 pb-16">
    <!-- Cabeçalho Editorial -->
    <header class="flex flex-col gap-3">
      <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
        <FileCode2Icon class="w-3.5 h-3.5" />
        Processamento de Documentos
      </div>
      <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
        Conversor de PDF para EPUB
      </h1>
      <p class="font-interface text-textSecondary text-base max-w-2xl leading-relaxed">
        Transforme documentos estáticos em formato EPUB fluido e responsivo. Desfrute de tipografia ajustável, notas de rodapé interativas e integração com o leitor Aresta.
      </p>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Área de Upload (Drag & Drop) se nenhum arquivo estiver em processo -->
    <section v-if="status === 'idle' && !result" class="flex flex-col gap-8">
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        class="border-2 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 group cursor-pointer"
        :class="isDragging ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,application/pdf"
          class="hidden"
          @change="handleFileChange"
        />

        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-divider flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
          <UploadCloudIcon class="w-8 h-8" />
        </div>

        <div class="flex flex-col gap-1 max-w-md">
          <p class="font-interface text-base font-medium text-textPrimary">
            Clique ou arraste seu arquivo PDF aqui
          </p>
          <p class="font-interface text-xs text-textSecondary">
            Suporta livros, artigos acadêmicos e apostilas até 100MB.
          </p>
        </div>

        <div v-if="selectedFile" class="mt-2 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-accent/30 text-accent font-technical text-xs">
          <FileTextIcon class="w-4 h-4" />
          <span>{{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})</span>
        </div>
      </div>

      <!-- Erro de validação -->
      <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
        <AlertCircleIcon class="w-4 h-4 shrink-0 text-rose-400" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Opções de Conversão -->
      <div v-if="selectedFile" class="flex flex-col gap-6 bg-white/[0.02] p-6 rounded-2xl border border-divider">
        <h3 class="font-interface text-sm font-semibold text-textPrimary uppercase tracking-wider flex items-center gap-2">
          <SlidersIcon class="w-4 h-4 text-accent" />
          Parâmetros de Conversão
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-interface">
          <!-- OCR -->
          <label class="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-divider/50 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" v-model="options.ocrEnabled" class="mt-0.5 accent-accent" />
            <div class="flex flex-col">
              <span class="text-textPrimary font-medium">Reconhecimento OCR Inteligente</span>
              <span class="text-textSecondary text-[11px]">Detecta e converte textos de páginas digitalizadas e fotos de livros.</span>
            </div>
          </label>

          <!-- Imagens -->
          <label class="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-divider/50 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" v-model="options.extractImages" class="mt-0.5 accent-accent" />
            <div class="flex flex-col">
              <span class="text-textPrimary font-medium">Preservar Ilustrações e Figuras</span>
              <span class="text-textSecondary text-[11px]">Otimiza e inclui gráficos, diagramas e capas no arquivo EPUB.</span>
            </div>
          </label>

          <!-- Notas de Rodapé -->
          <label class="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-divider/50 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" v-model="options.cleanFootnotes" class="mt-0.5 accent-accent" />
            <div class="flex flex-col">
              <span class="text-textPrimary font-medium">Notas de Rodapé Interativas</span>
              <span class="text-textSecondary text-[11px]">Transforma números de rodapé em links clicáveis no padrão EPUB3.</span>
            </div>
          </label>

          <!-- Detecção de Capítulos -->
          <div class="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-divider/50">
            <span class="text-textPrimary font-medium">Detecção de Sumário / Capítulos</span>
            <select v-model="options.chapterDetection" class="bg-bgApp text-textPrimary text-xs rounded-lg p-2 border border-divider focus:outline-none focus:border-accent">
              <option value="auto">Automática (Baseada em tamanho de fonte)</option>
              <option value="strict">Rigorosa (Sumário original)</option>
              <option value="headings">Apenas Cabeçalhos Principais</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="reset"
            class="px-5 py-2.5 rounded-xl border border-divider hover:bg-white/5 text-textSecondary hover:text-textPrimary text-xs font-interface transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="startConversion"
            class="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium font-interface transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            Iniciar Conversão para EPUB
          </button>
        </div>
      </div>
    </section>

    <!-- Estado de Processamento em Andamento -->
    <section v-if="['uploading', 'analyzing', 'extracting', 'formatting', 'packaging'].includes(status)" class="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-divider rounded-3xl gap-6 text-center">
      <div class="relative w-20 h-20 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping"></div>
        <div class="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
          <RefreshCwIcon class="w-8 h-8 animate-spin" />
        </div>
      </div>

      <div class="flex flex-col gap-2 max-w-md">
        <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold">Convertendo Documento</span>
        <h3 class="font-editorial text-2xl text-textPrimary">{{ currentStep }}</h3>
        <p class="font-interface text-xs text-textSecondary">Por favor aguarde, estamos reestruturando o conteúdo com formatação editorial.</p>
      </div>

      <!-- Barra de Progresso com Percentual -->
      <div class="w-full max-w-md flex flex-col gap-2">
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-accent transition-all duration-500 rounded-full" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="flex justify-between font-technical text-[10px] text-textSecondary">
          <span>{{ currentStep }}</span>
          <span>{{ progress }}%</span>
        </div>
      </div>
    </section>

    <!-- Estado de Erro / Falha no Processamento -->
    <section v-if="status === 'error'" class="flex flex-col gap-6 bg-white/[0.02] border border-rose-500/30 p-8 md:p-12 rounded-3xl">
      <div class="flex items-start gap-4">
        <div class="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <AlertTriangleIcon class="w-8 h-8" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="font-technical text-xs uppercase tracking-widest text-rose-400 font-semibold">Falha na Conversão</span>
          <h2 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary">Não foi possível converter o documento</h2>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            {{ errorMessage || 'Ocorreu um erro inesperado durante o processamento do arquivo PDF.' }}
          </p>
        </div>
      </div>

      <div class="p-4 rounded-xl bg-white/5 border border-divider/50 text-xs font-interface text-textSecondary flex flex-col gap-2">
        <span class="font-technical text-[10px] uppercase tracking-wider text-textPrimary font-semibold">Dicas para resolução:</span>
        <ul class="list-disc list-inside space-y-1 text-textSecondary text-xs">
          <li>Certifique-se de que o serviço de conversão (backend Python na porta 8000) está em execução.</li>
          <li>Verifique se o arquivo PDF não está protegido por senha ou corrompido.</li>
          <li>Experimente ajustar os parâmetros de conversão (desativar OCR ou simplificar detecção de capítulos).</li>
        </ul>
      </div>

      <div class="flex items-center justify-between gap-4 pt-4 border-t border-divider">
        <button
          @click="reset"
          class="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium font-interface transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
        >
          <RotateCcwIcon class="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>
    </section>

    <!-- Estado de Sucesso / Resultado Pronto -->
    <section v-if="status === 'completed' && result" class="flex flex-col gap-8 bg-white/[0.02] border border-emerald-500/30 p-8 md:p-12 rounded-3xl">
      <div class="flex items-start gap-4">
        <div class="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2Icon class="w-8 h-8" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="font-technical text-xs uppercase tracking-widest text-emerald-400 font-semibold">Conversão Concluída</span>
          <h2 class="font-editorial text-3xl font-light text-textPrimary">{{ result.fileName }}</h2>
          <p class="font-interface text-xs text-textSecondary">
            Arquivo EPUB3 gerado com {{ result.chaptersCount }} capítulos estruturados em {{ result.processingTimeSec }}s.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-divider text-xs">
        <div class="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-divider/50">
          <span class="text-textSecondary uppercase font-technical text-[10px] tracking-wider">Tamanho Final</span>
          <span class="font-technical text-textPrimary font-semibold text-sm">{{ formatBytes(result.fileSizeBytes) }}</span>
        </div>
        <div class="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-divider/50">
          <span class="text-textSecondary uppercase font-technical text-[10px] tracking-wider">Capítulos Detectados</span>
          <span class="font-technical text-textPrimary font-semibold text-sm">{{ result.chaptersCount }}</span>
        </div>
        <div class="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-divider/50">
          <span class="text-textSecondary uppercase font-technical text-[10px] tracking-wider">Formato</span>
          <span class="font-technical text-textPrimary font-semibold text-sm">EPUB 3.2 (Reflowable)</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-divider">
        <button
          @click="reset"
          class="px-5 py-2.5 rounded-xl border border-divider hover:bg-white/5 text-textSecondary hover:text-textPrimary text-xs font-interface transition-colors"
        >
          Converter outro PDF
        </button>

        <div class="flex items-center gap-3">
          <a
            :href="result.epubUrl"
            :download="result.fileName"
            class="px-5 py-2.5 rounded-xl border border-divider bg-white/5 hover:bg-white/10 text-textPrimary text-xs font-interface font-medium transition-colors flex items-center gap-2"
          >
            <DownloadIcon class="w-4 h-4" />
            Baixar .EPUB
          </a>
          <NuxtLink
            to="/library"
            class="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-interface font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <BookOpenIcon class="w-4 h-4" />
            Ir para Minha Biblioteca
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  FileCode2Icon,
  UploadCloudIcon,
  FileTextIcon,
  SlidersIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  DownloadIcon,
  BookOpenIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  RotateCcwIcon
} from 'lucide-vue-next'
import { useConverter } from '~/composables/useConverter'

const {
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
} = useConverter()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    setFile(target.files[0])
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    setFile(e.dataTransfer.files[0])
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>
