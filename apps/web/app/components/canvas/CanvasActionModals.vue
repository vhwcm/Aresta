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

          <!-- Tags com Busca de Existentes e Dropdown Escrolável -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-textSecondary font-medium">Tags (pressione Enter ou vírgula)</label>
              <span v-if="filteredExistingTags.length > 0" class="text-[10px] text-textSecondary/70 font-mono">
                {{ filteredExistingTags.length }} tag{{ filteredExistingTags.length > 1 ? 's' : '' }} existente{{ filteredExistingTags.length > 1 ? 's' : '' }}
              </span>
            </div>

            <div class="relative">
              <div
                class="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-bgRoot border transition-colors cursor-text"
                :class="isTagDropdownOpen ? 'border-accent ring-1 ring-accent/30' : 'border-divider focus-within:border-accent'"
                @click="focusTagInput"
              >
                <span
                  v-for="(tag, idx) in newCanvasForm.tags"
                  :key="tag"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/20 text-accent text-[11px] font-medium"
                >
                  #{{ tag }}
                  <button
                    type="button"
                    @click.stop="newCanvasForm.tags.splice(idx, 1)"
                    class="hover:text-white cursor-pointer ml-0.5"
                  >✕</button>
                </span>
                <input
                  ref="tagInputRef"
                  v-model="tagInput"
                  type="text"
                  placeholder="Adicionar ou buscar tag..."
                  class="bg-transparent text-xs text-textPrimary focus:outline-none flex-1 min-w-[120px]"
                  @focus="openTagDropdown"
                  @blur="handleTagBlur"
                  @keydown.enter.prevent="handleTagEnter"
                  @keydown.down.prevent="navigateTagDown"
                  @keydown.up.prevent="navigateTagUp"
                  @keydown.esc.prevent="closeTagDropdown"
                  @keydown="handleTagKeyDown"
                />
              </div>

              <!-- Dropdown de Tags Existentes: Limite visível com scrollbar -->
              <div
                v-if="isTagDropdownOpen && filteredExistingTags.length > 0"
                class="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-[160px] overflow-y-auto rounded-xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-2xl custom-scrollbar p-1"
                @mousedown.prevent
              >
                <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-textSecondary/70 font-semibold border-b border-divider/40 flex items-center justify-between">
                  <span>Tags Existentes</span>
                  <span class="text-[9px] font-normal normal-case text-textSecondary/50">↑↓ navegar, Enter seleciona</span>
                </div>
                <div class="space-y-0.5 mt-0.5">
                  <button
                    v-for="(tag, idx) in filteredExistingTags"
                    :key="tag"
                    type="button"
                    class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer"
                    :class="highlightedIndex === idx ? 'bg-accent text-white font-medium shadow-xs' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
                    @mousedown.prevent="selectExistingTag(tag)"
                    @mouseenter="highlightedIndex = idx"
                  >
                    <div class="flex items-center gap-1.5 truncate">
                      <TagIcon class="w-3 h-3 opacity-70 flex-shrink-0" />
                      <span class="truncate font-mono text-[11px]">#{{ tag }}</span>
                    </div>
                    <span
                      class="text-[10px] uppercase font-mono tracking-wider ml-2 opacity-60 flex-shrink-0"
                      :class="highlightedIndex === idx ? 'text-white' : 'text-accent'"
                    >
                      + adicionar
                    </span>
                  </button>
                </div>
              </div>
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
        <div class="flex items-center justify-between border-b border-divider pb-2">
          <h3 class="text-sm font-semibold text-textPrimary font-interface">Gerenciar Tags</h3>
          <button @click="$emit('update:tagsModalOpen', false)" class="text-textSecondary hover:text-textPrimary cursor-pointer">✕</button>
        </div>
        <p class="text-xs text-textSecondary">
          Edite as tags associadas a "<strong>{{ targetCanvas.title }}</strong>":
        </p>

        <div class="relative">
          <div
            class="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-bgRoot border min-h-[48px] transition-colors cursor-text"
            :class="isEditTagDropdownOpen ? 'border-accent ring-1 ring-accent/30' : 'border-divider focus-within:border-accent'"
            @click="focusEditTagInput"
          >
            <span
              v-for="(tag, idx) in editingTags"
              :key="tag"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/20 text-accent text-xs font-medium"
            >
              #{{ tag }}
              <button
                type="button"
                @click.stop="editingTags.splice(idx, 1)"
                class="hover:text-white cursor-pointer ml-0.5"
              >✕</button>
            </span>
            <input
              ref="editTagInputRef"
              v-model="editTagInput"
              type="text"
              placeholder="Adicionar ou buscar tag..."
              class="bg-transparent text-xs text-textPrimary focus:outline-none flex-1 min-w-[120px]"
              @focus="openEditTagDropdown"
              @blur="handleEditTagBlur"
              @keydown.enter.prevent="handleEditTagEnter"
              @keydown.down.prevent="navigateEditTagDown"
              @keydown.up.prevent="navigateEditTagUp"
              @keydown.esc.prevent="closeEditTagDropdown"
              @keydown="handleEditTagKeyDown"
            />
          </div>

          <!-- Dropdown para Gerenciar Tags -->
          <div
            v-if="isEditTagDropdownOpen && filteredEditExistingTags.length > 0"
            class="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-[160px] overflow-y-auto rounded-xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-2xl custom-scrollbar p-1"
            @mousedown.prevent
          >
            <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-textSecondary/70 font-semibold border-b border-divider/40 flex items-center justify-between">
              <span>Tags Existentes</span>
              <span class="text-[9px] font-normal normal-case text-textSecondary/50">↑↓ navegar, Enter seleciona</span>
            </div>
            <div class="space-y-0.5 mt-0.5">
              <button
                v-for="(tag, idx) in filteredEditExistingTags"
                :key="tag"
                type="button"
                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer"
                :class="editHighlightedIndex === idx ? 'bg-accent text-white font-medium shadow-xs' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
                @mousedown.prevent="selectEditExistingTag(tag)"
                @mouseenter="editHighlightedIndex = idx"
              >
                <div class="flex items-center gap-1.5 truncate">
                  <TagIcon class="w-3 h-3 opacity-70 flex-shrink-0" />
                  <span class="truncate font-mono text-[11px]">#{{ tag }}</span>
                </div>
                <span
                  class="text-[10px] uppercase font-mono tracking-wider ml-2 opacity-60 flex-shrink-0"
                  :class="editHighlightedIndex === idx ? 'text-white' : 'text-accent'"
                >
                  + adicionar
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-divider">
          <button
            @click="$emit('update:tagsModalOpen', false)"
            class="px-4 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="confirmSaveTags"
            class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white cursor-pointer shadow-md shadow-accent/20"
          >
            Salvar Tags
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { FolderIcon, TagIcon } from 'lucide-vue-next'
import type { CanvasSummary } from '~/interfaces/canvas'

