<template>
  <main class="flex-1 flex flex-col bg-bgApp overflow-hidden select-none font-interface">
    <!-- Top Header do Diário -->
    <header class="border-b border-divider bg-bgPanel/95 backdrop-blur-md px-3 sm:px-6 py-3 flex-shrink-0 z-10">
      <div class="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 flex-wrap">
        <!-- Título e Data Ativa -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
            <BookOpenCheckIcon class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-sm sm:text-base font-bold text-textPrimary truncate tracking-tight">
                Diário Sequencial
              </h1>
              <span
                v-if="isSaving"
                class="inline-flex items-center gap-1 text-[10px] text-amber-500 font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
              >
                <RefreshCwIcon class="w-2.5 h-2.5 animate-spin" />
                <span>Salvando...</span>
              </span>
              <span
                v-else-if="lastSaved"
                class="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <CheckCircle2Icon class="w-2.5 h-2.5" />
                <span>Salvo</span>
              </span>
            </div>
            <p class="text-xs text-textSecondary truncate">
              {{ formattedActiveDate }}
            </p>
          </div>
        </div>

        <!-- Seletor de Data & Atalho Hoje -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="relative flex items-center">
            <CalendarIcon class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none" />
            <input
              v-model="inputDate"
              type="date"
              class="pl-8 pr-2.5 py-1.5 rounded-xl bg-bgRoot border border-divider text-xs text-textPrimary focus:outline-none focus:border-amber-500 font-mono shadow-inner cursor-pointer"
              title="Pular para data específica"
              @change="onDatePickerChange"
            />
          </div>

          <button
            v-if="!isTodaySelected"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1"
            title="Voltar para a anotação de Hoje"
            @click="jumpToToday"
          >
            <ClockIcon class="w-3.5 h-3.5" />
            <span>Hoje</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Área de Conteúdo Scrollável -->
    <div
      ref="scrollContainerRef"
      class="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 md:p-8 pb-32"
    >
      <div class="max-w-4xl w-full mx-auto space-y-8">
        <!-- 1. BLOCO PRINCIPAL: ESCRITA DO DIA SELECIONADO -->
        <section
          :id="`journal-${selectedDate}`"
          class="bg-bgPanel rounded-2xl border border-divider shadow-sm overflow-hidden flex flex-col transition-all"
          :class="{ 'ring-2 ring-amber-500/40 border-amber-500/50 shadow-lg shadow-amber-500/5': isHighlightingSelectedDate }"
        >
          <!-- Barra de Ferramentas do Editor Diário -->
          <div class="bg-bgSurface border-b border-divider px-3 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
            <!-- Grupo de Formatação Markdown -->
            <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                class="px-2.5 h-7 rounded-lg text-xs font-bold border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Título 1 (# )"
                @click="applyMarkdownFormat('h1')"
              >
                H1
              </button>
              <button
                type="button"
                class="px-2.5 h-7 rounded-lg text-xs font-bold border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Título 2 (## )"
                @click="applyMarkdownFormat('h2')"
              >
                H2
              </button>
              <button
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Negrito (**texto**)"
                @click="applyMarkdownFormat('bold')"
              >
                B
              </button>
              <button
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center italic text-xs border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Itálico (*texto*)"
                @click="applyMarkdownFormat('italic')"
              >
                I
              </button>

              <div class="h-4 w-px bg-divider/80 mx-0.5 shrink-0"></div>

              <button
                type="button"
                class="px-2 h-7 rounded-lg flex items-center gap-1 text-xs border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Lista de Tarefas (- [ ])"
                @click="applyMarkdownFormat('task')"
              >
                <CheckSquareIcon class="w-3.5 h-3.5 text-amber-500" />
                <span class="hidden xs:inline">Tarefa</span>
              </button>

              <button
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Lista (- item)"
                @click="applyMarkdownFormat('list')"
              >
                <ListIcon class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs border border-divider/80 text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title="Citação (> texto)"
                @click="applyMarkdownFormat('quote')"
              >
                <QuoteIcon class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Grupo Direito: Visualizar / Limpar -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                class="px-2.5 h-7 rounded-lg text-xs font-medium border border-divider/80 flex items-center gap-1.5 cursor-pointer transition-colors"
                :class="isPreviewMode ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold' : 'text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
                title="Alternar modo de pré-visualização"
                @click="isPreviewMode = !isPreviewMode"
              >
                <EyeIcon class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">{{ isPreviewMode ? 'Editar' : 'Visualizar' }}</span>
              </button>

              <button
                v-if="editorText.trim()"
                type="button"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 cursor-pointer transition-colors"
                title="Limpar anotação deste dia"
                @click="confirmDeleteEntry(selectedDate)"
              >
                <Trash2Icon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Corpo de Escrita do Dia Selecionado -->
          <div class="p-4 sm:p-6 min-h-[220px] flex flex-col">
            <div class="flex items-center justify-between mb-3 text-xs text-textSecondary">
              <span class="font-semibold text-textPrimary flex items-center gap-1.5">
                <CalendarDaysIcon class="w-4 h-4 text-amber-500" />
                {{ isTodaySelected ? 'Anotações de Hoje' : `Anotações de ${selectedDate}` }}
              </span>
              <span class="font-mono text-[11px] opacity-75">
                {{ editorText.length }} caracteres
              </span>
            </div>

            <!-- Preview Markdown -->
            <div v-if="isPreviewMode" class="flex-1 py-2">
              <AiMarkdown
                v-if="editorText.trim()"
                :content="editorText"
              />
              <p v-else class="text-xs text-textSecondary italic py-4">
                Nenhum texto inserido ainda. Comece a digitar para registrar seu dia.
              </p>
            </div>

            <!-- Textarea de Escrita -->
            <textarea
              v-else
              ref="textareaRef"
              v-model="editorText"
              placeholder="Como foi o seu dia? Registre reflexões, ideias, tarefas, aprendizados ou resumos..."
              class="w-full flex-1 min-h-[180px] bg-transparent text-textPrimary text-sm sm:text-base leading-relaxed placeholder:text-textSecondary/50 focus:outline-none resize-y font-interface"
              @input="onEditorInput"
            ></textarea>
          </div>
        </section>

        <!-- 2. LINHA DO TEMPO CRONOLÓGICA (DIAS ANTERIORES) -->
        <section class="space-y-4 pt-4 border-t border-divider/60">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-bgSurface border border-divider flex items-center justify-center text-textSecondary">
                <HistoryIcon class="w-4 h-4" />
              </div>
              <h2 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-textSecondary font-interface">
                Linha do Tempo Cronológica ({{ previousEntries.length }})
              </h2>
            </div>
          </div>

          <!-- Feed Sequencial de Dias Anteriores -->
          <div v-if="previousEntries.length > 0" class="relative pl-4 sm:pl-6 space-y-6">
            <!-- Linha vertical conectora contínua -->
            <div class="absolute left-1.5 sm:left-2.5 top-3 bottom-3 w-0.5 bg-divider"></div>

            <div
              v-for="entry in previousEntries"
              :id="`journal-${entry.date}`"
              :key="entry.date"
              class="relative group"
            >
              <!-- Marcador de nó na linha do tempo -->
              <div class="absolute -left-4 sm:-left-6 top-3.5 w-3 h-3 rounded-full bg-bgPanel border-2 border-amber-500 ring-4 ring-bgApp group-hover:scale-125 transition-transform"></div>

              <!-- Cartão do Dia Anterior -->
              <div
                class="bg-bgPanel rounded-2xl border border-divider hover:border-amber-500/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 select-text"
                :class="{ 'ring-2 ring-amber-500/40 border-amber-500/50 shadow-lg shadow-amber-500/5': isHighlighted(entry.date) }"
              >
                <!-- Cabeçalho do Card -->
                <div class="flex items-center justify-between gap-2 border-b border-divider/60 pb-2.5 flex-wrap">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs sm:text-sm font-bold text-textPrimary truncate font-interface">
                      {{ formatJournalDateLong(entry.date) }}
                    </span>
                    <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-bgSurface text-textSecondary border border-divider">
                      {{ entry.date }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0 select-none">
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer transition-colors flex items-center gap-1"
                      title="Editar anotação deste dia no editor principal"
                      @click="loadDateIntoEditor(entry.date)"
                    >
                      <Edit3Icon class="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      class="p-1.5 rounded-lg text-textSecondary hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                      title="Excluir anotação deste dia"
                      @click="confirmDeleteEntry(entry.date)"
                    >
                      <Trash2Icon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Conteúdo Markdown Renderizado -->
                <div class="prose prose-sm dark:prose-invert max-w-none text-textPrimary">
                  <AiMarkdown :content="entry.content" />
                </div>
              </div>
            </div>
          </div>

          <!-- Estado Vazio da Linha do Tempo -->
          <div
            v-else
            class="p-8 rounded-2xl bg-bgPanel/50 border border-dashed border-divider text-center space-y-2 select-none"
          >
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-xl">
              📖
            </div>
            <h3 class="text-sm font-semibold text-textPrimary">Nenhuma anotação em dias anteriores</h3>
            <p class="text-xs text-textSecondary max-w-md mx-auto">
              Suas reflexões e anotações diárias passadas aparecerão aqui em ordem cronológica conforme você registrar seus dias.
            </p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  BookOpenCheck as BookOpenCheckIcon,
  Calendar as CalendarIcon,
  CalendarDays as CalendarDaysIcon,
  Clock as ClockIcon,
  CheckCircle2 as CheckCircle2Icon,
  RefreshCw as RefreshCwIcon,
  CheckSquare as CheckSquareIcon,
  List as ListIcon,
  Quote as QuoteIcon,
  Eye as EyeIcon,
  Trash2 as Trash2Icon,
  History as HistoryIcon,
  Edit3 as Edit3Icon,
} from 'lucide-vue-next'
import AiMarkdown from '~/components/AiMarkdown.vue'
import { useJournal } from '~/composables/useJournal'

