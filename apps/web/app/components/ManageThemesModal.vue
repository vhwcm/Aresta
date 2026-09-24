<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    aria-labelledby="manage-themes-title"
  >
    <div
      class="bg-bgPanel border border-divider rounded-3xl w-full max-w-xl p-6 md:p-7 shadow-2xl space-y-6 text-textPrimary flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho -->
      <div class="flex items-start justify-between gap-4 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center shrink-0">
            <TagIcon class="w-5 h-5" />
          </div>
          <div>
            <h3 id="manage-themes-title" class="text-xl font-bold font-editorial">Gerenciar Tags</h3>
            <p class="text-xs text-textSecondary font-interface">
              Edite ou remova tags da sua estante e do grafo de conhecimento.
            </p>
          </div>
        </div>
        <button
          @click="handleClose"
          data-testid="close-manage-themes-btn"
          class="p-2 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all"
          aria-label="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Barra de Criação Rápida de Tag -->
      <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-divider/60 flex flex-col gap-2.5 shrink-0">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-technical uppercase font-bold tracking-wider text-textSecondary">
            Nova Tag
          </span>
          <div class="flex items-center gap-1.5">
            <button
              v-for="color in presetColors"
              :key="color"
              type="button"
              @click="newThemeColor = color"
              class="w-4 h-4 rounded-full border transition-all"
              :class="newThemeColor === color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="newThemeName"
            type="text"
            placeholder="Nome da nova tag..."
            maxlength="30"
            class="flex-1 bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
            @keyup.enter="handleCreateTheme"
          />
          <button
            @click="handleCreateTheme"
            :disabled="!newThemeName.trim() || isCreating"
            data-testid="create-theme-submit-btn"
            class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <PlusIcon class="w-3.5 h-3.5" />
            <span>{{ isCreating ? 'Criando...' : 'Adicionar' }}</span>
          </button>
        </div>
        <span v-if="createError" class="text-[11px] text-rose-400 font-interface">
          {{ createError }}
        </span>
      </div>

      <!-- Barra de Busca e Contador -->
      <div class="flex items-center justify-between gap-3 shrink-0">
        <div class="relative flex-1">
          <SearchIcon class="w-3.5 h-3.5 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar tags..."
            class="w-full bg-bgApp border border-divider rounded-xl pl-9 pr-3 py-1.5 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
          />
        </div>
        <span class="text-xs font-technical text-textSecondary shrink-0">
          {{ filteredThemes.length }} {{ filteredThemes.length === 1 ? 'tag' : 'tags' }}
        </span>
      </div>

      <!-- Lista com Scroll de Tags -->
      <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
        <div v-if="filteredThemes.length === 0" class="py-8 text-center text-textSecondary text-xs">
          Nenhuma tag encontrada.
        </div>

        <div
          v-for="theme in filteredThemes"
          :key="theme.id"
          class="p-3 rounded-2xl bg-white/[0.02] border border-divider/60 hover:border-divider transition-all flex flex-col gap-2"
          :data-testid="`theme-row-${theme.id}`"
        >
          <!-- Modo Edição de Nome -->
          <div v-if="editingThemeId === theme.id" class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <span
                class="w-3.5 h-3.5 rounded-full shrink-0"
                :style="{ backgroundColor: editThemeColor || theme.color || '#E57B55' }"
              ></span>
              <input
                v-model="editThemeName"
                data-testid="edit-theme-input"
                type="text"
                maxlength="30"
                class="flex-1 bg-bgApp border border-accent rounded-xl px-3 py-1.5 text-xs text-textPrimary focus:outline-none"
                @keyup.enter="handleSaveEdit(theme)"
                @keyup.esc="cancelEdit"
                ref="editInputRef"
              />
              <button
                @click="handleSaveEdit(theme)"
                :disabled="!editThemeName.trim() || isSaving"
                data-testid="save-edit-theme-btn"
                class="p-2 rounded-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-all"
                title="Salvar alteração"
              >
                <CheckIcon class="w-4 h-4" />
              </button>
              <button
                @click="cancelEdit"
                class="p-2 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all"
                title="Cancelar"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>
            <!-- Seletor de cores na edição -->
            <div class="flex items-center gap-1.5 pl-5">
              <span class="text-[10px] font-technical uppercase text-textSecondary mr-1">Cor:</span>
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                @click="editThemeColor = color"
                class="w-3.5 h-3.5 rounded-full border transition-all"
                :class="editThemeColor === color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
            <span v-if="editError" class="text-[11px] text-rose-400 font-interface pl-5">
              {{ editError }}
            </span>
          </div>

          <!-- Modo Confirmação de Exclusão -->
          <div
            v-else-if="deletingThemeId === theme.id"
            class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2 text-xs"
          >
            <div class="flex items-center gap-2 text-rose-300 font-medium">
              <AlertTriangleIcon class="w-4 h-4 shrink-0 text-rose-400" />
              <span>Excluir tag «{{ theme.name }}»?</span>
            </div>
            <p class="text-textSecondary text-[11px] leading-relaxed">
              <template v-if="getThemeBooksCount(theme.id) > 0">
                Esta tag está vinculada a <strong class="text-rose-300">{{ getThemeBooksCount(theme.id) }}</strong> {{ getThemeBooksCount(theme.id) === 1 ? 'livro' : 'livros' }}.
                Ela será desvinculada dos livros, notas e do grafo.
              </template>
              <template v-else>
                A tag será removida permanentemente do acervo e do grafo de conhecimento.
              </template>
            </p>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                @click="deletingThemeId = null"
                class="px-3 py-1.5 rounded-lg border border-divider text-[11px] text-textSecondary hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                @click="handleConfirmDelete(theme)"
                :disabled="isDeleting"
                data-testid="confirm-delete-theme-btn"
                class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-all flex items-center gap-1"
              >
                <Trash2Icon class="w-3 h-3" />
                <span>{{ isDeleting ? 'Excluindo...' : 'Confirmar Exclusão' }}</span>
              </button>
            </div>
            <span v-if="deleteError" class="text-[11px] text-rose-400 font-interface">
              {{ deleteError }}
            </span>
          </div>

          <!-- Visualização Padrão da Linha da Tag -->
          <div v-else class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="w-3 h-3 rounded-full shrink-0 shadow-sm"
                :style="{ backgroundColor: theme.color || '#E57B55' }"
              ></span>
              <span class="text-xs font-semibold font-interface text-textPrimary truncate" :title="theme.name">
                {{ theme.name }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-technical border shrink-0"
                :class="getThemeBooksCount(theme.id) > 0 ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-divider text-textSecondary'"
              >
                {{ getThemeBooksCount(theme.id) }} {{ getThemeBooksCount(theme.id) === 1 ? 'livro' : 'livros' }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="toggleSelectTag(theme)"
                class="px-2.5 py-1 rounded-lg text-xs font-interface font-medium transition-all flex items-center gap-1 cursor-pointer border"
                :class="isTagActive(theme)
                  ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'"
                :title="isTagActive(theme) ? 'Desmarcar filtro de tag' : 'Filtrar no Grafo e Estante por esta tag'"
                data-testid="select-tag-modal-btn"
              >
                <span>{{ isTagActive(theme) ? 'Filtro Ativo ✓' : 'Filtrar' }}</span>
              </button>

              <button
                @click.stop="startEdit(theme)"
                data-testid="edit-theme-btn"
                class="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all cursor-pointer"
                title="Editar nome da tag"
              >
                <Edit2Icon class="w-3.5 h-3.5" />
              </button>
              <button
                @click.stop="startDelete(theme)"
                data-testid="delete-theme-btn"
                class="p-1.5 rounded-lg text-textSecondary hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Excluir tag"
              >
                <Trash2Icon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="flex items-center justify-end pt-3 border-t border-divider shrink-0">
        <button
          @click="handleClose"
          class="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-divider text-xs text-textSecondary hover:text-white transition-all font-interface"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  TagIcon,
  XIcon,
  PlusIcon,
  Edit2Icon,
  Trash2Icon,
  CheckIcon,
  SearchIcon,
  AlertTriangleIcon
} from 'lucide-vue-next'
import { useGraph } from '~/composables/useGraph'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'
import type { GraphNode } from '~/interfaces/graph'

interface ThemeItem {
  id: number | string
  name: string
  color?: string
  description?: string
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    themes?: ThemeItem[]
    booksCountByTheme?: (id: number | string) => number
  }>(),
  {
    themes: () => []
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'themeCreated', theme: any): void
  (e: 'themeUpdated', theme: any): void
  (e: 'themeDeleted', id: number | string): void
}>()

