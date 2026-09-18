<template>
  <main class="flex-1 flex flex-col bg-bgDarker overflow-hidden">
    <!-- Barra de Ferramentas Superior da Nota -->
    <div class="h-14 border-b border-divider bg-bgPanel flex items-center justify-between px-6 flex-shrink-0 gap-4">
      <input
        v-model="localNote.title"
        type="text"
        placeholder="Título da nota..."
        class="bg-transparent border-none text-base font-semibold text-textPrimary focus:outline-none flex-1 font-serif mr-4"
        @input="onInput"
      />

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Seletor de Pasta da Nota -->
        <div class="flex items-center gap-1.5 text-xs text-textSecondary">
          <FolderIcon class="w-3.5 h-3.5 text-accent" />
          <select
            v-model="localNote.folder"
            class="bg-bgSurface border border-divider rounded-lg px-2 py-1 text-xs text-textPrimary focus:outline-none focus:border-accent cursor-pointer"
            @change="onInput"
          >
            <option :value="null">Sem pasta</option>
            <option v-for="f in folders" :key="f" :value="f">📁 {{ f }}</option>
          </select>
        </div>

        <!-- Botão Vincular Quadro -->
        <button
          class="px-2.5 py-1 rounded-xl bg-bgElevated hover:bg-bgSurface text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Vincular ou criar um quadro nesta nota"
          @click="openCanvasPicker"
          data-testid="btn-link-canvas"
        >
          <LayoutGridIcon class="w-3.5 h-3.5 text-accent" />
          <span class="hidden md:inline">Vincular Quadro</span>
        </button>

        <!-- Botão Excluir Nota -->
        <button
          class="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          title="Excluir Nota"
          @click="$emit('delete', localNote.id)"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>

        <!-- Botão Fechar e Voltar ao Hub -->
        <button
          class="px-2.5 py-1 rounded-xl bg-bgSurface hover:bg-bgElevated text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center gap-1 cursor-pointer ml-1"
          title="Fechar e retornar"
          @click="$emit('close')"
        >
          <LayoutGridIcon class="w-3.5 h-3.5 text-accent" />
          <span>Fechar</span>
        </button>
      </div>
    </div>

    <!-- Barra de Tags da Nota Ativa -->
    <div class="px-6 py-2 border-b border-divider bg-bgSurface/40 flex items-center justify-between gap-2 flex-wrap text-xs">
      <div class="flex items-center gap-2 flex-wrap">
        <TagIcon class="w-3.5 h-3.5 text-accent" />
        <span class="text-textSecondary text-[11px] font-medium">Tags:</span>

        <span
          v-for="(tag, idx) in localNote.tags"
          :key="tag"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-medium"
        >
          #{{ tag }}
          <button @click="removeTag(idx)" class="hover:text-white cursor-pointer ml-0.5">✕</button>
        </span>

        <div class="flex items-center gap-1">
          <input
            v-model="newTagInput"
            type="text"
            placeholder="+ Adicionar tag (Enter)"
            class="bg-transparent border-none text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none min-w-[120px]"
            @keydown.enter.prevent="addTag"
            @keydown="handleTagKeyDown"
          />
        </div>
      </div>

      <!-- Indicador e Alternador para Notas HTML / Síntese IA -->
      <div v-if="isHtmlNote" class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-semibold text-[11px] border border-amber-500/30">
          <SparklesIcon class="w-3 h-3" />
          Síntese de Desenho (HTML)
        </span>

        <div class="flex items-center gap-1 bg-bgElevated p-0.5 rounded-lg text-[11px] border border-divider">
          <button
            @click="htmlViewMode = 'preview'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="htmlViewMode === 'preview' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
          >
            Preview Vivo
          </button>
          <button
            @click="htmlViewMode = 'code'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="htmlViewMode === 'code' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
          >
            Código HTML
          </button>
        </div>

        <button
          @click="copyHtmlContent"
          class="text-[11px] px-2 py-1 rounded bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all flex items-center gap-1 cursor-pointer"
          title="Copiar HTML"
        >
          <CopyIcon class="w-3 h-3" />
          <span>{{ copiedHtml ? 'Copiado!' : 'Copiar' }}</span>
        </button>
      </div>
    </div>

    <!-- Corpo do Editor Live Preview Unificado -->
    <div
      class="flex-1 p-4 md:p-6 overflow-hidden bg-bgDarker flex flex-col relative"
      @mouseup="handleTextSelection"
      @keyup="handleTextSelection"
    >
      <!-- Feedback Toast -->
      <Transition name="fade">
        <div
          v-if="toastMessage"
          class="absolute top-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in"
        >
          <CheckCircle2Icon class="w-4 h-4 text-emerald-400" />
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>

      <div class="flex-1 bg-bgPanel/60 rounded-2xl border border-divider/60 shadow-inner overflow-hidden flex flex-col relative">
        <!-- Visualização HTML quando o conteúdo for HTML / Síntese de Desenho -->
        <template v-if="isHtmlNote">
          <div
            v-if="htmlViewMode === 'preview'"
            class="flex-1 overflow-y-auto p-6 select-text custom-scrollbar prose dark:prose-invert max-w-none text-textPrimary leading-relaxed"
          >
            <div class="synthesized-html-container" v-html="localNote.content"></div>
          </div>
          <textarea
            v-else
            v-model="localNote.content"
            class="w-full h-full p-4 font-mono text-xs bg-transparent text-textPrimary focus:outline-none resize-none select-text custom-scrollbar"
            placeholder="Código HTML da anotação..."
            @input="onInput"
          ></textarea>
        </template>

        <!-- Modo Editor Único Live Preview -->
        <div
          v-else
          class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col"
          @click="handleEditorClick"
        >
          <MilkdownEditor
            v-model="localNote.content"
            placeholder="Comece a escrever sua nota... O Live Preview renderiza automaticamente. Use 'Vincular Quadro' para associar um quadro."
            @update:model-value="onInput"
          />
        </div>

        <!-- Barra flutuante de criação de anotação ou flashcard a partir do trecho selecionado -->
        <Transition name="fade">
          <div
            v-if="selectedSnippet"
            class="absolute bottom-4 right-4 flex items-center gap-2 p-1.5 rounded-2xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl transition-all animate-in fade-in z-30 ring-1 ring-white/10"
            data-testid="note-selection-toolbar"
          >
            <div class="hidden sm:flex items-center gap-1 pl-1 pr-2 border-r border-divider/60 text-[11px] text-textSecondary font-technical">
              <span class="truncate max-w-[140px] italic">"{{ selectedSnippet }}"</span>
            </div>

            <!-- Botão Criar Anotação -->
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-textPrimary font-technical text-xs font-semibold transition-all cursor-pointer hover:scale-102 active:scale-98"
              @mousedown.prevent.stop="openModalForAnnotation"
              title="Criar anotação ou reflexão a partir do trecho selecionado"
              data-testid="btn-create-note-from-snippet"
            >
              <MessageSquareIcon class="w-3.5 h-3.5 text-accent" />
              <span>Anotar</span>
            </button>

            <!-- Botão Criar Flashcard -->
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-technical text-xs font-semibold hover:bg-accent/90 transition-all cursor-pointer shadow-md hover:scale-102 active:scale-98"
              @mousedown.prevent.stop="openModalForFlashcard"
              title="Criar Flashcard a partir do trecho selecionado"
              data-testid="btn-create-flashcard-from-snippet"
            >
              <SparklesIcon class="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>

            <!-- Botão Cancelar Seleção -->
            <button
              type="button"
              class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
              @mousedown.prevent.stop="selectedSnippet = ''"
              title="Fechar barra"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Modal de Anotação e Flashcard com suporte à Nota -->
    <ReaderAnnotationModal
      :is-open="isAnnotationModalOpen"
      :initial-text="currentSelectedSnippet"
      :current-page="1"
      :book-id="1"
      :book-title="localNote.title || 'Nota'"
      :chapter-title="`Nota: ${localNote.title || 'Sem título'}`"
      :cfi="`note:${localNote.id}`"
      :note-id="String(localNote.id)"
      :initial-want-note="modalInitialWantNote"
      :initial-want-flashcard="modalInitialWantFlashcard"
      @close="isAnnotationModalOpen = false"
      @created="handleAnnotationCreated"
    />

    <!-- Modal de Seleção de Canvas para Embutir -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isCanvasPickerOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          @click.self="isCanvasPickerOpen = false"
        >
          <div class="w-full max-w-md bg-bgPanel border border-divider rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <!-- Modal Header -->
            <div class="px-5 py-4 border-b border-divider flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <LayoutGridIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-textPrimary">Vincular Quadro</h3>
                  <p class="text-[11px] text-textSecondary">Vincule um quadro existente ou crie um novo na hora</p>
                </div>
              </div>
              <button
                type="button"
                @click="isCanvasPickerOpen = false"
                class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Abas do Modal: Vincular Existente / Criar Novo -->
            <div class="flex border-b border-divider bg-bgSurface/30 px-3 pt-2 gap-2 text-xs">
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer"
                :class="activeCanvasTab === 'existing' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeCanvasTab = 'existing'"
              >
                Quadro Existente
              </button>
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer"
                :class="activeCanvasTab === 'new' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeCanvasTab = 'new'"
              >
                + Criar Novo Quadro
              </button>
            </div>

            <!-- Conteúdo Aba 1: Seleção de Existente -->
            <div v-if="activeCanvasTab === 'existing'" class="flex flex-col flex-1 overflow-hidden">
              <!-- Campo de Busca -->
              <div class="p-3 border-b border-divider bg-bgSurface/20">
                <div class="relative flex items-center">
                  <SearchIcon class="w-3.5 h-3.5 text-textSecondary absolute left-3" />
                  <input
                    v-model="canvasSearchQuery"
                    type="text"
                    placeholder="Buscar quadro por título..."
                    class="w-full pl-8 pr-3 py-1.5 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <!-- Lista de Quadros -->
              <div class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[340px]">
                <div
                  v-for="c in filteredCanvases"
                  :key="c.id"
                  class="group p-3 rounded-xl border border-divider/60 hover:border-accent/40 bg-bgSurface/40 hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between gap-3"
                  @click="selectCanvasToLink(c)"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-textPrimary group-hover:text-accent transition-colors truncate">
                        {{ c.title || 'Quadro Sem Título' }}
                      </span>
                      <span v-if="c.nodeCount" class="text-[10px] px-1.5 py-0.2 rounded bg-bgElevated text-textSecondary border border-divider/50">
                        {{ c.nodeCount }} nós
                      </span>
                    </div>
                    <div class="text-[11px] text-textSecondary/70 mt-0.5 truncate">
                      ID: {{ c.id }}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="btn-select-canvas"
                    class="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-white text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0"
                    @click.stop="selectCanvasToLink(c)"
                  >
                    <span>Vincular</span>
                    <span>🔗</span>
                  </button>
                </div>

                <div v-if="filteredCanvases.length === 0" class="p-8 text-center text-textSecondary text-xs">
                  <p>Nenhum quadro existente encontrado.</p>
                  <button
                    type="button"
                    class="mt-2 text-accent hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    @click="activeCanvasTab = 'new'"
                  >
                    Clique aqui para criar um novo quadro →
                  </button>
                </div>
              </div>
            </div>

            <!-- Conteúdo Aba 2: Criar Novo Quadro -->
            <div v-else class="p-5 space-y-4 flex-1 flex flex-col justify-center">
              <div>
                <label class="block text-xs font-medium text-textSecondary mb-1.5">Título do Novo Quadro</label>
                <input
                  v-model="newCanvasTitle"
                  type="text"
                  placeholder="Ex: Arquitetura do Sistema, Mapa Mental..."
                  class="w-full px-3.5 py-2 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                  @keydown.enter.prevent="createNewCanvasAndLink"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  @click="activeCanvasTab = 'existing'"
                  class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  :disabled="isCreatingCanvas"
                  @click="createNewCanvasAndLink"
                >
                  <PlusIcon class="w-3.5 h-3.5" />
                  <span>{{ isCreatingCanvas ? 'Criando...' : 'Criar e Vincular' }}</span>
                </button>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-5 py-3 border-t border-divider bg-bgSurface/20 flex items-center justify-end">
              <button
                type="button"
                @click="isCanvasPickerOpen = false"
                class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  FolderIcon,
  TagIcon,
  Trash2Icon,
  LayoutGridIcon,
  MessageSquareIcon,
  SparklesIcon,
  XIcon,
  CheckCircle2Icon,
  Copy as CopyIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
} from 'lucide-vue-next'
import MilkdownEditor from '~/components/MilkdownEditor.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import type { NoteItem } from '~/interfaces/note'
import type { CanvasSummary } from '~/interfaces/canvas'
import type { AnnotationItem } from '~/composables/useAnnotations'

