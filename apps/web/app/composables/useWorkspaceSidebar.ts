import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCanvas } from '~/composables/useCanvas'
import { useNotes } from '~/composables/useNotes'
import { useDrawing } from '~/composables/useDrawing'
import { useLinks } from '~/composables/useLinks'
import { useUserBooks } from '~/composables/useUserBooks'
import { useGraph } from '~/composables/useGraph'
import { openExternalUrl } from '~/utils/urlOpener'
import { loadGraphMeta, saveGraphMeta } from '~/utils/graphMeta'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { linkRepo } from '~/adapters/database/repositories/LinkRepository'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { runFolderToTagsMigration } from '~/adapters/database/migrations/folderToTagsMigration'
import type { SidebarTreeItem } from '~/interfaces/sidebar'

// Estado Singleton Compartilhado
const isSidebarCollapsed = ref(false)
const viewLayout = ref<'graph' | 'grid' | 'journal'>('graph')
const activeFolder = ref<string | null>(null)
const activeTag = ref<string | null>(null)
const activeItemId = ref<string | null>(null)
const graphSearchQuery = ref('')

// Modais globais acionados pelo sidebar
const isNewLinkModalOpen = ref(false)
const isNewCanvasModalOpen = ref(false)

export function useWorkspaceSidebar() {
  const router = typeof useRouter === 'function' ? useRouter() : undefined
  const route = typeof useRoute === 'function' ? useRoute() : { path: '/', query: {} }

  const {
    canvasesList,
    fetchCanvases,
    createCanvas
  } = useCanvas()

  const {
    notesList,
    fetchNotes,
    createNote,
    deleteNote
  } = useNotes()

  const {
    drawingsList,
    fetchDrawings,
    createDrawing
  } = useDrawing()

  const {
    linksList,
    fetchLinks
  } = useLinks()

  const {
    userBooks,
    fetchUserBooks
  } = useUserBooks()

  const { fetchGraph } = useGraph()

  const fetchAllWorkspaceData = async () => {
    // Executa migração transparente de folder -> tags se necessário
    await runFolderToTagsMigration().catch(() => {})

    await Promise.allSettled([
      fetchCanvases(),
      fetchNotes(),
      fetchDrawings(),
      fetchLinks(),
      fetchUserBooks(),
      fetchGraph()
    ])
  }

  // Todas as tags/pastas unificadas
  const unifiedFolders = computed<string[]>(() => {
    const set = new Set<string>()

    // 1. Tags criadas no graphMeta (inclusive novas pastas criadas vazias)
    try {
      const meta = loadGraphMeta()
      for (const th of meta.themes || []) {
        const name = (th.name || '').trim()
        if (name) set.add(name)
      }
    } catch {}

    // 2. Tags de notas
    for (const n of notesList.value) {
      for (const t of n.tags || []) {
        if (t && t.trim()) set.add(t.trim())
      }
      if (n.folder && n.folder.trim()) set.add(n.folder.trim())
    }

    // 3. Tags de quadros (canvases)
    for (const c of canvasesList.value) {
      for (const t of c.tags || []) {
        if (t && t.trim()) set.add(t.trim())
      }
      if (c.folder && c.folder.trim()) set.add(c.folder.trim())
    }

    // 4. Tags de desenhos
    for (const d of drawingsList.value) {
      for (const t of d.tags || []) {
        if (t && t.trim()) set.add(t.trim())
      }
      if (d.folder && d.folder.trim()) set.add(d.folder.trim())
    }

    // 5. Tags de links
    for (const l of linksList.value) {
      for (const t of l.tags || []) {
        if (t && t.trim()) set.add(t.trim())
      }
      if (l.folder && l.folder.trim()) set.add(l.folder.trim())
    }

    // 6. Temas dos livros convertidos e tratados diretamente como tags na árvore
    for (const b of userBooks.value) {
      const themes = Array.isArray(b.themes) ? b.themes : []
      for (const th of themes) {
        const name = (th?.name || '').trim()
        if (name) set.add(name)
      }
    }

    // Se houver livros cadastrados, inclui também a pasta padrão 'Livros' para fácil navegação
    if (userBooks.value.length > 0) {
      set.add('Livros')
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

  // Itens unificados para o Sidebar com tags completas e referenceCount
  const unifiedSidebarItems = computed<SidebarTreeItem[]>(() => {
    const cItems: SidebarTreeItem[] = canvasesList.value.map((c) => {
      const tags = Array.from(new Set([
        ...(c.tags || []),
        ...(c.folder ? [c.folder.trim()] : [])
      ].filter(Boolean)))
      return {
        id: `canvas-${c.id}`,
        title: c.title || 'Quadro sem título',
        kind: 'canvas',
        folder: tags[0] || null,
        tags,
        referenceCount: tags.length
      }
    })

    const nItems: SidebarTreeItem[] = notesList.value.map((n) => {
      const tags = Array.from(new Set([
        ...(n.tags || []),
        ...(n.folder ? [n.folder.trim()] : [])
      ].filter(Boolean)))
      return {
        id: `note-${n.id}`,
        title: n.title || 'Nota sem título',
        kind: 'note',
        folder: tags[0] || null,
        tags,
        referenceCount: tags.length
      }
    })

    const dItems: SidebarTreeItem[] = drawingsList.value.map((d) => {
      const tags = Array.from(new Set([
        ...(d.tags || []),
        ...(d.folder ? [d.folder.trim()] : [])
      ].filter(Boolean)))
      return {
        id: `drawing-${d.id}`,
        title: d.title || 'Desenho sem título',
        kind: 'drawing' as any,
        folder: tags[0] || null,
        tags,
        referenceCount: tags.length
      }
    })

    const lItems: SidebarTreeItem[] = linksList.value.map((l) => {
      const tags = Array.from(new Set([
        ...(l.tags || []),
        ...(l.folder ? [l.folder.trim()] : [])
      ].filter(Boolean)))
      return {
        id: `link-${l.id}`,
        title: l.title || l.domain || 'Link',
        kind: 'link' as any,
        folder: tags[0] || null,
        tags,
        referenceCount: tags.length
      }
    })

    const bItems: SidebarTreeItem[] = userBooks.value.map((b) => {
      const bookThemes = Array.isArray(b.themes) ? b.themes.map((t: any) => t.name).filter(Boolean) : []
      const tags = Array.from(new Set([...bookThemes, 'Livros']))
      return {
        id: `book-${b.bookId || b.userBookId}`,
        title: b.title || 'Livro sem título',
        kind: 'book' as any,
        folder: tags[0] || 'Livros',
        tags,
        referenceCount: tags.length,
        bookId: b.bookId || b.userBookId
      }
    })

    return [...cItems, ...nItems, ...dItems, ...lItems, ...bItems]
  })

  const handleCreateNewNote = async (folder?: string) => {
    const targetTag = folder && folder !== '__uncategorized__' ? folder.trim() : activeFolder.value || undefined
    const res = await createNote({
      title: 'Nota sem título',
      content: '',
      folder: targetTag,
      tags: targetTag ? [targetTag] : []
    })
    if (res?.id) {
      if (route.path !== '/') {
        await router?.push(`/?note=${res.id}`)
      }
    }
    await fetchAllWorkspaceData()
  }

  const handleCreateNewDrawing = async () => {
    const targetTag = activeFolder.value && activeFolder.value !== '__uncategorized__' ? activeFolder.value.trim() : undefined
    const res = await createDrawing({
      title: 'Desenho sem título',
      folder: targetTag
    })
    if (res?.id) {
      if (targetTag) {
        try {
          await drawingNoteRepo.save({ id: res.id, title: 'Desenho sem título', tags: [targetTag] })
        } catch {}
      }
      await router?.push(`/canvas/drawing/${res.id}`)
    }
    await fetchAllWorkspaceData()
  }

  const handleCreateNewCanvas = async (folder?: string) => {
    const targetTag = folder && folder !== '__uncategorized__' ? folder.trim() : activeFolder.value || undefined
    const res = await createCanvas({
      title: 'Quadro sem título',
      folder: targetTag
    })
    if (res?.id) {
      if (targetTag) {
        try {
          await canvasRepo.save({ id: res.id, name: 'Quadro sem título', document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }, tags: [targetTag] })
        } catch {}
      }
      activeItemId.value = `canvas-${res.id}`
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        isSidebarCollapsed.value = true
      }
      await router?.push(`/canvas/${res.id}`)
    }
    await fetchAllWorkspaceData()
    return res
  }

  const handleCreateNewBook = async () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      isSidebarCollapsed.value = true
    }
    await router?.push('/upload')
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
    } else if (item.kind === 'book' as any || item.id.startsWith('book-')) {
      const rawId = (item as any).bookId || item.id.replace(/^book-/, '')
      await router?.push(`/reader?bookId=${rawId}`)
    } else {
      const rawId = item.id.replace(/^note-/, '')
      if (route.path !== '/') {
        await router?.push(`/?note=${rawId}`)
      }
    }
  }

  /**
   * 1. Criar Pasta (Nó de Tag/Tema)
   * Como alinhado com o usuário: já cria imediatamente o nó no grafo!
   */
  const handleCreateFolder = async (name: string) => {
    const clean = name.trim()
    if (!clean) return

    activeFolder.value = clean

    // Cria nó no graphMeta
    const meta = loadGraphMeta()
    const exists = (meta.themes || []).some((t) => (t.name || '').trim().toLowerCase() === clean.toLowerCase())
    if (!exists) {
      let hash = 0
      for (let i = 0; i < clean.length; i++) {
        hash = (hash << 5) - hash + clean.charCodeAt(i)
        hash |= 0
      }
      meta.themes.push({
        id: Math.abs(hash),
        name: clean,
        color: '#E57B55',
        description: null
      })
      saveGraphMeta(meta)
    }

    await fetchGraph()
    await fetchAllWorkspaceData()
  }

  /**
   * 2. Renomear Pasta / Tag
   * Atualiza o nó de tag no grafo e em todos os arquivos locais vinculados
   */
  const handleRenameFolder = async (payload: { oldName: string; newName: string }) => {
    const oldNorm = payload.oldName.trim().toLowerCase()
    const newClean = payload.newName.trim()
    if (!newClean || oldNorm === newClean.toLowerCase()) return

    // 1. Atualizar graphMeta
    const meta = loadGraphMeta()
    for (const t of meta.themes || []) {
      if ((t.name || '').trim().toLowerCase() === oldNorm) {
        t.name = newClean
      }
    }
    saveGraphMeta(meta)

    // 2. Atualizar notas
    const notes = await noteRepo.getAll()
    for (const n of notes) {
      const tags = Array.isArray(n.tags) ? [...n.tags] : []
      let changed = false
      const newTags = tags.map((t) => {
        if (t.trim().toLowerCase() === oldNorm) {
          changed = true
          return newClean
        }
        return t
      })
      const newFolder = n.folder && n.folder.trim().toLowerCase() === oldNorm ? newClean : n.folder
      if (changed || newFolder !== n.folder) {
        await noteRepo.save({ ...n, tags: newTags, folder: newFolder })
      }
    }

    // 3. Atualizar canvases
    const canvases = await canvasRepo.getAll()
    for (const c of canvases) {
      const tags = Array.isArray((c as any).tags) ? [...(c as any).tags] : []
      let changed = false
      const newTags = tags.map((t) => {
        if (t.trim().toLowerCase() === oldNorm) {
          changed = true
          return newClean
        }
        return t
      })
      const newFolder = (c as any).folder && (c as any).folder.trim().toLowerCase() === oldNorm ? newClean : (c as any).folder
      if (changed || newFolder !== (c as any).folder) {
        await canvasRepo.save({ ...c, tags: newTags, folder: newFolder } as any)
      }
    }

    // 4. Atualizar desenhos
    const drawings = await drawingNoteRepo.getAll()
    for (const d of drawings) {
      const tags = Array.isArray(d.tags) ? [...d.tags] : []
      let changed = false
      const newTags = tags.map((t) => {
        if (t.trim().toLowerCase() === oldNorm) {
          changed = true
          return newClean
        }
        return t
      })
      const newFolder = d.folder && d.folder.trim().toLowerCase() === oldNorm ? newClean : d.folder
      if (changed || newFolder !== d.folder) {
        await drawingNoteRepo.save({ ...d, tags: newTags, folder: newFolder })
      }
    }

    // 5. Atualizar links
    const links = await linkRepo.getAll()
    for (const l of links) {
      const tags = Array.isArray(l.tags) ? [...l.tags] : []
      let changed = false
      const newTags = tags.map((t) => {
        if (t.trim().toLowerCase() === oldNorm) {
          changed = true
          return newClean
        }
        return t
      })
      const newFolder = l.folder && l.folder.trim().toLowerCase() === oldNorm ? newClean : l.folder
      if (changed || newFolder !== l.folder) {
        await linkRepo.save({ ...l, tags: newTags, folder: newFolder })
      }
    }

    if (activeFolder.value === payload.oldName) {
      activeFolder.value = newClean
    }

    await fetchAllWorkspaceData()
  }

  /**
   * 3. Excluir Pasta / Tag
   * Remove o nó da tag e desassocia essa tag de todos os arquivos
   */
  const handleDeleteFolder = async (name: string) => {
    const norm = name.trim().toLowerCase()

    // 1. Remover de graphMeta
    const meta = loadGraphMeta()
    meta.themes = (meta.themes || []).filter((t) => (t.name || '').trim().toLowerCase() !== norm)
    saveGraphMeta(meta)

    // 2. Remover de notas
    const notes = await noteRepo.getAll()
    for (const n of notes) {
      const tags = Array.isArray(n.tags) ? [...n.tags] : []
      if (tags.some((t) => t.trim().toLowerCase() === norm) || n.folder?.trim().toLowerCase() === norm) {
        const newTags = tags.filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = n.folder?.trim().toLowerCase() === norm ? null : n.folder
        await noteRepo.save({ ...n, tags: newTags, folder: newFolder })
      }
    }

    // 3. Remover de canvases
    const canvases = await canvasRepo.getAll()
    for (const c of canvases) {
      const tags = Array.isArray((c as any).tags) ? [...(c as any).tags] : []
      if (tags.some((t) => t.trim().toLowerCase() === norm) || (c as any).folder?.trim().toLowerCase() === norm) {
        const newTags = tags.filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = (c as any).folder?.trim().toLowerCase() === norm ? null : (c as any).folder
        await canvasRepo.save({ ...c, tags: newTags, folder: newFolder } as any)
      }
    }

    // 4. Remover de desenhos
    const drawings = await drawingNoteRepo.getAll()
    for (const d of drawings) {
      const tags = Array.isArray(d.tags) ? [...d.tags] : []
      if (tags.some((t) => t.trim().toLowerCase() === norm) || d.folder?.trim().toLowerCase() === norm) {
        const newTags = tags.filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = d.folder?.trim().toLowerCase() === norm ? null : d.folder
        await drawingNoteRepo.save({ ...d, tags: newTags, folder: newFolder })
      }
    }

    // 5. Remover de links
    const links = await linkRepo.getAll()
    for (const l of links) {
      const tags = Array.isArray(l.tags) ? [...l.tags] : []
      if (tags.some((t) => t.trim().toLowerCase() === norm) || l.folder?.trim().toLowerCase() === norm) {
        const newTags = tags.filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = l.folder?.trim().toLowerCase() === norm ? null : l.folder
        await linkRepo.save({ ...l, tags: newTags, folder: newFolder })
      }
    }

    if (activeFolder.value === name) {
      activeFolder.value = null
    }

    await fetchAllWorkspaceData()
  }

  /**
   * Adiciona uma referência (tag) a um arquivo sem remover as existentes
   */
  const handleAddReferenceToFolder = async (payload: { itemId: string; toFolder: string }) => {
    const { itemId, toFolder } = payload
    const cleanFolder = toFolder.trim()
    if (!cleanFolder) return

    if (itemId.startsWith('note-')) {
      const rawId = itemId.replace(/^note-/, '')
      const note = await noteRepo.getById(rawId) || await noteRepo.getById(itemId)
      if (note) {
        const tags = Array.isArray(note.tags) ? [...note.tags] : []
        if (!tags.some((t) => t.trim().toLowerCase() === cleanFolder.toLowerCase())) {
          tags.push(cleanFolder)
          await noteRepo.save({ ...note, tags })
        }
      }
    } else if (itemId.startsWith('canvas-')) {
      const rawId = itemId.replace(/^canvas-/, '')
      const canvas = await canvasRepo.getById(rawId)
      if (canvas) {
        const tags = Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []
        if (!tags.some((t) => t.trim().toLowerCase() === cleanFolder.toLowerCase())) {
          tags.push(cleanFolder)
          await canvasRepo.save({ ...canvas, tags } as any)
        }
      }
    } else if (itemId.startsWith('drawing-')) {
      const rawId = itemId.replace(/^drawing-/, '')
      const drawing = await drawingNoteRepo.getById(rawId)
      if (drawing) {
        const tags = Array.isArray(drawing.tags) ? [...drawing.tags] : []
        if (!tags.some((t) => t.trim().toLowerCase() === cleanFolder.toLowerCase())) {
          tags.push(cleanFolder)
          await drawingNoteRepo.save({ ...drawing, tags })
        }
      }
    } else if (itemId.startsWith('link-')) {
      const rawId = itemId.replace(/^link-/, '')
      const link = await linkRepo.getById(rawId)
      if (link) {
        const tags = Array.isArray(link.tags) ? [...link.tags] : []
        if (!tags.some((t) => t.trim().toLowerCase() === cleanFolder.toLowerCase())) {
          tags.push(cleanFolder)
          await linkRepo.save({ ...link, tags })
        }
      }
    } else if (itemId.startsWith('book-')) {
      const rawId = Number(itemId.replace(/^book-/, ''))
      const book = await bookRepo.getById(rawId)
      if (book) {
        const themes = Array.isArray(book.themes) ? [...book.themes] : []
        if (!themes.some((t) => t.name.trim().toLowerCase() === cleanFolder.toLowerCase())) {
          themes.push({ id: Date.now(), name: cleanFolder, color: '#E57B55' })
          await bookRepo.save({ ...book, themes })
        }
      }
    }

    await fetchAllWorkspaceData()
  }

  /**
   * Move o item de uma pasta para outra (substitui fromFolder por toFolder)
   */
  const handleMoveItemToFolder = async (payload: { itemId: string; fromFolder: string; toFolder: string }) => {
    const { itemId, fromFolder, toFolder } = payload
    const fromNorm = fromFolder.trim().toLowerCase()
    const cleanTo = toFolder.trim()

    if (itemId.startsWith('note-')) {
      const rawId = itemId.replace(/^note-/, '')
      const note = await noteRepo.getById(rawId) || await noteRepo.getById(itemId)
      if (note) {
        const tags = (Array.isArray(note.tags) ? [...note.tags] : []).filter((t) => t.trim().toLowerCase() !== fromNorm)
        if (cleanTo && !tags.some((t) => t.trim().toLowerCase() === cleanTo.toLowerCase())) {
          tags.push(cleanTo)
        }
        await noteRepo.save({ ...note, tags, folder: cleanTo || null })
      }
    } else if (itemId.startsWith('canvas-')) {
      const rawId = itemId.replace(/^canvas-/, '')
      const canvas = await canvasRepo.getById(rawId)
      if (canvas) {
        const tags = (Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []).filter((t) => t.trim().toLowerCase() !== fromNorm)
        if (cleanTo && !tags.some((t) => t.trim().toLowerCase() === cleanTo.toLowerCase())) {
          tags.push(cleanTo)
        }
        await canvasRepo.save({ ...canvas, tags, folder: cleanTo || null } as any)
      }
    } else if (itemId.startsWith('drawing-')) {
      const rawId = itemId.replace(/^drawing-/, '')
      const drawing = await drawingNoteRepo.getById(rawId)
      if (drawing) {
        const tags = (Array.isArray(drawing.tags) ? [...drawing.tags] : []).filter((t) => t.trim().toLowerCase() !== fromNorm)
        if (cleanTo && !tags.some((t) => t.trim().toLowerCase() === cleanTo.toLowerCase())) {
          tags.push(cleanTo)
        }
        await drawingNoteRepo.save({ ...drawing, tags, folder: cleanTo || null })
      }
    } else if (itemId.startsWith('link-')) {
      const rawId = itemId.replace(/^link-/, '')
      const link = await linkRepo.getById(rawId)
      if (link) {
        const tags = (Array.isArray(link.tags) ? [...link.tags] : []).filter((t) => t.trim().toLowerCase() !== fromNorm)
        if (cleanTo && !tags.some((t) => t.trim().toLowerCase() === cleanTo.toLowerCase())) {
          tags.push(cleanTo)
        }
        await linkRepo.save({ ...link, tags, folder: cleanTo || null })
      }
    }

    await fetchAllWorkspaceData()
  }

  /**
   * Remove apenas a referência (tag) atual do item
   */
  const handleRemoveReferenceFromFolder = async (payload: { itemId: string; folder: string }) => {
    const { itemId, folder } = payload
    const norm = folder.trim().toLowerCase()

    if (itemId.startsWith('note-')) {
      const rawId = itemId.replace(/^note-/, '')
      const note = await noteRepo.getById(rawId) || await noteRepo.getById(itemId)
      if (note) {
        const tags = (Array.isArray(note.tags) ? [...note.tags] : []).filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = note.folder?.trim().toLowerCase() === norm ? null : note.folder
        await noteRepo.save({ ...note, tags, folder: newFolder })
      }
    } else if (itemId.startsWith('canvas-')) {
      const rawId = itemId.replace(/^canvas-/, '')
      const canvas = await canvasRepo.getById(rawId)
      if (canvas) {
        const tags = (Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []).filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = (canvas as any).folder?.trim().toLowerCase() === norm ? null : (canvas as any).folder
        await canvasRepo.save({ ...canvas, tags, folder: newFolder } as any)
      }
    } else if (itemId.startsWith('drawing-')) {
      const rawId = itemId.replace(/^drawing-/, '')
      const drawing = await drawingNoteRepo.getById(rawId)
      if (drawing) {
        const tags = (Array.isArray(drawing.tags) ? [...drawing.tags] : []).filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = drawing.folder?.trim().toLowerCase() === norm ? null : drawing.folder
        await drawingNoteRepo.save({ ...drawing, tags, folder: newFolder })
      }
    } else if (itemId.startsWith('link-')) {
      const rawId = itemId.replace(/^link-/, '')
      const link = await linkRepo.getById(rawId)
      if (link) {
        const tags = (Array.isArray(link.tags) ? [...link.tags] : []).filter((t) => t.trim().toLowerCase() !== norm)
        const newFolder = link.folder?.trim().toLowerCase() === norm ? null : link.folder
        await linkRepo.save({ ...link, tags, folder: newFolder })
      }
    } else if (itemId.startsWith('book-')) {
      const rawId = Number(itemId.replace(/^book-/, ''))
      const book = await bookRepo.getById(rawId)
      if (book) {
        const themes = (Array.isArray(book.themes) ? [...book.themes] : []).filter((t) => t.name.trim().toLowerCase() !== norm)
        await bookRepo.save({ ...book, themes })
      }
    }

    await fetchAllWorkspaceData()
  }

  /**
   * Exclui o item definitivamente de todo o sistema
   */
  const handleDeleteItemCompletely = async (itemId: string) => {
    if (itemId.startsWith('note-')) {
      const rawId = itemId.replace(/^note-/, '')
      await deleteNote(rawId)
    } else if (itemId.startsWith('canvas-')) {
      const rawId = itemId.replace(/^canvas-/, '')
      await canvasRepo.delete(rawId)
    } else if (itemId.startsWith('drawing-')) {
      const rawId = itemId.replace(/^drawing-/, '')
      await drawingNoteRepo.delete(rawId)
    } else if (itemId.startsWith('link-')) {
      const rawId = itemId.replace(/^link-/, '')
      await linkRepo.delete(rawId)
    } else if (itemId.startsWith('book-')) {
      const rawId = Number(itemId.replace(/^book-/, ''))
      await bookRepo.delete(rawId)
    }

    if (activeItemId.value === itemId) {
      activeItemId.value = null
    }

    await fetchAllWorkspaceData()
  }

  const handleOpenJournal = async () => {
    viewLayout.value = 'journal'
    const path = route.path || ''
    if (path !== '/diario' && path !== '/diário' && decodeURIComponent(path) !== '/diário') {
      await router?.push('/diario')
    }
  }

  return {
    isSidebarCollapsed,
    viewLayout,
    activeFolder,
    activeTag,
    activeItemId,
    graphSearchQuery,
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
    handleAddReferenceToFolder,
    handleMoveItemToFolder,
    handleRemoveReferenceFromFolder,
    handleDeleteItemCompletely,
    handleOpenJournal
  }
}