const {
  selectedDate,
  selectedDateContent,
  timelineEntries,
  isLoading,
  isSaving,
  lastSaved,
  isTodaySelected,
  getTodayString,
  formatJournalDateLong,
  loadTimeline,
  selectDate,
  saveEntry,
  deleteEntry,
} = useJournal()

const scrollContainerRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const inputDate = ref<string>(selectedDate.value)
const editorText = ref<string>('')
const isPreviewMode = ref<boolean>(false)
const highlightedDate = ref<string | null>(null)
const isHighlightingSelectedDate = ref<boolean>(false)

let debounceTimer: any = null

const formattedActiveDate = computed(() => {
  return formatJournalDateLong(selectedDate.value)
})

// Dias anteriores para o feed (exclui o dia atualmente aberto no editor do topo)
const previousEntries = computed(() => {
  return timelineEntries.value.filter((e) => e.date !== selectedDate.value)
})

const isHighlighted = (date: string) => {
  return highlightedDate.value === date
}

// Sincroniza o texto do editor quando selectedDateContent muda
watch(
  () => selectedDateContent.value,
  (val) => {
    editorText.value = val || ''
  },
  { immediate: true }
)

watch(
  () => selectedDate.value,
  (val) => {
    inputDate.value = val
  }
)

onMounted(async () => {
  await loadTimeline()
  editorText.value = selectedDateContent.value || ''
})

const onEditorInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await saveEntry(selectedDate.value, editorText.value)
  }, 400)
}

const applyMarkdownFormat = (type: 'h1' | 'h2' | 'bold' | 'italic' | 'task' | 'list' | 'quote') => {
  const el = textareaRef.value
  if (!el) return

  const start = el.selectionStart || 0
  const end = el.selectionEnd || 0
  const val = editorText.value
  const selectedText = val.slice(start, end)

  let insertion = ''
  let newCursorPos = start

  switch (type) {
    case 'h1':
      insertion = `# ${selectedText || 'Título 1'}`
      break
    case 'h2':
      insertion = `## ${selectedText || 'Título 2'}`
      break
    case 'bold':
      insertion = `**${selectedText || 'texto'}**`
      break
    case 'italic':
      insertion = `*${selectedText || 'texto'}*`
      break
    case 'task':
      insertion = `- [ ] ${selectedText || 'Nova tarefa'}`
      break
    case 'list':
      insertion = `- ${selectedText || 'Item da lista'}`
      break
    case 'quote':
      insertion = `> ${selectedText || 'Citação'}`
      break
  }

  editorText.value = val.slice(0, start) + insertion + val.slice(end)
  nextTick(() => {
    el.focus()
    newCursorPos = start + insertion.length
    el.setSelectionRange(newCursorPos, newCursorPos)
    onEditorInput()
  })
}

const onDatePickerChange = async () => {
  if (!inputDate.value) return
  const targetDate = inputDate.value
  
  // Verifica se o dia alvo já existe no feed ou se vamos abrir direto no editor
  const exists = timelineEntries.value.some((e) => e.date === targetDate)
  await selectDate(targetDate)

  if (exists) {
    isHighlightingSelectedDate.value = true
    setTimeout(() => {
      isHighlightingSelectedDate.value = false
    }, 2000)
  }

  // Scroll suave até o bloco do editor no topo
  scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const jumpToToday = async () => {
  const today = getTodayString()
  await selectDate(today)
  scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadDateIntoEditor = async (date: string) => {
  await selectDate(date)
  scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  isHighlightingSelectedDate.value = true
  setTimeout(() => {
    isHighlightingSelectedDate.value = false
  }, 2000)
}

const confirmDeleteEntry = async (date: string) => {
  const isConfirmed = window.confirm(`Deseja realmente excluir a anotação do dia ${date}?`)
  if (!isConfirmed) return

  if (debounceTimer) clearTimeout(debounceTimer)
  await deleteEntry(date)
  if (selectedDate.value === date) {
    editorText.value = ''
  }
}
</script>
