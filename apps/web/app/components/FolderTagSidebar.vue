<template>
  <!-- Backdrop no mobile quando expandido -->
  <div
    v-if="!isCollapsed"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
    @click="toggleCollapse"
  />

  <aside
    class="flex flex-col bg-bgPanel border-r border-divider h-full transition-all duration-300 flex-shrink-0 select-none"
    :class="[
      isCollapsed
        ? 'hidden md:flex w-16'
        : 'fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-72 max-w-[85vw] md:max-w-none shadow-2xl md:shadow-none'
    ]"
  >
    <!-- Top Header do Sidebar -->
    <div
      class="h-14 border-b border-divider flex items-center flex-shrink-0 transition-all"
      :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-3 md:px-4'"
    >
      <div v-if="!isCollapsed" class="flex items-center gap-2 overflow-hidden">
        <span class="text-base font-semibold text-textPrimary truncate font-interface">{{ title }}</span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium font-mono">
          {{ totalItemsCount }}
        </span>
      </div>

      <!-- Botão Minimizar/Expandir Sidebar -->
      <button
        @click="toggleCollapse"
        class="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        :title="isCollapsed ? 'Expandir painel' : 'Recolher painel'"
      >
        <SidebarIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Conteúdo Scrollável -->
    <div class="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
      <!-- MODO COLAPSADO: Ícones Rápidos -->
      <div v-if="isCollapsed" class="flex flex-col items-center gap-2 pt-2">
        <button
          @click="$emit('select-folder', null); $emit('select-tag', null)"
          class="p-2.5 rounded-xl transition-all cursor-pointer"
          :class="selectedFolder === null && selectedTag === null ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:bg-black/5 dark:hover:bg-white/5'"
          title="Todos os itens"
        >
          <LayersIcon class="w-4 h-4" />
        </button>

        <button
          @click="$emit('select-folder', '__uncategorized__')"
          class="p-2.5 rounded-xl transition-all cursor-pointer"
          :class="selectedFolder === '__uncategorized__' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:bg-black/5 dark:hover:bg-white/5'"
          title="Sem pasta"
        >
          <InboxIcon class="w-4 h-4" />
        </button>

        <div class="w-8 h-px bg-divider my-1"></div>

        <div
          v-for="folder in allFolders"
          :key="folder"
          @click="$emit('select-folder', folder)"
          class="p-2.5 rounded-xl transition-all cursor-pointer relative group"
          :class="selectedFolder === folder ? 'bg-accent/20 text-accent border border-accent/40' : 'text-textSecondary hover:bg-black/5 dark:hover:bg-white/5'"
          :title="'Pasta: ' + folder"
        >
          <FolderIcon class="w-4 h-4" />
        </div>
      </div>

      <!-- MODO EXPANDIDO: Árvore Hierárquica de Pastas & Arquivos -->
      <div v-else class="space-y-4">
        <!-- 1. Todos os Itens -->
        <div>
          <button
            @click="selectFolder(null); $emit('select-tag', null)"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer"
            :class="selectedFolder === null && selectedTag === null ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="flex items-center gap-2.5 truncate">
              <LayersIcon class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">Todos os {{ itemLabel }}</span>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
              :class="selectedFolder === null && selectedTag === null ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-textSecondary'"
            >
              {{ totalItemsCount }}
            </span>
          </button>
        </div>

        <!-- 2. Estrutura em Árvore (Pastas e Arquivos Aninhados) -->
        <div class="pt-2 border-t border-divider">
          <div class="flex items-center justify-between px-2 mb-1.5">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-[11px] font-semibold tracking-wider uppercase text-textSecondary/80 font-interface truncate">
                Árvore de Arquivos
              </span>
              <button
                v-if="selectedTag"
                @click="$emit('select-tag', null)"
                class="text-[10px] px-1.5 py-0.2 rounded-md bg-accent/15 text-accent font-mono truncate max-w-[90px] hover:bg-accent/25 transition-colors cursor-pointer flex items-center gap-0.5"
                :title="'Filtro ativo #' + selectedTag + ' (clique para limpar)'"
              >
                <span>#{{ selectedTag }}</span>
                <span>✕</span>
              </button>
            </div>
            <div class="flex items-center gap-0.5">
              <button
                @click="$emit('create-note')"
                class="p-1 rounded-md text-textSecondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                title="Criar nova nota"
              >
                <FileTextIcon class="w-3.5 h-3.5" />
              </button>
              <button
                @click="isCreatingFolder = true"
                class="p-1 rounded-md text-textSecondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                title="Nova pasta"
              >
                <PlusIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Input inline para criar nova pasta -->
          <div v-if="isCreatingFolder" class="px-2 py-1 mb-2">
            <div class="flex items-center gap-1.5 p-1 rounded-lg bg-bgRoot border border-accent">
              <FolderIcon class="w-3.5 h-3.5 text-accent flex-shrink-0 ml-1" />
              <input
                ref="newFolderInputRef"
                v-model="newFolderName"
                type="text"
                placeholder="Nome da pasta..."
                class="w-full bg-transparent text-xs text-textPrimary focus:outline-none font-interface"
                @keyup.enter="handleCreateFolder"
                @keyup.esc="isCreatingFolder = false; newFolderName = ''"
              />
              <button
                @click="handleCreateFolder"
                class="px-1.5 py-0.5 rounded text-[10px] bg-accent text-white font-medium cursor-pointer"
              >
                OK
              </button>
              <button
                @click="isCreatingFolder = false; newFolderName = ''"
                class="px-1 text-[11px] text-textSecondary hover:text-textPrimary cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Mensagem quando tag selecionada não tem itens -->
          <div
            v-if="selectedTag && visibleFolders.length === 0 && uncategorizedItems.length === 0"
            class="px-3 py-4 text-center text-[11px] text-textSecondary/70 bg-bgSurface/40 rounded-xl border border-divider/60 space-y-1 my-2"
          >
            <p>Nenhum item com a tag <span class="text-accent font-mono">#{{ selectedTag }}</span></p>
            <button
              @click="$emit('select-tag', null)"
              class="text-[10px] text-accent hover:underline cursor-pointer"
            >
              Limpar filtro de tag
            </button>
          </div>

          <!-- Árvore: Lista de Pastas com Arquivos Aninhados -->
          <div v-else class="space-y-1">
            <div
              v-for="folder in visibleFolders"
              :key="folder"
              class="space-y-0.5"
            >
              <!-- Linha da Pasta -->
              <div
                class="group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs md:text-sm transition-all cursor-pointer"
                :class="selectedFolder === folder ? 'bg-accent/15 text-accent border border-accent/30 font-semibold' : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 font-medium'"
                @click="selectFolder(folder)"
              >
                <div class="flex items-center gap-1.5 truncate min-w-0 pr-2">
                  <!-- Botão de Expandir/Recolher Árvore -->
                  <button
                    class="p-0.5 rounded hover:bg-accent/20 text-textSecondary hover:text-accent cursor-pointer transition-transform"
                    @click.stop="toggleFolderExpand(folder)"
                    title="Expandir ou recolher pasta"
                  >
                    <ChevronRightIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="{ 'rotate-90 text-accent': expandedFolders.has(folder) }"
                    />
                  </button>

                  <FolderIcon class="w-3.5 h-3.5 flex-shrink-0 text-accent" />
                  <span class="truncate">{{ folder }}</span>
                </div>

                <div class="flex items-center gap-1">
                  <span
                    class="text-[11px] px-1.5 py-0.2 rounded-full font-mono"
                    :class="selectedFolder === folder ? 'bg-accent/20 text-accent' : 'text-textSecondary/60 group-hover:text-textSecondary'"
                  >
                    {{ getFolderItems(folder).length }}
                  </span>

                  <!-- Ações Rápidas da Pasta -->
                  <div class="opacity-0 group-hover:opacity-100 flex items-center transition-opacity ml-1">
                    <button
                      @click.stop="$emit('create-note', folder)"
                      class="p-1 hover:text-accent rounded text-textSecondary cursor-pointer"
                      title="Nova nota nesta pasta"
                    >
                      <PlusIcon class="w-3 h-3" />
                    </button>
                    <button
                      @click.stop="openRenameModal(folder)"
                      class="p-1 hover:text-accent rounded text-textSecondary cursor-pointer"
                      title="Renomear pasta"
                    >
                      <Edit3Icon class="w-3 h-3" />
                    </button>
                    <button
                      @click.stop="handleDeleteFolder(folder)"
                      class="p-1 hover:text-red-400 rounded text-textSecondary cursor-pointer"
                      title="Excluir pasta"
                    >
                      <Trash2Icon class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Itens/Arquivos Aninhados dentro da Pasta (Tree Children) -->
              <div
                v-if="expandedFolders.has(folder)"
                class="pl-6 pr-1 py-1 space-y-1 border-l-2 border-divider/60 ml-3.5"
              >
                <div
                  v-for="item in getFolderItems(folder)"
                  :key="item.id"
                  class="flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors group/file"
                  :class="selectedItemId === item.id
                    ? 'bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
                  @click="clickItem(item)"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <!-- Ícone de Quadro ou Nota -->
                    <LayoutGridIcon
                      v-if="item.kind === 'canvas'"
                      class="w-3 h-3 text-accent flex-shrink-0"
                    />
                    <FileTextIcon
                      v-else
                      class="w-3 h-3 text-indigo-400 flex-shrink-0"
                    />

                    <span class="truncate font-interface text-[11px]">{{ item.title || (item.kind === 'canvas' ? 'Quadro sem título' : 'Nota sem título') }}</span>
                  </div>

                  <span class="text-[9px] uppercase tracking-wider font-mono opacity-60 group-hover/file:opacity-100" :class="item.kind === 'canvas' ? 'text-accent' : 'text-indigo-400'">
                    {{ item.kind === 'canvas' ? 'quadro' : 'nota' }}
                  </span>
                </div>

                <div v-if="getFolderItems(folder).length === 0" class="px-2 py-1 text-[10px] text-textSecondary/50 italic">
                  {{ selectedTag ? 'Nenhum item com a tag nesta pasta' : 'Pasta vazia' }}
                </div>
              </div>
            </div>

            <!-- Seção de Arquivos Sem Pasta (Na Raiz) -->
            <div v-if="!selectedTag || uncategorizedItems.length > 0" class="space-y-0.5 pt-1">
              <div
                class="group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs md:text-sm transition-all cursor-pointer"
                :class="selectedFolder === '__uncategorized__' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 font-medium'"
              >
                <div class="flex items-center gap-1.5 truncate min-w-0 pr-2" @click="selectFolder('__uncategorized__')">
                  <button
                    class="p-0.5 rounded hover:bg-white/20 text-textSecondary hover:text-white cursor-pointer transition-transform"
                    @click.stop="toggleFolderExpand('__uncategorized__')"
                    title="Expandir ou recolher arquivos sem pasta"
                  >
                    <ChevronRightIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="{ 'rotate-90 text-accent': expandedFolders.has('__uncategorized__') }"
                    />
                  </button>

                  <InboxIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Sem pasta</span>
                </div>

                <span
                  class="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                  :class="selectedFolder === '__uncategorized__' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-textSecondary'"
                >
                  {{ uncategorizedItems.length }}
                </span>
              </div>

              <!-- Itens/Arquivos na Raiz (Sem Pasta) -->
              <div
                v-if="expandedFolders.has('__uncategorized__')"
                class="pl-6 pr-1 py-1 space-y-1 border-l-2 border-divider/60 ml-3.5"
              >
                <div
                  v-for="item in uncategorizedItems"
                  :key="item.id"
                  class="flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors group/file"
                  :class="selectedItemId === item.id
                    ? 'bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
                  @click="clickItem(item)"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <LayoutGridIcon
                      v-if="item.kind === 'canvas'"
                      class="w-3 h-3 text-accent flex-shrink-0"
                    />
                    <FileTextIcon
                      v-else
                      class="w-3 h-3 text-indigo-400 flex-shrink-0"
                    />
                    <span class="truncate font-interface text-[11px]">{{ item.title || (item.kind === 'canvas' ? 'Quadro sem título' : 'Nota sem título') }}</span>
                  </div>

                  <span class="text-[9px] uppercase tracking-wider font-mono opacity-60 group-hover/file:opacity-100" :class="item.kind === 'canvas' ? 'text-accent' : 'text-indigo-400'">
                    {{ item.kind === 'canvas' ? 'quadro' : 'nota' }}
                  </span>
                </div>

                <div v-if="uncategorizedItems.length === 0" class="px-2 py-1 text-[10px] text-textSecondary/50 italic">
                  Nenhum arquivo sem pasta
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Seção de Tags -->
        <div class="pt-2 border-t border-divider">
          <div class="flex items-center justify-between px-2 mb-2">
            <span class="text-[11px] font-semibold tracking-wider uppercase text-textSecondary/80 font-interface">
              Tags
            </span>
            <button
              v-if="selectedTag"
              @click="$emit('select-tag', null)"
              class="text-[10px] text-accent hover:underline cursor-pointer"
            >
              Limpar filtro
            </button>
          </div>

          <!-- Nuvem de Chips de Tags -->
          <div class="flex flex-wrap gap-1.5 px-1">
            <button
              v-for="tagItem in availableTags"
              :key="tagItem.name"
              @click="toggleTag(tagItem.name)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border"
              :class="selectedTag === tagItem.name
                ? 'bg-accent text-white border-accent shadow-sm shadow-accent/25 scale-102'
                : 'bg-bgSurface border-divider text-textSecondary hover:border-accent/40 hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
            >
              <span>#{{ tagItem.name }}</span>
              <span
                class="text-[10px] px-1 rounded-full font-mono"
                :class="selectedTag === tagItem.name ? 'bg-white/25 text-white' : 'bg-black/10 dark:bg-white/10 text-textSecondary'"
              >
                {{ tagItem.count }}
              </span>
            </button>

            <div v-if="availableTags.length === 0" class="px-2 py-1 text-[11px] text-textSecondary/60 italic">
              Nenhuma tag aplicada ainda.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Renomear Pasta -->
    <div
      v-if="renameModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-bgPanel border border-divider rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
        <h3 class="text-sm font-semibold text-textPrimary font-interface">Renomear Pasta</h3>
        <input
          v-model="renameFolderNewName"
          type="text"
          class="w-full px-3 py-2 rounded-xl bg-bgRoot border border-divider text-sm text-textPrimary focus:outline-none focus:border-accent font-interface"
          placeholder="Novo nome..."
          @keyup.enter="confirmRenameFolder"
        />
        <div class="flex items-center justify-end gap-2">
          <button
            @click="renameModalOpen = false"
            class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="confirmRenameFolder"
            class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  FolderIcon,
  LayersIcon,
  InboxIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  SidebarIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  FileTextIcon
} from 'lucide-vue-next'

