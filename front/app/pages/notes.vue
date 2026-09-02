<template>
  <div class="h-screen flex flex-col bg-bgRoot text-textPrimary overflow-hidden font-interface">
    <!-- Top Header -->
    <header class="h-14 border-b border-divider bg-bgPanel flex items-center justify-between px-4 z-20 flex-shrink-0">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span class="text-xl">📝</span>
          <span class="font-bold text-sm md:text-base tracking-tight text-textPrimary">Aresta Notes</span>
        </NuxtLink>
        <span class="text-divider">/</span>
        <span class="text-xs text-textSecondary">{{ activeNote ? activeNote.title : 'Todas as Notas' }}</span>
      </div>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/canvas"
          class="px-3 py-1.5 rounded-lg border border-divider hover:bg-bgElevated text-xs text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1.5"
        >
          <span>🎨</span>
          <span class="hidden sm:inline">Quadros Infinitos</span>
        </NuxtLink>
        <button
          class="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1"
          @click="createNewNote"
        >
          <span>+</span>
          <span>Nova Nota</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Notes Sidebar / List -->
      <aside class="w-72 md:w-80 border-r border-divider bg-bgPanel/50 flex flex-col flex-shrink-0">
        <!-- Search & Filter Bar -->
        <div class="p-3 border-b border-divider space-y-2">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar notas..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-bgElevated border border-divider text-xs text-textPrimary focus:outline-none focus:border-primary placeholder:text-textSecondary/50 font-interface"
              @input="onSearchChange"
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

        <!-- Notes List -->
        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div
            v-for="note in notesList"
            :key="note.id"
            class="p-3 rounded-xl border transition-all cursor-pointer select-none group"
            :class="activeNote?.id === note.id ? 'border-primary/60 bg-primary/10 shadow-sm' : 'border-divider hover:border-dividerHover bg-bgSurface hover:bg-bgElevated'"
            @click="selectNote(note)"
          >
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs font-semibold text-textPrimary line-clamp-1 group-hover:text-primary transition-colors">
                {{ note.title || 'Nota sem título' }}
              </h4>
              <span v-if="note.linksCount && note.linksCount > 0" class="text-[10px] text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                🔗 {{ note.linksCount }}
              </span>
            </div>
            <p class="text-[11px] text-textSecondary line-clamp-2 leading-relaxed">
              {{ note.content || 'Sem conteúdo adicional.' }}
            </p>
            <div class="mt-2 flex items-center justify-between text-[10px] text-textSecondary/70">
              <span>{{ note.folder || 'Geral' }}</span>
              <span>{{ formatTime(note.updatedAt) }}</span>
            </div>
          </div>

          <div v-if="notesList.length === 0 && !isLoading" class="text-center py-12 text-xs text-textSecondary">
            Nenhuma nota encontrada.
          </div>
        </div>
      </aside>

      <!-- Note Editor / Preview Pane -->
      <main v-if="activeNote" class="flex-1 flex flex-col bg-bgDarker overflow-hidden">
        <!-- Editor Toolbar -->
        <div class="h-12 border-b border-divider bg-bgPanel flex items-center justify-between px-6 flex-shrink-0">
          <input
            v-model="activeNote.title"
            type="text"
            placeholder="Título da nota..."
            class="bg-transparent border-none text-base font-semibold text-textPrimary focus:outline-none flex-1 font-serif mr-4"
            @input="scheduleSave"
          />

          <div class="flex items-center gap-2">
            <!-- Mode Toggle (Edit / Preview) -->
            <div class="flex rounded-lg bg-bgElevated p-0.5 border border-divider text-xs">
              <button
                class="px-2.5 py-1 rounded-md transition-colors"
                :class="viewMode === 'split' ? 'bg-primary text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
                @click="viewMode = 'split'"
              >
                Dividido
              </button>
              <button
                class="px-2.5 py-1 rounded-md transition-colors"
                :class="viewMode === 'edit' ? 'bg-primary text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
                @click="viewMode = 'edit'"
              >
                Editor
              </button>
              <button
                class="px-2.5 py-1 rounded-md transition-colors"
                :class="viewMode === 'preview' ? 'bg-primary text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
                @click="viewMode = 'preview'"
              >
                Preview
              </button>
            </div>

            <!-- Quick Embed Buttons -->
            <button
              class="px-2 py-1 rounded bg-bgElevated hover:bg-bgSurface text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors"
              title="Inserir Embed de Canvas"
              @click="openCanvasPicker"
            >
              + 🎨 Canvas
            </button>

            <!-- Delete Note Button -->
            <button
              class="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors"
              title="Excluir Nota"
              @click="handleDeleteNote"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Editor & Preview Body -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Textarea (Editor) -->
          <div
            v-if="viewMode === 'edit' || viewMode === 'split'"
            class="flex-1 border-r border-divider/60 p-6 overflow-y-auto bg-bgSurface/40"
          >
            <textarea
              v-model="activeNote.content"
              placeholder="Escreva sua anotação em Markdown... Use ![[canvas:id]] para embutir um canvas."
              class="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed text-textPrimary font-mono placeholder:text-textSecondary/40"
              @input="scheduleSave"
            ></textarea>
          </div>

          <!-- Live Preview (Composite Renderer) -->
          <div
            v-if="viewMode === 'preview' || viewMode === 'split'"
            class="flex-1 p-6 overflow-y-auto bg-bgDarker"
          >
            <NoteCompositeRenderer
              :content="activeNote.content"
              :note-id="activeNote.id"
              :note-title="activeNote.title"
            />
          </div>
        </div>
      </main>

      <!-- Empty State when no note is selected -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bgDarker select-none">
        <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-4">
          📝
        </div>
        <h3 class="text-base font-semibold text-textPrimary">Nenhuma nota selecionada</h3>
        <p class="text-xs text-textSecondary mt-1 max-w-sm">
          Selecione uma nota da lista ao lado ou crie uma nova anotação para começar.
        </p>
        <button
          class="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-semibold shadow-md transition-all"
          @click="createNewNote"
        >
          + Criar Nota
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNotes } from '~/composables/useNotes';
import { useCanvas } from '~/composables/useCanvas';
import type { NoteItem } from '~/interfaces/note';
import NoteCompositeRenderer from '~/components/notes/NoteCompositeRenderer.vue';

