<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
  >
    <div
      class="relative w-full max-w-6xl h-[90vh] bg-bgRoot border border-divider rounded-2xl shadow-2xl flex flex-col overflow-hidden text-textPrimary font-interface"
    >
      <!-- Top Header -->
      <header class="h-14 px-5 border-b border-divider bg-bgPanel flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <span class="p-1.5 rounded-lg bg-primary/10 text-primary">
            <SparklesIcon class="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-textPrimary flex items-center gap-2">
              <span>Síntese de Desenho com IA</span>
              <span
                v-if="isGenerating"
                class="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse"
              >
                Analisando páginas...
              </span>
            </h2>
          </div>
        </div>

        <button
          @click="handleClose"
          class="p-1.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgElevated transition-all cursor-pointer"
          title="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </header>

      <!-- Main Body: Split View -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-divider">
        <!-- Lado Esquerdo: Desenho Original -->
        <div class="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-bgRoot/40 overflow-hidden">
          <div class="px-4 py-2.5 bg-bgPanel/60 border-b border-divider text-xs font-semibold text-textSecondary flex items-center justify-between">
            <span>Desenho Original ({{ images.length }} página{{ images.length > 1 ? 's' : '' }})</span>
            <span class="text-[11px] font-mono opacity-70">Visualização de Origem</span>
          </div>

          <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
            <div
              v-for="(img, idx) in images"
              :key="idx"
              class="w-full max-w-md bg-white rounded-lg shadow-md border border-divider overflow-hidden"
            >
              <div class="p-1.5 bg-gray-100 text-[10px] font-mono text-gray-500 border-b border-gray-200">
                Página {{ idx + 1 }}
              </div>
              <img :src="img" :alt="`Página ${idx + 1}`" class="w-full h-auto object-contain" />
            </div>
          </div>
        </div>

        <!-- Lado Direito: HTML Sintetizado Vivo -->
        <div class="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-bgPanel/40 overflow-hidden">
          <div class="px-4 py-2.5 bg-bgPanel/60 border-b border-divider text-xs font-semibold text-textSecondary flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span>HTML Semântico Gerado</span>
              <div class="flex items-center gap-1 bg-bgElevated p-0.5 rounded-lg text-[11px]">
                <button
                  @click="viewMode = 'preview'"
                  class="px-2 py-0.5 rounded transition-all cursor-pointer"
                  :class="viewMode === 'preview' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                >
                  Preview Vivo
                </button>
                <button
                  @click="viewMode = 'code'"
                  class="px-2 py-0.5 rounded transition-all cursor-pointer"
                  :class="viewMode === 'code' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                >
                  Código HTML
                </button>
              </div>
            </div>

            <button
              v-if="synthesisResult?.html"
              @click="handleCopyHtml"
              class="text-[11px] px-2 py-1 rounded bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all flex items-center gap-1 cursor-pointer"
            >
              <CopyIcon class="w-3 h-3" />
              <span>{{ copied ? 'Copiado!' : 'Copiar' }}</span>
            </button>
          </div>

          <!-- Conteúdo Gerado -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <!-- Loading State -->
            <div v-if="isGenerating" class="h-full flex flex-col items-center justify-center gap-3 text-center">
              <div class="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p class="text-sm font-semibold text-textPrimary">Interpretando manuscritos, diagramas e tabelas...</p>
              <p class="text-xs text-textSecondary max-w-sm">A IA está transformando traços visuais em HTML semântico puro e layout responsivo.</p>
            </div>

            <!-- View: Preview Vivo -->
            <div
              v-else-if="viewMode === 'preview' && synthesisResult?.html"
              class="prose dark:prose-invert max-w-none text-textPrimary select-text leading-relaxed"
            >
              <div class="mb-4">
                <input
                  v-model="editableTitle"
                  type="text"
                  class="w-full text-lg sm:text-xl font-bold bg-transparent border-b border-dashed border-divider hover:border-primary focus:border-primary focus:outline-none pb-1 transition-colors text-textPrimary"
                  placeholder="Título da Nota"
                />
                <p v-if="synthesisResult.summary" class="text-xs text-textSecondary mt-1 italic">
                  {{ synthesisResult.summary }}
                </p>
              </div>

              <!-- Injeção segura do HTML sintetizado -->
              <div class="synthesized-html-container" v-html="synthesisResult.html"></div>
            </div>

            <!-- View: Código HTML Cru -->
            <div v-else-if="viewMode === 'code' && synthesisResult?.html" class="h-full">
              <textarea
                readonly
                :value="synthesisResult.html"
                class="w-full h-full p-3 font-mono text-xs bg-bgElevated border border-divider rounded-xl text-textPrimary focus:outline-none resize-none select-text"
              ></textarea>
            </div>

            <!-- Empty / Error State -->
            <div v-else class="h-full flex flex-col items-center justify-center text-center text-textSecondary">
              <p class="text-xs">Nenhum resultado gerado ainda.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Footer com Opção de Exclusão do Desenho Original -->
      <footer class="h-16 px-5 border-t border-divider bg-bgPanel flex items-center justify-between shrink-0">
        <!-- Checkbox: Excluir desenho original -->
        <label class="flex items-center gap-2 cursor-pointer text-xs text-textSecondary hover:text-textPrimary">
          <input
            v-model="deleteOriginalDrawing"
            type="checkbox"
            class="rounded border-divider text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          />
          <span>Excluir a nota de desenho original após salvar</span>
        </label>

        <!-- Ações -->
        <div class="flex items-center gap-2">
          <button
            @click="handleClose"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all cursor-pointer"
          >
            Descartar
          </button>

          <button
            :disabled="!synthesisResult?.html || isGenerating || isSaving"
            @click="handleSaveAsNote"
            class="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <SaveIcon class="w-4 h-4" />
            <span>{{ isSaving ? 'Salvando...' : 'Salvar como Nota' }}</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Sparkles as SparklesIcon, X as XIcon, Copy as CopyIcon, Save as SaveIcon } from 'lucide-vue-next';
