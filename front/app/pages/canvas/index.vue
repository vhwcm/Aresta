<template>
  <div class="h-full w-full flex flex-col overflow-y-auto bg-bgRoot text-textPrimary p-6 md:p-10 custom-scrollbar select-none">
    <div class="max-w-6xl w-full mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-divider pb-6">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🎨</span>
            <h1 class="text-2xl md:text-3xl font-bold font-serif tracking-tight">Quadros & Anotações Livres</h1>
          </div>
          <p class="text-sm text-textSecondary mt-1">
            Quadros brancos infinitos estilo Obsidian Canvas com escrita manual e transcrição IA.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <!-- Hidden File Input for .canvas Import -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".canvas,.json"
            class="hidden"
            @change="handleFileImport"
          />

          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bgPanel hover:bg-black/5 dark:hover:bg-white/5 text-textPrimary border border-divider text-xs md:text-sm font-medium font-interface transition-all shadow-sm cursor-pointer"
            @click="triggerImport"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Importar .canvas</span>
          </button>

          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs md:text-sm font-semibold font-interface transition-all shadow-lg shadow-accent/20 hover:scale-102 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            :disabled="isCreating"
            @click="handleCreateCanvas"
          >
            <svg
              v-if="isCreating"
              class="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{{ isCreating ? 'Criando...' : 'Novo Quadro' }}</span>
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex items-center justify-between gap-4">
        <div class="relative w-full max-w-sm">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquisar quadros..."
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-bgPanel border border-divider text-sm text-textPrimary focus:outline-none focus:border-accent placeholder:text-textSecondary/50 font-interface shadow-sm"
          />
          <svg
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <span class="text-xs text-textSecondary font-mono">
          {{ filteredCanvases.length }} quadro{{ filteredCanvases.length === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Error State Alert -->
      <div
        v-if="errorMessage"
        class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between"
      >
        <span>{{ errorMessage }}</span>
        <button
          class="text-xs font-semibold underline hover:text-red-300 ml-4 cursor-pointer"
          @click="errorMessage = null"
        >
          Fechar
        </button>
      </div>

      <!-- Canvases Grid -->
      <div v-if="filteredCanvases.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="item in filteredCanvases"
          :key="item.id"
          class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-accent/50 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
          @click="openCanvas(item.id)"
        >
          <!-- Top Accent / Header -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
                <span class="text-[11px] font-mono text-textSecondary uppercase tracking-wider">JSON Canvas</span>
              </div>

              <!-- Context Actions Dropdown / Buttons -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                <button
                  class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
                  title="Duplicar Quadro"
                  @click="handleDuplicate(item.id)"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  class="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Excluir Quadro"
                  @click="handleDelete(item.id)"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 class="text-base font-semibold text-textPrimary group-hover:text-accent transition-colors line-clamp-1">
              {{ item.title }}
            </h3>
            <p v-if="item.description" class="text-xs text-textSecondary mt-1 line-clamp-2">
              {{ item.description }}
            </p>
          </div>

          <!-- Footer Metadata -->
          <div class="flex items-center justify-between pt-4 mt-4 border-t border-divider/60 text-xs text-textSecondary">
            <div class="flex items-center gap-3 font-mono">
              <span class="inline-flex items-center gap-1">
                <span>📝</span> {{ item.nodeCount || 0 }}
              </span>
              <span class="inline-flex items-center gap-1">
                <span>🔗</span> {{ item.edgeCount || 0 }}
              </span>
            </div>

            <span class="text-[11px] text-textSecondary/70">
              {{ formatDate(item.updatedAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!isLoading"
        class="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-divider bg-bgPanel/40"
      >
        <div class="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl mb-4">
          ✨
        </div>
        <h3 class="text-lg font-semibold text-textPrimary">Nenhum quadro encontrado</h3>
        <p class="text-sm text-textSecondary max-w-md mt-1 mb-6">
          Crie seu primeiro quadro infinito para estruturar suas ideias, conectar anotações e desenhar livremente com IA.
        </p>
        <button
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium font-interface shadow-lg shadow-accent/20 transition-all cursor-pointer hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          :disabled="isCreating"
          @click="handleCreateCanvas"
        >
          <svg
            v-if="isCreating"
            class="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>{{ isCreating ? 'Criando quadro...' : 'Criar Primeiro Quadro' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCanvas } from '~/composables/useCanvas';

const searchQuery = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const isCreating = ref(false);
const errorMessage = ref<string | null>(null);

const {
  canvasesList,
  isLoading,
  fetchCanvases,
  createCanvas,
  deleteCanvas,
  duplicateCanvas,
  importJsonCanvas,
} = useCanvas();

onMounted(async () => {
  try {
    await fetchCanvases();
  } catch (err: any) {
    console.error('Erro ao carregar quadros:', err);
  }
});

const filteredCanvases = computed(() => {
  if (!searchQuery.value) return canvasesList.value;
  const q = searchQuery.value.toLowerCase();
  return canvasesList.value.filter(
    (c) =>
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
  );
});

const openCanvas = async (id: string) => {
  await navigateTo(`/canvas/${id}`);
};

const handleCreateCanvas = async () => {
  if (isCreating.value) return;
  isCreating.value = true;
  errorMessage.value = null;

  try {
    const newCanvas = await createCanvas('Novo Quadro');
    if (newCanvas?.id) {
      await navigateTo(`/canvas/${newCanvas.id}`);
    } else {
      throw new Error('Identificador do quadro não foi retornado.');
    }
  } catch (err: any) {
    console.error('Erro ao criar quadro:', err);
    errorMessage.value = 'Falha ao criar o quadro. Verifique se o servidor está ativo e tente novamente.';
  } finally {
    isCreating.value = false;
  }
};

const handleDuplicate = async (id: string) => {
  try {
    await duplicateCanvas(id);
  } catch (err) {
    console.error('Erro ao duplicar quadro:', err);
  }
};

const handleDelete = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este quadro?')) {
    try {
      await deleteCanvas(id);
    } catch (err) {
      console.error('Erro ao excluir quadro:', err);
    }
  }
};

const triggerImport = () => {
  fileInputRef.value?.click();
};

const handleFileImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    try {
      const created = await importJsonCanvas(file);
      if (created?.id) {
        await navigateTo(`/canvas/${created.id}`);
      }
    } catch (err) {
      console.error('Erro ao importar quadro:', err);
      errorMessage.value = 'Falha ao importar o arquivo .canvas.';
    }
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>
