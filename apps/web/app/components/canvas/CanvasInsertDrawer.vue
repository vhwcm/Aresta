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
        :class="activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'"
        @click="activeTab = 'notes'"
      >
        Notas
      </button>
      <button
        class="flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors text-center"
        :class="activeTab === 'quotes' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'"
        @click="activeTab = 'quotes'"
      >
        Citações
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

      <!-- Notes Tab -->
      <template v-else-if="activeTab === 'notes'">
        <!-- New Note Action Button / Form -->
        <div class="mb-3">
          <button
            v-if="!showNewNoteForm"
            class="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            @click="showNewNoteForm = true"
          >
            <span class="text-sm">＋</span>
            <span>Criar Nova Nota</span>
          </button>

          <!-- Inline Create Note Form -->
          <div
            v-else
            class="p-3 rounded-xl bg-bgElevated border border-primary/40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-textPrimary flex items-center gap-1">
                <span>📝</span> Criar Nova Nota
              </span>
              <button
                class="text-xs text-textSecondary hover:text-textPrimary"
                @click="showNewNoteForm = false"
              >
                ✕
              </button>
            </div>

            <input
              v-model="newNoteTitle"
              type="text"
              placeholder="Título da nota *"
              class="w-full px-2.5 py-1.5 rounded-lg bg-bgSurface border border-divider text-xs text-textPrimary focus:outline-none focus:border-primary font-interface"
              @keydown.enter.prevent="handleCreateAndInsertNote"
            />

            <select
              v-model="newNoteFolder"
              class="w-full px-2.5 py-1.5 rounded-lg bg-bgSurface border border-divider text-xs text-textPrimary focus:outline-none focus:border-primary font-interface"
            >
              <option :value="null">Sem pasta (Geral)</option>
              <option v-for="f in folders" :key="f" :value="f">📁 {{ f }}</option>
            </select>

            <textarea
              v-model="newNoteContent"
              rows="3"
              placeholder="Conteúdo em Markdown... (Ctrl+Enter para salvar)"
              class="w-full px-2.5 py-1.5 rounded-lg bg-bgSurface border border-divider text-xs text-textPrimary focus:outline-none focus:border-primary font-interface resize-none placeholder:text-textSecondary/40 custom-scrollbar"
              @keydown.ctrl.enter.prevent="handleCreateAndInsertNote"
              @keydown.meta.enter.prevent="handleCreateAndInsertNote"
            ></textarea>

            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border border-divider text-[11px] text-textSecondary hover:text-textPrimary"
                @click="showNewNoteForm = false"
              >
                Cancelar
              </button>
              <button
                type="button"
                :disabled="isCreatingNote || !newNoteTitle.trim()"
                class="px-3 py-1 rounded-lg bg-primary hover:bg-primaryHover text-white text-[11px] font-semibold transition-all disabled:opacity-40 flex items-center gap-1 shadow-sm"
                @click="handleCreateAndInsertNote"
              >
                <span v-if="isCreatingNote">Criando...</span>
                <span v-else>Criar e Inserir</span>
              </button>
            </div>
          </div>
        </div>

        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="flex items-center gap-3 p-2.5 rounded-xl border border-divider hover:border-primary/50 bg-bgSurface hover:bg-bgElevated cursor-pointer transition-all group"
          @click="$emit('insert-note', note)"
        >
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm flex-shrink-0">
            📝
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-medium text-textPrimary line-clamp-1 group-hover:text-primary transition-colors">
              {{ note.title }}
            </h4>
            <span v-if="note.folder" class="text-[10px] text-textSecondary uppercase tracking-wider line-clamp-1">
              📁 {{ note.folder }}
            </span>
          </div>
          <button class="p-1 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs">
            + Inserir
          </button>
        </div>

        <div v-if="filteredNotes.length === 0 && !showNewNoteForm" class="text-center py-8 text-xs text-textSecondary">
          Nenhuma nota encontrada.
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
import { useAnnotations } from '~/composables/useAnnotations';
import { useNotes } from '~/composables/useNotes';
import { getCoverUrl as resolveCoverUrl } from '~/utils/cover';

const props = withDefaults(
  defineProps<{
    initialTab?: 'books' | 'notes' | 'quotes';
    openCreateNote?: boolean;
    canvasId?: string;
  }>(),
  {
    initialTab: 'books',
    openCreateNote: false,
  }
);

const emit = defineEmits<{
  (_e: 'close'): void;
  (_e: 'insert-book', _book: any): void;
  (_e: 'insert-note', _note: any): void;
  (_e: 'insert-annotation', _annotation: any): void;
}>();

const activeTab = ref<'books' | 'notes' | 'quotes'>(props.initialTab);
const searchQuery = ref('');
const showNewNoteForm = ref(props.openCreateNote);
const newNoteTitle = ref('');
const newNoteFolder = ref<string | null>(null);
const newNoteContent = ref('');
const isCreatingNote = ref(false);

const userBooks = ref<any[]>([]);
const { annotations, fetchAnnotations } = useAnnotations();
const { notesList, folders, fetchNotes, fetchFolders, createNote } = useNotes();

onMounted(async () => {
  await Promise.all([fetchNotes(), fetchAnnotations(), fetchFolders()]);
});

const handleCreateAndInsertNote = async () => {
  const title = newNoteTitle.value.trim();
  if (!title || isCreatingNote.value) return;

  isCreatingNote.value = true;
  const content = newNoteContent.value;
  const folder = newNoteFolder.value;

  try {
    const created = await createNote({
      title,
      content,
      folder,
      canvasId: props.canvasId,
    });
    newNoteTitle.value = '';
    newNoteContent.value = '';
    newNoteFolder.value = null;
    showNewNoteForm.value = false;
    emit('insert-note', created);
  } catch (err) {
    console.error('Erro ao criar nota:', err);
    // Fallback defensivo imediato
    const fallbackNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      folder,
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    newNoteTitle.value = '';
    newNoteContent.value = '';
    newNoteFolder.value = null;
    showNewNoteForm.value = false;
    emit('insert-note', fallbackNote);
  } finally {
    isCreatingNote.value = false;
  }
};

const getCoverUrl = (path: string) => {
  return resolveCoverUrl(path);
};

const filteredBooks = computed(() => {
  if (!searchQuery.value) return userBooks.value;
  const q = searchQuery.value.toLowerCase();
  return userBooks.value.filter((b) => b.title?.toLowerCase().includes(q));
});

const filteredNotes = computed(() => {
  if (!searchQuery.value) return notesList.value;
  const q = searchQuery.value.toLowerCase();
  return notesList.value.filter(
    (n) =>
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.folder?.toLowerCase().includes(q)
  );
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
