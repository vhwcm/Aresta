<template>
  <div
    v-if="isVisible"
    class="fixed bottom-0 left-0 right-0 w-full z-50 bg-bgPanel border-t border-divider shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all pointer-events-auto"
    role="navigation"
    aria-label="Navegação Principal"
  >
    <!-- Container Principal da Navbar Fixa -->
    <nav
      class="relative flex items-center justify-around md:justify-center md:gap-8 lg:gap-12 h-14 md:h-16 max-w-4xl mx-auto px-2 sm:px-4"
    >
      <!-- Item 1: Livros (Dropdown: Meus Livros, Conversor, Loja) -->
      <div class="relative" ref="booksMenuRef">
        <button
          @click="isBooksOpen = !isBooksOpen; isNotesOpen = false"
          class="nav-item group focus:outline-none"
          :class="{
            'nav-item-active': isBooksActive || isBooksOpen
          }"
          title="Menu de Livros"
          aria-haspopup="true"
          :aria-expanded="isBooksOpen"
        >
          <BookOpenIcon
            class="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 group-hover:scale-110"
            :class="(isBooksActive || isBooksOpen) ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
          />
          <span class="hidden md:inline font-interface text-xs md:text-sm font-medium tracking-tight">Livros</span>
          <ChevronUpIcon
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="[
              (isBooksActive || isBooksOpen) ? 'text-accent' : 'text-textSecondary',
              { 'rotate-180': isBooksOpen }
            ]"
          />
        </button>

        <!-- Dropdown Flutuante de Livros -->
        <div
          v-if="isBooksOpen"
          class="absolute bottom-full mb-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-60 md:w-64 p-2 rounded-2xl bg-bgPanel border border-divider shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- 1. Meus Livros -->
          <NuxtLink
            to="/library"
            @click="isBooksOpen = false"
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
            :class="isMyBooksActive ? 'bg-accent/15 text-accent border border-accent/30' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="p-2 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
              <BookIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col text-left">
              <span class="font-interface text-xs md:text-sm font-medium" :class="isMyBooksActive ? 'text-accent font-semibold' : 'text-textPrimary group-hover:text-accent'">Meus Livros</span>
              <span class="font-interface text-[10px] md:text-xs text-textSecondary">Sua estante pessoal</span>
            </div>
          </NuxtLink>

          <!-- 2. Conversor -->
          <NuxtLink
            to="/conversor"
            @click="isBooksOpen = false"
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
            :class="route.path.startsWith('/conversor') ? 'bg-accent/15 text-accent border border-accent/30' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="p-2 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
              <FileCode2Icon class="w-4 h-4" />
            </div>
            <div class="flex flex-col text-left">
              <span class="font-interface text-xs md:text-sm font-medium" :class="route.path.startsWith('/conversor') ? 'text-accent font-semibold' : 'text-textPrimary group-hover:text-accent'">Conversor</span>
              <span class="font-interface text-[10px] md:text-xs text-textSecondary">PDF para EPUB</span>
            </div>
          </NuxtLink>

          <!-- 3. Loja / Catálogo -->
          <NuxtLink
            to="/loja"
            @click="isBooksOpen = false"
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
            :class="route.path === '/loja' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="p-2 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
              <ShoppingBagIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col text-left">
              <span class="font-interface text-xs md:text-sm font-medium" :class="route.path === '/loja' ? 'text-accent font-semibold' : 'text-textPrimary group-hover:text-accent'">Loja</span>
              <span class="font-interface text-[10px] md:text-xs text-textSecondary">Descubra novas obras</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Item 2: Notas (Dropdown: Notas/Quadros, Grafo de Conhecimento) -->
      <div class="relative" ref="notesMenuRef">
        <button
          @click="isNotesOpen = !isNotesOpen; isBooksOpen = false"
          class="nav-item group focus:outline-none"
          :class="{
            'nav-item-active': isNotesActive || isNotesOpen
          }"
          title="Menu de Notas"
          aria-haspopup="true"
          :aria-expanded="isNotesOpen"
        >
          <FileTextIcon
            class="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 group-hover:scale-110"
            :class="(isNotesActive || isNotesOpen) ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
          />
          <span class="hidden md:inline font-interface text-xs md:text-sm font-medium tracking-tight">Notas</span>
          <ChevronUpIcon
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="[
              (isNotesActive || isNotesOpen) ? 'text-accent' : 'text-textSecondary',
              { 'rotate-180': isNotesOpen }
            ]"
          />
        </button>

        <!-- Dropdown Flutuante de Notas -->
        <div
          v-if="isNotesOpen"
          class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 md:w-68 p-2 rounded-2xl bg-bgPanel border border-divider shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- 1. Notas & Quadros -->
          <NuxtLink
            to="/canvas"
            @click="isNotesOpen = false"
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
            :class="isCanvasActive ? 'bg-accent/15 text-accent border border-accent/30' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="p-2 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
              <LayoutGridIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col text-left">
              <span class="font-interface text-xs md:text-sm font-medium" :class="isCanvasActive ? 'text-accent font-semibold' : 'text-textPrimary group-hover:text-accent'">Notas & Quadros</span>
              <span class="font-interface text-[10px] md:text-xs text-textSecondary">Anotações e canvas infinito</span>
            </div>
          </NuxtLink>

          <!-- 2. Grafo de Conhecimento -->
          <NuxtLink
            to="/grafo"
            @click="isNotesOpen = false"
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
            :class="route.path === '/grafo' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-textPrimary hover:bg-black/5 dark:hover:bg-white/5'"
          >
            <div class="p-2 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
              <NetworkIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col text-left">
              <span class="font-interface text-xs md:text-sm font-medium" :class="route.path === '/grafo' ? 'text-accent font-semibold' : 'text-textPrimary group-hover:text-accent'">Grafo de Conhecimento</span>
              <span class="font-interface text-[10px] md:text-xs text-textSecondary">Conexões conceituais e semânticas</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Item 3: Início (Logo Oficial Aresta -> Home) -->
      <NuxtLink
        to="/"
        class="nav-item group p-1.5 md:p-2"
        :class="{ 'nav-item-active': isHomeActive }"
        title="Início"
        aria-label="Ir para o Início"
      >
        <ArestaLogoGraph :size="28" class="sm:hidden" use-image :to="null" />
        <ArestaLogoGraph :size="32" class="hidden sm:inline-flex" use-image :to="null" />
      </NuxtLink>

      <!-- Item 4: Revisão -->
      <NuxtLink
        to="/revisao"
        class="nav-item group"
        :class="{ 'nav-item-active': isReviewActive }"
        title="Revisão (Flashcards & Resumos)"
        aria-label="Revisão"
      >
        <LayersIcon
          class="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 group-hover:scale-110"
          :class="isReviewActive ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
        />
        <span class="hidden md:inline font-interface text-xs md:text-sm font-medium tracking-tight">Revisão</span>
      </NuxtLink>

      <!-- Item 5: Conta -->
      <NuxtLink
        to="/conta"
        class="nav-item group"
        :class="{ 'nav-item-active': isAccountActive }"
        title="Sua Conta & Status Pro"
        aria-label="Conta"
      >
        <UserIcon
          class="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 group-hover:scale-110"
          :class="isAccountActive ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
        />
        <span class="hidden md:inline font-interface text-xs md:text-sm font-medium tracking-tight">Conta</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  FileCode2Icon,
  FileTextIcon,
  BookOpenIcon,
  BookIcon,
  NetworkIcon,
  ShoppingBagIcon,
  LayoutGridIcon,
  LayersIcon,
  UserIcon,
  ChevronUpIcon,
} from 'lucide-vue-next'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import { useAuth } from '~/composables/useAuth'

