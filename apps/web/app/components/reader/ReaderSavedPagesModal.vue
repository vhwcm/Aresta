<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
    @click.self="$emit('close')"
    role="dialog"
    aria-modal="true"
    aria-labelledby="saved-pages-title"
  >
    <div class="bg-bgPanel border border-divider rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[85vh] text-textPrimary">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-divider">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <BookmarkIcon class="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 id="saved-pages-title" class="font-bold text-base">Páginas Marcadas</h3>
            <p class="text-xs text-textSecondary">{{ store.savedPages.length }} {{ store.savedPages.length === 1 ? 'página salva' : 'páginas salvas' }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-textSecondary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors"
          aria-label="Fechar modal"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto py-4 space-y-2">
        <template v-if="store.savedPages.length > 0">
          <div
            v-for="page in store.savedPages"
            :key="page"
            class="flex items-center justify-between p-3 rounded-xl bg-bgApp/80 border border-divider/60 hover:border-accent/40 transition-all group"
          >
            <button
              @click="handleSelectPage(page)"
              class="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              <div
                class="w-9 h-9 rounded-lg font-technical font-bold text-xs flex items-center justify-center transition-colors"
                :class="store.currentPage === page ? 'bg-accent text-white' : 'bg-white/5 text-textSecondary group-hover:text-textPrimary group-hover:bg-white/10'"
              >
                {{ page }}
              </div>
              <div>
                <p class="text-sm font-semibold text-textPrimary group-hover:text-accent transition-colors">
                  Página {{ page }}
                </p>
                <p v-if="store.currentPage === page" class="text-[11px] text-accent font-medium">
                  Página atual
                </p>
              </div>
            </button>

            <button
              @click="store.removeBookmark(page)"
              class="p-2 text-textSecondary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-2"
              title="Remover marcação"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </template>

        <div v-else class="text-center py-10 text-textSecondary">
          <BookmarkIcon class="w-10 h-10 mx-auto opacity-30 mb-2" />
          <p class="text-sm font-semibold text-textPrimary">Nenhuma página marcada</p>
          <p class="text-xs mt-1">Clique no ícone de marcar página na barra inferior para salvar páginas importantes.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-divider flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textPrimary hover:bg-white/10 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookmarkIcon, XIcon, Trash2Icon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selectPage', page: number): void
}>()

const store = useReaderStore()

const handleSelectPage = (page: number) => {
  store.goToPage(page)
  emit('selectPage', page)
  emit('close')
}
</script>