const route = useRoute();
const { notesList, isLoading, fetchNotes, createNote, updateNote, deleteNote, loadNote } = useNotes();
const { fetchCanvases, canvasesList } = useCanvas();

const activeNote = ref<NoteItem | null>(null);
const searchQuery = ref('');
const viewMode = ref<'split' | 'edit' | 'preview'>('split');
let saveTimeout: any = null;

onMounted(async () => {
  await Promise.all([fetchNotes(), fetchCanvases()]);

  if (route.query.id && typeof route.query.id === 'string') {
    const note = await loadNote(route.query.id);
    if (note) activeNote.value = note;
  } else if (notesList.value.length > 0) {
    activeNote.value = notesList.value[0] || null;
  }
});

const selectNote = (note: NoteItem) => {
  activeNote.value = { ...note };
};

const createNewNote = async () => {
  const created = await createNote({
    title: 'Nova Nota',
    content: '# Nova Anotação\n\nComece a digitar seu pensamento aqui...',
  });
  if (created) {
    activeNote.value = created;
  }
};

const scheduleSave = () => {
  if (!activeNote.value) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (activeNote.value) {
      await updateNote(activeNote.value.id, {
        title: activeNote.value.title,
        content: activeNote.value.content,
      });
    }
  }, 600);
};

const handleDeleteNote = async () => {
  if (!activeNote.value) return;
  if (confirm('Tem certeza que deseja excluir esta nota?')) {
    await deleteNote(activeNote.value.id);
    activeNote.value = notesList.value[0] || null;
  }
};

const openCanvasPicker = () => {
  if (!activeNote.value) return;
  if (canvasesList.value.length === 0) {
    alert('Nenhum canvas encontrado. Crie um quadro na página /canvas primeiro!');
    return;
  }
  const canvas = canvasesList.value[0];
  if (canvas) {
    activeNote.value.content += `\n\n![[canvas:${canvas.id}]]\n`;
    scheduleSave();
  }
};

const onSearchChange = () => {
  fetchNotes({ search: searchQuery.value });
};

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};
</script>
