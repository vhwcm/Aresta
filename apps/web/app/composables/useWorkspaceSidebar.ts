import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCanvas } from '~/composables/useCanvas'
import { useNotes } from '~/composables/useNotes'
import { useDrawing } from '~/composables/useDrawing'
import { useLinks } from '~/composables/useLinks'
import { openExternalUrl } from '~/utils/urlOpener'
import type { SidebarTreeItem } from '~/components/FolderTagSidebar.vue'

// Estado Singleton Compartilhado
const isSidebarCollapsed = ref(false)
const viewLayout = ref<'graph' | 'grid' | 'journal' | 'note-editor'>('graph')
const activeFolder = ref<string | null>(null)
const activeTag = ref<string | null>(null)
const activeItemId = ref<string | null>(null)

// Modais globais acionados pelo sidebar
const isNewLinkModalOpen = ref(false)
const isNewCanvasModalOpen = ref(false)

export function useWorkspaceSidebar() {
  const router = typeof useRouter === 'function' ? useRouter() : undefined
  const route = typeof useRoute === 'function' ? useRoute() : { path: '/', query: {} }

  const {
    canvasesList,
    canvasFolders,
    fetchCanvases,
    fetchCanvasFolders,
    renameCanvasFolder
  } = useCanvas()

  const {
    notesList,
    folders: noteFolders,
    fetchNotes,
    fetchFolders: fetchNoteFolders,
    createNote,
    renameFolder: renameNoteFolder,
    deleteFolder: deleteNoteFolder
  } = useNotes()

  const {
    drawingsList,
    fetchDrawings,
    createDrawing
  } = useDrawing()

  const {
    linksList,
    linkFolders,
    fetchLinks
  } = useLinks()

  const fetchAllWorkspaceData = async () => {
    await Promise.allSettled([
      fetchCanvases(),
      fetchCanvasFolders(),
      fetchNotes(),
      fetchNoteFolders(),
      fetchDrawings(),
      fetchLinks()
    ])
  }

  // Todas as pastas unificadas
  const unifiedFolders = computed<string[]>(() => {
    const set = new Set<string>()
    for (const f of canvasFolders.value) if (f) set.add(f)
    for (const f of noteFolders.value) if (f) set.add(f)
    for (const f of linkFolders.value) if (f) set.add(f)
    for (const c of canvasesList.value) if (c.folder) set.add(c.folder)
    for (const n of notesList.value) if (n.folder) set.add(n.folder)
    for (const d of drawingsList.value) if (d.folder) set.add(d.folder)
    for (const l of linksList.value) if (l.folder) set.add(l.folder)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

  // Itens unificados para o Sidebar
  const unifiedSidebarItems = computed<SidebarTreeItem[]>(() => {
    const cItems: SidebarTreeItem[] = canvasesList.value.map((c) => ({
      id: `canvas-${c.id}`,
      title: c.title || 'Quadro sem título',
      kind: 'canvas',
      folder: c.folder,
      tags: c.tags
    }))
    const nItems: SidebarTreeItem[] = notesList.value.map((n) => ({
      id: `note-${n.id}`,
      title: n.title || 'Nota sem título',
      kind: 'note',
      folder: n.folder,
      tags: n.tags
    }))
    const dItems: SidebarTreeItem[] = drawingsList.value.map((d) => ({
      id: `drawing-${d.id}`,
      title: d.title || 'Desenho sem título',
      kind: 'drawing' as any,
      folder: d.folder,
      tags: d.tags
    }))
    const lItems: SidebarTreeItem[] = linksList.value.map((l) => ({
      id: `link-${l.id}`,
      title: l.title || l.domain || 'Link',
      kind: 'link' as any,
      folder: l.folder,
      tags: l.tags
    }))
    return [...cItems, ...nItems, ...dItems, ...lItems]
  })

  const handleCreateNewNote = async (folder?: string) => {
    const res = await createNote({
      title: 'Nota sem título',
      content: '',
      folder: folder || activeFolder.value || undefined
    })
    if (res?.id) {
      if (route.path !== '/') {
        await router?.push(`/?note=${res.id}`)
      }
    }
  }

  const handleCreateNewDrawing = async () => {
    const res = await createDrawing({
      title: 'Desenho sem título',
      folder: activeFolder.value || undefined
    })
    if (res?.id) {
      await router?.push(`/canvas/drawing/${res.id}`)
    }
  }

  const handleSelectItem = async (item: SidebarTreeItem) => {
    activeItemId.value = item.id
    if (item.kind === 'canvas') {
      const rawId = item.id.replace(/^canvas-/, '')
      await router?.push(`/canvas/${rawId}`)
    } else if (item.kind === 'drawing' as any || item.id.startsWith('drawing-')) {
      const rawId = item.id.replace(/^drawing-/, '')
      await router?.push(`/canvas/drawing/${rawId}`)
    } else if (item.kind === 'link' as any || item.id.startsWith('link-')) {
      const rawId = item.id.replace(/^link-/, '')
      const foundLink = linksList.value.find((l) => String(l.id) === rawId)
      if (foundLink?.url) {
        await openExternalUrl(foundLink.url)
      }
    } else {
      const rawId = item.id.replace(/^note-/, '')
      if (route.path !== '/') {
        await router?.push(`/?note=${rawId}`)
      }
    }
  }

  const handleCreateFolder = async (name: string) => {
    activeFolder.value = name
  }

  const handleRenameFolder = async (payload: { oldName: string; newName: string }) => {
    await Promise.allSettled([
      renameNoteFolder(payload.oldName, payload.newName),
      renameCanvasFolder(payload.oldName, payload.newName)
    ])
    if (activeFolder.value === payload.oldName) {
      activeFolder.value = payload.newName
    }
  }

  const handleDeleteFolder = async (name: string) => {
    await deleteNoteFolder(name)
    if (activeFolder.value === name) {
      activeFolder.value = null
    }
  }

  const handleOpenJournal = async () => {
    viewLayout.value = 'journal'
    if (route.path !== '/') {
      await router?.push('/?view=journal')
    }
  }

  return {
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
  }
}
