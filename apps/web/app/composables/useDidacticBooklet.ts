import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { getApiBase } from '~/utils/apiBase'
import { getDatabase, dbManager } from '~/adapters/database/DatabaseManager'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { saveCachedBook, getCachedBook } from '~/utils/bookCache'
import { generateDidacticCoverDataUri } from '~/utils/cover'
import type { LocalDidacticBooklet } from '~/adapters/database/types'
import type { DidacticBookletData, DidacticChapterData } from '~/adapters/DidacticDocumentAdapter'

export interface DidacticChapterItem {
  id: string | number
  order_index: number
  title: string
  topic: string
  diagram_count: number
  created_at: string
  raw_markdown?: string
}

export interface DidacticBookletItem {
  id: string | number
  user_id: number
  book_id: number
  title: string
  description?: string
  created_at: string
  updated_at: string
  book?: {
    id: number
    title: string
    format_type: string
    is_ai_generated: boolean
  }
  chapters: DidacticChapterItem[]
}

const booklets = ref<DidacticBookletItem[]>([])
const currentBooklet = ref<DidacticBookletItem | null>(null)
const isLoading = ref(false)
const isGenerating = ref(false)
const error = ref<string | null>(null)

export const useDidacticBooklet = () => {
  const getHeaders = () => {
    const token = typeof useCookie === 'function' ? useCookie('aresta_token').value : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const fetchBooklets = async (themeId?: number) => {
    isLoading.value = true
    error.value = null
    try {
      const db = getDatabase()
      const localBooklets = await db.getDidacticBooklets({ themeId })

      const items: DidacticBookletItem[] = localBooklets.map((b) => ({
        id: b.id,
        user_id: 1,
        book_id: b.bookId || Number(b.id) || 1,
        title: b.title,
        description: b.topic,
        created_at: b.createdAt,
        updated_at: b.updated_at,
        book: {
          id: b.bookId || Number(b.id) || 1,
          title: b.title,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
        },
        chapters: [
          {
            id: `${b.id}-ch1`,
            order_index: 1,
            title: b.title,
            topic: b.topic,
            diagram_count: b.diagramCount,
            created_at: b.createdAt,
            raw_markdown: b.markdown || b.html,
          },
        ],
      }))

      booklets.value = items
      return booklets.value
    } catch (err: any) {
      console.warn('[useDidacticBooklet] Erro ao carregar livretos locais:', err)
      error.value = err.message || 'Erro desconhecido'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const loadBooklet = async (id: number | string) => {
    isLoading.value = true
    error.value = null
    try {
      const db = getDatabase()
      let localBooklet = await db.getDidacticBookletById(String(id))

      if (!localBooklet) {
        const all = await db.getDidacticBooklets()
        localBooklet = all.find((b) => String(b.bookId) === String(id) || String(b.id) === String(id)) || null
      }

      if (!localBooklet) {
        // Tentar obter dados diretamente do bookCache se existir
        const cached = await getCachedBook(id)
        if (cached && cached.type === 'didactic') {
          const decoder = new TextDecoder('utf-8')
          const jsonStr = decoder.decode(cached.arrayBuffer)
          try {
            const parsed = JSON.parse(jsonStr) as DidacticBookletData
            const item: DidacticBookletItem = {
              id: parsed.id || String(id),
              user_id: 1,
              book_id: Number(id) || 1,
              title: parsed.title,
              description: parsed.description,
              created_at: new Date(cached.savedAt).toISOString(),
              updated_at: new Date(cached.savedAt).toISOString(),
              book: {
                id: Number(id) || 1,
                title: parsed.title,
                format_type: 'DIDACTIC',
                is_ai_generated: true,
              },
              chapters: (parsed.chapters || []).map((ch) => ({
                id: ch.id || uuidv4(),
                order_index: ch.order_index,
                title: ch.title,
                topic: ch.topic || '',
                diagram_count: 0,
                created_at: new Date(cached.savedAt).toISOString(),
                raw_markdown: ch.raw_markdown,
              })),
            }
            currentBooklet.value = item
            return item
          } catch {}
        }
        throw new Error('Livreto didático não encontrado')
      }

      const item: DidacticBookletItem = {
        id: localBooklet.id,
        user_id: 1,
        book_id: localBooklet.bookId || Number(localBooklet.id) || 1,
        title: localBooklet.title,
        description: localBooklet.topic,
        created_at: localBooklet.createdAt,
        updated_at: localBooklet.updated_at,
        book: {
          id: localBooklet.bookId || Number(localBooklet.id) || 1,
          title: localBooklet.title,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
        },
        chapters: [
          {
            id: `${localBooklet.id}-ch1`,
            order_index: 1,
            title: localBooklet.title,
            topic: localBooklet.topic,
            diagram_count: localBooklet.diagramCount,
            created_at: localBooklet.createdAt,
            raw_markdown: localBooklet.markdown || localBooklet.html,
          },
        ],
      }
      currentBooklet.value = item
      return item
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar livreto'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createBooklet = async (payload: {
    title?: string
    topic: string
    theme_id?: number
    flashcard_id?: number
    annotation_id?: number
    parent_book_id?: number
    source_highlight?: string
    depth_level?: 'quick_summary' | 'standard' | 'deep_dive'
  }) => {
    isGenerating.value = true
    error.value = null
    try {
      const base = getApiBase()
      const aiPayload = {
        topic: payload.topic,
        depthLevel: payload.depth_level || 'standard',
        annotationQuote: payload.source_highlight,
        userLanguage: 'pt-BR',
      }

      const res = await fetch(`${base}/ai/didactic`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(aiPayload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao gerar livreto didático com IA')
      }

      const aiResult = await res.json()
      const bookletId = uuidv4()
      const numericBookId = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 900 + 100)
      const finalTitle = payload.title?.trim() || aiResult.title || payload.topic

      const coverUri = generateDidacticCoverDataUri({
        title: finalTitle,
        topic: payload.topic,
      })

      const chapter: DidacticChapterData = {
        id: `${bookletId}-ch1`,
        order_index: 1,
        title: aiResult.title || finalTitle,
        topic: payload.topic,
        raw_markdown: aiResult.markdown || aiResult.html,
      }

      const bookletData: DidacticBookletData = {
        id: bookletId,
        title: finalTitle,
        description: payload.topic,
        chapters: [chapter],
      }

      // 1. Salvar no cache binário de livros do leitor (IndexedDB / FS)
      const jsonStr = JSON.stringify(bookletData)
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(jsonStr).buffer
      await saveCachedBook(numericBookId, arrayBuffer, finalTitle, 'didactic')

      // 2. Salvar metadados do livro no repositório de livros (estante local)
      await bookRepo.save({
        id: numericBookId,
        bookId: numericBookId,
        title: finalTitle,
        author: 'Didactic AI Tutor',
        coverPath: coverUri,
        filePath: `virtual://didactic/${numericBookId}.json`,
        status: 'LENDO',
        currentPage: 1,
        lastAccessedAt: new Date().toISOString(),
        themes: payload.theme_id ? [{ id: payload.theme_id, name: '' }] : [],
      })

      // 3. Salvar registro na tabela de livretos didáticos do banco local
      const now = new Date().toISOString()
      const localBooklet: LocalDidacticBooklet = {
        id: bookletId,
        title: finalTitle,
        topic: payload.topic,
        html: aiResult.html,
        markdown: aiResult.markdown || aiResult.html,
        diagramCount: aiResult.diagramCount || 0,
        depthLevel: payload.depth_level || 'standard',
        bookId: numericBookId,
        themeId: payload.theme_id ?? null,
        createdAt: now,
        updated_at: now,
        sync_status: 'pending',
      }

      const db = getDatabase()
      await db.saveDidacticBooklet(localBooklet)
      await dbManager.recordMutation('didactic_booklet', bookletId, 'INSERT', localBooklet)

      const bookletItem: DidacticBookletItem = {
        id: bookletId,
        user_id: 1,
        book_id: numericBookId,
        title: finalTitle,
        description: payload.topic,
        created_at: now,
        updated_at: now,
        book: {
          id: numericBookId,
          title: finalTitle,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
        },
        chapters: [
          {
            id: chapter.id!,
            order_index: chapter.order_index,
            title: chapter.title,
            topic: chapter.topic || payload.topic,
            diagram_count: aiResult.diagramCount || 0,
            created_at: now,
            raw_markdown: chapter.raw_markdown,
          },
        ],
      }

      booklets.value.unshift(bookletItem)

      return {
        booklet: bookletItem,
        book: bookletItem.book,
      }
    } catch (err: any) {
      console.error('[useDidacticBooklet] Erro ao criar livreto:', err)
      error.value = err.message || 'Erro ao criar livreto'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  const appendChapter = async (
    targetBookIdOrBookletId: number | string,
    payload: {
      title?: string
      topic: string
      theme_id?: number
      flashcard_id?: number
      annotation_id?: number
      depth_level?: 'quick_summary' | 'standard' | 'deep_dive'
    }
  ) => {
    isGenerating.value = true
    error.value = null
    try {
      const base = getApiBase()
      const aiPayload = {
        topic: payload.topic,
        depthLevel: payload.depth_level || 'standard',
        userLanguage: 'pt-BR',
      }

      const res = await fetch(`${base}/ai/didactic`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(aiPayload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao anexar capítulo ao livreto')
      }

      const aiResult = await res.json()
      const db = getDatabase()
      const allBooklets = await db.getDidacticBooklets()
      let existingBooklet = allBooklets.find(
        (b) => String(b.bookId) === String(targetBookIdOrBookletId) || String(b.id) === String(targetBookIdOrBookletId)
      )

      // Carregar dados existentes do cache
      const numericId = Number(existingBooklet?.bookId || targetBookIdOrBookletId)
      const cached = await getCachedBook(numericId)
      let bookletData: DidacticBookletData

      if (cached && cached.type === 'didactic') {
        const decoder = new TextDecoder('utf-8')
        const jsonStr = decoder.decode(cached.arrayBuffer)
        bookletData = JSON.parse(jsonStr)
      } else {
        bookletData = {
          id: existingBooklet?.id || uuidv4(),
          title: existingBooklet?.title || payload.title || 'Livreto Didático',
          description: existingBooklet?.topic || payload.topic,
          chapters: [],
        }
      }

      const newOrderIndex = (bookletData.chapters?.length || 0) + 1
      const newChapterId = `${bookletData.id || uuidv4()}-ch${newOrderIndex}`
      const newChapter: DidacticChapterData = {
        id: newChapterId,
        order_index: newOrderIndex,
        title: payload.title?.trim() || aiResult.title || payload.topic,
        topic: payload.topic,
        raw_markdown: aiResult.markdown || aiResult.html,
      }

      bookletData.chapters.push(newChapter)

      // Salvar no cache binário de livros
      const jsonStr = JSON.stringify(bookletData)
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(jsonStr).buffer
      await saveCachedBook(numericId, arrayBuffer, bookletData.title, 'didactic')

      // Atualizar no banco local
      if (existingBooklet) {
        existingBooklet.updated_at = new Date().toISOString()
        existingBooklet.sync_status = 'pending'
        await db.saveDidacticBooklet(existingBooklet)
        await dbManager.recordMutation('didactic_booklet', existingBooklet.id, 'UPDATE', existingBooklet)
      }

      await fetchBooklets()

      return {
        booklet: bookletData,
        book: {
          id: numericId,
          title: bookletData.title,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
        },
      }
    } catch (err: any) {
      console.error('[useDidacticBooklet] Erro ao anexar capítulo:', err)
      error.value = err.message || 'Erro ao anexar capítulo'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  return {
    booklets,
    currentBooklet,
    isLoading,
    isGenerating,
    error,
    fetchBooklets,
    loadBooklet,
    createBooklet,
    appendChapter,
  }
}
