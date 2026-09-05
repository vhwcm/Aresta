<template>
  <main class="flex-1 flex flex-col bg-bgDarker overflow-hidden">
    <!-- Barra de Ferramentas Superior da Nota -->
    <div class="h-14 border-b border-divider bg-bgPanel flex items-center justify-between px-6 flex-shrink-0 gap-4">
      <input
        v-model="localNote.title"
        type="text"
        placeholder="Título da nota..."
        class="bg-transparent border-none text-base font-semibold text-textPrimary focus:outline-none flex-1 font-serif mr-4"
        @input="onInput"
      />

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Seletor de Pasta da Nota -->
        <div class="flex items-center gap-1.5 text-xs text-textSecondary">
          <FolderIcon class="w-3.5 h-3.5 text-accent" />
          <select
            v-model="localNote.folder"
            class="bg-bgSurface border border-divider rounded-lg px-2 py-1 text-xs text-textPrimary focus:outline-none focus:border-accent cursor-pointer"
            @change="onInput"
          >
            <option :value="null">Sem pasta</option>
            <option v-for="f in folders" :key="f" :value="f">📁 {{ f }}</option>
          </select>
        </div>

        <!-- Alternador de Modos do Editor (Dividido / Editor / Preview) -->
        <div class="flex rounded-xl bg-bgElevated p-0.5 border border-divider text-xs">
          <button
            class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="noteViewMode === 'split' ? 'bg-accent text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
            @click="noteViewMode = 'split'"
          >
            Dividido
          </button>
          <button
            class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="noteViewMode === 'edit' ? 'bg-accent text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
            @click="noteViewMode = 'edit'"
          >
            Editor
          </button>
          <button
            class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="noteViewMode === 'preview' ? 'bg-accent text-white font-medium shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
            @click="noteViewMode = 'preview'"
          >
            Preview
          </button>
        </div>

        <!-- Botão Inserir Canvas Embed -->
        <button
          class="px-2.5 py-1 rounded-xl bg-bgElevated hover:bg-bgSurface text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center gap-1 cursor-pointer"
          title="Inserir Embed de Canvas nesta nota"
          @click="openCanvasPicker"
        >
          <LayoutGridIcon class="w-3.5 h-3.5 text-accent" />
          <span class="hidden md:inline">Embutir Canvas</span>
        </button>

        <!-- Botão Excluir Nota -->
        <button
          class="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          title="Excluir Nota"
          @click="$emit('delete', localNote.id)"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>

        <!-- Botão Fechar e Voltar à Grade -->
        <button
          class="px-2.5 py-1 rounded-xl bg-bgSurface hover:bg-bgElevated text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center gap-1 cursor-pointer ml-1"
          title="Fechar e retornar à visão em grade"
          @click="$emit('close')"
        >
          <LayoutGridIcon class="w-3.5 h-3.5 text-accent" />
          <span>Ver Grade</span>
        </button>
      </div>
    </div>

    <!-- Barra de Tags da Nota Ativa -->
    <div class="px-6 py-2 border-b border-divider bg-bgSurface/40 flex items-center gap-2 flex-wrap text-xs">
      <TagIcon class="w-3.5 h-3.5 text-accent" />
      <span class="text-textSecondary text-[11px] font-medium">Tags:</span>

      <span
        v-for="(tag, idx) in localNote.tags"
        :key="tag"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-medium"
      >
        #{{ tag }}
        <button @click="removeTag(idx)" class="hover:text-white cursor-pointer ml-0.5">✕</button>
      </span>

      <div class="flex items-center gap-1">
        <input
          v-model="newTagInput"
          type="text"
          placeholder="+ Adicionar tag (Enter)"
          class="bg-transparent border-none text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none min-w-[120px]"
          @keydown.enter.prevent="addTag"
          @keydown="handleTagKeyDown"
        />
      </div>
    </div>

    <!-- Corpo do Editor & Preview em Tempo Real -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Textarea (Markdown) -->
      <div
        v-if="noteViewMode === 'edit' || noteViewMode === 'split'"
        class="flex-1 border-r border-divider/60 p-6 overflow-y-auto bg-bgSurface/30 custom-scrollbar"
      >
        <textarea
          ref="textareaRef"
          v-model="localNote.content"
          placeholder="Escreva sua anotação em Markdown... Use ![[canvas:id]] para embutir um canvas ou ![[book:id]] para embutir um livro."
          class="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed text-textPrimary font-mono placeholder:text-textSecondary/40"
          @input="onInput"
          @keydown="onTextareaKeydown"
        ></textarea>
      </div>

      <!-- Preview em Tempo Real (Composite Renderer) -->
      <div
        v-if="noteViewMode === 'preview' || noteViewMode === 'split'"
        class="flex-1 p-6 overflow-y-auto bg-bgDarker custom-scrollbar"
      >
        <NoteCompositeRenderer
          :content="localNote.content"
          :note-id="localNote.id"
          :note-title="localNote.title"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { applyMarkdownFormat } from '~/utils/markdownFormat'
import {
  FolderIcon,
  TagIcon,
  Trash2Icon,
  LayoutGridIcon
} from 'lucide-vue-next'
import NoteCompositeRenderer from '~/components/notes/NoteCompositeRenderer.vue'
import type { NoteItem } from '~/interfaces/note'
import type { CanvasSummary } from '~/interfaces/canvas'

const props = defineProps<{
  note: NoteItem
  folders: string[]
  canvases: CanvasSummary[]
}>()

const emit = defineEmits<{
  (_e: 'update:note', _note: NoteItem): void
  (_e: 'save', _note: NoteItem): void
  (_e: 'delete', _id: string): void
  (_e: 'close'): void
}>()

const localNote = ref<NoteItem>({
  ...props.note,
  tags: Array.isArray(props.note.tags) ? [...props.note.tags] : []
})

watch(
  () => props.note,
  (newVal) => {
    localNote.value = {
      ...newVal,
      tags: Array.isArray(newVal.tags) ? [...newVal.tags] : []
    }
  },
  { deep: true }
)

const noteViewMode = ref<'split' | 'edit' | 'preview'>('split')
const newTagInput = ref('')

const onInput = () => {
  emit('update:note', localNote.value)
  emit('save', localNote.value)
}

const addTag = () => {
  const clean = newTagInput.value.trim().replace(/^#/, '')
  if (!localNote.value.tags) localNote.value.tags = []
  if (clean && !localNote.value.tags.includes(clean)) {
    localNote.value.tags.push(clean)
    onInput()
  }
  newTagInput.value = ''
}

const handleTagKeyDown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

const removeTag = (idx: number) => {
  if (!localNote.value.tags) return
  localNote.value.tags.splice(idx, 1)
  onInput()
}

const openCanvasPicker = () => {
  if (props.canvases.length === 0) {
    alert('Nenhum canvas encontrado. Crie um quadro primeiro!')
    return
  }
  const canvas = props.canvases[0]
  if (canvas) {
    localNote.value.content = (localNote.value.content || '') + `\n\n![[canvas:${canvas.id}]]\n`
    onInput()
  }
}

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const formatMarkdown = (format: 'bold' | 'italic') => {
  if (!textareaRef.value) return
  const textarea = textareaRef.value
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const result = applyMarkdownFormat(localNote.value.content || '', start, end, format)
  localNote.value.content = result.newText
  onInput()
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(result.selectionStart, result.selectionEnd)
    }
  })
}

const onTextareaKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault()
    formatMarkdown('bold')
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
    e.preventDefault()
    formatMarkdown('italic')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}
</style>
