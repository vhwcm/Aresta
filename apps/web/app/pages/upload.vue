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
      </div>

      <div class="flex flex-col gap-1">
        <h1 class="font-editorial text-4xl sm:text-5xl font-light text-textPrimary leading-tight">
          Upload de Livros
        </h1>
      </div>
    </header>

    <!-- Área Principal de DropZone -->
    <div class="w-full flex flex-col gap-6">
      <div class="bg-bgPanel/40 border border-divider rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col items-center text-center">
        <div class="absolute -right-12 -top-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 class="font-editorial text-2xl text-textPrimary font-light mb-2">
          Selecione ou Arraste seu Arquivo
        </h2>
        <p class="text-xs text-textSecondary font-interface mb-6 max-w-md">
          O arquivo será processado localmente com validação de bytes e extração automática de capa.
        </p>

        <!-- Campo Opcional de Título do Livro -->
        <div class="w-full max-w-lg mb-5 flex flex-col items-start gap-2 text-left">
          <label for="upload-book-title" class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center justify-between w-full">
            <span class="flex items-center gap-1.5">
              <BookmarkIcon class="w-3.5 h-3.5 text-accent" />
              Título do Livro (Opcional)
            </span>
            <span class="text-[10px] text-textSecondary/70 font-mono">{{ customTitle.length }}/30</span>
          </label>
          <input
            id="upload-book-title"
            v-model="customTitle"
            type="text"
            maxlength="30"
            placeholder="Ex: Título personalizado (máx. 30 caracteres)"
            class="w-full bg-bgApp/60 border border-divider/80 rounded-xl px-4 py-3 text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-all"
          />
        </div>

        <!-- Campo Opcional de Tema do Livro -->
        <div class="w-full max-w-lg mb-6 flex flex-col items-start gap-2.5 text-left" data-testid="upload-theme-section">
          <div class="flex items-center justify-between w-full">
            <label class="text-xs font-technical uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
              <TagIcon class="w-3.5 h-3.5 text-accent" />
              <span>Tema do Livro (Opcional)</span>
            </label>
            <button
              type="button"
              @click="showCreateThemeInline = !showCreateThemeInline"
              data-testid="toggle-create-theme-btn"
              class="text-[11px] font-technical text-accent hover:underline flex items-center gap-1 transition-colors"
            >
              <PlusIcon class="w-3 h-3" />
              <span>{{ showCreateThemeInline ? 'Fechar' : 'Novo Tema' }}</span>
            </button>
          </div>

          <!-- Criação Rápida de Tema Inline -->
          <div
            v-if="showCreateThemeInline"
            data-testid="inline-create-theme-panel"
            class="w-full p-3.5 rounded-2xl bg-white/[0.03] border border-divider/80 flex flex-col gap-3 animate-in fade-in duration-200"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-technical uppercase tracking-wider text-textSecondary font-bold">
                Criar Novo Tema no Grafo
              </span>
              <div class="flex items-center gap-1.5">
                <button
                  v-for="color in presetColors"
                  :key="color"
                  type="button"
                  @click="newThemeColor = color"
                  class="w-3.5 h-3.5 rounded-full border transition-all"
                  :class="newThemeColor === color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="newThemeName"
                type="text"
                maxlength="30"
                placeholder="Nome do tema (ex: Estoicismo)..."
                data-testid="inline-theme-name-input"
                class="flex-1 bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                @keyup.enter="handleCreateThemeInline"
              />
              <button
                type="button"
                @click="handleCreateThemeInline"
                :disabled="!newThemeName.trim() || isCreatingTheme"
                data-testid="inline-theme-submit-btn"
                class="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                <PlusIcon class="w-3 h-3" />
                <span>{{ isCreatingTheme ? 'Criando...' : 'Adicionar' }}</span>
              </button>
            </div>

            <span v-if="createThemeError" class="text-[11px] text-rose-400 font-interface">
              {{ createThemeError }}
            </span>
          </div>

          <!-- Seletor de Chips de Temas Existentes -->
          <div v-if="availableThemes.length > 0" class="flex flex-wrap gap-1.5 w-full">
            <button
              v-for="theme in availableThemes"
              :key="theme.id"
              type="button"
              @click="toggleTheme(theme)"
              :data-testid="`theme-chip-${theme.rawId || theme.id}`"
              class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer"
              :style="isThemeSelected(theme) ? {
                backgroundColor: (theme.color || '#E57B55'),
                borderColor: (theme.color || '#E57B55'),
                color: '#FFFFFF',
                boxShadow: '0 2px 8px ' + (theme.color || '#E57B55') + '40'
              } : {
                backgroundColor: (theme.color || '#E57B55') + '10',
                borderColor: (theme.color || '#E57B55') + '30',
                color: 'inherit'
              }"
            >
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
              <span class="font-medium">{{ theme.name }}</span>
              <CheckIcon
                v-if="isThemeSelected(theme)"
                class="w-3 h-3 text-white shrink-0 ml-0.5"
              />
            </button>
          </div>

          <div
            v-else-if="!showCreateThemeInline"
            class="w-full py-3 px-4 border border-dashed border-divider/60 rounded-xl text-center text-textSecondary text-xs font-interface"
          >
            <span>Nenhum tema criado ainda. </span>
            <button
              type="button"
              @click="showCreateThemeInline = true"
              class="text-accent underline font-medium hover:text-accent/90"
            >
              Clique para criar seu primeiro tema
            </button>
          </div>
        </div>

        <ReaderUploadDropZone
          id="drop-zone-area"
          @file-validated="onFileValidated"
        />

        <!-- Prévia da Capa Extraída -->
        <div
          v-if="lastExtractedCover"
          class="mt-4 p-4 rounded-2xl bg-white/5 border border-accent/30 flex items-center gap-4 animate-in fade-in w-full max-w-lg text-left"
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
          class="mt-4 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-3 text-sky-300 text-xs font-interface animate-in fade-in w-full max-w-lg text-left"
        >
          <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"></span>
          <span>Enviando livro e capa para o seu Google Drive (pasta Aresta)...</span>
        </div>

        <div
          v-else-if="driveSyncStatus === 'success'"
          class="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-interface animate-in fade-in w-full max-w-lg text-left"
        >
          <CheckCircle2Icon class="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Livro salvo com sucesso no Google Drive (pasta Aresta/{{ lastBookTitle }})!</span>
        </div>

        <div
          v-else-if="driveSyncStatus === 'error'"
          class="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 text-amber-300 text-xs font-interface animate-in fade-in w-full max-w-lg text-left"
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
          class="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-interface flex items-center gap-3 animate-in fade-in w-full max-w-lg text-left"
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
definePageMeta({
  middleware: ['auth'],
})

