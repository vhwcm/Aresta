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
            O arquivo será processado localmente com validação de assinatura de bytes para garantir leitura segura.
          </p>

          <ReaderUploadDropZone
            id="drop-zone-area"
            @file-validated="onFileValidated"
          />

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
import { UploadIcon, BookOpenIcon, AlertTriangleIcon, FileCheckIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { createBookDocument } from '~/adapters/BookDocumentFactory'
import { isProductionMode, logError } from '~/utils/logger'

const store = useReaderStore()
const router = useRouter()

async function onFileValidated({ file, type }: { file: File; type: 'pdf' | 'epub' }) {
  store.setLoading(true)

  try {
    const doc = createBookDocument(type)
    await doc.load(file)
    store.setDocument(doc, file.name)
    await router.push('/reader')
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
