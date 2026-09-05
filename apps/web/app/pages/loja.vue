<template>
  <div class="flex flex-col gap-12 pb-16">
    <!-- Header Editorial da Loja/Catálogo -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
          <ShoppingBagIcon class="w-3.5 h-3.5" />
          Acervo Intelectual Curado
        </div>
        <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
          Loja & Catálogo Aberto
        </h1>
        <p class="font-interface text-textSecondary text-base max-w-2xl leading-relaxed">
          Obras clássicas, tratados de filosofia da ciência e tesouros de domínio público catalogados para leitura e síntese no Aresta.
        </p>
      </div>

      <!-- Filtro por Categoria -->
      <div class="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-2xl border border-divider">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="px-4 py-1.5 rounded-xl font-interface text-xs font-medium transition-all"
          :class="selectedCategory === cat ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'"
        >
          {{ cat }}
        </button>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Destaque da Semana -->
    <section v-if="featuredBook" class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent/15 via-black/[0.02] dark:via-white/[0.03] to-transparent border border-accent/30 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
      <div class="w-32 md:w-44 h-48 md:h-64 rounded-2xl bg-bgPanel border border-divider shadow-2xl flex flex-col items-center justify-center p-4 text-center shrink-0">
        <BookOpenIcon class="w-10 h-10 text-accent mb-2" />
        <span class="font-editorial text-sm font-semibold text-textPrimary line-clamp-3">{{ featuredBook.title }}</span>
        <span class="font-interface text-[10px] text-textSecondary mt-1">{{ featuredBook.author }}</span>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-technical text-[10px] font-semibold uppercase tracking-wider">
            Destaque do Mês
          </span>
          <span class="font-technical text-[11px] text-textSecondary">Domínio Público · Edição Crítica</span>
        </div>

        <h2 class="font-editorial text-3xl md:text-4xl font-light text-textPrimary leading-tight">
          {{ featuredBook.title }}
        </h2>
        <p class="font-interface text-textSecondary text-sm leading-relaxed max-w-xl">
          {{ featuredBook.description }}
        </p>

        <div class="flex items-center gap-4 pt-2">
          <button
            @click="addToLibrary(featuredBook)"
            class="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-interface font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <PlusIcon class="w-4 h-4" />
            Adicionar à Minha Estante
          </button>
          <button
            @click="openPreview(featuredBook)"
            class="px-5 py-2.5 rounded-xl border border-divider hover:bg-white/5 text-textPrimary text-xs font-interface transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </section>

    <!-- Grade de Livros do Catálogo -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h3 class="font-editorial text-2xl font-light text-textPrimary">
          {{ selectedCategory === 'Todos' ? 'Todas as Obras Disponíveis' : `Categoria: ${selectedCategory}` }}
        </h3>
        <span class="font-technical text-xs text-textSecondary">
          {{ filteredBooks.length }} títulos encontrados
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="book in filteredBooks"
          :key="book.id"
          class="flex flex-col justify-between p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-divider hover:border-white/20 transition-all duration-300 group"
        >
          <div class="flex gap-4">
            <!-- Capa Miniatura -->
            <div class="w-16 h-24 rounded-xl bg-white/5 border border-divider flex flex-col items-center justify-center p-2 text-center shrink-0 group-hover:border-accent/40 transition-colors">
              <BookIcon class="w-6 h-6 text-accent" />
            </div>

            <!-- Metadados -->
            <div class="flex flex-col gap-1">
              <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold">
                {{ book.category }}
              </span>
              <h4 class="font-editorial text-lg text-textPrimary font-light group-hover:text-accent transition-colors line-clamp-2">
                {{ book.title }}
              </h4>
              <span class="font-interface text-xs text-textSecondary">{{ book.author }}</span>
            </div>
          </div>

          <p class="font-interface text-xs text-textSecondary mt-3 line-clamp-2 leading-relaxed">
            {{ book.description }}
          </p>

          <div class="flex items-center justify-between pt-4 mt-4 border-t border-divider text-xs">
            <span class="font-technical text-[10px] text-textSecondary">{{ book.pages }} págs · {{ book.language }}</span>

            <button
              @click="addToLibrary(book)"
              class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-accent hover:text-white text-textPrimary border border-divider hover:border-accent/40 font-interface text-xs transition-all flex items-center gap-1.5"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de Pré-visualização do Livro -->
    <div
      v-if="selectedBook"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      @click.self="selectedBook = null"
    >
      <div class="max-w-lg w-full p-8 rounded-3xl bg-bgPanel border border-divider shadow-2xl flex flex-col gap-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-md bg-accent/20 text-accent font-technical text-[10px] font-semibold uppercase">
              {{ selectedBook.category }}
            </span>
          </div>
          <button @click="selectedBook = null" class="p-1 rounded-lg text-textSecondary hover:text-textPrimary">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="font-editorial text-3xl text-textPrimary">{{ selectedBook.title }}</h3>
          <p class="font-interface text-sm text-accent">{{ selectedBook.author }}</p>
        </div>

        <p class="font-interface text-xs text-textSecondary leading-relaxed">
          {{ selectedBook.description }}
        </p>

        <div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 text-center font-technical text-xs">
          <div>
            <span class="text-[10px] text-textSecondary block">Páginas</span>
            <span class="text-textPrimary font-semibold">{{ selectedBook.pages }}</span>
          </div>
          <div>
            <span class="text-[10px] text-textSecondary block">Ano Original</span>
            <span class="text-textPrimary font-semibold">{{ selectedBook.year }}</span>
          </div>
          <div>
            <span class="text-[10px] text-textSecondary block">Licença</span>
            <span class="text-textPrimary font-semibold">Livre</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button
            @click="selectedBook = null"
            class="px-4 py-2 rounded-xl text-xs text-textSecondary hover:text-textPrimary"
          >
            Fechar
          </button>
          <button
            @click="addToLibrary(selectedBook); selectedBook = null"
            class="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <PlusIcon class="w-4 h-4" />
            Adicionar à Minha Estante
          </button>
        </div>
      </div>
    </div>

    <!-- Toast de Notificação -->
    <div
      v-if="toastMessage"
      class="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-interface shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300"
    >
      <CheckCircle2Icon class="w-4 h-4 text-emerald-400" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ShoppingBagIcon,
  BookOpenIcon,
  BookIcon,
  PlusIcon,
  XIcon,
  CheckCircle2Icon
} from 'lucide-vue-next'

