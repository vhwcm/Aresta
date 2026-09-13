<template>
  <Teleport to="body">
    <div
      v-if="isOpen && book"
      class="fixed inset-0 z-50 overflow-hidden"
    >
      <!-- Backdrop translúcido com clique para fechar -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        @click="$emit('close')"
      />

      <aside
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bgPanel border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        <!-- Cabeçalho do Livro -->
        <header class="p-6 border-b border-divider flex items-start justify-between shrink-0 bg-white/[0.02]">
          <div class="flex gap-4 items-center">
            <!-- Miniatura da Capa -->
            <div class="w-14 h-20 rounded-xl overflow-hidden bg-white/5 border border-divider shadow-md shrink-0 relative">
              <img
                v-if="book.coverPath"
                :src="getCoverUrl(book)"
                :alt="book.title || book.name"
                class="w-full h-full object-cover"
                @error="onCoverError"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-accent">
                <BookOpenIcon class="w-6 h-6" />
              </div>
            </div>

            <div class="flex flex-col">
              <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
                <BookIcon class="w-3 h-3" />
                <span>Livro da Biblioteca</span>
              </div>
              <h2 class="font-editorial text-xl font-light text-textPrimary leading-tight mt-0.5 line-clamp-2" :title="book.fullTitle || book.name">
                {{ book.fullTitle || book.name }}
              </h2>
              <p class="text-xs font-interface text-textSecondary mt-0.5">
                {{ book.author || 'Autor desconhecido' }}
              </p>
              <NuxtLink
                v-if="currentBookId"
                :to="`/reader?bookId=${currentBookId}`"
                class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md w-fit active:scale-95"
                title="Abrir livro no leitor"
              >
                <BookOpenIcon class="w-3.5 h-3.5" />
                <span>Continuar Leitura</span>
              </NuxtLink>
            </div>
          </div>

          <button
            @click="$emit('close')"
            class="p-2 rounded-full bg-white/5 border border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95 shrink-0"
            title="Fechar"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </header>

    <!-- Resumo do Livro se disponível -->
    <div v-if="book.summary" class="px-6 py-3 bg-white/[0.01] border-b border-divider text-xs text-textSecondary font-interface leading-relaxed">
      <span class="font-semibold text-textPrimary font-technical uppercase text-[9px] block mb-0.5">Resumo Curado por IA:</span>
      <p class="line-clamp-3 hover:line-clamp-none transition-all cursor-pointer" title="Clique para expandir">{{ book.summary }}</p>
    </div>

    <!-- Corpo com Anotações e Criação de Anotação Solta -->
    <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
      <!-- 1. Card para Criação de Anotação Solta -->
      <section class="p-4 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="font-interface text-xs uppercase tracking-wider font-semibold text-textPrimary flex items-center gap-1.5">
            <PlusCircleIcon class="w-4 h-4 text-accent" />
            <span>Criar Anotação Solta</span>
          </h3>
          <span class="text-[10px] text-textSecondary font-technical">Sem CFI (Nota Geral)</span>
        </div>

        <textarea
          v-model="newLooseNote"
          placeholder="Escreva sua reflexão, síntese ou insight sobre este livro..."
          rows="3"
          class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-all resize-none"
        ></textarea>

        <!-- Seleção de Temas do Livro -->
        <div v-if="availableThemes.length > 0" class="flex flex-col gap-1.5">
          <label class="text-[10px] font-technical uppercase tracking-wider text-textSecondary">
            Vincular a temas deste livro:
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in availableThemes"
              :key="t.id"
              type="button"
              @click="toggleThemeSelection(t.id)"
              class="px-2.5 py-1 rounded-lg text-[11px] font-technical transition-all border flex items-center gap-1"
              :class="selectedThemeIds.includes(t.id) ? 'bg-accent/20 border-accent text-accent font-bold' : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
            >
              <span>#{{ t.name }}</span>
            </button>
          </div>
        </div>

        <button
          @click="handleCreateLooseNote"
          :disabled="!newLooseNote.trim() || creatingNote"
          class="py-2 px-4 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
        >
          <SendIcon class="w-3.5 h-3.5" />
          <span>{{ creatingNote ? 'Salvando...' : 'Salvar Anotação Solta' }}</span>
        </button>
      </section>

      <!-- 2. Lista de Anotações do Livro -->
      <section class="flex flex-col gap-3">
        <h3 class="font-interface text-xs uppercase tracking-wider font-semibold text-textSecondary flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <QuoteIcon class="w-3.5 h-3.5 text-accent" />
            <span>Anotações deste livro ({{ annotations.length }})</span>
          </span>
        </h3>

        <!-- Loading Anotações -->
        <div v-if="loading" class="flex flex-col gap-3">
          <div v-for="i in 3" :key="i" class="h-20 rounded-2xl bg-white/5 animate-pulse border border-divider"></div>
        </div>

        <!-- Feed de Anotações -->
        <div v-else-if="annotations.length > 0" class="flex flex-col gap-3">
          <div
            v-for="anno in annotations"
            :key="anno.id"
            class="p-4 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2.5 transition-all hover:border-accent/40"
          >
            <!-- Badge de Tipo: Solta vs Leitor -->
            <div class="flex items-center justify-between text-[10px] text-textSecondary font-technical">
              <span v-if="anno.cfi && !anno.cfi.startsWith('note:')" class="text-accent font-semibold flex items-center gap-1">
                <BookmarkIcon class="w-3 h-3" />
                <span>{{ anno.chapterTitle || 'Destaque no Leitor' }}</span>
              </span>
              <span v-else class="text-amber-400 font-semibold flex items-center gap-1">
                <SparklesIcon class="w-3 h-3" />
                <span>{{ anno.chapterTitle || 'Anotação Solta' }}</span>
              </span>

              <span
                v-if="anno.color"
                class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                :style="{ backgroundColor: anno.color }"
                title="Cor do destaque"
              ></span>
            </div>

            <!-- Citação (Texto Selecionado / Marcado) -->
            <blockquote
              v-if="anno.selectedText"
              class="border-l-4 pl-3 py-1.5 text-xs italic font-serif text-textPrimary leading-relaxed bg-white/[0.02] rounded-r-lg"
              :style="{ borderLeftColor: anno.color || '#E57B55' }"
            >
              "<span v-html="renderInlineMarkdown(anno.selectedText)"></span>"
            </blockquote>

            <!-- Nota Pessoal -->
            <div v-if="anno.note" class="text-xs font-interface text-textPrimary leading-relaxed whitespace-pre-wrap">
              <span v-if="anno.selectedText" class="text-[10px] font-technical uppercase text-accent font-semibold block mb-0.5">Sua Nota:</span>
              <p v-html="renderInlineMarkdown(anno.note)"></p>
            </div>

            <!-- Fallback se não houver selectedText nem note -->
            <div v-if="!anno.selectedText && !anno.note" class="text-xs text-textSecondary italic">
              (Destaque sem texto adicional registrado)
            </div>

            <!-- Tags e Ação de Leitura -->
            <div class="flex items-center justify-between flex-wrap gap-1.5 pt-1">
              <div v-if="anno.themes && anno.themes.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="t in anno.themes"
                  :key="t.id"
                  class="px-2 py-0.5 rounded text-[9px] font-technical bg-white/5 border border-divider text-textSecondary"
                >
                  #{{ t.name }}
                </span>
              </div>
              <NuxtLink
                v-if="anno.cfi && currentBookId"
                :to="`/reader?bookId=${currentBookId}&cfi=${encodeURIComponent(anno.cfi)}`"
                class="text-accent hover:underline inline-flex items-center gap-1 text-[11px] font-technical ml-auto"
                title="Abrir trecho no leitor"
              >
                <BookOpenIcon class="w-3 h-3" />
                <span>Ver no texto</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-else class="p-6 rounded-2xl bg-white/[0.01] border border-divider text-center text-xs text-textSecondary">
          Nenhuma anotação registrada para este livro ainda.
        </div>
      </section>
    </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XIcon,
  BookOpenIcon,
  BookIcon,
  BookmarkIcon,
  PlusCircleIcon,
  SendIcon,
  QuoteIcon,
  SparklesIcon,
} from 'lucide-vue-next'
import type { GraphNode, AnnotationThemeItem, BookThemeItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { getCoverUrl as resolveCoverUrl } from '~/utils/cover'

const getApiBase = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.readerApiUrl) {
        return config.public.readerApiUrl
      }
      if (config?.public?.apiUrl) {
        return config.public.apiUrl
      }
    } catch {
      // fallback
    }
  }
  return 'http://localhost:3001'
}

