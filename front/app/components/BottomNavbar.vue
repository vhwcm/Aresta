<template>
  <div
    class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto"
    role="navigation"
    aria-label="Navegação Principal"
  >
    <!-- Container Principal da Navbar com transição suave de expansão lateral -->
    <nav
      class="relative flex items-center h-14 md:h-16 rounded-2xl bg-[#16171a]/90 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] transition-all duration-300 ease-in-out"
      :class="[
        isCollapsed
          ? 'w-14 md:w-16 px-0 justify-center'
          : 'w-[94vw] max-w-[620px] md:max-w-[700px] px-2.5 md:px-4 justify-between'
      ]"
    >
      <!-- ESTADO COLAPSADO (Modo Mínimo / Retraído - Ícone Unificado do Aresta) -->
      <template v-if="isCollapsed">
        <button
          @click="toggleCollapse"
          class="flex items-center justify-center w-full h-full p-2 rounded-2xl hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 group"
          title="Aresta - Início / Expandir Menu"
          aria-label="Aresta - Início / Expandir Menu"
        >
          <ArestaLogoGraph :size="32" :to="null" />
        </button>
      </template>

      <!-- ESTADO EXPANDIDO (Modo Completo) -->
      <template v-else>
        <!-- Item 1: Conversor -->
        <NuxtLink
          to="/conversor"
          class="nav-item group"
          :class="{ 'nav-item-active': route.path.startsWith('/conversor') }"
          title="Conversor de PDF para EPUB"
        >
          <FileCode2Icon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
          <span class="hidden md:inline font-interface text-xs font-medium tracking-tight">Conversor</span>
        </NuxtLink>

        <!-- Item 2: Livros (Menu Dropdown com Meus Livros, Grafo e Loja) -->
        <div class="relative" ref="booksMenuRef">
          <button
            @click="isBooksOpen = !isBooksOpen"
            class="nav-item group focus:outline-none"
            :class="{
              'nav-item-active': isBooksActive || isBooksOpen
            }"
            title="Menu de Livros"
            aria-haspopup="true"
            :aria-expanded="isBooksOpen"
          >
            <BookOpenIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span class="hidden md:inline font-interface text-xs font-medium tracking-tight">Livros</span>
            <ChevronUpIcon
              class="w-3 h-3 text-textSecondary transition-transform duration-200"
              :class="{ 'rotate-180': isBooksOpen }"
            />
          </button>

          <!-- Dropdown Flutuante de Livros (Um debaixo do outro) -->
          <div
            v-if="isBooksOpen"
            class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-2 rounded-2xl bg-[#141518]/95 backdrop-blur-xl border border-divider shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            <!-- 1. Meus Livros -->
            <NuxtLink
              to="/library"
              @click="isBooksOpen = false"
              class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              :class="{ 'bg-white/10 text-white': route.path === '/library' }"
            >
              <div class="p-1.5 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
                <BookIcon class="w-4 h-4" />
              </div>
              <div class="flex flex-col text-left">
                <span class="font-interface text-xs font-medium text-textPrimary group-hover:text-white">Meus Livros</span>
                <span class="font-interface text-[10px] text-textSecondary">Sua estante pessoal</span>
              </div>
            </NuxtLink>

            <!-- 2. Grafo de Conhecimento -->
            <NuxtLink
              to="/grafo"
              @click="isBooksOpen = false"
              class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              :class="{ 'bg-white/10 text-white': route.path === '/grafo' }"
            >
              <div class="p-1.5 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
                <NetworkIcon class="w-4 h-4" />
              </div>
              <div class="flex flex-col text-left">
                <span class="font-interface text-xs font-medium text-textPrimary group-hover:text-white">Grafo de Conhecimento</span>
                <span class="font-interface text-[10px] text-textSecondary">Conexões conceituais</span>
              </div>
            </NuxtLink>

            <!-- 3. Loja / Catálogo -->
            <NuxtLink
              to="/loja"
              @click="isBooksOpen = false"
              class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              :class="{ 'bg-white/10 text-white': route.path === '/loja' }"
            >
              <div class="p-1.5 rounded-lg bg-accent/15 text-accent group-hover:scale-105 transition-transform">
                <ShoppingBagIcon class="w-4 h-4" />
              </div>
              <div class="flex flex-col text-left">
                <span class="font-interface text-xs font-medium text-textPrimary group-hover:text-white">Loja & Catálogo</span>
                <span class="font-interface text-[10px] text-textSecondary">Descubra novas obras</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Item 3: Logo Central (Grafo Vivo -> Home) -->
        <div class="flex items-center justify-center px-1">
          <ArestaLogoGraph :size="34" />
        </div>

        <!-- Item 4: Revisão -->
        <NuxtLink
          to="/revisao"
          class="nav-item group"
          :class="{ 'nav-item-active': route.path.startsWith('/revisao') }"
          title="Revisão (Flashcards & Resumos)"
        >
          <SparklesIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
          <span class="hidden md:inline font-interface text-xs font-medium tracking-tight">Revisão</span>
        </NuxtLink>

        <!-- Item 5: Conta -->
        <NuxtLink
          to="/conta"
          class="nav-item group"
          :class="{ 'nav-item-active': route.path.startsWith('/conta') }"
          title="Sua Conta & Status Pro"
        >
          <UserIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
          <span class="hidden md:inline font-interface text-xs font-medium tracking-tight">Conta</span>
        </NuxtLink>

        <!-- Botão de Colapso / Minimizar -->
        <button
          @click="toggleCollapse"
          class="p-2 rounded-xl text-textSecondary hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          title="Minimizar barra"
          aria-label="Minimizar barra de navegação"
        >
          <Minimize2Icon class="w-3.5 h-3.5" />
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  FileCode2Icon,
  BookOpenIcon,
  BookIcon,
  NetworkIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserIcon,
  ChevronUpIcon,
  Minimize2Icon
} from 'lucide-vue-next'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'

const route = useRoute()

// Estado de colapso
// No desktop: começa expandida (isCollapsed = false)
// No mobile: começa retraída (isCollapsed = true)
const isCollapsed = ref(false)
const isBooksOpen = ref(false)
const booksMenuRef = ref<HTMLElement | null>(null)

const isBooksActive = computed(() => {
  return route.path.startsWith('/library') || route.path.startsWith('/grafo') || route.path.startsWith('/loja')
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    isBooksOpen.value = false
  }
}

// Fechar dropdown de livros ao clicar fora
const handleClickOutside = (e: MouseEvent) => {
  if (booksMenuRef.value && !booksMenuRef.value.contains(e.target as Node)) {
    isBooksOpen.value = false
  }
}

// Auto-recolher no mobile ao trocar de rota para maximizar espaço de leitura
watch(
  () => route.path,
  () => {
    isBooksOpen.value = false
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      isCollapsed.value = true
    }
  }
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    // Definir estado inicial baseado na largura da tela
    if (window.innerWidth < 768) {
      isCollapsed.value = true
    } else {
      isCollapsed.value = false
    }
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
  color: #a0a3aa;
  transition: all 0.25s ease;
  font-family: 'Inter', sans-serif;
  user-select: none;
}

@media (max-width: 767px) {
  .nav-item {
    padding: 0.5rem;
  }
}

.nav-item:hover {
  color: #f2f2f2;
  background-color: rgba(255, 255, 255, 0.06);
}

.nav-item-active {
  color: #ffffff;
  background-color: rgba(229, 123, 85, 0.15);
  border: 1px solid rgba(229, 123, 85, 0.35);
  box-shadow: 0 0 12px rgba(229, 123, 85, 0.2);
}
</style>
