import { loadGraphMeta, saveGraphMeta, type GraphThemeRecord, type GraphEdgeRecord } from '~/utils/graphMeta'
import { getCanonicalThemeId, hashThemeNumeric, normalizeThemeName, parseNodeId } from '~/utils/themeIdentity'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { linkRepo } from '~/adapters/database/repositories/LinkRepository'

export class ThemeManagementService {
  /**
   * Cria ou reativa um tema com identidade determinística
   */
  static async createTheme(
    name: string,
    color = '#E57B55',
    description: string | null = null
  ): Promise<GraphThemeRecord> {
    const cleanName = name.trim()
    if (!cleanName) {
      throw new Error('Nome do tema não pode ser vazio')
    }
    if (cleanName.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    const normName = normalizeThemeName(cleanName)
    const numericId = hashThemeNumeric(cleanName)
    const meta = loadGraphMeta()

    const existingIndex = meta.themes.findIndex(
      (t) => normalizeThemeName(t.name) === normName || String(t.id) === String(numericId)
    )

    const now = Date.now()
    if (existingIndex !== -1) {
      const existing = meta.themes[existingIndex]!
      const updated: GraphThemeRecord = {
        ...existing,
        name: cleanName,
        color: color || existing.color || '#E57B55',
        description: description !== null ? description : existing.description,
        updated_at: now,
        deleted_at: null, // Desfaz tombstone caso estivesse deletado
      }
      meta.themes[existingIndex] = updated
      saveGraphMeta(meta)
      return updated
    }

    const newTheme: GraphThemeRecord = {
      id: numericId,
      name: cleanName,
      color,
      description,
      updated_at: now,
      deleted_at: null,
    }

    meta.themes.push(newTheme)
    saveGraphMeta(meta)
    return newTheme
  }

  /**
   * Renomeia e atualiza tema em cascata (graph_meta, livros, anotações, notas, quadros, desenhos, links)
   */
  static async renameTheme(
    oldNameOrId: string | number,
    newName: string,
    newColor?: string | null,
    newDescription?: string | null
  ): Promise<void> {
    const cleanNewName = newName.trim()
    if (!cleanNewName) {
      throw new Error('Novo nome do tema não pode ser vazio')
    }
    if (cleanNewName.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    const rawOld = String(oldNameOrId ?? '').trim()
    const normOld = normalizeThemeName(rawOld)
    const meta = loadGraphMeta()

    let targetTheme = meta.themes.find(
      (t) => normalizeThemeName(t.name) === normOld || String(t.id) === rawOld || String(t.id) === rawOld.replace(/^theme-/, '')
    )

    const oldName = targetTheme?.name || rawOld
    const normOldName = normalizeThemeName(oldName)
    const now = Date.now()

    // 1. Atualiza no graph_meta
    if (targetTheme) {
      targetTheme.name = cleanNewName
      if (newColor) targetTheme.color = newColor
      if (newDescription !== undefined && newDescription !== null) targetTheme.description = newDescription
      targetTheme.updated_at = now
      targetTheme.deleted_at = null
    } else {
      meta.themes.push({
        id: hashThemeNumeric(cleanNewName),
        name: cleanNewName,
        color: newColor || '#E57B55',
        description: newDescription || null,
        updated_at: now,
        deleted_at: null,
      })
    }
    saveGraphMeta(meta)

    // 2. Atualiza em Livros
    const books = await bookRepo.getAll().catch(() => [])
    for (const book of books) {
      const themes = book.themes || []
      let changed = false
      const newThemes = themes.map((t) => {
        if (normalizeThemeName(t.name) === normOldName || String(t.id) === rawOld) {
          changed = true
          return { ...t, name: cleanNewName, color: newColor || t.color }
        }
        return t
      })
      if (changed) {
        await bookRepo.save({ ...book, themes: newThemes })
      }
    }

    // 3. Atualiza em Anotações
    const annotations = await annotationRepo.getAll().catch(() => [])
    for (const anno of annotations) {
      const themes = anno.themes || []
      let changed = false
      const newThemes = themes.map((t) => {
        if (normalizeThemeName(t.name) === normOldName || String(t.id) === rawOld) {
          changed = true
          return { ...t, name: cleanNewName, color: newColor || t.color }
        }
        return t
      })
      if (changed) {
        await annotationRepo.save({ ...anno, themes: newThemes })
      }
    }

    // 4. Atualiza em Notas
    const notes = await noteRepo.getAll().catch(() => [])
    for (const note of notes) {
      const tags = Array.isArray(note.tags) ? [...note.tags] : []
      let changed = false
      const newTags = tags.map((tag) => {
        if (normalizeThemeName(tag) === normOldName) {
          changed = true
          return cleanNewName
        }
        return tag
      })
      const newFolder = note.folder && normalizeThemeName(note.folder) === normOldName ? cleanNewName : note.folder
      if (changed || newFolder !== note.folder) {
        await noteRepo.save({ ...note, tags: newTags, folder: newFolder })
      }
    }

    // 5. Atualiza em Quadros (Canvases)
    const canvases = await canvasRepo.getAll().catch(() => [])
    for (const canvas of canvases) {
      const tags = Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []
      let changed = false
      const newTags = tags.map((tag) => {
        if (normalizeThemeName(tag) === normOldName) {
          changed = true
          return cleanNewName
        }
        return tag
      })
      const newFolder = (canvas as any).folder && normalizeThemeName((canvas as any).folder) === normOldName ? cleanNewName : (canvas as any).folder
      if (changed || newFolder !== (canvas as any).folder) {
        await canvasRepo.save({ ...canvas, tags: newTags, folder: newFolder } as any)
      }
    }

    // 6. Atualiza em Desenhos
    const drawings = await drawingNoteRepo.getAll().catch(() => [])
    for (const d of drawings) {
      const tags = Array.isArray(d.tags) ? [...d.tags] : []
      let changed = false
      const newTags = tags.map((tag) => {
        if (normalizeThemeName(tag) === normOldName) {
          changed = true
          return cleanNewName
        }
        return tag
      })
      const newFolder = d.folder && normalizeThemeName(d.folder) === normOldName ? cleanNewName : d.folder
      if (changed || newFolder !== d.folder) {
        await drawingNoteRepo.save({ ...d, tags: newTags, folder: newFolder })
      }
    }

    // 7. Atualiza em Links
    const links = await linkRepo.getAll().catch(() => [])
    for (const l of links) {
      const tags = Array.isArray(l.tags) ? [...l.tags] : []
      let changed = false
      const newTags = tags.map((tag) => {
        if (normalizeThemeName(tag) === normOldName) {
          changed = true
          return cleanNewName
        }
        return tag
      })
      const newFolder = l.folder && normalizeThemeName(l.folder) === normOldName ? cleanNewName : l.folder
      if (changed || newFolder !== l.folder) {
        await linkRepo.save({ ...l, tags: newTags, folder: newFolder })
      }
    }
  }

  /**
   * Exclui tema e aplica tombstone em graph_meta e arestas, desvinculando de todas as entidades
   */
  static async deleteTheme(nameOrId: string | number): Promise<void> {
    const raw = String(nameOrId ?? '').trim()
    const norm = normalizeThemeName(raw)
    const meta = loadGraphMeta()
    const now = Date.now()

    let targetTheme = meta.themes.find(
      (t) => normalizeThemeName(t.name) === norm || String(t.id) === raw || String(t.id) === raw.replace(/^theme-/, '')
    )

    const themeName = targetTheme?.name || raw
    const normThemeName = normalizeThemeName(themeName)
    const themeId = targetTheme?.id || raw

    // 1. Aplica tombstone no tema e arestas associadas
    if (targetTheme) {
      targetTheme.deleted_at = now
      targetTheme.updated_at = now
    } else {
      meta.themes.push({
        id: hashThemeNumeric(themeName),
        name: themeName,
        color: '#E57B55',
        updated_at: now,
        deleted_at: now,
      })
    }

    for (const edge of meta.edges) {
      const s = String(edge.source)
      const t = String(edge.target)
      if (
        s === `theme-${themeId}` || t === `theme-${themeId}` ||
        s === `theme-${normThemeName}` || t === `theme-${normThemeName}` ||
        s === String(themeId) || t === String(themeId)
      ) {
        edge.deleted_at = now
        edge.updated_at = now
      }
    }
    saveGraphMeta(meta)

    // 2. Remove de Livros
    const books = await bookRepo.getAll().catch(() => [])
    for (const book of books) {
      const themes = book.themes || []
      if (themes.some((t) => normalizeThemeName(t.name) === normThemeName || String(t.id) === String(themeId))) {
        await bookRepo.save({
          ...book,
          themes: themes.filter((t) => normalizeThemeName(t.name) !== normThemeName && String(t.id) !== String(themeId)),
        })
      }
    }

    // 3. Remove de Anotações
    const annotations = await annotationRepo.getAll().catch(() => [])
    for (const anno of annotations) {
      const themes = anno.themes || []
      if (themes.some((t) => normalizeThemeName(t.name) === normThemeName || String(t.id) === String(themeId))) {
        await annotationRepo.save({
          ...anno,
          themes: themes.filter((t) => normalizeThemeName(t.name) !== normThemeName && String(t.id) !== String(themeId)),
        })
      }
    }

    // 4. Remove de Notas
    const notes = await noteRepo.getAll().catch(() => [])
    for (const note of notes) {
      const tags = Array.isArray(note.tags) ? [...note.tags] : []
      const hasTag = tags.some((t) => normalizeThemeName(t) === normThemeName)
      const hasFolder = note.folder && normalizeThemeName(note.folder) === normThemeName
      if (hasTag || hasFolder) {
        await noteRepo.save({
          ...note,
          tags: tags.filter((t) => normalizeThemeName(t) !== normThemeName),
          folder: hasFolder ? null : note.folder,
        })
      }
    }

    // 5. Remove de Quadros
    const canvases = await canvasRepo.getAll().catch(() => [])
    for (const canvas of canvases) {
      const tags = Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []
      const hasTag = tags.some((t) => normalizeThemeName(t) === normThemeName)
      const hasFolder = (canvas as any).folder && normalizeThemeName((canvas as any).folder) === normThemeName
      if (hasTag || hasFolder) {
        await canvasRepo.save({
          ...canvas,
          tags: tags.filter((t) => normalizeThemeName(t) !== normThemeName),
          folder: hasFolder ? null : (canvas as any).folder,
        } as any)
      }
    }

    // 6. Remove de Desenhos
    const drawings = await drawingNoteRepo.getAll().catch(() => [])
    for (const d of drawings) {
      const tags = Array.isArray(d.tags) ? [...d.tags] : []
      const hasTag = tags.some((t) => normalizeThemeName(t) === normThemeName)
      const hasFolder = d.folder && normalizeThemeName(d.folder) === normThemeName
      if (hasTag || hasFolder) {
        await drawingNoteRepo.save({
          ...d,
          tags: tags.filter((t) => normalizeThemeName(t) !== normThemeName),
          folder: hasFolder ? null : d.folder,
        })
      }
    }

    // 7. Remove de Links
    const links = await linkRepo.getAll().catch(() => [])
    for (const l of links) {
      const tags = Array.isArray(l.tags) ? [...l.tags] : []
      const hasTag = tags.some((t) => normalizeThemeName(t) === normThemeName)
      const hasFolder = l.folder && normalizeThemeName(l.folder) === normThemeName
      if (hasTag || hasFolder) {
        await linkRepo.save({
          ...l,
          tags: tags.filter((t) => normalizeThemeName(t) !== normThemeName),
          folder: hasFolder ? null : l.folder,
        })
      }
    }
  }

  /**
   * Conecta qualquer entidade a um tema/tag na fonte de verdade correspondente
   */
  static async linkEntityToTheme(
    entityNodeId: string | number,
    themeNodeIdOrName: string | number,
    color = '#E57B55'
  ): Promise<void> {
    const { type: entityType, rawId: entityRawId } = parseNodeId(entityNodeId)
    const rawTheme = String(themeNodeIdOrName).replace(/^theme-/, '')
    const meta = loadGraphMeta()
    const themeObj = meta.themes.find((t) => String(t.id) === rawTheme || normalizeThemeName(t.name) === normalizeThemeName(rawTheme))
    const themeName = (themeObj?.name || rawTheme).trim()

    if (!themeName) return

    // Garante que o tema existe no meta
    await this.createTheme(themeName, color)

    if (entityType === 'book') {
      const bookId = Number(entityRawId)
      const book = await bookRepo.getById(bookId)
      if (book) {
        const themes = [...(book.themes || [])]
        if (!themes.some((t) => normalizeThemeName(t.name) === normalizeThemeName(themeName))) {
          themes.push({ id: hashThemeNumeric(themeName), name: themeName, color })
          await bookRepo.save({ ...book, themes })
        }
      }
    } else if (entityType === 'annotation') {
      const annoId = Number(entityRawId)
      const anno = await annotationRepo.getById(annoId)
      if (anno) {
        const themes = [...(anno.themes || [])]
        if (!themes.some((t) => normalizeThemeName(t.name) === normalizeThemeName(themeName))) {
          themes.push({ id: hashThemeNumeric(themeName), name: themeName, color })
          await annotationRepo.save({ ...anno, themes })
        }
      }
    } else if (entityType === 'note') {
      const note = await noteRepo.getById(entityRawId) || await noteRepo.getById(String(entityNodeId))
      if (note) {
        const tags = Array.isArray(note.tags) ? [...note.tags] : []
        if (!tags.some((t) => normalizeThemeName(t) === normalizeThemeName(themeName))) {
          tags.push(themeName)
          await noteRepo.save({ ...note, tags })
        }
      }
    } else if (entityType === 'canvas') {
      const canvas = await canvasRepo.getById(entityRawId)
      if (canvas) {
        const tags = Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []
        if (!tags.some((t) => normalizeThemeName(t) === normalizeThemeName(themeName))) {
          tags.push(themeName)
          await canvasRepo.save({ ...canvas, tags } as any)
        }
      }
    } else if (entityType === 'drawing') {
      const drawing = await drawingNoteRepo.getById(entityRawId)
      if (drawing) {
        const tags = Array.isArray(drawing.tags) ? [...drawing.tags] : []
        if (!tags.some((t) => normalizeThemeName(t) === normalizeThemeName(themeName))) {
          tags.push(themeName)
          await drawingNoteRepo.save({ ...drawing, tags })
        }
      }
    } else if (entityType === 'link') {
      const link = await linkRepo.getById(entityRawId)
      if (link) {
        const tags = Array.isArray(link.tags) ? [...link.tags] : []
        if (!tags.some((t) => normalizeThemeName(t) === normalizeThemeName(themeName))) {
          tags.push(themeName)
          await linkRepo.save({ ...link, tags })
        }
      }
    }
  }

  /**
   * Desconecta qualquer entidade de um tema/tag na fonte de verdade correspondente
   */
  static async unlinkEntityFromTheme(
    entityNodeId: string | number,
    themeNodeIdOrName: string | number
  ): Promise<void> {
    const { type: entityType, rawId: entityRawId } = parseNodeId(entityNodeId)
    const rawTheme = String(themeNodeIdOrName).replace(/^theme-/, '')
    const meta = loadGraphMeta()
    const themeObj = meta.themes.find((t) => String(t.id) === rawTheme || normalizeThemeName(t.name) === normalizeThemeName(rawTheme))
    const themeName = (themeObj?.name || rawTheme).trim()
    const normTheme = normalizeThemeName(themeName)

    if (entityType === 'book') {
      const bookId = Number(entityRawId)
      const book = await bookRepo.getById(bookId)
      if (book) {
        await bookRepo.save({
          ...book,
          themes: (book.themes || []).filter((t) => normalizeThemeName(t.name) !== normTheme && String(t.id) !== rawTheme),
        })
      }
    } else if (entityType === 'annotation') {
      const annoId = Number(entityRawId)
      const anno = await annotationRepo.getById(annoId)
      if (anno) {
        await annotationRepo.save({
          ...anno,
          themes: (anno.themes || []).filter((t) => normalizeThemeName(t.name) !== normTheme && String(t.id) !== rawTheme),
        })
      }
    } else if (entityType === 'note') {
      const note = await noteRepo.getById(entityRawId) || await noteRepo.getById(String(entityNodeId))
      if (note) {
        await noteRepo.save({
          ...note,
          tags: (note.tags || []).filter((t) => normalizeThemeName(t) !== normTheme),
        })
      }
    } else if (entityType === 'canvas') {
      const canvas = await canvasRepo.getById(entityRawId)
      if (canvas) {
        await canvasRepo.save({
          ...canvas,
          tags: ((canvas as any).tags || []).filter((t: string) => normalizeThemeName(t) !== normTheme),
        } as any)
      }
    } else if (entityType === 'drawing') {
      const drawing = await drawingNoteRepo.getById(entityRawId)
      if (drawing) {
        await drawingNoteRepo.save({
          ...drawing,
          tags: (drawing.tags || []).filter((t) => normalizeThemeName(t) !== normTheme),
        })
      }
    } else if (entityType === 'link') {
      const link = await linkRepo.getById(entityRawId)
      if (link) {
        await linkRepo.save({
          ...link,
          tags: (link.tags || []).filter((t) => normalizeThemeName(t) !== normTheme),
        })
      }
    }
  }
}