export interface SidebarTreeItem {
  id: string
  title?: string
  kind?: 'canvas' | 'note'
  folder?: string | null
  tags?: string[]
}

const props = withDefaults(
  defineProps<{
    items: SidebarTreeItem[]
    folders: string[]
    selectedFolder?: string | null
    selectedTag?: string | null
    selectedItemId?: string | null
    title?: string
    itemLabel?: string
    collapsed?: boolean
  }>(),
  {
    selectedFolder: null,
    selectedTag: null,
    selectedItemId: null,
    title: 'Biblioteca',
    itemLabel: 'itens',
    collapsed: false
  }
)

const emit = defineEmits<{
  (_e: 'select-folder', _folder: string | null): void
  (_e: 'select-tag', _tag: string | null): void
  (_e: 'select-item', _item: SidebarTreeItem): void
  (_e: 'create-note', _folder?: string): void
  (_e: 'create-folder', _name: string): void
  (_e: 'rename-folder', _payload: { oldName: string; newName: string }): void
  (_e: 'delete-folder', _name: string): void
  (_e: 'update:collapsed', _collapsed: boolean): void
}>()

const isCollapsed = ref(props.collapsed ?? false)
const expandedFolders = ref<Set<string>>(new Set(['__uncategorized__']))

watch(
  () => props.collapsed,
  (val) => {
    if (val !== undefined && val !== isCollapsed.value) {
      isCollapsed.value = val
    }
  }
)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