const props = defineProps<{
  isOpen: boolean
  book: GraphNode | null
  allThemes?: BookThemeItem[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { fetchBookAnnotations, createLooseAnnotation } = useGraph()

const annotations = ref<any[]>([])
const loading = ref(false)
const newLooseNote = ref('')
const selectedThemeIds = ref<number[]>([])
const creatingNote = ref(false)
const availableThemes = ref<BookThemeItem[]>([])

const resolveBookId = (b: any): number | null => {
  if (!b) return null
  const candidates = [b.bookId, b.rawId, b.id]
  for (const c of candidates) {
    if (typeof c === 'number' && !isNaN(c) && c > 0) return c
    if (typeof c === 'string') {
      const clean = c.replace(/^book-/, '')
      const parsed = parseInt(clean, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return null
}

const currentBookId = computed(() => resolveBookId(props.book))

const getCoverUrl = (b: any) => {
  const id = resolveBookId(b)
  return resolveCoverUrl(b?.coverPath, id || undefined)
}

const onCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const normalizeAnnotation = (item: any) => {
  if (!item) return item
  let color = item.color || null
  if (!color && item.cfi && item.cfi.includes('#color=')) {
    const match = item.cfi.match(/#color=([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)
    if (match && match[1]) {
      color = `#${match[1]}`
    }
  }

  let chapterTitle = item.chapterTitle || item.chapter_title || null
  if (!chapterTitle && item.cfi) {
    const pageMatch = item.cfi.match(/page:(\d+)/)
    if (pageMatch && pageMatch[1]) {
      chapterTitle = `Página ${pageMatch[1]}`
    }
  }

  const selectedText = item.selectedText || item.selected_text || item.text || item.quote || null
  const note = item.note || item.comment || item.content || null

  return {
    id: Number(item.id),
    userId: item.userId ?? item.user_id ?? 0,
    bookId: Number(item.bookId ?? item.book_id ?? 0),
    cfi: item.cfi || null,
    selectedText,
    note,
    color,
    chapterTitle,
    themes: Array.isArray(item.themes)
      ? item.themes
      : (Array.isArray(item.annotationThemes) ? item.annotationThemes.map((at: any) => at.theme || at).filter(Boolean) : []),
    createdAt: item.createdAt || item.created_at || '',
  }
}

const loadBookData = async () => {
  const bookId = resolveBookId(props.book)
  if (!bookId) {
    annotations.value = []
    return
  }

  loading.value = true
  try {
    // 1. Carrega imediatamente do IndexedDB local (Offline / Local-First)
    let localNotes: any[] = []
    try {
      const local = await annotationRepo.getAll({ bookId })
      if (local && local.length > 0) {
        localNotes = local.map(normalizeAnnotation)
        annotations.value = localNotes
      }
    } catch (e) {
      console.warn('[BookAnnotationsDrawer] Erro ao carregar do banco local:', e)
    }

    // 2. Busca anotações sincronizadas da API
    try {
      const remote = await fetchBookAnnotations(bookId)
      if (Array.isArray(remote) && remote.length > 0) {
        const normalizedRemote = remote.map(normalizeAnnotation)
        // Combina anotações remotas com anotações locais que ainda não foram sincronizadas
        const merged = [...normalizedRemote]
        for (const loc of localNotes) {
          if (!merged.some((m: any) => Number(m.id) === Number(loc.id))) {
            merged.push(loc)
          }
        }
        annotations.value = merged
      } else if (localNotes.length > 0) {
        annotations.value = localNotes
      } else {
        annotations.value = []
      }
    } catch (e) {
      console.warn('[BookAnnotationsDrawer] Erro ao buscar da API:', e)
      if (localNotes.length > 0) {
        annotations.value = localNotes
      }
    }

    // 3. Buscar os temas que pertencem a este livro
    try {
      const res = await $fetch<any>(`${getApiBase()}/api/books/${bookId}`)
      availableThemes.value = res.themes || []
      selectedThemeIds.value = availableThemes.value.map((t: any) => t.id)
    } catch {
      availableThemes.value = []
    }
  } catch (e) {
    console.error('Erro ao carregar anotações do livro:', e)
  } finally {
    loading.value = false
  }
}

function toggleThemeSelection(themeId: number) {
  if (selectedThemeIds.value.includes(themeId)) {
    selectedThemeIds.value = selectedThemeIds.value.filter((id) => id !== themeId)
  } else {
    selectedThemeIds.value.push(themeId)
  }
}

async function handleCreateLooseNote() {
  const bookId = resolveBookId(props.book)
  if (!bookId || !newLooseNote.value.trim()) return

  creatingNote.value = true
  try {
    const created = await createLooseAnnotation(bookId, newLooseNote.value.trim(), selectedThemeIds.value)
    const noteObj = (created as any)?.annotation || created
    annotations.value.unshift(noteObj)
    newLooseNote.value = ''
    selectedThemeIds.value = []
  } catch (e) {
    console.error('Erro ao criar anotação solta:', e)
  } finally {
    creatingNote.value = false
  }
}

watch(
  () => [props.isOpen, props.book],
  () => {
    if (props.isOpen && props.book) {
      newLooseNote.value = ''
      selectedThemeIds.value = []
      loadBookData()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
