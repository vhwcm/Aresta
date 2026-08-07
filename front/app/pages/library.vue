<template>
  <div class="flex flex-col gap-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header: Title and Tabs -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-2">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <BookIcon class="w-3.5 h-3.5" />
          Acervo da Aresta
        </div>
        <h1 class="font-editorial text-5xl font-light text-textPrimary leading-tight">
          Biblioteca & Estante
        </h1>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center bg-white/5 p-1 rounded-full border border-divider w-max">
        <button 
          @click="activeTab = 'catalog'"
          class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'catalog' ? 'bg-white text-black shadow-lg' : 'text-textSecondary hover:text-white'"
        >
          <CompassIcon class="w-4 h-4" />
          Catálogo Geral
        </button>
        <button 
          @click="handleSelectMyBooksTab"
          class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'my-books' ? 'bg-white text-black shadow-lg' : 'text-textSecondary hover:text-white'"
        >
          <LibraryIcon class="w-4 h-4" />
          Minha Estante
        </button>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Catálogo Geral View (Todos os Livros do Banco) -->
    <section v-if="activeTab === 'catalog'" class="flex flex-col gap-10 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-editorial text-2xl text-textPrimary font-light">Todos os Livros do Acervo</h2>
          <p class="text-xs text-textSecondary font-interface mt-1">
            Escolha qualquer livro para adicionar à sua estante pessoal e sincronizar com o Mapa Mental.
          </p>
        </div>
        <span class="text-xs font-technical text-textSecondary bg-white/5 border border-divider px-3 py-1 rounded-full">
          {{ catalogBooks.length }} Obras Disponíveis
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="catalogLoading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse border border-divider"></div>
      </div>

      <!-- Grid de Livros do Catálogo -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div 
          v-for="book in catalogBooks" 
          :key="book.id" 
          class="flex flex-col gap-4 group relative bg-bgPanel/60 border border-divider rounded-2xl p-4 hover:border-accent/50 transition-all duration-300 shadow-xl"
        >
          <!-- Capa do Livro -->
          <div class="aspect-[2/3] bg-white/5 border border-divider rounded-xl overflow-hidden relative shadow-lg group-hover:scale-[1.02] transition-transform duration-500">
            <img 
              v-if="book.coverPath" 
              :src="getCoverUrl(book.coverPath, book.id)" 
              :alt="book.title" 
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center p-4 text-center">
              <span class="font-editorial text-lg text-white/60 line-clamp-3">{{ book.title }}</span>
            </div>

            <!-- Overlay de Ação ao Passar o Mouse -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 gap-2">
              <NuxtLink 
                :to="`/reader?bookId=${book.id}`" 
                class="w-full bg-white text-black font-interface text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
              >
                <BookOpenIcon class="w-3.5 h-3.5" /> Ler Agora
              </NuxtLink>
            </div>
          </div>

          <!-- Informações e Botão de Pegar / Remover -->
          <div class="flex flex-col gap-2 flex-1 justify-between">
            <h3 class="font-editorial text-lg font-light text-textPrimary leading-snug group-hover:text-accent transition-colors line-clamp-2">
              {{ book.title }}
            </h3>

            <div class="pt-2 border-t border-divider/60">
              <!-- Se o usuário já pegou este livro -->
              <div v-if="isBookInShelf(book.id)" class="flex flex-col gap-2">
                <div class="flex items-center gap-1.5 text-[10px] font-technical uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full w-max">
                  <CheckCircleIcon class="w-3 h-3" /> Na sua estante
                </div>
                <button 
                  @click="handleRemoveFromShelf(book.id)" 
                  class="w-full text-[11px] text-rose-400 hover:text-rose-300 font-technical hover:underline flex items-center justify-center gap-1 py-1"
                >
                  <TrashIcon class="w-3 h-3" /> Remover da Estante
                </button>
              </div>

              <!-- Se ainda não pegou -->
              <button 
                v-else 
                @click="handleTakeBook(book.id)" 
                class="w-full bg-accent/20 hover:bg-accent text-accent hover:text-white border border-accent/40 font-interface text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <PlusIcon class="w-3.5 h-3.5" /> Pegar Livro
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- My Books View (Estante Pessoal do Usuário Logado) -->
    <section v-else class="flex flex-col gap-10 animate-in fade-in duration-500">
      
      <!-- Card de Status do Usuário -->
      <div v-if="auth.isLoggedIn.value" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2 shadow-lg">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Lendo Atualmente</span>
          <span class="font-editorial text-4xl text-textPrimary">{{ countByStatus('LENDO') }}</span>
        </div>
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2 shadow-lg">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Livros Concluídos</span>
          <span class="font-editorial text-4xl text-textPrimary">{{ countByStatus('LIDO') }}</span>
        </div>
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2 shadow-lg">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Total na sua Estante</span>
          <span class="font-editorial text-4xl text-accent">{{ userBooks.length }}</span>
        </div>
      </div>

      <!-- Filtros por Status -->
      <div class="flex items-center gap-3 border-b border-divider pb-4">
        <span class="text-xs font-technical uppercase font-bold text-textSecondary">Filtrar:</span>
        <button 
          v-for="filter in ['TODOS', 'LENDO', 'LIDO', 'QUERO_LER']" 
          :key="filter"
          @click="statusFilter = filter"
          class="px-3 py-1 rounded-xl text-xs font-technical transition-all"
          :class="statusFilter === filter ? 'bg-accent text-white font-bold shadow' : 'bg-white/5 text-textSecondary hover:text-white'"
        >
          {{ getFilterLabel(filter) }}
        </button>
      </div>

      <!-- Lista da Estante -->
      <div v-if="filteredUserBooks.length > 0" class="flex flex-col gap-4">
        <div 
          v-for="item in filteredUserBooks" 
          :key="item.userBookId" 
          class="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-divider rounded-2xl p-6 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-6 shadow-lg"
        >
          <!-- Capa -->
          <div class="w-16 h-24 shrink-0 rounded-xl border border-divider overflow-hidden bg-white/5 shadow-md flex items-center justify-center">
            <img v-if="item.coverPath" :src="getCoverUrl(item.coverPath, item.bookId)" class="w-full h-full object-cover" />
            <BookOpenIcon v-else class="w-6 h-6 text-textSecondary" />
          </div>

          <!-- Conteúdo -->
          <div class="flex-1 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="font-editorial text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">{{ item.title }}</h3>
              </div>

              <!-- Seletor de Status -->
              <select 
                :value="item.status" 
                @change="handleStatusChange(item.userBookId, ($event.target as HTMLSelectElement).value, item.currentPage)"
                class="bg-bgApp border border-divider rounded-xl px-3 py-1.5 text-xs text-textPrimary font-technical focus:outline-none focus:border-accent"
              >
                <option value="LENDO">📖 Lendo</option>
                <option value="LIDO">✅ Lido</option>
                <option value="QUERO_LER">📌 Quero Ler</option>
                <option value="ABANDONADO">⏸️ Abandonado</option>
              </select>
            </div>

            <!-- Progresso de Página -->
            <div class="flex items-center gap-4 text-xs font-technical text-textSecondary">
              <span>Página Atual:</span>
              <input 
                type="number" 
                :value="item.currentPage" 
                min="0"
                @change="handlePageChange(item.userBookId, item.status, Number(($event.target as HTMLInputElement).value))"
                class="w-20 bg-bgApp border border-divider rounded-lg px-2 py-1 text-xs text-textPrimary text-center focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <!-- Ações -->
          <div class="flex items-center gap-3 shrink-0">
            <NuxtLink 
              :to="`/reader?bookId=${item.bookId}&page=${item.currentPage}`" 
              class="px-4 py-2.5 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all shadow-md flex items-center gap-2"
              title="Ler Livro"
            >
              <BookOpenIcon class="w-4 h-4" />
              <span>Ler Livro</span>
            </NuxtLink>

            <NuxtLink 
              to="/grafo" 
              class="p-3 rounded-xl bg-white/5 border border-divider text-textSecondary hover:text-white transition-all"
              title="Ver no Mapa Mental"
            >
              <NetworkIcon class="w-4 h-4" />
            </NuxtLink>

            <button 
              @click="handleDeleteFromShelf(item.userBookId)" 
              class="p-3 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Remover da Estante"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Estado Vazio -->
      <div v-else class="text-center py-16 border border-dashed border-divider rounded-3xl flex flex-col items-center gap-4">
        <LibraryIcon class="w-10 h-10 text-textSecondary/40" />
        <h3 class="font-editorial text-xl text-textPrimary font-light">Sua estante está vazia nesta categoria</h3>
        <p class="text-xs text-textSecondary font-interface">
          Acesse a aba <strong>Catálogo Geral</strong> para pegar livros e adicioná-los à sua biblioteca.
        </p>
        <button @click="activeTab = 'catalog'" class="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all">
          Explorar Catálogo
        </button>
      </div>
    </section>

    <!-- Modal de Convite ao Login -->
    <div v-if="isLoginModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="bg-bgPanel border border-divider rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 text-textPrimary text-center">
        <div class="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center mx-auto">
          <LogInIcon class="w-6 h-6" />
        </div>

        <div class="space-y-2">
          <h3 class="text-xl font-bold font-editorial">Faça Login para Pegar Livros</h3>
          <p class="text-xs text-textSecondary font-interface leading-relaxed">
            Para montar sua estante pessoal, acompanhar seu progresso de leitura e gerar seu Mapa Mental de conhecimento, entre com sua conta.
          </p>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button @click="isLoginModalOpen = false" class="px-5 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-white transition-all">
            Continuar Explorando
          </button>
          <NuxtLink to="/login" class="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-lg">
            Fazer Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  BookIcon, 
  CompassIcon, 
  LibraryIcon, 
  PlusIcon,
  PlayIcon,
  NetworkIcon,
  CheckCircleIcon,
  TrashIcon,
  Trash2Icon,
  BookOpenIcon,
  LogInIcon
} from 'lucide-vue-next'