interface StoreBook {
  id: string
  title: string
  author: string
  category: string
  description: string
  pages: number
  year: number
  language: string
}

const categories = ['Todos', 'Filosofia', 'Ciência', 'Design & Cognição', 'Clássicos']
const selectedCategory = ref('Todos')
const selectedBook = ref<StoreBook | null>(null)
const toastMessage = ref('')

const books = ref<StoreBook[]>([
  {
    id: 'sapiens',
    title: 'Sapiens: Uma Breve História da Humanidade',
    author: 'Yuval Noah Harari',
    category: 'Ciência',
    description: 'Como uma espécie insignificante de macaco se tornou o governante do planeta Terra através de mitos compartilhados e revoluções cognitivas.',
    pages: 464,
    year: 2011,
    language: 'Português'
  },
  {
    id: 'kuhn-paradigma',
    title: 'A Estrutura das Revoluções Científicas',
    author: 'Thomas S. Kuhn',
    category: 'Ciência',
    description: 'O clássico marco da epistemologia moderna que introduziu o conceito de mudança de paradigmas nas revoluções científicas.',
    pages: 352,
    year: 1962,
    language: 'Português'
  },
  {
    id: 'design-things',
    title: 'O Design do Dia a Dia',
    author: 'Don Norman',
    category: 'Design & Cognição',
    description: 'Um estudo fundamental sobre affordances, modelos mentais e como o design centrado no ser humano molda a usabilidade do mundo moderno.',
    pages: 368,
    year: 1988,
    language: 'Português'
  },
  {
    id: 'meditations-marcus',
    title: 'Meditações',
    author: 'Marco Aurélio',
    category: 'Filosofia',
    description: 'Diários pessoais do imperador filósofo de Roma sobre estoicismo, disciplina, autodomínio e a brevidade da vida.',
    pages: 220,
    year: 180,
    language: 'Português'
  },
  {
    id: 'republica-platao',
    title: 'A República',
    author: 'Platão',
    category: 'Filosofia',
    description: 'O diálogo socrático basilar sobre justiça, a ordem da cidade-estado ideal e a famosa alegoria da caverna.',
    pages: 416,
    year: -375,
    language: 'Português'
  },
  {
    id: 'metamorfose-kafka',
    title: 'A Metamorfose',
    author: 'Franz Kafka',
    category: 'Clássicos',
    description: 'A narrativa alegórica sobre Gregor Samsa, que acorda transformado em um inseto monstruoso e enfrenta a alienação humana.',
    pages: 112,
    year: 1915,
    language: 'Português'
  }
])

const featuredBook = computed(() => books.value[1]) // Kuhn

const filteredBooks = computed(() => {
  if (selectedCategory.value === 'Todos') return books.value
  return books.value.filter((b) => b.category === selectedCategory.value)
})

const openPreview = (book: StoreBook) => {
  selectedBook.value = book
}

const addToLibrary = (book: StoreBook) => {
  toastMessage.value = `"${book.title}" adicionado à sua estante com sucesso!`
  setTimeout(() => {
    toastMessage.value = ''
  }, 3500)
}
</script>