const props = defineProps<{
  note: NoteItem
  folders: string[]
  canvases: CanvasSummary[]
}>()

const emit = defineEmits<{
  (_e: 'update:note', _note: NoteItem): void
  (_e: 'save', _note: NoteItem): void
  (_e: 'delete', _id: string): void
  (_e: 'close'): void
}>()

const localNote = ref<NoteItem>({
  ...props.note,
  tags: Array.isArray(props.note.tags) ? [...props.note.tags] : []
})

const selectedSnippet = ref('')
const currentSelectedSnippet = ref('')
const isAnnotationModalOpen = ref(false)
const modalInitialWantNote = ref(false)
const modalInitialWantFlashcard = ref(false)
const toastMessage = ref('')
let toastTimer: any = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3500)
}

function handleTextSelection() {
  if (typeof window === 'undefined') return
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (text && text.length > 2) {
    selectedSnippet.value = text
  } else {
    selectedSnippet.value = ''
  }
}

function openModalForAnnotation() {
  if (!selectedSnippet.value) return
  currentSelectedSnippet.value = selectedSnippet.value
  modalInitialWantNote.value = true
  modalInitialWantFlashcard.value = false
  isAnnotationModalOpen.value = true
  selectedSnippet.value = ''
}

function openModalForFlashcard() {
  if (!selectedSnippet.value) return
  currentSelectedSnippet.value = selectedSnippet.value
  modalInitialWantNote.value = false
  modalInitialWantFlashcard.value = true
  isAnnotationModalOpen.value = true
  selectedSnippet.value = ''
}

