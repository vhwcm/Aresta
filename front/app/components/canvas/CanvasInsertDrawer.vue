<template>
  <div
    class="fixed inset-y-0 right-0 w-80 md:w-96 bg-bgPanel/95 border-l border-divider shadow-2xl backdrop-blur-xl z-50 flex flex-col transition-transform duration-300 ease-in-out select-none"
  >
    <!-- Drawer Header -->
    <div class="flex items-center justify-between p-4 border-b border-divider">
      <div class="flex items-center gap-2">
        <span class="text-lg">📚</span>
        <h3 class="font-semibold text-textPrimary text-sm md:text-base">Inserir no Canvas</h3>
      </div>
      <button
        class="p-1.5 rounded-lg hover:bg-bgElevated text-textSecondary hover:text-textPrimary transition-colors"
        @click="$emit('close')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tab Selector -->
    <div class="flex border-b border-divider px-4">
      <button
        class="flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors text-center"
        :class="activeTab === 'books' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'"
        @click="activeTab = 'books'"
      >
        Minha Estante
      </button>
      <button
        class="flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors text-center"
        :class="activeTab === 'quotes' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'"
        @click="activeTab = 'quotes'"
      >
        Anotações & Citações
      </button>
    </div>

    <!-- Search Input -->
    <div class="p-3 border-b border-divider">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-bgElevated border border-divider text-xs text-textPrimary focus:outline-none focus:border-primary placeholder:text-textSecondary/50 font-interface"
        />
        <svg
          class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </div>

    <!-- Content List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
      <!-- Books Tab -->
      <template v-if="activeTab === 'books'">
        <div
          v-for="book in filteredBooks"
          :key="book.bookId"
          class="flex items-center gap-3 p-2.5 rounded-xl border border-divider hover:border-primary/50 bg-bgSurface hover:bg-bgElevated cursor-pointer transition-all group"
          @click="$emit('insert-book', book)"
        >
          <!-- Cover -->
          <div class="w-10 h-14 rounded overflow-hidden bg-bgElevated flex-shrink-0 border border-divider">
            <img
              v-if="book.coverPath"
              :src="getCoverUrl(book.coverPath)"
              :alt="book.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-[10px] text-textSecondary/40">
              📖
            </div>
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-medium text-textPrimary line-clamp-1 group-hover:text-primary transition-colors">
              {{ book.title }}
            </h4>
            <span class="text-[10px] text-textSecondary uppercase tracking-wider">
              {{ book.status || 'QUERO_LER' }}
            </span>
          </div>
          <button class="p-1 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            + Inserir
          </button>
        </div>

        <div v-if="filteredBooks.length === 0" class="text-center py-8 text-xs text-textSecondary">
          Nenhum livro encontrado na estante.
        </div>
      </template>

      <!-- Quotes Tab -->
      <template v-else>
        <div
          v-for="annotation in filteredAnnotations"
          :key="annotation.id"
          class="p-3 rounded-xl border border-divider hover:border-primary/50 bg-bgSurface hover:bg-bgElevated cursor-pointer transition-all group space-y-1.5"
          @click="$emit('insert-annotation', annotation)"
        >
          <div class="flex items-center justify-between text-[10px] text-textSecondary">
            <span class="font-medium text-primary line-clamp-1">{{ annotation.bookTitle || 'Anotação' }}</span>
            <span>{{ annotation.chapterTitle || '' }}</span>
          </div>
          <p v-if="annotation.selectedText" class="text-xs text-textPrimary italic line-clamp-3 pl-2 border-l-2 border-primary/40">
            "{{ annotation.selectedText }}"
          </p>
          <p v-if="annotation.note" class="text-xs text-textSecondary line-clamp-2">
            {{ annotation.note }}
          </p>
        </div>

        <div v-if="filteredAnnotations.length === 0" class="text-center py-8 text-xs text-textSecondary">
          Nenhuma anotação encontrada.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserBooks } from '~/composables/useUserBooks';
import { useAnnotations } from '~/composables/useAnnotations';

defineEmits<{
  (e: 'close'): void;
  (e: 'insert-book', book: any): void;
  (e: 'insert-annotation', annotation: any): void;
}>();

const activeTab = ref<'books' | 'quotes'>('books');
const searchQuery = ref('');

const { userBooks, fetchUserBooks } = useUserBooks();
const { annotations, fetchAnnotations } = useAnnotations();

onMounted(async () => {
  await Promise.all([fetchUserBooks(), fetchAnnotations()]);
});

const getCoverUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `http://localhost:7070/${path}`;
};

const filteredBooks = computed(() => {
  if (!searchQuery.value) return userBooks.value;
  const q = searchQuery.value.toLowerCase();
  return userBooks.value.filter((b) => b.title?.toLowerCase().includes(q));
});

const filteredAnnotations = computed(() => {
  if (!searchQuery.value) return annotations.value;
  const q = searchQuery.value.toLowerCase();
  return annotations.value.filter(
    (a) =>
      a.selectedText?.toLowerCase().includes(q) ||
      a.note?.toLowerCase().includes(q) ||
      a.bookTitle?.toLowerCase().includes(q)
  );
});
</script>