import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  BookmarkIcon,
  TagIcon,
  PlusIcon,
  CheckIcon
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { useLocalBookUpload } from '~/composables/useLocalBookUpload'
import { useGraph } from '~/composables/useGraph'
import { useUserBooks } from '~/composables/useUserBooks'
import { useAuth } from '~/composables/useAuth'
import { isProductionMode, logError } from '~/utils/logger'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const router = useRouter()
const { uploadBookLocally } = useLocalBookUpload()
const { graphData, fetchGraph, createNode } = useGraph()
const { fetchUserBooks } = useUserBooks()

const customTitle = ref<string>('')
const lastExtractedCover = ref<string | null>(null)
const lastBookTitle = ref<string>('')
const driveSyncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
const driveSyncError = ref<string | null>(null)

// Gestão de Temas
const presetColors = ['#E57B55', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']
const selectedThemeIds = ref<number[]>([])
const createdThemes = ref<Array<{ id: number | string; name: string; color?: string }>>([])
const showCreateThemeInline = ref(false)
const newThemeName = ref('')
const newThemeColor = ref('#E57B55')
const isCreatingTheme = ref(false)
const createThemeError = ref<string | null>(null)

function getThemeNumericId(themeOrId: any): number {
  if (typeof themeOrId === 'object' && themeOrId !== null) {
    if (themeOrId.rawId !== undefined && !isNaN(Number(themeOrId.rawId))) {
      return Number(themeOrId.rawId)
    }
    return getThemeNumericId(themeOrId.id)
  }
  if (typeof themeOrId === 'number' && !isNaN(themeOrId)) return themeOrId
  const raw = String(themeOrId || '').replace(/^theme-/, '')
  const parsed = Number(raw)
  return isNaN(parsed) ? 0 : parsed
}

function isThemeSelected(themeOrId: any): boolean {
  const id = getThemeNumericId(themeOrId)
  return id > 0 && selectedThemeIds.value.includes(id)
}

const availableThemes = computed(() => {
  const nodes = (graphData.value.nodes || []).filter((node: any) => {
    if (node.type && node.type !== 'theme') return false
    if (
      typeof node.id === 'string' &&
      (node.id.startsWith('book-') ||
        node.id.startsWith('note-') ||
        node.id.startsWith('canvas-') ||
        node.id.startsWith('folder-') ||
        node.id.startsWith('annotation-'))
    ) {
      return false
    }
    return true
  })
  const list: any[] = [...nodes]
  for (const ct of createdThemes.value) {
    if (!list.some((n: any) => getThemeNumericId(n) === getThemeNumericId(ct))) {
      list.push(ct)
    }
  }
  return list
})

const selectedThemesMap = ref<Map<number, { id: number; name: string; color?: string | null }>>(new Map())

function toggleTheme(themeOrId: any) {
  const numId = getThemeNumericId(themeOrId)
  if (!numId) return
  const idx = selectedThemeIds.value.indexOf(numId)
  if (idx > -1) {
    selectedThemeIds.value.splice(idx, 1)
    selectedThemesMap.value.delete(numId)
  } else {
    selectedThemeIds.value.push(numId)
    const name = (typeof themeOrId === 'object' && themeOrId?.name) ? themeOrId.name : `Tema ${numId}`
    const color = (typeof themeOrId === 'object' && themeOrId?.color) ? themeOrId.color : null
    selectedThemesMap.value.set(numId, { id: numId, name, color })
  }
}

async function handleCreateThemeInline() {
  const name = newThemeName.value.trim()
  if (!name) return null
  if (name.length > 30) {
    createThemeError.value = 'O nome do tema deve ter no máximo 30 caracteres'
    return null
  }
  isCreatingTheme.value = true
  createThemeError.value = null
  try {
    const created = await createNode(name, newThemeColor.value)
    if (created && (created.rawId || created.id)) {
      const numId = getThemeNumericId(created)
      const validId = numId || Date.now()
      const themeObj = {
        id: validId,
        rawId: validId,
        name: created.name || name,
        color: created.color || newThemeColor.value,
      }
      createdThemes.value.push(themeObj)
      if (validId && !selectedThemeIds.value.includes(validId)) {
        selectedThemeIds.value.push(validId)
        selectedThemesMap.value.set(validId, { id: validId, name: themeObj.name, color: themeObj.color })
      }
      if (!graphData.value.nodes.some((n: any) => getThemeNumericId(n) === validId)) {
        graphData.value = {
          nodes: [
            ...(graphData.value.nodes || []),
            {
              id: `theme-${validId}`,
              rawId: validId,
              name: created.name || name,
              color: created.color || newThemeColor.value,
              type: 'theme',
            },
          ],
          edges: graphData.value.edges || [],
        }
      }
    }
    newThemeName.value = ''
    showCreateThemeInline.value = false
    return created
  } catch (err: any) {
    createThemeError.value = err?.message || 'Falha ao criar tema'
    return null
  } finally {
    isCreatingTheme.value = false
  }
}

async function onFileValidated({ file, type }: { file: File; type: SupportedFileType }) {
  store.setLoading(true)
  driveSyncStatus.value = 'idle'
  driveSyncError.value = null

  try {
    store.syncSettings()

    // Se houver nome digitado no formulário inline de novo tema, cria antes do upload
    if (newThemeName.value && newThemeName.value.trim()) {
      await handleCreateThemeInline()
    }

    const selectedThemes: Array<{ id: number; name: string; color?: string | null }> = []
    const allKnownThemes = [...availableThemes.value, ...createdThemes.value]
    for (const id of selectedThemeIds.value) {
      const found = allKnownThemes.find(
        (t: any) => getThemeNumericId(t) === id
      )
      if (found) {
        selectedThemes.push({
          id,
          name: found.name,
          color: found.color || null,
        })
      } else if (selectedThemesMap.value.has(id)) {
        selectedThemes.push(selectedThemesMap.value.get(id)!)
      }
    }

    const result = await uploadBookLocally({
      file,
      type,
      customTitle: customTitle.value,
      initialFontSize: store.fontSize,
      initialFontFamily: store.fontFamily,
      themes: selectedThemes,
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

    // Atualiza a lista da estante
    try {
      await fetchUserBooks()
    } catch {}

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

const auth = useAuth()

onMounted(async () => {
  if (auth.isLoggedIn.value) {
    try {
      await fetchGraph()
    } catch {}
  }
})
</script>