function handleAnnotationCreated(created: AnnotationItem) {
  isAnnotationModalOpen.value = false
  selectedSnippet.value = ''
  if (created.hasFlashcard) {
    showToast('Flashcard gerado a partir do trecho!')
  } else {
    showToast('Anotação criada a partir do trecho!')
  }
}

watch(
  () => props.note,
  (newVal) => {
    localNote.value = {
      ...newVal,
      tags: Array.isArray(newVal.tags) ? [...newVal.tags] : []
    }
  },
  { deep: true }
)

const newTagInput = ref('')

const onInput = () => {
  emit('update:note', localNote.value)
  emit('save', localNote.value)
}

const addTag = () => {
  const clean = newTagInput.value.trim().replace(/^#/, '')
  if (!localNote.value.tags) localNote.value.tags = []
  if (clean && !localNote.value.tags.includes(clean)) {
    localNote.value.tags.push(clean)
    onInput()
  }
  newTagInput.value = ''
}

const handleTagKeyDown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

const removeTag = (idx: number) => {
  if (!localNote.value.tags) return
  localNote.value.tags.splice(idx, 1)
  onInput()
}

const isCanvasPickerOpen = ref(false)
const activeCanvasTab = ref<'existing' | 'new'>('existing')
const canvasSearchQuery = ref('')
const newCanvasTitle = ref('')
const isCreatingCanvas = ref(false)

const filteredCanvases = computed(() => {
  const list = props.canvases || []
  const q = canvasSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q))
  )
})