import type { DrawingSynthesisResult } from '~/interfaces/drawing';

const props = defineProps<{
  modelValue: boolean;
  images: string[];
  synthesisResult: DrawingSynthesisResult | null;
  isGenerating: boolean;
  drawingTitle: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save-as-note', payload: { title: string; html: string; deleteOriginal: boolean }): void;
}>();

const viewMode = ref<'preview' | 'code'>('preview');
const deleteOriginalDrawing = ref(false);
const editableTitle = ref('');
const isSaving = ref(false);
const copied = ref(false);

watch(
  () => props.synthesisResult,
  (res) => {
    if (res) {
      editableTitle.value = res.titleSuggested || props.drawingTitle || 'Nota Sintetizada';
    }
  },
  { immediate: true }
);

function handleClose() {
  emit('update:modelValue', false);
}

function handleCopyHtml() {
  if (!props.synthesisResult?.html) return;
  navigator.clipboard.writeText(props.synthesisResult.html);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function handleSaveAsNote() {
  if (!props.synthesisResult?.html) return;
  isSaving.value = true;
  emit('save-as-note', {
    title: editableTitle.value || props.drawingTitle || 'Nota Sintetizada',
    html: props.synthesisResult.html,
    deleteOriginal: deleteOriginalDrawing.value,
  });
}
</script>

<style scoped>
:deep(.aresta-drawing-synthesis) {
  font-family: inherit;
}
:deep(.aresta-drawing-synthesis h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}
:deep(.aresta-drawing-synthesis th),
:deep(.aresta-drawing-synthesis td) {
  border: 1px solid rgba(125, 125, 125, 0.2);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
:deep(.aresta-drawing-synthesis th) {
  background-color: rgba(125, 125, 125, 0.08);
  font-weight: 600;
}
:deep(.aresta-drawing-synthesis ul),
:deep(.aresta-drawing-synthesis ol) {
  padding-left: 1.25rem;
  margin: 0.75rem 0;
}
</style>
