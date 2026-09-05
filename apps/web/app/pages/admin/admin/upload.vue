<template>
  <div class="flex flex-col gap-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Cabeçalho da Página -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-2">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent flex items-center gap-2">
          <ShieldAlertIcon class="w-3.5 h-3.5 text-accent" />
          Painel do Administrador (Viktor)
        </div>
        <h1 class="font-editorial text-5xl font-light text-textPrimary leading-tight">
          Catálogo Público & IA
        </h1>
        <p class="text-sm font-interface text-textSecondary max-w-xl leading-relaxed">
          Envie livros para a biblioteca pública. Ao cadastrar com <strong>Título</strong> e <strong>Autor</strong>, o microserviço de IA pesquisará a obra na internet, gerará o resumo e vinculará/criará temas e subtemas no grafo automaticamente.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          to="/grafo"
          class="px-5 py-2.5 rounded-full border border-divider text-xs font-technical text-textSecondary hover:text-textPrimary hover:border-divider/80 transition-all flex items-center gap-2"
        >
          <NetworkIcon class="w-4 h-4 text-accent" />
          <span>Ver no Grafo</span>
        </NuxtLink>
        <NuxtLink
          to="/library"
          class="px-5 py-2.5 rounded-full bg-white/5 border border-divider text-xs font-technical text-textPrimary hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <BookOpenIcon class="w-4 h-4" />
          <span>Biblioteca</span>
        </NuxtLink>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Formulário Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Coluna Esquerda: Formulário de Metadados e Arquivo -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <div class="bg-bgPanel/40 border border-divider rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col gap-6">
          <div class="absolute -right-12 -top-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <h2 class="font-editorial text-2xl text-textPrimary font-light mb-1">
              Cadastrar Novo Livro no Catálogo
            </h2>
            <p class="text-xs text-textSecondary font-interface">
              Preencha os dados da obra para enriquecimento automático de IA e extração de temas.
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
            <!-- Título -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                <BookmarkIcon class="w-3.5 h-3.5 text-accent" />
                Título da Obra *
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="Ex: O Programador Pragmático"
                class="w-full bg-bgApp/60 border border-divider/80 rounded-xl px-4 py-3 text-sm text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            <!-- Autor -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                <UserIcon class="w-3.5 h-3.5 text-accent" />
                Autor(a) *
              </label>
              <input
                v-model="form.author"
                type="text"
                required
                placeholder="Ex: Andy Hunt & Dave Thomas"
                class="w-full bg-bgApp/60 border border-divider/80 rounded-xl px-4 py-3 text-sm text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            <!-- Seleção de Arquivo (PDF ou EPUB) -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                <FileUpIcon class="w-3.5 h-3.5 text-accent" />
                Arquivo do Livro (.pdf ou .epub) *
              </label>
              <div
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                :class="isDragging ? 'border-accent bg-accent/5' : selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-divider/70 hover:border-divider bg-white/[0.01]'"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.epub"
                  class="hidden"
                  @change="handleFileChange"
                />
                
                <template v-if="selectedFile">
                  <FileCheckIcon class="w-8 h-8 text-emerald-400" />
                  <p class="text-sm font-semibold text-textPrimary">{{ selectedFile.name }}</p>
                  <p class="text-[11px] text-textSecondary font-technical">{{ formatFileSize(selectedFile.size) }}</p>
                </template>
                <template v-else>
                  <UploadCloudIcon class="w-8 h-8 text-textSecondary/60" />
                  <p class="text-xs text-textPrimary font-interface">
                    Arraste o arquivo ou <span class="text-accent underline font-semibold">clique para selecionar</span>
                  </p>
                  <p class="text-[10px] text-textSecondary font-technical">PDF ou EPUB 3</p>
                </template>
              </div>
            </div>

            <!-- Imagem de Capa Opcional -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                <ImageIcon class="w-3.5 h-3.5 text-accent" />
                Imagem de Capa (Opcional - caso queira substituir a capa automática)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                @change="handleCoverChange"
                class="text-xs text-textSecondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-technical file:bg-white/5 file:text-textPrimary hover:file:bg-white/10 cursor-pointer"
              />
            </div>

            <!-- Feedback de Erro / Sucesso -->
            <div
              v-if="adminStore.error"
              class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-interface flex items-center gap-3 animate-in fade-in"
            >
              <AlertTriangleIcon class="w-4 h-4 text-rose-400 shrink-0" />
              <span>{{ adminStore.error }}</span>
            </div>

            <div
              v-if="successMessage"
              class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-interface flex items-center gap-3 animate-in fade-in"
            >
              <CheckCircle2Icon class="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- Botão de Envio -->
            <button
              type="submit"
              :disabled="adminStore.loading.value || !selectedFile"
              class="mt-2 w-full py-3.5 px-6 rounded-2xl bg-accent text-white font-interface font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <SparklesIcon v-if="!adminStore.loading.value" class="w-4 h-4" />
              <RotateCwIcon v-else class="w-4 h-4 animate-spin" />
              <span>{{ adminStore.loading.value ? 'Processando & Enriquecendo com IA...' : 'Cadastrar Livro & Mapear Temas' }}</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Coluna Direita: Instruções e Detalhes do Pipeline -->
      <div class="flex flex-col gap-6">
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-4">
          <div class="flex items-center gap-3 text-textPrimary">
            <SparklesIcon class="w-5 h-5 text-accent" />
            <h3 class="font-editorial text-lg font-light">Pipeline Inteligente</h3>
          </div>
          <ul class="space-y-3.5 text-xs text-textSecondary font-interface leading-relaxed">
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-accent/20 text-accent font-technical text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span><strong>Upload & Capa:</strong> O arquivo é armazenado e a capa é extraída automaticamente.</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-accent/20 text-accent font-technical text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span><strong>Google Search Grounding:</strong> O microserviço Go pesquisa o contexto e tópicos do livro na web.</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-accent/20 text-accent font-technical text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span><strong>Embeddings Semânticos:</strong> Compara com os temas do banco e calcula similaridade de cosseno.</span>
            </li>
            <li class="flex items-start gap-2.5">
              <span class="w-5 h-5 rounded-full bg-accent/20 text-accent font-technical text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <span><strong>Hierarquia de Subtemas:</strong> Cria e conecta subtemas no grafo (ex: "Programação" ➔ "Ferramentas").</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  ShieldAlertIcon,
  BookOpenIcon,
  NetworkIcon,
  BookmarkIcon,
  UserIcon,
  FileUpIcon,
  UploadCloudIcon,
  FileCheckIcon,
  ImageIcon,
  SparklesIcon,
  RotateCwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from 'lucide-vue-next'
