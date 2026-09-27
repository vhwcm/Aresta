import { getDatabase } from '../DatabaseManager'
import { loadGraphMeta, saveGraphMeta } from '~/utils/graphMeta'

/**
 * Migra dados legados onde 'folder' era um campo exclusivo para a taxonomia unificada de 'tags'.
 * Idempotente: pode ser executada em todo boot sem risco de duplicar tags.
 */
export async function runFolderToTagsMigration(): Promise<{
  notesMigrated: number
  canvasesMigrated: number
  drawingsMigrated: number
  linksMigrated: number
  booksMigrated: number
}> {
  const db = getDatabase()
  let notesMigrated = 0
  let canvasesMigrated = 0
  let drawingsMigrated = 0
  let linksMigrated = 0
  let booksMigrated = 0

  try {
    // 1. Notas
    const notes = await db.getNotes().catch(() => [])
    for (const note of notes) {
      let modified = false
      const tags = Array.isArray(note.tags) ? [...note.tags] : []
      if (note.folder && typeof note.folder === 'string' && note.folder.trim()) {
        const folderTag = note.folder.trim()
        if (!tags.includes(folderTag)) {
          tags.push(folderTag)
          modified = true
        }
      }
      if (modified) {
        await db.saveNote({
          ...note,
          tags,
          updated_at: new Date().toISOString()
        })
        notesMigrated++
      }
    }

    // 2. Canvases
    const canvases = await db.getCanvases().catch(() => [])
    for (const canvas of canvases) {
      let modified = false
      const tags = Array.isArray((canvas as any).tags) ? [...(canvas as any).tags] : []
      const folder = (canvas as any).folder
      if (folder && typeof folder === 'string' && folder.trim()) {
        const folderTag = folder.trim()
        if (!tags.includes(folderTag)) {
          tags.push(folderTag)
          modified = true
        }
      }
      if (modified) {
        await db.saveCanvas({
          ...canvas,
          tags,
          updated_at: new Date().toISOString()
        } as any)
        canvasesMigrated++
      }
    }

    // 3. Desenhos (Drawing Notes)
    const drawings = await db.getDrawingNotes().catch(() => [])
    for (const drawing of drawings) {
      let modified = false
      const tags = Array.isArray(drawing.tags) ? [...drawing.tags] : []
      if (drawing.folder && typeof drawing.folder === 'string' && drawing.folder.trim()) {
        const folderTag = drawing.folder.trim()
        if (!tags.includes(folderTag)) {
          tags.push(folderTag)
          modified = true
        }
      }
      if (modified) {
        await db.saveDrawingNote({
          ...drawing,
          tags,
          updated_at: new Date().toISOString()
        })
        drawingsMigrated++
      }
    }

    // 4. Links
    const links = await db.getLinks().catch(() => [])
    for (const link of links) {
      let modified = false
      const tags = Array.isArray(link.tags) ? [...link.tags] : []
      if (link.folder && typeof link.folder === 'string' && link.folder.trim()) {
        const folderTag = link.folder.trim()
        if (!tags.includes(folderTag)) {
          tags.push(folderTag)
          modified = true
        }
      }
      if (modified) {
        await db.saveLink({
          ...link,
          tags,
          updated_at: new Date().toISOString()
        })
        linksMigrated++
      }
    }

    // 5. Garantir que todas as pastas migradas também constem como temas no graphMeta
    const meta = loadGraphMeta()
    const existingThemeNames = new Set(
      (meta.themes || []).map((t) => (t.name || '').trim().toLowerCase())
    )
    let metaChanged = false

    const allNewFolderTags = new Set<string>()
    for (const n of notes) {
      if (n.folder?.trim()) allNewFolderTags.add(n.folder.trim())
    }
    for (const c of canvases) {
      if ((c as any).folder?.trim()) allNewFolderTags.add((c as any).folder.trim())
    }
    for (const d of drawings) {
      if (d.folder?.trim()) allNewFolderTags.add(d.folder.trim())
    }
    for (const l of links) {
      if (l.folder?.trim()) allNewFolderTags.add(l.folder.trim())
    }

    for (const tagName of allNewFolderTags) {
      if (!existingThemeNames.has(tagName.toLowerCase())) {
        existingThemeNames.add(tagName.toLowerCase())
        meta.themes.push({
          id: Math.abs(hashCode(tagName)),
          name: tagName,
          color: '#E57B55',
          description: null
        })
        metaChanged = true
      }
    }

    if (metaChanged) {
      saveGraphMeta(meta)
    }

  } catch (err) {
    console.warn('[FolderToTagsMigration] Falha parcial na migração:', err)
  }

  return {
    notesMigrated,
    canvasesMigrated,
    drawingsMigrated,
    linksMigrated,
    booksMigrated
  }
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