const presetColors = ['#E57B55', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']

const { createNode, updateNode, deleteNode } = useGraph()
const { activeTag } = useWorkspaceSidebar()

const isTagActive = (theme: any) => {
  if (!activeTag.value) return false
  const name = String(theme?.name || '').trim().toLowerCase()
  return activeTag.value.trim().toLowerCase() === name
}

const toggleSelectTag = (theme: any) => {
  if (isTagActive(theme)) {
    activeTag.value = null
  } else {
    activeTag.value = theme.name
  }
}

const searchQuery = ref('')
const newThemeName = ref('')
const newThemeColor = ref('#E57B55')
const isCreating = ref(false)
const createError = ref<string | null>(null)

const editingThemeId = ref<number | string | null>(null)
const editThemeName = ref('')
const editThemeColor = ref('#E57B55')
const isSaving = ref(false)
const editError = ref<string | null>(null)

const deletingThemeId = ref<number | string | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

const editInputRef = ref<HTMLInputElement[] | null>(null)

const filteredThemes = computed(() => {
  const list = props.themes || []
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((t) => t.name && t.name.toLowerCase().includes(q))
})

const getThemeBooksCount = (themeOrId: any): number => {
  if (props.booksCountByTheme) {
    return props.booksCountByTheme(themeOrId)
  }
  return 0
}

const handleClose = () => {
  editingThemeId.value = null
  deletingThemeId.value = null
  createError.value = null
  editError.value = null
  deleteError.value = null
  searchQuery.value = ''
  emit('close')
}

const handleCreateTheme = async () => {
  const name = newThemeName.value.trim()
  if (!name) return
  if (name.length > 30) {
    createError.value = 'O nome do tema deve ter no máximo 30 caracteres'
    return
  }
  isCreating.value = true
  createError.value = null
  try {
    const created = await createNode(name, newThemeColor.value)
    newThemeName.value = ''
    emit('themeCreated', created)
  } catch (err: any) {
    console.error('Erro ao criar tema:', err)
    createError.value = err?.data?.error || err?.message || 'Falha ao criar tema'
  } finally {
    isCreating.value = false
  }
}

const startEdit = (theme: ThemeItem) => {
  deletingThemeId.value = null
  editingThemeId.value = theme.id
  editThemeName.value = theme.name
  editThemeColor.value = theme.color || '#E57B55'
  editError.value = null
  nextTick(() => {
    if (editInputRef.value && editInputRef.value[0]) {
      editInputRef.value[0].focus()
    }
  })
}

const cancelEdit = () => {
  editingThemeId.value = null
  editThemeName.value = ''
  editError.value = null
}

const handleSaveEdit = async (theme: ThemeItem) => {
  const name = editThemeName.value.trim()
  if (!name) {
    editError.value = 'O nome não pode ser vazio'
    return
  }
  if (name.length > 30) {
    editError.value = 'O nome do tema deve ter no máximo 30 caracteres'
    return
  }
  isSaving.value = true
  editError.value = null
  try {
    const updated = await updateNode(
      theme.id,
      name,
      editThemeColor.value,
      theme.description || ''
    )
    editingThemeId.value = null
    emit('themeUpdated', updated || { ...theme, name, color: editThemeColor.value })
  } catch (err: any) {
    console.error('Erro ao atualizar tema:', err)
    editError.value = err?.data?.error || err?.message || 'Falha ao atualizar tema'
  } finally {
    isSaving.value = false
  }
}

const startDelete = (theme: ThemeItem) => {
  editingThemeId.value = null
  deletingThemeId.value = theme.id
  deleteError.value = null
}

const handleConfirmDelete = async (theme: ThemeItem) => {
  isDeleting.value = true
  deleteError.value = null
  try {
    await deleteNode(theme.id)
    const idToDelete = theme.id
    deletingThemeId.value = null
    emit('themeDeleted', idToDelete)
  } catch (err: any) {
    console.error('Erro ao excluir tema:', err)
    deleteError.value = err?.data?.error || err?.message || 'Falha ao excluir tema'
  } finally {
    isDeleting.value = false
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (!val) {
      editingThemeId.value = null
      deletingThemeId.value = null
      createError.value = null
      editError.value = null
      deleteError.value = null
    }
  }
)
</script>