const toggleFolderExpand = (folder: string) => {
  if (expandedFolders.value.has(folder)) {
    expandedFolders.value.delete(folder)
  } else {
    expandedFolders.value.add(folder)
  }
}

const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderInputRef = ref<HTMLInputElement | null>(null)

const renameModalOpen = ref(false)
const renamingFolderOldName = ref('')
const renameFolderNewName = ref('')

// Todas as pastas (união de pastas passadas com pastas presentes nos itens)
const allFolders = computed(() => {
  const set = new Set<string>(props.folders)
  for (const item of props.items) {
    if (item.folder) set.add(item.folder)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const totalItemsCount = computed(() => props.items.length)

// Itens filtrados pela tag ativa (se selecionada)
const filteredTreeItems = computed(() => {
  if (!props.selectedTag) return props.items
  return props.items.filter((item) => {
    return Array.isArray(item.tags) && item.tags.includes(props.selectedTag!)
  })
})

const uncategorizedItems = computed(() => {
  return filteredTreeItems.value.filter((i) => !i.folder)
})

const getFolderItems = (folderName: string) => {
  return filteredTreeItems.value.filter((i) => i.folder === folderName)
}

// Pastas visíveis: se uma tag estiver ativa, exibe apenas pastas com itens correspondentes
const visibleFolders = computed(() => {
  if (!props.selectedTag) return allFolders.value
  return allFolders.value.filter((f) => getFolderItems(f).length > 0)
})

// Auto-expande pastas que contêm itens da tag selecionada
watch(
  () => props.selectedTag,
  (tag) => {
    if (tag) {
      for (const folder of allFolders.value) {
        if (getFolderItems(folder).length > 0) {
          expandedFolders.value.add(folder)
        }
      }
      if (uncategorizedItems.value.length > 0) {
        expandedFolders.value.add('__uncategorized__')
      }
    }
  },
  { immediate: true }
)

// Lista de tags existentes e sua respectiva frequência
const availableTags = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of props.items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const t of tags) {
      const clean = typeof t === 'string' ? t.trim() : ''
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1
      }
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const closeIfMobile = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isCollapsed.value = true
    emit('update:collapsed', true)
  }
}

