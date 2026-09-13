<template>
  <div
    v-if="isVisible"
    class="app-navbar-wrapper fixed z-50 transition-all duration-300 pointer-events-auto bottom-0 left-0 right-0 w-full bg-bgPanel border-t border-divider shadow-[0_-4px_24px_rgba(0,0,0,0.12)] lg:bottom-auto lg:right-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-3 lg:w-auto lg:h-auto lg:rounded-3xl lg:border lg:shadow-2xl md:landscape:bottom-auto md:landscape:right-auto md:landscape:top-1/2 md:landscape:-translate-y-1/2 md:landscape:left-3 md:landscape:w-auto md:landscape:h-auto md:landscape:rounded-3xl md:landscape:border md:landscape:shadow-2xl"
    role="navigation"
    aria-label="Navegação Principal"
  >
    <!-- Container Principal da Navbar Fixa -->
    <nav
      class="app-nav relative flex items-center justify-around md:justify-center md:gap-6 h-14 md:h-16 max-w-4xl mx-auto px-2 sm:px-4 lg:flex-col lg:h-auto lg:w-auto lg:p-2 lg:gap-2.5 lg:mx-0 md:landscape:flex-col md:landscape:h-auto md:landscape:w-auto md:landscape:p-2 md:landscape:gap-2.5 md:landscape:mx-0"
    >
      <!-- Item: Início (Logo Oficial Aresta -> Home) - topo no modo lateral -->
      <NuxtLink
        to="/"
        class="nav-item group app-nav-logo lg:order-first md:landscape:order-first"
        :class="{ 'nav-item-active': isHomeActive }"
        title="Início"
        aria-label="Ir para o Início"
      >
        <ArestaLogoGraph :size="26" class="transition-transform duration-200 group-hover:scale-110" use-image :to="null" />
      </NuxtLink>

      <!-- Item: Livros (Dropdown: Meus Livros, Conversor, Loja) -->
      <div class="relative" ref="booksMenuRef">
        <button
          @click="isBooksOpen = !isBooksOpen"
          class="nav-item group focus:outline-none"
          :class="{
            'nav-item-active': isBooksActive || isBooksOpen
          }"
          title="Menu de Livros"
          aria-label="Menu de Livros"
          aria-haspopup="true"
          :aria-expanded="isBooksOpen"
        >
          <BookOpenIcon
            class="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
            :class="(isBooksActive || isBooksOpen) ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
          />
        </button>

        <!-- Dropdown Flutuante de Livros -->
        <div
          v-if="isBooksOpen"
          class="app-dropdown-books absolute bottom-full mb-3 left-0 sm:left-1/2 sm:-translate-x-1/2 lg:bottom-auto lg:top-0 lg:left-full lg:ml-3 lg:translate-x-0 lg:mb-0 md:landscape:bottom-auto md:landscape:top-0 md:landscape:left-full md:landscape:ml-3 md:landscape:translate-x-0 md:landscape:mb-0 w-60 md:w-64 p-2 rounded-2xl bg-bgPanel border border-divider shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
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

      <!-- Item: Anotações (Link direto para /canvas) -->
      <NuxtLink
        to="/canvas"
        class="nav-item group focus:outline-none"
        :class="{
          'nav-item-active': isCanvasActive
        }"
        title="Anotações"
        aria-label="Anotações"
      >
        <FileTextIcon
          class="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
          :class="isCanvasActive ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
        />
      </NuxtLink>

      <!-- Item: Revisão -->
      <NuxtLink
        to="/revisao"
        class="nav-item group"
        :class="{ 'nav-item-active': isReviewActive }"
        title="Revisão (Flashcards & Resumos)"
        aria-label="Revisão"
      >
        <LayersIcon
          class="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
          :class="isReviewActive ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
        />
      </NuxtLink>

      <!-- Item: Conta -->
      <NuxtLink
        to="/conta"
        class="nav-item group"
        :class="{ 'nav-item-active': isAccountActive }"
        title="Sua Conta & Status Pro"
        aria-label="Conta"
      >
        <UserIcon
          class="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
          :class="isAccountActive ? 'text-accent' : 'text-textSecondary group-hover:text-textPrimary'"
        />
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
  ShoppingBagIcon,
  LayersIcon,
  UserIcon,
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
    }
  }
)

const isBooksOpen = ref(false)
const booksMenuRef = ref<HTMLElement | null>(null)

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

const isReviewActive = computed(() => {
  const path = route?.path || ''
  return path.startsWith('/revisao') || path.startsWith('/curva-do-esquecimento')
})

const isAccountActive = computed(() => {
  const path = route?.path || ''
  return path.startsWith('/conta') || path.startsWith('/users') || path.startsWith('/admin')
})

// Fechar dropdown de livros ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (booksMenuRef.value && !booksMenuRef.value.contains(e.target as Node)) {
    isBooksOpen.value = false
  }
}

// Fechar dropdown ao navegar
watch(
  () => route?.path,
  () => {
    isBooksOpen.value = false
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
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0.5rem;
  border-radius: 0.875rem;
  color: var(--text-secondary, #7A7D84);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  border: 1px solid transparent;
  cursor: pointer;
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: rgba(125, 125, 125, 0.12);
  transform: scale(1.06);
}

.nav-item-active {
  color: var(--accent, #E57B55) !important;
  background-color: rgba(229, 123, 85, 0.14) !important;
  border: 1px solid rgba(229, 123, 85, 0.4) !important;
  box-shadow: 0 0 16px rgba(229, 123, 85, 0.22) !important;
}

@media (min-width: 1024px), ((min-width: 768px) and (orientation: landscape)) {
  .nav-item-active,
  .nav-item-active:hover {
    border: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
    outline: none !important;
  }

  .app-navbar-wrapper {
    top: 50% !important;
    bottom: auto !important;
    left: 0.75rem !important;
    right: auto !important;
    transform: translateY(-50%) !important;
    width: auto !important;
    height: auto !important;
    border-radius: 1.5rem !important;
    border: 1px solid var(--divider, rgba(255, 255, 255, 0.08)) !important;
    box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
    background-color: var(--bg-panel, #121315) !important;
  }

  .app-nav {
    flex-direction: column !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    padding: 0.625rem 0.5rem !important;
    gap: 0.625rem !important;
    margin: 0 !important;
  }

  .app-dropdown-books {
    bottom: auto !important;
    top: 0 !important;
    left: 100% !important;
    margin-left: 0.75rem !important;
    margin-bottom: 0 !important;
    transform: none !important;
  }

  .app-nav-logo {
    order: -1 !important;
  }
}
</style>
