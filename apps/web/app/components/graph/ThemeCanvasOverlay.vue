<template>
  <div
    v-if="isOpen && theme"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200"
  >
    <!-- Backdrop suave sem blur pesado -->
    <div
      class="absolute inset-0 bg-black/40 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Container do Canvas Modal 100% Nítido e Sólido -->
    <div
      class="relative w-full max-w-4xl max-h-[90vh] bg-bgPanel border border-divider rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho do Tema -->
      <header class="p-6 border-b border-divider flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 rounded-full shadow-md"
            :style="{ backgroundColor: theme.color || '#E57B55' }"
          ></span>
          <div>
            <div class="font-technical text-[10px] uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
              <span>Tema do Conhecimento</span>
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary leading-tight">
              {{ theme.name }}
            </h2>
          </div>
        </div>

        <button
          @click="$emit('close')"
          class="p-2.5 rounded-full bg-white/5 border border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95"
          title="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </header>

      <!-- Corpo com Scroll -->
      <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
        <!-- 1. Carrossel Horizontal de Livros no Topo -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="font-interface text-xs uppercase tracking-wider font-semibold text-textSecondary flex items-center gap-2">
              <BookOpenIcon class="w-4 h-4 text-accent" />
              <span>Livros com este tema ({{ books.length }})</span>
            </h3>
            <span class="text-[11px] text-textSecondary font-technical">Clique para filtrar anotações</span>
          </div>

          <!-- Loading Livros -->
          <div v-if="loadingBooks" class="flex gap-4 overflow-x-auto py-2">
            <div
              v-for="i in 3"
              :key="i"
              class="w-28 h-40 rounded-2xl bg-white/5 animate-pulse shrink-0 border border-divider"
            ></div>
          </div>

          <!-- Carrossel com Scroll Horizontal -->
          <div
            v-else-if="books.length > 0"
            class="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar snap-x"
          >
            <div
              v-for="book in books"
              :key="book.id"
              @click="handleBookClick(book)"
              class="group flex flex-col w-32 shrink-0 rounded-2xl p-2 bg-white/[0.02] hover:bg-white/[0.06] border transition-all cursor-pointer snap-start"
              :class="selectedBookId === book.id ? 'border-accent ring-2 ring-accent/30 bg-accent/10' : 'border-divider hover:border-divider/80'"
            >
              <!-- Capa -->
              <div class="w-full aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-divider/50 mb-2 relative shadow-md">
                <img
                  v-if="book.coverPath"
                  :src="getCoverUrl(book)"
                  :alt="book.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  @error="onCoverError"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center p-2 text-center text-textSecondary">
                  <BookIcon class="w-6 h-6 mb-1 text-accent opacity-70" />
                  <span class="text-[9px] font-technical font-semibold line-clamp-2">{{ book.title }}</span>
                </div>
              </div>

              <!-- Título & Autor -->
              <h4 class="font-interface text-xs font-semibold text-textPrimary truncate group-hover:text-accent transition-colors" :title="book.title">
                {{ book.title }}
              </h4>
              <p class="font-interface text-[10px] text-textSecondary truncate mt-0.5">
                {{ book.author || 'Autor desconhecido' }}
              </p>
            </div>
          </div>

          <div v-else class="p-6 rounded-2xl bg-white/[0.01] border border-divider text-center text-xs text-textSecondary">
            Nenhum livro vinculado a este tema no momento.
          </div>
        </section>

        <div class="h-px bg-divider w-full"></div>

        <!-- 2. Lista Vertical de Anotações do Tema -->
        <section class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="font-interface text-xs uppercase tracking-wider font-semibold text-textSecondary flex items-center gap-2">
              <QuoteIcon class="w-4 h-4 text-accent" />
              <span>Anotações & Citações ({{ filteredAnnotations.length }})</span>
            </h3>

            <button
              v-if="selectedBookId"
              @click="selectedBookId = null"
              class="text-[11px] font-technical text-accent hover:underline flex items-center gap-1"
            >
              <span>Remover filtro de livro</span>
              <XIcon class="w-3 h-3" />
            </button>
          </div>

          <!-- Loading Anotações -->
          <div v-if="loadingAnnotations" class="flex flex-col gap-3">
            <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-white/5 animate-pulse border border-divider"></div>
          </div>

          <!-- Feed de Anotações -->
          <div v-else-if="filteredAnnotations.length > 0" class="flex flex-col gap-3.5">
            <div
              v-for="anno in filteredAnnotations"
              :key="anno.id"
              class="p-5 rounded-2xl bg-white/[0.02] border border-divider hover:border-divider/80 transition-all flex flex-col gap-3"
            >
              <!-- Origem do Livro -->
              <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-b border-divider/40 pb-2">
                <span class="flex items-center gap-1.5 text-textPrimary font-semibold">
                  <BookOpenIcon class="w-3.5 h-3.5 text-accent" />
                  {{ anno.bookTitle || 'Livro' }}
                </span>
                <span v-if="anno.chapterTitle" class="truncate max-w-[200px]">{{ anno.chapterTitle }}</span>
              </div>

              <!-- Trecho Selecionado -->
              <blockquote
                v-if="anno.selectedText"
                class="border-l-2 border-accent pl-3 text-xs italic font-serif text-textPrimary/90 leading-relaxed"
              >
                "{{ anno.selectedText }}"
              </blockquote>

              <!-- Nota Pessoal -->
              <p v-if="anno.note" class="text-xs font-interface text-textPrimary leading-relaxed">
                {{ anno.note }}
              </p>

              <!-- Tags de Tema da Anotação -->
              <div v-if="anno.themes && anno.themes.length > 0" class="flex flex-wrap gap-1.5 pt-1">
                <span
                  v-for="t in anno.themes"
                  :key="t.id"
                  class="px-2 py-0.5 rounded-md text-[10px] font-technical font-semibold bg-white/5 border border-divider text-textSecondary"
                  :style="{ color: t.color }"
                >
                  #{{ t.name }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="p-8 rounded-2xl bg-white/[0.01] border border-divider text-center text-xs text-textSecondary">
            Nenhuma anotação vinculada a este tema ainda.
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, BookOpenIcon, BookIcon, QuoteIcon } from 'lucide-vue-next'
import type { GraphNode, BookItem, AnnotationThemeItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'

const props = defineProps<{
  isOpen: boolean
  theme: GraphNode | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selectBook', book: BookItem): void
}>()

const { fetchThemeBooks, fetchThemeAnnotations } = useGraph()

const books = ref<BookItem[]>([])
const annotations = ref<AnnotationThemeItem[]>([])
const loadingBooks = ref(false)
const loadingAnnotations = ref(false)
const selectedBookId = ref<number | null>(null)

const API_BASE = 'http://localhost:7070'

const getCoverUrl = (book: BookItem) => {
  if (book.coverPath?.startsWith('http')) return book.coverPath
  return `${API_BASE}/api/books/${book.id}/cover`
}

const onCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const filteredAnnotations = computed(() => {
  if (!selectedBookId.value) return annotations.value
  return annotations.value.filter((a) => a.bookId === selectedBookId.value)
})

const loadThemeData = async () => {
  if (!props.theme || !props.theme.rawId) return

  selectedBookId.value = null
  loadingBooks.value = true
  loadingAnnotations.value = true

  try {
    const [fetchedBooks, fetchedAnnotations] = await Promise.all([
      fetchThemeBooks(props.theme.rawId),
      fetchThemeAnnotations(props.theme.rawId),
    ])
    books.value = fetchedBooks
    annotations.value = fetchedAnnotations
  } finally {
    loadingBooks.value = false
    loadingAnnotations.value = false
  }
}

function handleBookClick(book: BookItem) {
  if (selectedBookId.value === book.id) {
    // Se clicar de novo, emite evento para abrir o drawer do livro
    emit('selectBook', book)
  } else {
    selectedBookId.value = book.id
  }
}

watch(
  () => [props.isOpen, props.theme],
  () => {
    if (props.isOpen && props.theme) {
      loadThemeData()
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
