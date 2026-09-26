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
      v-model:view-layout="viewLayout"
      item-label="itens"
      v-model:collapsed="isSidebarCollapsed"
      @open-journal="onOpenJournal"
      @select-folder="onSelectFolder"
      @select-tag="onSelectTag"
      @select-item="onSelectItem"
      @create-note="handleCreateNewNote"
      @create-drawing="handleCreateNewDrawing"
      @create-link="isNewLinkModalOpen = true"
      @create-canvas="isNewCanvasModalOpen = true"
      @create-folder="handleCreateFolder"
      @rename-folder="handleRenameFolder"
      @delete-folder="handleDeleteFolder"
    />

    <!-- Área Principal de Conteúdo -->
    <main
      class="flex-1 min-w-0 h-full relative flex flex-col"
      :class="isCanvasOrFullPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto'"
    >
      <!-- Botão Hambúrguer Mobile Flutuante quando a Sidebar estiver recolhida -->
      <button
        v-if="isSidebarCollapsed"
        class="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-xl bg-bgPanel/95 backdrop-blur-md hover:bg-bgSurface text-textPrimary border border-divider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        title="Abrir menu"
        aria-label="Abrir navegação lateral"
        @click="isSidebarCollapsed = false"
      >
        <MenuIcon class="w-5 h-5 text-accent" />
      </button>

      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu as MenuIcon } from 'lucide-vue-next'
import FolderTagSidebar from '~/components/FolderTagSidebar.vue'
import { useAuth } from '~/composables/useAuth'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'

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
  handleSelectItem,
  handleCreateFolder,
  handleRenameFolder,
  handleDeleteFolder,
  handleOpenJournal
} = useWorkspaceSidebar()

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