import { useAdminBooks } from '~/composables/useAdminBooks'

const adminStore = useAdminBooks()

const form = reactive({
  title: '',
  author: '',
})

const selectedFile = ref<File | null>(null)
const selectedCover = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const successMessage = ref<string | null>(null)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

function handleCoverChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedCover.value = target.files[0]
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf' || ext === 'epub') {
      selectedFile.value = file
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = (reader.result as string) || ''
      // Extrair apenas o base64 puro após a vírgula
      const base64 = result.includes(',') ? result.split(',')[1] || '' : result
      resolve(base64)
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })

async function handleSubmit() {
  if (!selectedFile.value || !form.title || !form.author) return

  successMessage.value = null

  try {
    const fileBase64 = await fileToBase64(selectedFile.value)
    let coverBase64: string | undefined
    if (selectedCover.value) {
      coverBase64 = await fileToBase64(selectedCover.value)
    }

    const created = await adminStore.uploadBook({
      title: form.title,
      author: form.author,
      fileName: selectedFile.value.name,
      fileBase64,
      coverBase64,
    })

    successMessage.value = `Livro "${created.title}" cadastrado e mapeado no Grafo de Conhecimento com sucesso!`
    form.title = ''
    form.author = ''
    selectedFile.value = null
    selectedCover.value = null
  } catch (_e) {
    // Erro gerenciado pelo composable
  }
}
</script>
