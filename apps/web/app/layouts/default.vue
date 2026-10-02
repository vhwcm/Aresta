<template>
  <!-- Layout para Usuário Não Autenticado ou Páginas Imersivas Dedicadas (Leitor / Onboarding) -->
  <div v-if="!auth.isLoggedIn.value || isImmersivePage" class="min-h-screen w-full">
    <slot />
  </div>

  <!-- Layout Global Unificado para Usuários Autenticados em Todas as Páginas -->
  <div v-else class="h-screen w-full flex bg-bgApp text-textPrimary overflow-hidden font-interface select-none">
    <!-- Sidebar Global Unificada com Navegação, Leitura Ativa & Árvore de Arquivos -->
    <FolderTagSidebar
      :items="unifiedSidebarItems"
      :folders="unifiedFolders"
      :selected-folder="activeFolder"
      :selected-tag="activeTag"
      :selected-item-id="activeItemId"
      :is-journal-active="isJournalActive"
      v-model:view-layout="sidebarViewLayout"
      item-label="itens"
      v-model:collapsed="isSidebarCollapsed"
      @go-home="onGoHome"
      @open-journal="onOpenJournal"
      @select-folder="onSelectFolder"
      @select-tag="onSelectTag"
      @select-item="onSelectItem"
      @create-note="handleCreateNewNote"
      @create-drawing="handleCreateNewDrawing"
      @create-book="handleCreateNewBook"
      @create-link="handleCreateNewLink"
      @create-canvas="handleCreateNewCanvas"
      @create-folder="handleCreateFolder"
      @rename-folder="handleRenameFolder"
      @delete-folder="handleDeleteFolder"
      @move-item="handleMoveItemToFolder"
      @add-reference="handleAddReferenceToFolder"
      @remove-reference="handleRemoveReferenceFromFolder"
      @delete-item="handleDeleteItemCompletely"
    />

    <!-- Área Principal de Conteúdo -->
    <div class="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative">
      <!-- Top Bar Mobile Unificada quando a Sidebar estiver recolhida -->
      <header
        v-if="isSidebarCollapsed && showMobileHeader"
        class="md:hidden shrink-0 h-14 bg-bgPanel/95 backdrop-blur-md border-b border-divider px-3 flex items-center justify-between z-30"
        data-testid="mobile-top-header"
      >
        <div class="flex items-center gap-2 min-w-0">
          <!-- Botão Voltar Mobile (em rotas secundárias) -->
          <AppBackButton
            v-if="route.path !== '/'"
            variant="button"
            fallback="/"
            test-id="mobile-header-back-btn"
          />

          <!-- Botão Hambúrguer Mobile -->
          <button
            class="p-2 rounded-xl bg-bgSurface/80 hover:bg-bgSurface text-textPrimary border border-divider shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Abrir menu"
            aria-label="Abrir navegação lateral"
            @click="isSidebarCollapsed = false"
          >
            <MenuIcon class="w-5 h-5 text-accent" />
          </button>

          <!-- Título da Página ao lado do Hambúrguer -->
          <div class="flex items-center gap-2 min-w-0" data-testid="mobile-header-title-container">
            <component :is="currentPageInfo.icon" v-if="currentPageInfo.icon" class="w-4 h-4 text-accent shrink-0" />
            <h1 class="font-technical text-xs uppercase font-bold tracking-widest text-textSecondary truncate">
              {{ currentPageInfo.title }}
            </h1>

            <!-- Indicador sutil de filtro ativo se houver tag na estante -->
            <div
              v-if="activeTag && route.path === '/library'"
              class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] shrink-0"
            >
              <span class="font-mono text-blue-500">#</span>
              <span class="truncate max-w-[80px]">{{ activeTag }}</span>
              <button
                @click="activeTag = null"
                class="text-blue-400 hover:text-blue-200 cursor-pointer ml-0.5 text-[10px]"
                title="Limpar filtro de tag"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Ação Rápida: Alternador de Tema -->
        <button
          @click="toggleThemeMode"
          class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer shrink-0"
          title="Alternar tema da interface"
          aria-label="Alternar tema da interface"
        >
          <SunIcon v-if="themeMode === 'light'" class="w-4 h-4 text-amber-500" />
          <PaletteIcon v-else-if="themeMode === 'sepia'" class="w-4 h-4 text-amber-600 dark:text-amber-300" />
          <MoonIcon v-else class="w-4 h-4 text-accent" />
        </button>
      </header>

      <!-- Botão Hambúrguer Mobile Flutuante quando a Top Bar não estiver visível -->
      <button
        v-if="isSidebarCollapsed && !showMobileHeader"
        class="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-xl bg-bgPanel/95 backdrop-blur-md hover:bg-bgSurface text-textPrimary border border-divider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        title="Abrir menu"
        aria-label="Abrir navegação lateral"
        @click="isSidebarCollapsed = false"
      >
        <MenuIcon class="w-5 h-5 text-accent" />
      </button>

      <main
        class="flex-1 min-w-0 h-full relative flex flex-col"
        :class="isCanvasOrFullPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto'"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Menu as MenuIcon,
  Book as BookIcon,
  Brain as BrainIcon,
  User as UserIcon,
  Upload as UploadIcon,
  BookOpenCheck as BookOpenCheckIcon,
  LayoutGrid as LayoutGridIcon,
  Network as NetworkIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Palette as PaletteIcon
} from 'lucide-vue-next'
import FolderTagSidebar from '~/components/FolderTagSidebar.vue'
import AppBackButton from '~/components/AppBackButton.vue'
import { useAuth } from '~/composables/useAuth'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'
import { useSettings } from '~/composables/useSettings'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const {
  isSidebarCollapsed,
  viewLayout,
  activeFolder,
  activeTag,
  activeItemId,
  isNewLinkModalOpen,
  isNewCanvasModalOpen,
  unifiedFolders,
  unifiedSidebarItems,
  fetchAllWorkspaceData,
  handleCreateNewNote,
  handleCreateNewDrawing,
  handleCreateNewCanvas,
  handleCreateNewBook,
  handleSelectItem,
  handleCreateFolder,
  handleRenameFolder,
  handleDeleteFolder,
  handleMoveItemToFolder,
  handleAddReferenceToFolder,
  handleRemoveReferenceFromFolder,
  handleDeleteItemCompletely,
  handleOpenJournal,
  handleGoHome
} = useWorkspaceSidebar()