const openCanvasPicker = () => {
  canvasSearchQuery.value = ''
  newCanvasTitle.value = ''
  activeCanvasTab.value = (props.canvases && props.canvases.length > 0) ? 'existing' : 'new'
  isCanvasPickerOpen.value = true
}

const selectCanvasToLink = (canvas: CanvasSummary) => {
  isCanvasPickerOpen.value = false
  const title = canvas.title || 'Quadro'
  const linkText = `\n\n[🎨 ${title}](canvas:${canvas.id})\n`
  localNote.value.content = (localNote.value.content || '') + linkText
  onInput()
  showToast(`Link para o quadro "${title}" adicionado à nota!`)
}

const createNewCanvasAndLink = async () => {
  const title = newCanvasTitle.value.trim() || 'Novo Quadro'
  isCreatingCanvas.value = true
  try {
    const newId = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    await canvasRepo.save({
      id: newId,
      name: title,
      document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    })

    isCanvasPickerOpen.value = false
    const linkText = `\n\n[🎨 ${title}](canvas:${newId})\n`
    localNote.value.content = (localNote.value.content || '') + linkText
    onInput()
    showToast(`Quadro "${title}" criado e vinculado com sucesso!`)
  } catch (err) {
    console.error('Erro ao criar novo quadro:', err)
    showToast('Erro ao criar novo quadro.')
  } finally {
    isCreatingCanvas.value = false
  }
}