const props = withDefaults(
  defineProps<{
    newCanvasModalOpen: boolean
    moveModalOpen: boolean
    tagsModalOpen: boolean
    targetCanvas: CanvasSummary | null
    folders: string[]
    availableTags?: string[]
    isCreating: boolean
    initialFolder: string | null
    initialTag: string | null
  }>(),
  {
    availableTags: () => []
  }
)

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
const tagInputRef = ref<HTMLInputElement | null>(null)
const isTagDropdownOpen = ref(false)
const highlightedIndex = ref(-1)

const editingTags = ref<string[]>([])
const editTagInput = ref('')
const editTagInputRef = ref<HTMLInputElement | null>(null)
const isEditTagDropdownOpen = ref(false)
const editHighlightedIndex = ref(-1)

// Filtragem das tags existentes para Novo Quadro
const filteredExistingTags = computed(() => {
  const query = tagInput.value.trim().toLowerCase().replace(/^#/, '')
  const selected = new Set(newCanvasForm.value.tags.map((t) => t.toLowerCase()))
  return (props.availableTags || [])
    .filter((t) => !selected.has(t.toLowerCase()))
    .filter((t) => !query || t.toLowerCase().includes(query))
})

// Filtragem das tags existentes para Gerenciar Tags
const filteredEditExistingTags = computed(() => {
  const query = editTagInput.value.trim().toLowerCase().replace(/^#/, '')
  const selected = new Set(editingTags.value.map((t) => t.toLowerCase()))
  return (props.availableTags || [])
    .filter((t) => !selected.has(t.toLowerCase()))
    .filter((t) => !query || t.toLowerCase().includes(query))
})

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
      isTagDropdownOpen.value = false
      highlightedIndex.value = -1
    }
  }
)

watch(
  () => props.tagsModalOpen,
  (open) => {
    if (open && props.targetCanvas) {
      editingTags.value = Array.isArray(props.targetCanvas.tags) ? [...props.targetCanvas.tags] : []
      editTagInput.value = ''
      isEditTagDropdownOpen.value = false
      editHighlightedIndex.value = -1
    }
  }
)

watch(filteredExistingTags, () => {
  if (highlightedIndex.value >= filteredExistingTags.value.length) {
    highlightedIndex.value = filteredExistingTags.value.length - 1
  }
})

watch(filteredEditExistingTags, () => {
  if (editHighlightedIndex.value >= filteredEditExistingTags.value.length) {
    editHighlightedIndex.value = filteredEditExistingTags.value.length - 1
  }
})

