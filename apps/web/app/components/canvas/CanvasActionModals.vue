<template>
  <div>
    <!-- MODAL: Novo Quadro (com Pasta e Tags) -->
    <div
      v-if="newCanvasModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-bgPanel border border-divider rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-divider pb-3">
          <h3 class="text-base font-semibold text-textPrimary font-interface">Criar Novo Quadro</h3>
          <button @click="$emit('update:newCanvasModalOpen', false)" class="text-textSecondary hover:text-textPrimary cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 font-interface text-xs">
          <div>
            <label class="block text-textSecondary mb-1 font-medium">Título do Quadro</label>
            <input
              v-model="newCanvasForm.title"
              type="text"
              placeholder="Ex: Filosofia da Mente, Projeto X..."
              class="w-full px-3 py-2 rounded-xl bg-bgRoot border border-divider text-textPrimary text-sm focus:outline-none focus:border-accent"
              @keyup.enter="confirmCreate"
            />
          </div>

          <div>
            <label class="block text-textSecondary mb-1 font-medium">Descrição (opcional)</label>
            <textarea
              v-model="newCanvasForm.description"
              rows="2"
              placeholder="Breve resumo sobre o objetivo deste quadro..."
              class="w-full px-3 py-2 rounded-xl bg-bgRoot border border-divider text-textPrimary text-xs focus:outline-none focus:border-accent resize-none"
            ></textarea>
          </div>

          <!-- Seleção de Pasta -->
          <div>
            <label class="block text-textSecondary mb-1 font-medium">Pasta</label>
            <select
              v-model="newCanvasForm.folder"
              class="w-full px-3 py-2 rounded-xl bg-bgRoot border border-divider text-textPrimary text-xs focus:outline-none focus:border-accent cursor-pointer"
            >
              <option :value="null">Nenhuma (Sem pasta)</option>
              <option v-for="folder in folders" :key="folder" :value="folder">📁 {{ folder }}</option>
            </select>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-textSecondary mb-1 font-medium">Tags (pressione Enter ou vírgula)</label>
            <div class="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-bgRoot border border-divider">
              <span
                v-for="(tag, idx) in newCanvasForm.tags"
                :key="tag"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/20 text-accent text-[11px]"
              >
                #{{ tag }}
                <button @click="newCanvasForm.tags.splice(idx, 1)" class="hover:text-white cursor-pointer">✕</button>
              </span>
              <input
                v-model="tagInput"
                type="text"
                placeholder="Adicionar tag..."
                class="bg-transparent text-xs text-textPrimary focus:outline-none flex-1 min-w-[100px]"
                @keydown.enter.prevent="addTagToForm"
                @keydown="handleTagKeyDown"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-divider">
          <button
            @click="$emit('update:newCanvasModalOpen', false)"
            class="px-4 py-2 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="confirmCreate"
            :disabled="isCreating"
            class="px-5 py-2 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
          >
            {{ isCreating ? 'Criando...' : 'Criar Quadro' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Mover para Pasta -->
    <div
      v-if="moveModalOpen && targetCanvas"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-bgPanel border border-divider rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <h3 class="text-sm font-semibold text-textPrimary font-interface">Mover Quadro</h3>
        <p class="text-xs text-textSecondary">
          Selecione a pasta de destino para "<strong>{{ targetCanvas.title }}</strong>":
        </p>

        <div class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          <button
            @click="$emit('confirm-move', null)"
            class="w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-colors"
            :class="!targetCanvas.folder ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-divider hover:bg-black/5 dark:hover:bg-white/5 text-textPrimary'"
          >
            <span>Sem pasta</span>
            <span v-if="!targetCanvas.folder">✓</span>
          </button>

          <button
            v-for="folder in folders"
            :key="folder"
            @click="$emit('confirm-move', folder)"
            class="w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-colors"
            :class="targetCanvas.folder === folder ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-divider hover:bg-black/5 dark:hover:bg-white/5 text-textPrimary'"
          >
            <div class="flex items-center gap-2 truncate">
              <FolderIcon class="w-3.5 h-3.5 text-accent" />
              <span class="truncate">{{ folder }}</span>
            </div>
            <span v-if="targetCanvas.folder === folder">✓</span>
          </button>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="$emit('update:moveModalOpen', false)"
            class="px-4 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Gerenciar Tags -->
    <div
      v-if="tagsModalOpen && targetCanvas"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-bgPanel border border-divider rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 class="text-sm font-semibold text-textPrimary font-interface">Gerenciar Tags</h3>
        <p class="text-xs text-textSecondary">
          Edite as tags associadas a "<strong>{{ targetCanvas.title }}</strong>":
        </p>

        <div class="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-bgRoot border border-divider min-h-[48px]">
          <span
            v-for="(tag, idx) in editingTags"
            :key="tag"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/20 text-accent text-xs"
          >
            #{{ tag }}
            <button @click="editingTags.splice(idx, 1)" class="hover:text-white cursor-pointer ml-0.5">✕</button>
          </span>
          <input
            v-model="editTagInput"
            type="text"
            placeholder="Nova tag..."
            class="bg-transparent text-xs text-textPrimary focus:outline-none flex-1 min-w-[100px]"
            @keydown.enter.prevent="addTagToEdit"
            @keydown="handleEditTagKeyDown"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            @click="$emit('update:tagsModalOpen', false)"
            class="px-4 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="confirmSaveTags"
            class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white cursor-pointer"
          >
            Salvar Tags
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FolderIcon } from 'lucide-vue-next'
import type { CanvasSummary } from '~/interfaces/canvas'

const props = defineProps<{
  newCanvasModalOpen: boolean
  moveModalOpen: boolean
  tagsModalOpen: boolean
  targetCanvas: CanvasSummary | null
  folders: string[]
  isCreating: boolean
  initialFolder: string | null
  initialTag: string | null
}>()

const emit = defineEmits<{
  (e: 'update:newCanvasModalOpen', val: boolean): void
  (e: 'update:moveModalOpen', val: boolean): void
  (e: 'update:tagsModalOpen', val: boolean): void
  (e: 'confirm-create', payload: { title: string; description: string; folder: string | null; tags: string[] }): void
  (e: 'confirm-move', folder: string | null): void
  (e: 'confirm-tags', tags: string[]): void
}>()

const newCanvasForm = ref<{
  title: string
  description: string
  folder: string | null
  tags: string[]
}>({
  title: '',
  description: '',
  folder: null,
  tags: []
})
const tagInput = ref('')

const editingTags = ref<string[]>([])
const editTagInput = ref('')

watch(
  () => props.newCanvasModalOpen,
  (open) => {
    if (open) {
      newCanvasForm.value = {
        title: '',
        description: '',
        folder: props.initialFolder && props.initialFolder !== '__uncategorized__' ? props.initialFolder : null,
        tags: props.initialTag ? [props.initialTag] : []
      }
      tagInput.value = ''
    }
  }
)

watch(
  () => props.tagsModalOpen,
  (open) => {
    if (open && props.targetCanvas) {
      editingTags.value = Array.isArray(props.targetCanvas.tags) ? [...props.targetCanvas.tags] : []
      editTagInput.value = ''
    }
  }
)

const addTagToForm = () => {
  const clean = tagInput.value.trim().replace(/^#/, '')
  if (clean && !newCanvasForm.value.tags.includes(clean)) {
    newCanvasForm.value.tags.push(clean)
  }
  tagInput.value = ''
}

const handleTagKeyDown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    addTagToForm()
  }
}

const confirmCreate = () => {
  addTagToForm()
  emit('confirm-create', {
    title: newCanvasForm.value.title.trim() || 'Quadro sem título',
    description: newCanvasForm.value.description.trim(),
    folder: newCanvasForm.value.folder,
    tags: [...newCanvasForm.value.tags]
  })
}

const addTagToEdit = () => {
  const clean = editTagInput.value.trim().replace(/^#/, '')
  if (clean && !editingTags.value.includes(clean)) {
    editingTags.value.push(clean)
  }
  editTagInput.value = ''
}

const handleEditTagKeyDown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    addTagToEdit()
  }
}

const confirmSaveTags = () => {
  addTagToEdit()
  emit('confirm-tags', [...editingTags.value])
}
</script>
