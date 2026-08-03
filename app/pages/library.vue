<template>
  <div class="flex flex-col gap-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header: Title and Tabs -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-2">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <BookIcon class="w-3.5 h-3.5" />
          Acervo
        </div>
        <h1 class="font-editorial text-5xl font-light text-textPrimary leading-tight">
          Sua Biblioteca
        </h1>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center bg-white/5 p-1 rounded-full border border-divider w-max">
        <button 
          @click="activeTab = 'recommendations'"
          class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'recommendations' ? 'bg-white text-black shadow-lg' : 'text-textSecondary hover:text-white'"
        >
          <CompassIcon class="w-4 h-4" />
          Descobrir
        </button>
        <button 
          @click="activeTab = 'my-books'"
          class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'my-books' ? 'bg-white text-black shadow-lg' : 'text-textSecondary hover:text-white'"
        >
          <LibraryIcon class="w-4 h-4" />
          Meus Livros
        </button>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Recommendations View -->
    <section v-if="activeTab === 'recommendations'" class="flex flex-col gap-16 animate-in fade-in duration-500">
      
      <!-- Destaque / Curadoria -->
      <div class="flex flex-col gap-6">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <StarIcon class="w-3.5 h-3.5 text-accent" />
          Curadoria da IA
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="relative group cursor-pointer overflow-hidden rounded-3xl border border-divider bg-bgPanel aspect-auto md:aspect-[4/3] flex items-end p-8">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500"></div>
            <!-- Mock placeholder para capa de livro, poderia usar um NuxtImg -->
            <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105"></div>
            
            <div class="relative z-20 flex flex-col gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div class="flex items-center gap-2">
                <span class="bg-accent text-white font-technical text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded">Recomendado</span>
                <span class="text-white/70 font-technical text-[10px]">Filosofia</span>
              </div>
              <h3 class="font-editorial text-3xl font-light text-white leading-tight">Meditações</h3>
              <p class="font-interface text-sm text-white/70 line-clamp-2 max-w-md">
                Diário pessoal do imperador romano Marco Aurélio, oferecendo insights atemporais sobre resiliência, estoicismo e a condição humana.
              </p>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-500 mt-2">
                <span class="font-technical text-xs text-white uppercase tracking-widest flex items-center gap-2">
                  Adicionar à biblioteca <ArrowRightIcon class="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-4 justify-center px-4">
            <h4 class="font-editorial text-2xl font-light text-textPrimary">Por que recomendamos para você?</h4>
            <p class="font-interface text-textSecondary leading-relaxed">
              Baseado na sua leitura recente de <em>"A Estrutura das Revoluções Científicas"</em>, notamos seu interesse por obras que desafiam a percepção da realidade e do eu. Marco Aurélio oferece uma abordagem prática e introspectiva que complementa a visão sistêmica de Kuhn.
            </p>
            <div class="flex gap-2 mt-2">
              <span class="bg-white/5 border border-divider px-3 py-1.5 rounded-full text-xs font-interface text-textPrimary">Estoicismo</span>
              <span class="bg-white/5 border border-divider px-3 py-1.5 rounded-full text-xs font-interface text-textPrimary">Clássicos</span>
              <span class="bg-white/5 border border-divider px-3 py-1.5 rounded-full text-xs font-interface text-textPrimary">Introspecção</span>
            </div>
          </div>
        </div>
      </div>

      <div class="h-px bg-divider w-full"></div>

      <!-- Tendências -->
      <div class="flex flex-col gap-8">
        <div class="flex items-center justify-between">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
            Em Alta na Aresta
          </div>
          <button class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary hover:text-white transition-colors">
            Ver todos
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="book in trendingBooks" :key="book.id" class="flex flex-col gap-4 group cursor-pointer">
            <div class="aspect-[2/3] bg-white/5 border border-divider rounded-xl overflow-hidden relative shadow-lg">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                <button class="bg-white text-black font-interface text-xs font-medium py-2 rounded flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <PlusIcon class="w-3 h-3" /> Adicionar
                </button>
              </div>
              <!-- Placeholder de capa com cor/gradiente gerado -->
              <div class="w-full h-full" :class="book.colorClass">
                <div class="w-full h-full flex items-center justify-center p-4 text-center opacity-30 font-editorial text-xl font-light text-white mix-blend-overlay">
                  {{ book.title }}
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <h5 class="font-editorial text-lg font-light text-textPrimary leading-tight group-hover:text-accent transition-colors line-clamp-1">{{ book.title }}</h5>
              <span class="font-interface text-xs text-textSecondary">{{ book.author }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- My Books View -->
    <section v-else class="flex flex-col gap-12 animate-in fade-in duration-500">
      
      <!-- Status Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Lendo Atualmente</span>
          <span class="font-editorial text-4xl text-textPrimary">2</span>
        </div>
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Concluídos este ano</span>
          <span class="font-editorial text-4xl text-textPrimary">14</span>
        </div>
        <div class="p-6 rounded-2xl bg-white/5 border border-divider flex flex-col gap-2">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Conhecimento (Nós)</span>
          <span class="font-editorial text-4xl text-accent">3,402</span>
        </div>
      </div>

      <!-- Lista de Leitura -->
      <div class="flex flex-col gap-8">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
          Sua Estante
        </div>

        <div class="flex flex-col gap-4">
          <div v-for="item in myBooks" :key="item.id" class="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-divider rounded-2xl p-4 sm:p-6 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-6 overflow-hidden">
            <!-- Capa do Livro em Thumbnail -->
            <div class="w-16 h-24 shrink-0 rounded-lg shadow-md overflow-hidden relative" :class="item.colorClass">
               <div class="absolute inset-0 bg-black/20"></div>
            </div>

            <!-- Info do Livro -->
            <div class="flex-1 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h4 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-white transition-colors">{{ item.title }}</h4>
                  <span class="font-interface text-sm text-textSecondary">{{ item.author }}</span>
                </div>
                <!-- Status Badge -->
                <div class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-technical uppercase tracking-wider" 
                     :class="item.status === 'reading' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-textSecondary border border-divider'">
                  <div class="w-1.5 h-1.5 rounded-full" :class="item.status === 'reading' ? 'bg-accent animate-pulse' : 'bg-textSecondary'"></div>
                  {{ item.status === 'reading' ? 'Lendo' : 'Concluído' }}
                </div>
              </div>

              <!-- Progresso (Apenas se estiver lendo) -->
              <div v-if="item.status === 'reading'" class="flex flex-col gap-1.5 mt-2">
                <div class="flex justify-between text-xs font-technical text-textSecondary">
                  <span>{{ item.progress }}% concluído</span>
                  <span>Última leitura: {{ item.lastRead }}</span>
                </div>
                <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-accent rounded-full" :style="{ width: `${item.progress}%` }"></div>
                </div>
              </div>
            </div>

            <!-- Botões de Ação na Hover (Desktop) -->
            <div class="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 hidden sm:flex">
              <button class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors" title="Continuar Leitura">
                <PlayIcon class="w-4 h-4 ml-0.5" />
              </button>
              <button class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-textSecondary hover:text-white hover:bg-white/10 transition-colors" title="Ver Grafo de Conhecimento">
                <NetworkIcon class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Ações Mobile -->
            <div class="flex gap-2 sm:hidden mt-2">
               <button class="flex-1 bg-white/10 py-2 rounded text-white text-sm font-interface hover:bg-white hover:text-black transition-colors">Continuar</button>
               <button class="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-textSecondary"><NetworkIcon class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  BookIcon, 
  CompassIcon, 
  LibraryIcon, 
  StarIcon, 
  ArrowRightIcon, 
  PlusIcon,
  PlayIcon,
  NetworkIcon
} from 'lucide-vue-next'

