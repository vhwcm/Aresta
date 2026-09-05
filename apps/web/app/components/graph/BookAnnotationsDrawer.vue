<template>
  <div
    v-if="isOpen && book"
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
            class="p-4 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2"
          >
            <!-- Badge de Tipo: Solta vs Leitor -->
            <div class="flex items-center justify-between text-[10px] text-textSecondary font-technical">
              <span v-if="anno.cfi" class="text-accent font-semibold flex items-center gap-1">
                <BookmarkIcon class="w-3 h-3" />
                <span>{{ anno.chapterTitle || 'Destaque no Leitor' }}</span>
              </span>
              <span v-else class="text-amber-400 font-semibold flex items-center gap-1">
                <SparklesIcon class="w-3 h-3" />
                <span>Anotação Solta</span>
              </span>
            </div>

            <!-- Citação -->
            <blockquote
              v-if="anno.selectedText"
              class="border-l-2 border-accent/60 pl-2.5 text-xs italic font-serif text-textPrimary/90"
            >
              "{{ anno.selectedText }}"
            </blockquote>

            <!-- Nota -->
            <p v-if="anno.note" class="text-xs font-interface text-textPrimary">
              {{ anno.note }}
            </p>

            <!-- Tags -->
            <div v-if="anno.themes && anno.themes.length > 0" class="flex flex-wrap gap-1 pt-1">
              <span
                v-for="t in anno.themes"
                :key="t.id"
                class="px-2 py-0.5 rounded text-[9px] font-technical bg-white/5 border border-divider text-textSecondary"
              >
                #{{ t.name }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="p-6 rounded-2xl bg-white/[0.01] border border-divider text-center text-xs text-textSecondary">
          Nenhuma anotação registrada para este livro ainda.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const props = defineProps<{
  isOpen: boolean
  book: GraphNode | null
  allThemes?: BookThemeItem[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { fetchBookAnnotations, createLooseAnnotation } = useGraph()

const annotations = ref<AnnotationThemeItem[]>([])
const loading = ref(false)
const newLooseNote = ref('')
const selectedThemeIds = ref<number[]>([])
const creatingNote = ref(false)
const availableThemes = ref<BookThemeItem[]>([])

const API_BASE = 'http://localhost:7070'

const getCoverUrl = (b: any) => {
  if (b.coverPath?.startsWith('http')) return b.coverPath
  return `${API_BASE}/api/books/${b.rawId || b.id}/cover`
}

const onCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const loadBookData = async () => {
  if (!props.book) return
  const bookId = props.book.rawId || (typeof props.book.id === 'number' ? props.book.id : parseInt(String(props.book.id).replace('book-', ''), 10))
  if (!bookId) return

  loading.value = true
  try {
    annotations.value = await fetchBookAnnotations(bookId)

    // Buscar os temas que pertencem a este livro
    const res = await $fetch<any>(`${API_BASE}/api/books/${bookId}`)
    availableThemes.value = res.themes || []
    selectedThemeIds.value = availableThemes.value.map((t: any) => t.id)
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
  if (!props.book || !newLooseNote.value.trim()) return
  const bookId = props.book.rawId || (typeof props.book.id === 'number' ? props.book.id : parseInt(String(props.book.id).replace('book-', ''), 10))
  if (!bookId) return

  creatingNote.value = true
  try {
    const created = await createLooseAnnotation(bookId, newLooseNote.value.trim(), selectedThemeIds.value)
    annotations.value.unshift(created)
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
