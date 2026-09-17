<template>
  <Teleport to="body">
    <div
      v-if="isOpen && node"
      class="fixed inset-0 z-50 overflow-hidden"
    >
      <!-- Backdrop translúcido com clique para fechar -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        @click="$emit('close')"
      />

      <aside
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bgPanel border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        <!-- Cabeçalho da Nota -->
        <header class="p-6 border-b border-divider flex items-start justify-between shrink-0 bg-white/[0.02]">
          <div class="flex gap-3 items-center min-w-0 flex-1 mr-2">
            <!-- Ícone do Tipo de Nota -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :class="isDrawing ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'"
            >
              <PenToolIcon v-if="isDrawing" class="w-5 h-5" />
              <FileTextIcon v-else class="w-5 h-5" />
            </div>

            <div class="flex flex-col min-w-0 flex-1">
              <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
                <span>{{ isDrawing ? 'Nota de Desenho' : 'Anotação Livre' }}</span>
                <span v-if="folder" class="text-textSecondary font-normal lowercase">em 📁 {{ folder }}</span>
              </div>
              <h2 class="font-interface text-lg font-semibold text-textPrimary leading-tight mt-0.5 truncate" :title="title">
                {{ title || 'Sem título' }}
              </h2>
            </div>
          </div>

          <button
            @click="$emit('close')"
            class="p-2 rounded-full bg-white/5 border border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Fechar"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </header>

        <!-- Corpo da Gaveta -->
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">

          <!-- CASO 1: NOTA DE DESENHO (DRAWING NOTE) -->
          <template v-if="isDrawing">
            <div class="flex flex-col gap-4">
              <!-- Miniatura ou indicação visual de caderno -->
              <div class="w-full aspect-[4/3] rounded-2xl bg-bgElevated/60 border border-divider/40 flex items-center justify-center overflow-hidden relative shadow-inner">
                <img
                  v-if="drawingPreview"
                  :src="drawingPreview"
                  alt="Prévia do desenho"
                  class="w-full h-full object-cover"
                />
                <div v-else class="flex flex-col items-center gap-2 text-textSecondary/60">
                  <PenToolIcon class="w-10 h-10 text-primary/60" />
                  <span class="text-xs font-mono">Páginas de Desenho</span>
                </div>
              </div>

              <!-- Informações adicionais -->
              <div class="flex items-center justify-between text-xs text-textSecondary border-y border-divider/60 py-3">
                <span v-if="pagesCount">📄 {{ pagesCount }} pág{{ pagesCount > 1 ? 's' : '' }}</span>
                <span v-if="updatedAt">Atualizado em {{ formattedDate }}</span>
              </div>

              <!-- Botão para Abrir no Editor de Desenho -->
              <NuxtLink
                :to="`/canvas/drawing/${noteId}`"
                class="w-full py-3 px-4 rounded-xl bg-primary text-white font-interface text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-98 cursor-pointer"
              >
                <PenToolIcon class="w-4 h-4" />
                <span>Abrir Editor de Desenho</span>
                <ArrowRightIcon class="w-4 h-4 ml-auto" />
              </NuxtLink>
            </div>
          </template>

          <!-- CASO 2: NOTA TEXTO / MARKDOWN -->
          <template v-else>
            <!-- Tags da Nota -->
            <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in tags"
                :key="tag"
                class="text-[10px] px-2 py-0.5 rounded-md font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Alternância Visualizar / Editar -->
            <div class="flex items-center justify-between border-b border-divider/60 pb-2">
              <span class="text-xs font-technical uppercase tracking-wider text-textSecondary">
                {{ isEditing ? 'Editando Conteúdo' : 'Conteúdo da Nota' }}
              </span>
              <button
                @click="toggleEdit"
                class="text-xs text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Edit3Icon v-if="!isEditing" class="w-3.5 h-3.5" />
                <span>{{ isEditing ? 'Visualizar' : 'Editar Rápido' }}</span>
              </button>
            </div>

            <!-- Modo Edição: Input de Título + Textarea de Conteúdo -->
            <div v-if="isEditing" class="flex flex-col gap-3">
              <div>
                <label class="block text-[10px] font-technical uppercase tracking-wider text-textSecondary mb-1">Título</label>
                <input
                  v-model="editTitle"
                  type="text"
                  placeholder="Título da nota..."
                  class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-all font-semibold"
                />
              </div>

              <div>
                <label class="block text-[10px] font-technical uppercase tracking-wider text-textSecondary mb-1">Conteúdo Markdown</label>
                <textarea
                  v-model="editContent"
                  placeholder="Escreva seu pensamento aqui..."
                  rows="10"
                  class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-all font-mono resize-none leading-relaxed"
                ></textarea>
              </div>

              <div class="flex items-center gap-2 mt-1">
                <button
                  @click="saveNoteChanges"
                  :disabled="isSaving"
                  class="flex-1 py-2 px-4 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <SaveIcon class="w-3.5 h-3.5" />
                  <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
                </button>
                <button
                  @click="isEditing = false"
                  class="py-2 px-3 rounded-xl bg-white/5 border border-divider text-textSecondary hover:text-textPrimary text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <!-- Modo Visualização: Conteúdo Renderizado -->
            <div v-else class="flex flex-col gap-3">
              <div
                v-if="content && content.trim()"
                class="text-xs sm:text-sm text-textPrimary/90 leading-relaxed font-interface whitespace-pre-wrap break-words bg-white/[0.01] p-4 rounded-2xl border border-divider/50"
              >
                {{ content }}
              </div>
              <div v-else class="text-xs text-textSecondary/50 italic py-6 text-center border border-dashed border-divider rounded-2xl">
                Esta nota ainda não possui conteúdo de texto.
              </div>
            </div>
          </template>
        </div>

        <!-- Rodapé com Ações -->
        <footer class="p-4 border-t border-divider bg-bgApp/60 shrink-0 flex items-center gap-2">
          <!-- Ação 1: Abrir no Editor Completo do Espaço Criativo -->
          <NuxtLink
            :to="`/canvas?id=${noteId}&view=note-editor`"
            @click="$emit('close')"
            class="flex-1 py-2.5 px-3 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white font-interface text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            title="Abrir no Espaço Criativo completo"
          >
            <LayoutGridIcon class="w-3.5 h-3.5" />
            <span>Abrir no Espaço Criativo</span>
          </NuxtLink>

          <!-- Ação 2: Excluir Nota -->
          <button
            @click="handleDelete"
            class="p-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Excluir nota"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { XIcon, FileTextIcon, PenToolIcon, Edit3Icon, SaveIcon, LayoutGridIcon, Trash2Icon, ArrowRightIcon } from 'lucide-vue-next'