const activeTab = ref<'recommendations' | 'my-books'>('recommendations')

// Mock Data para Descobrir / Em Alta
const trendingBooks = [
  {
    id: 1,
    title: 'O Mal-Estar na Civilização',
    author: 'Sigmund Freud',
    colorClass: 'bg-gradient-to-br from-neutral-800 to-neutral-900',
  },
  {
    id: 2,
    title: 'O Mito de Sísifo',
    author: 'Albert Camus',
    colorClass: 'bg-gradient-to-br from-stone-700 to-stone-900',
  },
  {
    id: 3,
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    colorClass: 'bg-gradient-to-br from-slate-800 to-slate-900',
  },
  {
    id: 4,
    title: 'A Vida Não É Útil',
    author: 'Ailton Krenak',
    colorClass: 'bg-gradient-to-br from-emerald-900/80 to-neutral-900',
  }
]

// Mock Data para Meus Livros
const myBooks = [
  {
    id: 1,
    title: 'A Estrutura das Revoluções Científicas',
    author: 'Thomas S. Kuhn',
    status: 'reading',
    progress: 35,
    lastRead: 'Hoje',
    colorClass: 'bg-gradient-to-br from-orange-900/40 to-neutral-900',
  },
  {
    id: 2,
    title: 'Sapiens: Uma Breve História da Humanidade',
    author: 'Yuval Noah Harari',
    status: 'reading',
    progress: 82,
    lastRead: 'Ontem',
    colorClass: 'bg-gradient-to-br from-blue-900/40 to-neutral-900',
  },
  {
    id: 3,
    title: 'Design of Everyday Things',
    author: 'Don Norman',
    status: 'completed',
    progress: 100,
    lastRead: '12 de Julho',
    colorClass: 'bg-gradient-to-br from-zinc-800 to-neutral-900',
  },
  {
    id: 4,
    title: 'As Veias Abertas da América Latina',
    author: 'Eduardo Galeano',
    status: 'completed',
    progress: 100,
    lastRead: '20 de Junho',
    colorClass: 'bg-gradient-to-br from-red-900/40 to-neutral-900',
  }
]
</script>
