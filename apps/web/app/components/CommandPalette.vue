<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-md"
        @click.self="close"
      >
        <div class="w-full max-w-2xl bg-bgPanel rounded-2xl shadow-2xl overflow-hidden border border-divider">
          <div class="px-6 py-5 flex items-center gap-4">
            <SearchIcon class="w-6 h-6 text-textSecondary" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              class="w-full bg-transparent border-none outline-none text-2xl font-interface font-light text-textPrimary placeholder:text-textSecondary/50 focus:ring-0 p-0"
              placeholder="O que você procura?"
              @keydown.enter="handleEnter"
              @keydown.esc="close"
            />
          </div>

          <!-- Mockup de Resultados (Aparecem apenas se houver texto) -->
          <div v-if="query.length > 0" class="border-t border-divider px-2 py-2 max-h-[60vh] overflow-y-auto">
            <div class="px-4 py-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary opacity-50 mb-1">
              Resultados de Conhecimento
            </div>

            <div class="p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex flex-col gap-2 transition-colors mb-1 group">
              <div class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
                O Efeito Observador na Mecânica Quântica
              </div>
              <div class="font-interface text-sm text-textSecondary line-clamp-1">
                Uma análise de como o ato de medir afeta o sistema medido, proveniente do livro "The Fabric of Reality".
              </div>
            </div>

            <div class="p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex flex-col gap-2 transition-colors mb-1 group">
              <div class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Design de Interfaces Escalas
              </div>
              <div class="font-interface text-sm text-textSecondary line-clamp-1">
                Anotação rápida: O uso de whitespace como elemento funcional da navegação.
              </div>
            </div>
          </div>

          <!-- Ajuda / Atalhos -->
          <div v-else class="border-t border-divider px-6 py-4 flex items-center justify-between text-textSecondary font-interface text-sm opacity-60">
            <span>Comece a escrever para pesquisar...</span>
            <div class="flex items-center gap-3 font-technical text-[10px] uppercase font-semibold tracking-widest">
              <div class="flex items-center gap-1"><span class="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">↑↓</span> Navegar</div>
              <div class="flex items-center gap-1"><span class="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">Enter</span> Selecionar</div>
              <div class="flex items-center gap-1"><span class="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">Esc</span> Fechar</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { SearchIcon } from 'lucide-vue-next'
import { useCommandPalette } from '~/composables/useCommandPalette'

const { isOpen, open, close } = useCommandPalette()
const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

watch(isOpen, (newVal) => {
  if (newVal) {
    query.value = ''
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

const handleEnter = () => {
  console.log('Pesquisar por:', query.value)
  // Lógica de pesquisa
  close()
}

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  open,
  close
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, backdrop-filter 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}
</style>