import type { GraphNode } from '~/interfaces/graph'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { useNotes } from '~/composables/useNotes'

const props = defineProps<{
  isOpen: boolean
  node: GraphNode | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'deleted', id: string): void
  (e: 'saved', note: any): void
}>()

const { updateNote, deleteNote } = useNotes()

const isEditing = ref(false)
const isSaving = ref(false)
const editTitle = ref('')
const editContent = ref('')
const loadedFullNote = ref<any>(null)

const noteId = computed(() => {
  if (!props.node) return ''
  return String(props.node.rawId || props.node.id).replace(/^note-/, '')
})

const isDrawing = computed(() => {
  return Boolean(props.node?.isDrawing || (props.node as any)?.is_drawing)
})

const title = computed(() => {
  return loadedFullNote.value?.title || props.node?.title || props.node?.name || ''
})

const content = computed(() => {
  return loadedFullNote.value?.content || props.node?.description || ''
})

const folder = computed(() => {
  return loadedFullNote.value?.folder || props.node?.folder || null
})

const tags = computed<string[]>(() => {
  return loadedFullNote.value?.tags || props.node?.tags || []
})

const drawingPreview = computed(() => {
  return loadedFullNote.value?.preview_url || null
})

const pagesCount = computed(() => {
  if (!loadedFullNote.value?.pages_data) return 1
  try {
    const parsed = typeof loadedFullNote.value.pages_data === 'string'
      ? JSON.parse(loadedFullNote.value.pages_data)
      : loadedFullNote.value.pages_data
    return Array.isArray(parsed) ? parsed.length : 1
  } catch {
    return 1
  }
})

const updatedAt = computed(() => {
  return loadedFullNote.value?.updated_at || props.node?.updatedAt || null
})

const formattedDate = computed(() => {
  if (!updatedAt.value) return ''
  try {
    return new Date(updatedAt.value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return ''
  }
})

const loadNoteData = async () => {
  if (!noteId.value) return
  isEditing.value = false

  try {
    if (isDrawing.value) {
      const drawing = await drawingNoteRepo.getById(noteId.value)
      if (drawing) {
        loadedFullNote.value = drawing
      }
    } else {
      const note = await noteRepo.getById(noteId.value)
      if (note) {
        loadedFullNote.value = note
        editTitle.value = note.title || ''
        editContent.value = note.content || ''
      } else {
        editTitle.value = props.node?.title || props.node?.name || ''
        editContent.value = props.node?.description || ''
      }
    }
  } catch (err) {
    console.warn('[NoteDetailDrawer] Erro ao carregar detalhes da nota:', err)
  }
}

watch(() => props.node, () => {
  if (props.isOpen && props.node) {
    loadNoteData()
  }
}, { immediate: true })

watch(() => props.isOpen, (open) => {
  if (open && props.node) {
    loadNoteData()
  } else {
    isEditing.value = false
  }
})

const toggleEdit = () => {
  if (!isEditing.value) {
    editTitle.value = title.value
    editContent.value = content.value
  }
  isEditing.value = !isEditing.value
}

const saveNoteChanges = async () => {
  if (!noteId.value) return
  isSaving.value = true
  try {
    await updateNote(noteId.value, {
      title: editTitle.value,
      content: editContent.value,
      folder: folder.value,
      tags: tags.value
    })
    if (loadedFullNote.value) {
      loadedFullNote.value.title = editTitle.value
      loadedFullNote.value.content = editContent.value
    }
    isEditing.value = false
    emit('saved', { id: noteId.value, title: editTitle.value, content: editContent.value })
  } catch (err) {
    console.error('[NoteDetailDrawer] Erro ao salvar alterações:', err)
  } finally {
    isSaving.value = false
  }
}

const handleDelete = async () => {
  if (!noteId.value) return
  if (confirm(`Tem certeza que deseja excluir "${title.value}"?`)) {
    try {
      if (isDrawing.value) {
        await drawingNoteRepo.delete(noteId.value)
      } else {
        await deleteNote(noteId.value)
      }
      emit('deleted', noteId.value)
      emit('close')
    } catch (err) {
      console.error('[NoteDetailDrawer] Erro ao excluir nota:', err)
    }
  }
}
</script>