const focusTagInput = () => {
  tagInputRef.value?.focus()
  openTagDropdown()
}

const openTagDropdown = () => {
  isTagDropdownOpen.value = true
}

const closeTagDropdown = () => {
  isTagDropdownOpen.value = false
  highlightedIndex.value = -1
}

const handleTagBlur = () => {
  setTimeout(() => {
    isTagDropdownOpen.value = false
    highlightedIndex.value = -1
  }, 180)
}

const navigateTagDown = () => {
  if (!isTagDropdownOpen.value) {
    isTagDropdownOpen.value = true
    highlightedIndex.value = 0
    return
  }
  if (filteredExistingTags.value.length > 0) {
    highlightedIndex.value = (highlightedIndex.value + 1) % filteredExistingTags.value.length
  }
}

const navigateTagUp = () => {
  if (!isTagDropdownOpen.value) {
    isTagDropdownOpen.value = true
    highlightedIndex.value = filteredExistingTags.value.length - 1
    return
  }
  if (filteredExistingTags.value.length > 0) {
    highlightedIndex.value = (highlightedIndex.value - 1 + filteredExistingTags.value.length) % filteredExistingTags.value.length
  }
}

const selectExistingTag = (tag: string) => {
  const clean = tag.trim().replace(/^#/, '')
  if (clean && !newCanvasForm.value.tags.includes(clean)) {
    newCanvasForm.value.tags.push(clean)
  }
  tagInput.value = ''
  highlightedIndex.value = -1
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTagToForm = () => {
  const clean = tagInput.value.trim().replace(/^#/, '')
  if (clean && !newCanvasForm.value.tags.includes(clean)) {
    newCanvasForm.value.tags.push(clean)
  }
  tagInput.value = ''
  highlightedIndex.value = -1
}

const handleTagEnter = () => {
  if (isTagDropdownOpen.value && highlightedIndex.value >= 0 && highlightedIndex.value < filteredExistingTags.value.length) {
    const selected = filteredExistingTags.value[highlightedIndex.value]
    if (selected) {
      selectExistingTag(selected)
      return
    }
  }
  if (tagInput.value.trim()) {
    addTagToForm()
    return
  }
  confirmCreate()
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

// Funções para Gerenciar Tags
const focusEditTagInput = () => {
  editTagInputRef.value?.focus()
  openEditTagDropdown()
}

const openEditTagDropdown = () => {
  isEditTagDropdownOpen.value = true
}

const closeEditTagDropdown = () => {
  isEditTagDropdownOpen.value = false
  editHighlightedIndex.value = -1
}

const handleEditTagBlur = () => {
  setTimeout(() => {
    isEditTagDropdownOpen.value = false
    editHighlightedIndex.value = -1
  }, 180)
}

const navigateEditTagDown = () => {
  if (!isEditTagDropdownOpen.value) {
    isEditTagDropdownOpen.value = true
    editHighlightedIndex.value = 0
    return
  }
  if (filteredEditExistingTags.value.length > 0) {
    editHighlightedIndex.value = (editHighlightedIndex.value + 1) % filteredEditExistingTags.value.length
  }
}

const navigateEditTagUp = () => {
  if (!isEditTagDropdownOpen.value) {
    isEditTagDropdownOpen.value = true
    editHighlightedIndex.value = filteredEditExistingTags.value.length - 1
    return
  }
  if (filteredEditExistingTags.value.length > 0) {
    editHighlightedIndex.value = (editHighlightedIndex.value - 1 + filteredEditExistingTags.value.length) % filteredEditExistingTags.value.length
  }
}

const selectEditExistingTag = (tag: string) => {
  const clean = tag.trim().replace(/^#/, '')
  if (clean && !editingTags.value.includes(clean)) {
    editingTags.value.push(clean)
  }
  editTagInput.value = ''
  editHighlightedIndex.value = -1
  nextTick(() => {
    editTagInputRef.value?.focus()
  })
}

const addTagToEdit = () => {
  const clean = editTagInput.value.trim().replace(/^#/, '')
  if (clean && !editingTags.value.includes(clean)) {
    editingTags.value.push(clean)
  }
  editTagInput.value = ''
  editHighlightedIndex.value = -1
}

const handleEditTagEnter = () => {
  if (isEditTagDropdownOpen.value && editHighlightedIndex.value >= 0 && editHighlightedIndex.value < filteredEditExistingTags.value.length) {
    const selected = filteredEditExistingTags.value[editHighlightedIndex.value]
    if (selected) {
      selectEditExistingTag(selected)
      return
    }
  }
  if (editTagInput.value.trim()) {
    addTagToEdit()
    return
  }
  confirmSaveTags()
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