const sidebarViewLayout = computed<'graph' | 'grid' | 'journal'>({
  get: () => (viewLayout.value === 'note-editor' ? 'grid' : viewLayout.value),
  set: (val) => {
    viewLayout.value = val
  }
})

const handleCreateNewLink = async () => {
  const path = route?.path || ''
  if (path !== '/') {
    await router?.push('/')
  }
  isNewLinkModalOpen.value = true
}

// Páginas imersivas que não renderizam a barra lateral (leitor e onboarding)
const isImmersivePage = computed(() => {
  const path = route?.path || ''
  return path === '/onboarding' || path.startsWith('/reader')
})

const isCanvasOrFullPage = computed(() => {
  const path = route?.path || ''
  return path === '/' || path.startsWith('/canvas') || path === '/diario' || path === '/diário' || decodeURIComponent(path) === '/diário'
})

const isJournalActive = computed(() => {
  const path = route?.path || ''
  return path === '/diario' || path === '/diário' || decodeURIComponent(path) === '/diário' || (path === '/' && route?.query?.view === 'journal')
})

const showMobileHeader = computed(() => {
  const path = route?.path || ''
  if (isImmersivePage.value) return false
  if (path.startsWith('/canvas/')) return false
  return true
})

const currentPageInfo = computed(() => {
  const path = route?.path || ''
  if (path === '/library') {
    return { title: 'Estante', icon: BookIcon }
  }
  if (path === '/revisao') {
    return { title: 'Revisão', icon: BrainIcon }
  }
  if (path === '/conta') {
    return { title: 'Sua Conta', icon: UserIcon }
  }
  if (path === '/upload') {
    return { title: 'Upload de Livros', icon: UploadIcon }
  }
  if (
    path === '/diario' ||
    path === '/diário' ||
    decodeURIComponent(path) === '/diário' ||
    (path === '/' && route?.query?.view === 'journal')
  ) {
    return { title: 'Diário Sequencial', icon: BookOpenCheckIcon }
  }
  if (path.startsWith('/canvas')) {
    return { title: 'Quadro', icon: LayoutGridIcon }
  }
  if (path === '/') {
    if (viewLayout.value === 'graph') {
      return { title: 'Grafo de Conhecimento', icon: NetworkIcon }
    }
    return { title: 'Espaço Criativo', icon: LayoutGridIcon }
  }
  return { title: 'Aresta', icon: BookIcon }
})

const themeMode = ref<'dark' | 'light' | 'sepia'>('dark')
const toggleThemeMode = () => {
  try {
    const settings = useSettings()
    if (settings && typeof settings.toggleThemeMode === 'function') {
      settings.toggleThemeMode()
      themeMode.value = settings.themeMode?.value || 'dark'
    }
  } catch {
    // fallback
  }
}

try {
  const settings = useSettings()
  if (settings?.themeMode) {
    themeMode.value = settings.themeMode.value
  }
} catch {
  // fallback
}

const onGoHome = async () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
  await handleGoHome()
}

const onOpenJournal = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
  void handleOpenJournal()
}

const onSelectFolder = async (folder: string | null) => {
  activeFolder.value = folder
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
  const path = route?.path || ''
  if (path === '/diario' || path === '/diário' || decodeURIComponent(path) === '/diário') {
    await router?.push('/')
  }
}

const onSelectTag = async (tag: string | null) => {
  activeTag.value = tag
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
  const path = route?.path || ''
  if (path === '/diario' || path === '/diário' || decodeURIComponent(path) === '/diário') {
    await router?.push('/')
  }
}

const onSelectItem = async (item: any) => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
  await handleSelectItem(item)
}

onMounted(() => {
  // No mobile, a sidebar deve iniciar expandida ("Quando o app for aberto no mobile tem que aparecer só essa barra")
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = false
  }
  if (auth.isLoggedIn.value) {
    void fetchAllWorkspaceData()
  }
})

// Ao mudar de rota no mobile, recolhe a barra para mostrar o conteúdo da página
watch(
  () => route?.fullPath,
  () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      isSidebarCollapsed.value = true
    }
  }
)
</script>