import { useCatalog } from '~/composables/useCatalog'
import { useUserBooks } from '~/composables/useUserBooks'
import { useAuth } from '~/composables/useAuth'
import { getCoverUrl } from '~/utils/cover'

const activeTab = ref<'catalog' | 'my-books'>('catalog')
const statusFilter = ref('TODOS')
const isLoginModalOpen = ref(false)

const { books: catalogBooks, loading: catalogLoading, fetchCatalog } = useCatalog()
const { userBooks, fetchUserBooks, addUserBook, updateUserBook, deleteUserBook, deleteUserBookByBookId, isBookInShelf } = useUserBooks()
const auth = useAuth()

const handleSelectMyBooksTab = () => {
  if (!auth.isLoggedIn.value) {
    isLoginModalOpen.value = true
    return
  }
  activeTab.value = 'my-books'
}

const handleTakeBook = async (bookId: number) => {
  if (!auth.isLoggedIn.value) {
    isLoginModalOpen.value = true
    return
  }
  await addUserBook(bookId, 'QUERO_LER', 0)
}

const handleRemoveFromShelf = async (bookId: number) => {
  if (confirm('Tem certeza que deseja remover este livro da sua estante?')) {
    await deleteUserBookByBookId(bookId)
  }
}

const handleDeleteFromShelf = async (userBookId: number) => {
  if (confirm('Tem certeza que deseja remover este livro da sua estante?')) {
    await deleteUserBook(userBookId)
  }
}

const handleStatusChange = async (userBookId: number, status: string, page: number) => {
  await updateUserBook(userBookId, status, page)
}

const handlePageChange = async (userBookId: number, status: string, page: number) => {
  await updateUserBook(userBookId, status, page)
}

const countByStatus = (status: string) => {
  return userBooks.value.filter(b => b.status === status).length
}

const filteredUserBooks = computed(() => {
  if (statusFilter.value === 'TODOS') return userBooks.value
  return userBooks.value.filter(b => b.status === statusFilter.value)
})

const getFilterLabel = (filter: string) => {
  switch (filter) {
    case 'TODOS': return 'Todos'
    case 'LENDO': return 'Lendo'
    case 'LIDO': return 'Lidos'
    case 'QUERO_LER': return 'Quero Ler'
    default: return filter
  }
}

onMounted(() => {
  fetchCatalog()
  if (auth.isLoggedIn.value) {
    fetchUserBooks()
  }
})
</script>