const auth = useAuth()
const route = useRoute()

const isVisible = computed(() => {
  if (!auth?.isLoggedIn?.value) return false
  const path = route?.path || ''
  if (path.startsWith('/reader')) return false
  if (path.startsWith('/canvas/') && path !== '/canvas') return false
  return true
})

watch(
  () => auth?.isLoggedIn?.value,
  (loggedIn) => {
    if (!loggedIn) {
      isBooksOpen.value = false
      isNotesOpen.value = false
    }
  }
)

const isBooksOpen = ref(false)
const isNotesOpen = ref(false)
const booksMenuRef = ref<HTMLElement | null>(null)
const notesMenuRef = ref<HTMLElement | null>(null)

// Rotas ativas com destaque visual
const isHomeActive = computed(() => {
  return (route?.path || '') === '/'
})

const isMyBooksActive = computed(() => {
  const path = route?.path || ''
  return path.startsWith('/library') || path.startsWith('/upload') || path.startsWith('/livros')
})

const isBooksActive = computed(() => {
  const path = route?.path || ''
  return isMyBooksActive.value || path.startsWith('/conversor') || path.startsWith('/loja')
})

const isCanvasActive = computed(() => {
  const path = route?.path || ''
  return path === '/canvas' || path.startsWith('/notes')
})

const isNotesActive = computed(() => {
  const path = route?.path || ''
  return isCanvasActive.value || path.startsWith('/grafo')
})

const isReviewActive = computed(() => {
  const path = route?.path || ''
  return path.startsWith('/revisao') || path.startsWith('/curva-do-esquecimento')
})

const isAccountActive = computed(() => {
  const path = route?.path || ''
  return path.startsWith('/conta') || path.startsWith('/users') || path.startsWith('/admin')
})

// Fechar dropdowns de livros e notas ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (booksMenuRef.value && !booksMenuRef.value.contains(e.target as Node)) {
    isBooksOpen.value = false
  }
  if (notesMenuRef.value && !notesMenuRef.value.contains(e.target as Node)) {
    isNotesOpen.value = false
  }
}

// Fechar dropdowns ao navegar
watch(
  () => route?.path,
  () => {
    isBooksOpen.value = false
    isNotesOpen.value = false
  }
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  color: var(--text-secondary, #6B7280);
  transition: all 0.25s ease;
  font-family: 'Inter', sans-serif;
  user-select: none;
  border: 1px solid transparent;
  cursor: pointer;
}

@media (max-width: 767px) {
  .nav-item {
    padding: 0.5rem;
  }
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: rgba(125, 125, 125, 0.08);
}

.nav-item-active {
  color: var(--accent, #E57B55) !important;
  background-color: rgba(229, 123, 85, 0.12);
  border: 1px solid rgba(229, 123, 85, 0.35);
  box-shadow: 0 0 14px rgba(229, 123, 85, 0.18);
  font-weight: 600;
}
</style>
