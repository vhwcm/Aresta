<template>
  <div class="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Cabeçalho da Página -->
    <header class="flex flex-col gap-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <NuxtLink
          to="/library"
          class="font-technical text-xs text-textSecondary hover:text-textPrimary flex items-center gap-1.5 transition-colors group"
        >
          <ArrowLeftIcon class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para a Estante</span>
        </NuxtLink>

        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <UploadIcon class="w-3.5 h-3.5 text-accent" />
          Módulo de Importação
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <h1 class="font-editorial text-4xl sm:text-5xl font-light text-textPrimary leading-tight">
          Upload de Livros
        </h1>
        <p class="text-xs sm:text-sm font-interface text-textSecondary max-w-xl leading-relaxed">
          Envie seus livros nos formatos <strong>PDF</strong> ou <strong>EPUB</strong> para leitura imediata no leitor Aresta com animação de páginas.
        </p>
      </div>
    </header>

    <!-- Área Principal de DropZone -->
    <div class="w-full flex flex-col gap-6">
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

        <!-- Status do Google Drive -->
        <div
          v-if="driveSyncStatus === 'syncing'"
          class="mt-4 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-3 text-sky-300 text-xs font-interface animate-in fade-in"
        >
          <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"></span>
          <span>Enviando livro e capa para o seu Google Drive (pasta Aresta)...</span>
        </div>

        <div
          v-else-if="driveSyncStatus === 'success'"
          class="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-interface animate-in fade-in"
        >
          <CheckCircle2Icon class="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Livro salvo com sucesso no Google Drive (pasta Aresta/{{ lastBookTitle }})!</span>
        </div>

        <div
          v-else-if="driveSyncStatus === 'error'"
          class="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 text-amber-300 text-xs font-interface animate-in fade-in"
        >
          <div class="flex items-center gap-3">
            <AlertTriangleIcon class="w-4 h-4 text-amber-400 shrink-0" />
            <span>Livro salvo na sua conta. Google Drive: {{ driveSyncError || 'Falha na sincronização' }}</span>
          </div>
          <a
            v-if="driveSyncError?.includes('Google Cloud Console')"
            href="https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=476318150003"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition-colors w-max font-semibold text-[11px]"
          >
            <span>Ativar Google Drive API no Console Google</span>
            <span>↗</span>
          </a>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeftIcon, UploadIcon, AlertTriangleIcon, CheckCircle2Icon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { useLocalBookUpload } from '~/composables/useLocalBookUpload'
import { isProductionMode, logError } from '~/utils/logger'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const router = useRouter()
const { uploadBookLocally } = useLocalBookUpload()

const lastExtractedCover = ref<string | null>(null)
const lastBookTitle = ref<string>('')
const driveSyncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
const driveSyncError = ref<string | null>(null)

async function onFileValidated({ file, type }: { file: File; type: SupportedFileType }) {
  store.setLoading(true)
  driveSyncStatus.value = 'idle'
  driveSyncError.value = null

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

    // Se o usuário tem o Google Drive conectado, aguarda a sincronização na nuvem
    if (result.cloudSyncPromise) {
      driveSyncStatus.value = 'syncing'
      try {
        const syncRes = await result.cloudSyncPromise
        if (syncRes.synced) {
          driveSyncStatus.value = 'success'
        } else if (syncRes.error) {
          driveSyncStatus.value = 'error'
          driveSyncError.value = syncRes.error
        }
      } catch (err: any) {
        driveSyncStatus.value = 'error'
        driveSyncError.value = err?.message || 'Falha ao sincronizar com Google Drive'
      }
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
