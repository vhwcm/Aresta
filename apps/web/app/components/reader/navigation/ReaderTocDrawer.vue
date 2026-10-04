<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="toc-drawer-title"
    >
      <!-- Backdrop suave -->
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        @click="$emit('close')"
      />

      <!-- Drawer Lateral Esquerdo -->
      <aside
        class="relative w-full max-w-sm sm:max-w-md h-full flex flex-col z-10 shadow-2xl border-r transition-transform duration-300 transform"
        :class="{
          'bg-[#FAF5E8] border-[#dfd5c0] text-[#2a2521]': activeTheme === 'sepia',
          'bg-white border-gray-200 text-gray-900': activeTheme === 'white',
          'bg-[#121214] border-white/10 text-[#e4e4e7]': activeTheme === 'black',
        }"
      >
        <!-- Topo do Drawer -->
        <div
          class="flex items-center justify-between px-6 py-5 border-b shrink-0"
          :class="{
            'border-[#dfd5c0]': activeTheme === 'sepia',
            'border-gray-100': activeTheme === 'white',
            'border-white/10': activeTheme === 'black',
          }"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
              <ListIcon class="w-4 h-4" />
            </div>
            <div>
              <h2 id="toc-drawer-title" class="text-base font-bold font-serif leading-tight">
                Sumário
              </h2>
              <p class="text-xs font-technical text-textSecondary">
                {{ flatEntries.length }} seções encontradas
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            @click="$emit('close')"
            aria-label="Fechar sumário"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Lista de Itens do Sumário -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <div v-if="flatEntries.length === 0" class="py-12 text-center text-xs text-textSecondary">
            Nenhum sumário ou índice disponível para este documento.
          </div>

          <button
            v-for="(item, idx) in flatEntries"
            :key="idx"
            type="button"
            class="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-sm"
            :style="{ paddingLeft: `${Math.max(12, item.depth * 20 + 12)}px` }"
            :class="{
              'bg-accent/15 text-accent font-semibold': item.isCurrent,
              'hover:bg-black/5 text-textPrimary': !item.isCurrent && activeTheme !== 'black',
              'hover:bg-white/5 text-textPrimary': !item.isCurrent && activeTheme === 'black',
            }"
            @click="handleJump(item.entry)"
          >
            <div class="flex items-center gap-2 truncate">
              <span
                v-if="item.isCurrent"
                class="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
              />
              <span class="truncate font-serif">{{ item.entry.label }}</span>
            </div>
            <span
              class="text-[11px] font-technical px-2 py-0.5 rounded-md shrink-0 border"
              :class="{
                'bg-accent text-white border-accent': item.isCurrent,
                'bg-black/5 border-black/10 text-textSecondary': !item.isCurrent && activeTheme !== 'black',
                'bg-white/5 border-white/10 text-textSecondary': !item.isCurrent && activeTheme === 'black',
              }"
            >
              {{ isEpub ? `Loc. ${item.entry.unit}` : `Pág. ${item.entry.unit}` }}
            </span>
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ListIcon, XIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useLocationProgress } from '~/composables/reader/useLocationProgress'
import { useReadingNavigation } from '~/composables/reader/useReadingNavigation'
import type { TocEntry } from '~/utils/reader/toc/tocNormalizer'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (_e: 'close'): void
}>()

const store = useReaderStore()
const { cachedToc, currentUnit, isEpub } = useLocationProgress()
const { goToPosition } = useReadingNavigation()

const activeTheme = computed(() => store.readerTheme || 'sepia')

interface FlattenedEntry {
  entry: TocEntry
  depth: number
  isCurrent: boolean
}

function flattenToc(entries: TocEntry[], depth = 0): FlattenedEntry[] {
  const result: FlattenedEntry[] = []
  for (const entry of entries) {
    result.push({
      entry,
      depth,
      isCurrent: false,
    })
    if (entry.children && entry.children.length > 0) {
      result.push(...flattenToc(entry.children, depth + 1))
    }
  }
  return result
}

const flatEntries = computed(() => {
  const flat = flattenToc(cachedToc.value)
  const targetUnit = currentUnit.value

  // Encontra o item de maior unit <= targetUnit
  let bestIdx = -1
  let bestUnit = -1
  for (let i = 0; i < flat.length; i++) {
    const item = flat[i]
    if (item && item.entry.unit <= targetUnit && item.entry.unit > bestUnit) {
      bestUnit = item.entry.unit
      bestIdx = i
    }
  }

  if (bestIdx >= 0) {
    const currentItem = flat[bestIdx]
    if (currentItem) {
      currentItem.isCurrent = true
    }
  }

  return flat
})

function handleJump(entry: TocEntry) {
  goToPosition(entry.position)
  emit('close')
}
</script>