const handleEditorClick = (event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) return

  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href') || ''
  let canvasId = ''
  if (href.startsWith('canvas:')) {
    canvasId = href.replace(/^canvas:/, '')
  } else if (href.includes('/canvas/')) {
    const match = href.match(/\/canvas\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) canvasId = match[1]
  }

  if (canvasId) {
    event.preventDefault()
    if (typeof navigateTo === 'function') {
      navigateTo(`/canvas/${canvasId}`)
    } else if (typeof window !== 'undefined') {
      window.location.href = `/canvas/${canvasId}`
    }
  }
}

const isHtmlNote = computed(() => {
  const c = localNote.value?.content || ''
  return /<([a-z]+)[^>]*>[\s\S]*?<\/\1>/i.test(c) || c.includes('synthesized-html-container') || c.includes('aresta-drawing-synthesis')
})

const htmlViewMode = ref<'preview' | 'code'>('preview')
const copiedHtml = ref(false)

function copyHtmlContent() {
  if (!localNote.value?.content) return
  navigator.clipboard.writeText(localNote.value.content)
  copiedHtml.value = true
  setTimeout(() => {
    copiedHtml.value = false
  }, 2000)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}

:deep(.aresta-drawing-synthesis) {
  font-family: inherit;
}
:deep(.aresta-drawing-synthesis h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}
:deep(.aresta-drawing-synthesis th),
:deep(.aresta-drawing-synthesis td) {
  border: 1px solid rgba(125, 125, 125, 0.2);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
:deep(.aresta-drawing-synthesis th) {
  background-color: rgba(125, 125, 125, 0.08);
  font-weight: 600;
}
:deep(.aresta-drawing-synthesis ul),
:deep(.aresta-drawing-synthesis ol) {
  padding-left: 1.25rem;
  margin: 0.75rem 0;
}
</style>
