<template>
  <div class="flex flex-col gap-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Cabeçalho da Página -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-2">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <UploadIcon class="w-3.5 h-3.5 text-accent" />
          Módulo de Importação
        </div>
        <h1 class="font-editorial text-5xl font-light text-textPrimary leading-tight">
          Upload de Livros
        </h1>
        <p class="text-sm font-interface text-textSecondary max-w-xl leading-relaxed">
          Envie seus livros nos formatos <strong>PDF</strong> ou <strong>EPUB</strong> para leitura imediata no leitor Aresta com animação de páginas.
        </p>
      </div>

      <NuxtLink
        to="/library"
        class="px-5 py-2.5 rounded-full border border-divider text-xs font-technical text-textSecondary hover:text-textPrimary hover:border-divider/80 transition-all flex items-center gap-2 w-max"
      >
        <BookOpenIcon class="w-4 h-4" />
        <span>Ir para Biblioteca</span>
      </NuxtLink>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Status de Sincronização em Nuvem (Google Drive) -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border transition-all"
      :class="isGoogleDriveConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.02] border-divider text-textSecondary'"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 87.3 78" fill="none">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.9 10.2z" fill="#ea4335"/>
          <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
          <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
        <div class="flex flex-col">
          <span class="text-xs font-interface font-medium text-textPrimary">
            {{ isGoogleDriveConnected ? 'Google Drive Conectado' : 'Google Drive Desconectado' }}
          </span>
          <span class="text-[11px] font-interface text-textSecondary">
            {{ isGoogleDriveConnected ? 'Livros e capas são salvos automaticamente na pasta Aresta/[Título]/ do seu Drive.' : 'Seus livros serão salvos localmente. Conecte sua conta Google para salvar na nuvem.' }}
          </span>
        </div>
      </div>

      <button
        v-if="!isGoogleDriveConnected"
        type="button"
        @click="loginWithOAuth('google')"
        :disabled="isLoggingIn"
        data-testid="connect-drive-btn"
        class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-textPrimary text-xs font-interface font-medium border border-divider transition-all flex items-center gap-2 cursor-pointer shrink-0"
      >
        <span v-if="!isLoggingIn">Conectar Google Drive</span>
        <span v-else>Conectando...</span>
      </button>
      <span v-else class="text-[10px] font-technical uppercase text-emerald-400 tracking-wider font-semibold">
        Ativo
      </span>
    </div>

    <!-- Área Principal de DropZone e Instruções -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Coluna da Esquerda: DropZone (2 cols em telas grandes) -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <div class="bg-bgPanel/40 border border-divider rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

          <h2 class="font-editorial text-2xl text-textPrimary font-light mb-2">
            Selecione ou Arraste seu Arquivo
          </h2>
          <p class="text-xs text-textSecondary font-interface mb-6">
            O arquivo será processado localmente com validação de bytes e extração automática de capa.
          </p>

          <ReaderUploadDropZone
            id="drop-zone-area"
            @file-validated="onFileValidated"
          />

          <!-- Prévia da Capa Extraída -->
          <div
            v-if="lastExtractedCover"
            class="mt-4 p-4 rounded-2xl bg-white/5 border border-accent/30 flex items-center gap-4 animate-in fade-in"
          >
            <img
              :src="lastExtractedCover"
              alt="Capa Extraída"
              class="w-14 h-20 object-cover rounded-lg shadow-md border border-divider"
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] font-semibold text-accent uppercase tracking-wider font-technical">
                Capa Extraída Automaticamente
              </span>
              <span class="text-sm font-interface font-medium text-textPrimary">{{ lastBookTitle }}</span>
              <span class="text-xs font-interface text-textSecondary">
                Capa salva com sucesso para exibição na estante e no leitor.
              </span>
            </div>
          </div>

          <!-- Feedback de Erro -->
          <div
            v-if="store.error"
            id="drop-zone-error"
            class="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-interface flex items-center gap-3 animate-in fade-in"
            role="alert"
          >
            <AlertTriangleIcon class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ store.error }}</span>
          </div>
        </div>
      </div>

      <!-- Coluna da Direita: Informações e Guia Rápido -->
      <div class="flex flex-col gap-6">
        <!-- Formatos Aceitos -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-4">
          <div class="flex items-center gap-3 text-textPrimary">
            <FileCheckIcon class="w-5 h-5 text-accent" />
            <h3 class="font-editorial text-lg font-light">Formatos Suportados</h3>
          </div>
          <ul class="flex flex-col gap-3 text-xs text-textSecondary font-interface">
            <li class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-divider">
              <span class="font-semibold text-textPrimary">PDF (.pdf)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-technical bg-accent/20 text-accent font-bold">Documento</span>
            </li>
            <li class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-divider">
              <span class="font-semibold text-textPrimary">EPUB (.epub)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-technical bg-accent/20 text-accent font-bold">E-book</span>
            </li>
          </ul>
        </div>

        <!-- Recursos do Leitor -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-4">
          <div class="flex items-center gap-3 text-textPrimary">
            <BookOpenIcon class="w-5 h-5 text-amber-400" />
            <h3 class="font-editorial text-lg font-light">Recursos Aresta</h3>
          </div>
          <ul class="space-y-3 text-xs text-textSecondary font-interface leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-accent">•</span>
              <span>Animação fluida de virada de página (Page Curl 3D).</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent">•</span>
              <span>Suporte a navegação por teclado (Setas Esquerda / Direita).</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent">•</span>
              <span>Mapeamento automático com o Grafo de Conhecimento.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadIcon, BookOpenIcon, AlertTriangleIcon, FileCheckIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { useLocalBookUpload } from '~/composables/useLocalBookUpload'
import { useOAuth } from '~/composables/useOAuth'
import { isProductionMode, logError } from '~/utils/logger'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const router = useRouter()
const { uploadBookLocally } = useLocalBookUpload()
const { isGoogleDriveConnected, loginWithOAuth, isLoggingIn } = useOAuth()

const lastExtractedCover = ref<string | null>(null)
const lastBookTitle = ref<string>('')

async function onFileValidated({ file, type }: { file: File; type: SupportedFileType }) {
  store.setLoading(true)

  try {
    store.syncSettings()
    const result = await uploadBookLocally({
      file,
      type,
      initialFontSize: store.fontSize,
      initialFontFamily: store.fontFamily,
    })

    if (result.extractedCover?.dataUrl) {
      lastExtractedCover.value = result.extractedCover.dataUrl
      lastBookTitle.value = result.title
    }

    store.setDocument(result.doc, result.title, result.bookId)
    await router.push({ path: '/reader', query: { bookId: String(result.bookId) } })
  } catch (error) {
    logError('[Uploader Error]', error)
    const isProd = isProductionMode()
    const msg = isProd
      ? 'Falha ao abrir o arquivo.'
      : `Falha ao abrir o arquivo: ${String(error)}`
    store.setError(msg)
  } finally {
    store.setLoading(false)
  }
}
</script>