const selectFolder = (folder: string | null) => {
  closeIfMobile()
  if (folder && folder !== '__uncategorized__') {
    expandedFolders.value.add(folder)
  }
  emit('select-folder', folder)
}

const clickItem = (item: SidebarTreeItem) => {
  closeIfMobile()
  emit('select-item', item)
}

const toggleTag = (tagName: string) => {
  closeIfMobile()
  if (props.selectedTag === tagName) {
    emit('select-tag', null)
  } else {
    emit('select-tag', tagName)
  }
}

const handleCreateFolder = () => {
  const clean = newFolderName.value.trim()
  if (!clean) {
    isCreatingFolder.value = false
    return
  }
  emit('create-folder', clean)
  emit('select-folder', clean)
  expandedFolders.value.add(clean)
  newFolderName.value = ''
  isCreatingFolder.value = false
}

const openRenameModal = (folder: string) => {
  renamingFolderOldName.value = folder
  renameFolderNewName.value = folder
  renameModalOpen.value = true
}

const confirmRenameFolder = () => {
  const clean = renameFolderNewName.value.trim()
  if (clean && clean !== renamingFolderOldName.value) {
    emit('rename-folder', {
      oldName: renamingFolderOldName.value,
      newName: clean
    })
  }
  renameModalOpen.value = false
}

const handleDeleteFolder = (folder: string) => {
  if (confirm(`Tem certeza de que deseja excluir a pasta "${folder}"? Os itens serão movidos para "Sem pasta".`)) {
    emit('delete-folder', folder)
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}
</style>
