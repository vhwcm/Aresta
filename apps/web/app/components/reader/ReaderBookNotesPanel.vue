<template>
  <div
    class="reader-book-notes-panel w-full h-full flex flex-col relative overflow-hidden transition-colors duration-200"
    :class="{
      'bg-[#FAF5E8] text-[#2a2521] border-l border-[#dfd5c0]': activeTheme === 'sepia',
      'bg-[#ffffff] text-[#1a1a1a] border-l border-gray-200': activeTheme === 'white',
      'bg-[#121214] text-[#e4e4e7] border-l border-white/10': activeTheme === 'black',
    }"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
  >
    <!-- Header do Painel de Notas -->
    <header
      class="p-4 border-b flex items-center justify-between backdrop-blur-md z-10 shrink-0 transition-colors duration-200"
      :class="{
        'bg-[#FAF5E8]/95 border-[#dfd5c0] text-[#2a2521]': activeTheme === 'sepia',
        'bg-white/95 border-gray-200 text-gray-900': activeTheme === 'white',
        'bg-[#161619]/95 border-white/10 text-[#e4e4e7]': activeTheme === 'black',
      }"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
          <FileTextIcon class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm leading-tight truncate">Notas do Livro</h3>
            <span
              v-if="!loading"
              class="px-2 py-0.5 rounded-full text-[10px] font-technical font-semibold bg-accent/15 text-accent shrink-0"
            >
              {{ annotations.length }}
            </span>
          </div>
          <p
            class="text-[11px] truncate mt-0.5"
            :class="activeTheme === 'sepia' ? 'text-[#786C5E]' : (activeTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
          >
            {{ store.title || bookTitle || 'Anotações e destaques desta obra' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Botão Criar Anotação / Nova Nota -->
        <button
          @click="$emit('openAnnotationModal')"
          class="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center gap-1 hover:bg-accent/90 transition-all shadow-xs active:scale-95"
          title="Criar nova anotação nesta página"
          aria-label="Nova anotação"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Anotar</span>
        </button>

        <!-- Botão Fechar Painel -->
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-xl transition-all"
          :class="activeTheme === 'sepia'
            ? 'bg-[#EBE2CE] hover:bg-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521]'
            : (activeTheme === 'white'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              : 'bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary')"
          title="Fechar painel de notas"
          aria-label="Fechar painel de notas"
        >
          <ChevronRightIcon v-if="!isMobile" class="w-4 h-4" />
          <XIcon v-else class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Barra de Pesquisa e Filtros -->
    <div
      class="px-4 py-2.5 border-b shrink-0 flex flex-col gap-2 transition-colors duration-200"
      :class="{
        'bg-[#FAF5E8]/80 border-[#dfd5c0]': activeTheme === 'sepia',
        'bg-gray-50/80 border-gray-200': activeTheme === 'white',
        'bg-[#141416]/80 border-white/10': activeTheme === 'black',
      }"
    >
      <div class="relative flex items-center">
        <SearchIcon
          class="w-3.5 h-3.5 absolute left-3 pointer-events-none"
          :class="activeTheme === 'sepia' ? 'text-[#786C5E]' : 'text-textSecondary'"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar nas notas ou citações..."
          class="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border focus:outline-none transition-all placeholder:text-opacity-60"
          :class="{
            'bg-[#f0e7d3] border-[#dfd5c0] text-[#2a2521] placeholder-[#786C5E] focus:border-accent': activeTheme === 'sepia',
            'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-accent': activeTheme === 'white',
            'bg-white/5 border-white/10 text-white placeholder-textSecondary focus:border-accent': activeTheme === 'black',
          }"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-2.5 text-textSecondary hover:text-textPrimary p-0.5 rounded-full"
          title="Limpar busca"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>

      <!-- Filtros Rápidos -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
        <button
          @click="activeFilter = 'all'"
          class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0"
          :class="activeFilter === 'all'
            ? 'bg-accent text-white shadow-xs'
            : (activeTheme === 'sepia'
              ? 'bg-[#EBE2CE] text-[#5c4d3c] hover:text-[#2a2521]'
              : (activeTheme === 'white'
                ? 'bg-gray-200 text-gray-700 hover:text-black'
                : 'bg-white/5 text-textSecondary hover:text-textPrimary'))"
        >
          Todas ({{ annotations.length }})
        </button>

        <button
          @click="activeFilter = 'currentPage'"
          class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0"
          :class="activeFilter === 'currentPage'
            ? 'bg-accent text-white shadow-xs'
            : (activeTheme === 'sepia'
              ? 'bg-[#EBE2CE] text-[#5c4d3c] hover:text-[#2a2521]'
              : (activeTheme === 'white'
                ? 'bg-gray-200 text-gray-700 hover:text-black'
                : 'bg-white/5 text-textSecondary hover:text-textPrimary'))"
        >
          Pág. {{ store.currentPage }} ({{ currentPageNotesCount }})
        </button>

        <button
          @click="activeFilter = 'quotes'"
          class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0"
          :class="activeFilter === 'quotes'
            ? 'bg-accent text-white shadow-xs'
            : (activeTheme === 'sepia'
              ? 'bg-[#EBE2CE] text-[#5c4d3c] hover:text-[#2a2521]'
              : (activeTheme === 'white'
                ? 'bg-gray-200 text-gray-700 hover:text-black'
                : 'bg-white/5 text-textSecondary hover:text-textPrimary'))"
        >
          Com Citação
        </button>

        <button
          @click="activeFilter = 'reflections'"
          class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0"
          :class="activeFilter === 'reflections'
            ? 'bg-accent text-white shadow-xs'
            : (activeTheme === 'sepia'
              ? 'bg-[#EBE2CE] text-[#5c4d3c] hover:text-[#2a2521]'
              : (activeTheme === 'white'
                ? 'bg-gray-200 text-gray-700 hover:text-black'
                : 'bg-white/5 text-textSecondary hover:text-textPrimary'))"
        >
          Anotações Soltas
        </button>
      </div>
    </div>

    <!-- Feedback Toast -->
    <transition name="fade">
      <div
        v-if="feedbackMessage"
        class="mx-4 mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn"
        :class="feedbackType === 'success'
          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400'"
      >
        <CheckCircle2Icon v-if="feedbackType === 'success'" class="w-4 h-4 shrink-0" />
        <AlertCircleIcon v-else class="w-4 h-4 shrink-0" />
        <span>{{ feedbackMessage }}</span>
      </div>
    </transition>

    <!-- Conteúdo Principal: Lista de Anotações -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
      <!-- Loading Skeleton -->
      <div v-if="loading && annotations.length === 0" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-28 rounded-2xl animate-pulse border"
          :class="activeTheme === 'sepia'
            ? 'bg-[#EBE2CE]/60 border-[#dfd5c0]'
            : (activeTheme === 'white' ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10')"
        />
      </div>

      <!-- Estado Vazio: Nenhuma Nota Encontrada na Busca -->
      <div
        v-else-if="filteredAnnotations.length === 0 && (searchQuery || activeFilter !== 'all')"
        class="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3"
      >
        <div class="p-3 rounded-2xl bg-accent/10 text-accent">
          <SearchXIcon class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-sm">Nenhuma anotação encontrada</h4>
          <p
            class="text-xs mt-1 max-w-xs"
            :class="activeTheme === 'sepia' ? 'text-[#786C5E]' : (activeTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
          >
            Tente buscar com outros termos ou altere os filtros selecionados.
          </p>
        </div>
        <button
          @click="searchQuery = ''; activeFilter = 'all'"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      <!-- Estado Vazio: Nenhuma Anotação no Livro -->
      <div
        v-else-if="filteredAnnotations.length === 0"
        class="flex flex-col items-center justify-center py-14 px-4 text-center space-y-4"
      >
        <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm">
          <BookOpenIcon class="w-7 h-7" />
        </div>
        <div class="space-y-1 max-w-sm">
          <h4 class="font-bold text-sm sm:text-base">Nenhuma anotação neste livro ainda</h4>
          <p
            class="text-xs leading-relaxed"
            :class="activeTheme === 'sepia' ? 'text-[#786C5E]' : (activeTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
          >
            Destaque trechos durante a leitura ou registre seus pensamentos, resumos e insights para revisitar mais tarde.
          </p>
        </div>

        <button
          @click="$emit('openAnnotationModal')"
          class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Criar Primeira Anotação</span>
        </button>
      </div>

      <!-- Feed de Anotações -->
      <div v-else class="space-y-3.5">
        <article
          v-for="item in filteredAnnotations"
          :key="item.id"
          class="rounded-2xl p-4 transition-all space-y-3 border shadow-xs group"
          :class="{
            'bg-[#FAF5E8] border-[#dfd5c0] hover:border-accent/50 text-[#2a2521]': activeTheme === 'sepia',
            'bg-white border-gray-200 hover:border-accent/50 text-gray-900': activeTheme === 'white',
            'bg-[#18181b] border-white/10 hover:border-accent/40 text-[#e4e4e7]': activeTheme === 'black',
          }"
        >
          <!-- Topo do Card: Localização (Página/Capítulo) e Ações Rápidas -->
          <div class="flex items-center justify-between gap-2">
            <!-- Badge de Página / Local com Clique para Navegar -->
            <button
              v-if="getPageNumber(item)"
              @click="handleJumpToPage(getPageNumber(item)!)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-technical font-semibold border transition-all cursor-pointer group/btn"
              :class="{
                'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:text-accent hover:border-accent': activeTheme === 'sepia',
                'bg-gray-100 border-gray-200 text-gray-700 hover:text-accent hover:border-accent': activeTheme === 'white',
                'bg-white/5 border-white/10 text-textSecondary hover:text-accent hover:border-accent': activeTheme === 'black',
              }"
              title="Clique para ir para esta página no livro"
            >
              <BookmarkIcon class="w-3.5 h-3.5 text-accent group-hover/btn:scale-110 transition-transform" />
              <span>{{ item.chapterTitle || `Página ${getPageNumber(item)}` }}</span>
              <ArrowRightIcon class="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </button>

            <span
              v-else
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-technical uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20"
            >
              <SparklesIcon class="w-3 h-3" />
              <span>Anotação Solta</span>
            </span>

            <!-- Ações do Card (Editar, Flashcard, Excluir) -->
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <!-- Gerar Flashcard -->
              <button
                @click="handleCreateFlashcard(item)"
                class="p-1.5 rounded-lg text-textSecondary hover:text-accent hover:bg-accent/10 transition-colors"
                title="Transformar esta anotação em Flashcard"
                aria-label="Gerar Flashcard"
              >
                <SparklesIcon class="w-3.5 h-3.5" />
              </button>

              <!-- Editar Nota -->
              <button
                @click="startEdit(item)"
                class="p-1.5 rounded-lg text-textSecondary hover:text-accent hover:bg-accent/10 transition-colors"
                title="Editar anotação"
                aria-label="Editar anotação"
              >
                <Edit3Icon class="w-3.5 h-3.5" />
              </button>

              <!-- Excluir Nota -->
              <button
                v-if="deletingId !== item.id"
                @click="deletingId = item.id"
                class="p-1.5 rounded-lg text-textSecondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Excluir anotação"
                aria-label="Excluir anotação"
              >
                <Trash2Icon class="w-3.5 h-3.5" />
              </button>

              <!-- Confirmação de Exclusão -->
              <div v-else class="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded-lg border border-red-500/20">
                <button
                  @click="handleConfirmDelete(item.id)"
                  class="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Excluir?
                </button>
                <button
                  @click="deletingId = null"
                  class="text-textSecondary hover:text-textPrimary p-0.5"
                >
                  <XIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Citação do Livro (Texto Selecionado) -->
          <blockquote
            v-if="item.selectedText"
            class="p-3 rounded-xl border-l-3 border-accent/70 text-xs italic font-serif leading-relaxed"
            :class="{
              'bg-[#f0e7d3]/70 text-[#5c4d3c]': activeTheme === 'sepia',
              'bg-gray-50 text-gray-700': activeTheme === 'white',
              'bg-white/[0.03] text-[#d4d4d8]': activeTheme === 'black',
            }"
          >
            "{{ item.selectedText }}"
          </blockquote>

          <!-- Modo Edição da Anotação -->
          <div v-if="editingAnnotationId === item.id" class="space-y-2 pt-1">
            <label class="block text-[10px] font-semibold text-accent uppercase tracking-wider">
              Editar sua Reflexão:
            </label>
            <textarea
              v-model="editNoteText"
              rows="3"
              class="w-full border border-accent/60 rounded-xl p-3 text-xs focus:outline-none resize-none transition-colors"
              :class="{
                'bg-[#FAF5E8] text-[#2a2521]': activeTheme === 'sepia',
                'bg-white text-gray-900': activeTheme === 'white',
                'bg-[#121214] text-[#e4e4e7]': activeTheme === 'black',
              }"
              placeholder="Escreva sua reflexão ou insight..."
            ></textarea>
            <div class="flex items-center justify-end gap-2">
              <button
                @click="cancelEdit"
                class="px-3 py-1.5 text-xs rounded-lg transition-colors"
                :class="{
                  'text-[#786C5E] hover:text-[#2a2521] bg-[#EBE2CE]': activeTheme === 'sepia',
                  'text-gray-600 hover:text-gray-900 bg-gray-100': activeTheme === 'white',
                  'text-textSecondary hover:text-textPrimary bg-white/5': activeTheme === 'black',
                }"
              >
                Cancelar
              </button>
              <button
                @click="handleSaveNote(item.id)"
                :disabled="isSavingNote"
                class="px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <CheckIcon class="w-3.5 h-3.5" />
                <span>{{ isSavingNote ? 'Salvando...' : 'Salvar Nota' }}</span>
              </button>
            </div>
          </div>

          <!-- Modo Visualização da Anotação -->
          <div v-else class="space-y-1.5">
            <p
              v-if="item.note"
              class="text-xs whitespace-pre-wrap leading-relaxed"
              :class="{
                'text-[#2a2521]': activeTheme === 'sepia',
                'text-gray-900': activeTheme === 'white',
                'text-[#f4f4f5]': activeTheme === 'black',
              }"
            >
              {{ item.note }}
            </p>
            <p
              v-else-if="item.selectedText"
              class="text-[11px] italic"
              :class="activeTheme === 'sepia' ? 'text-[#786C5E]' : (activeTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
            >
              (Destaque sem anotação escrita. Clique no ícone de lápis para adicionar uma nota.)
            </p>
          </div>

          <!-- Tags / Temas Vinculados -->
          <div v-if="item.themes && item.themes.length > 0" class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="t in item.themes"
              :key="t.id"
              class="px-2 py-0.5 rounded-lg text-[10px] font-technical font-medium transition-colors"
              :class="{
                'bg-[#EBE2CE] text-[#5c4d3c] border border-[#dfd5c0]': activeTheme === 'sepia',
                'bg-gray-100 text-gray-700 border border-gray-200': activeTheme === 'white',
                'bg-white/5 text-textSecondary border border-white/10': activeTheme === 'black',
              }"
            >
              #{{ t.name }}
            </span>
          </div>

          <!-- Rodapé do Card: Data e Progresso -->
          <div
            class="flex items-center justify-between pt-2 border-t text-[10px] font-technical"
            :class="{
              'border-[#dfd5c0] text-[#786C5E]': activeTheme === 'sepia',
              'border-gray-200 text-gray-500': activeTheme === 'white',
              'border-white/10 text-textSecondary': activeTheme === 'black',
            }"
          >
            <span>{{ formatDate(item.createdAt) }}</span>
            <span v-if="item.progress !== undefined && item.progress !== null">
              Progresso: {{ Math.round(item.progress) }}%
            </span>
          </div>
        </article>
      </div>
    </div>

    <!-- Caixa Expansível de Criação Rápida de Nota no Rodapé -->
    <footer
      class="p-3.5 border-t shrink-0 flex flex-col gap-2.5 transition-colors duration-200"
      :class="{
        'bg-[#FAF5E8]/95 border-[#dfd5c0]': activeTheme === 'sepia',
        'bg-white/95 border-gray-200': activeTheme === 'white',
        'bg-[#161619]/95 border-white/10': activeTheme === 'black',
      }"
    >
      <div v-if="!isQuickNoteOpen" class="flex items-center justify-between">
        <button
          @click="isQuickNoteOpen = true"
          class="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          :class="{
            'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]': activeTheme === 'sepia',
            'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200': activeTheme === 'white',
            'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10': activeTheme === 'black',
          }"
        >
          <PlusCircleIcon class="w-4 h-4 text-accent" />
          <span>Escrever reflexão rápida (Pág. {{ store.currentPage }})</span>
        </button>
      </div>

      <div v-else class="space-y-2 animate-fadeIn">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-technical uppercase font-bold text-accent flex items-center gap-1">
            <SparklesIcon class="w-3 h-3" />
            <span>Nota na Página {{ store.currentPage }}</span>
          </span>
          <button
            @click="isQuickNoteOpen = false; quickNoteText = ''"
            class="text-textSecondary hover:text-textPrimary p-0.5 rounded-lg"
            title="Cancelar"
          >
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <textarea
          v-model="quickNoteText"
          rows="2"
          placeholder="Escreva sua reflexão ou síntese rápida..."
          class="w-full rounded-xl p-2.5 text-xs border focus:outline-none resize-none transition-colors"
          :class="{
            'bg-[#f0e7d3] border-[#dfd5c0] text-[#2a2521] placeholder-[#786C5E] focus:border-accent': activeTheme === 'sepia',
            'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-accent': activeTheme === 'white',
            'bg-white/5 border-white/10 text-white placeholder-textSecondary focus:border-accent': activeTheme === 'black',
          }"
          @keydown.enter.ctrl.prevent="handleSaveQuickNote"
        ></textarea>

        <div class="flex items-center justify-between">
          <span class="text-[10px] text-textSecondary font-technical hidden sm:inline">
            Pressione Ctrl+Enter para salvar
          </span>
          <div class="flex items-center gap-2 ml-auto">
            <button
              @click="isQuickNoteOpen = false; quickNoteText = ''"
              class="px-2.5 py-1 text-xs rounded-lg transition-colors"
              :class="activeTheme === 'sepia'
                ? 'text-[#786C5E] hover:text-[#2a2521]'
                : (activeTheme === 'white' ? 'text-gray-600 hover:text-gray-900' : 'text-textSecondary hover:text-textPrimary')"
            >
              Cancelar
            </button>
            <button
              @click="handleSaveQuickNote"
              :disabled="!quickNoteText.trim() || isSavingQuickNote"
              class="px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <SendIcon class="w-3 h-3" />
              <span>{{ isSavingQuickNote ? 'Salvando...' : 'Salvar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FileTextIcon,
  PlusIcon,
  PlusCircleIcon,
  ChevronRightIcon,
  XIcon,
  SearchIcon,
  SearchXIcon,
  BookOpenIcon,
  BookmarkIcon,
  ArrowRightIcon,
  SparklesIcon,
  Edit3Icon,
  Trash2Icon,
  CheckIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SendIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useAnnotations, type AnnotationItem } from '~/composables/useAnnotations'

const props = defineProps<{
  isMobile?: boolean
  theme?: 'sepia' | 'white' | 'black'
  bookId?: number | null
  bookTitle?: string
}>()

const emit = defineEmits<{
  (_e: 'close'): void
  (_e: 'openAnnotationModal'): void
  (_e: 'goToPage', _page: number): void
}>()

const store = useReaderStore()
const {
  annotations,
  loading,
  fetchAnnotations,
  createAnnotation,
  updateAnnotationNote,
  deleteAnnotation,
  convertAnnotationToFlashcard,
} = useAnnotations()

const activeTheme = computed(() => props.theme || store.readerTheme || 'sepia')

// Estados de Filtro e Busca
const searchQuery = ref('')
const activeFilter = ref<'all' | 'currentPage' | 'quotes' | 'reflections'>('all')

// Estados de Edição
const editingAnnotationId = ref<number | null>(null)
const editNoteText = ref('')
const isSavingNote = ref(false)

// Estados de Exclusão
const deletingId = ref<number | null>(null)

// Estados de Criação Rápida
const isQuickNoteOpen = ref(false)
const quickNoteText = ref('')
const isSavingQuickNote = ref(false)

// Estados de Notificação/Feedback
const feedbackMessage = ref<string | null>(null)
const feedbackType = ref<'success' | 'error'>('success')
let feedbackTimeout: any = null

function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMessage.value = msg
  feedbackType.value = type
  if (feedbackTimeout) clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    feedbackMessage.value = null
  }, 3200)
}

function getPageNumber(item: AnnotationItem): number | null {
  if (item.cfi && item.cfi.startsWith('page:')) {
    const parsed = parseInt(item.cfi.replace('page:', ''), 10)
    if (!isNaN(parsed)) return parsed
  }
  if (item.chapterTitle) {
    const match = item.chapterTitle.match(/P[áa]gina\s+(\d+)/i)
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10)
      if (!isNaN(parsed)) return parsed
    }
  }
  if (typeof item.progress === 'number' && store.totalPages > 0) {
    return Math.max(1, Math.min(store.totalPages, Math.round((item.progress / 100) * store.totalPages)))
  }
  return null
}

const currentPageNotesCount = computed(() => {
  return annotations.value.filter((a) => getPageNumber(a) === store.currentPage).length
})

const filteredAnnotations = computed(() => {
  let list = annotations.value

  // Filtro de Categoria
  if (activeFilter.value === 'currentPage') {
    list = list.filter((a) => getPageNumber(a) === store.currentPage)
  } else if (activeFilter.value === 'quotes') {
    list = list.filter((a) => Boolean(a.selectedText && a.selectedText.trim()))
  } else if (activeFilter.value === 'reflections') {
    list = list.filter((a) => !a.selectedText || !a.selectedText.trim())
  }

  // Filtro de Busca
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((a) => {
      const matchNote = a.note?.toLowerCase().includes(q)
      const matchQuote = a.selectedText?.toLowerCase().includes(q)
      const matchChapter = a.chapterTitle?.toLowerCase().includes(q)
      const matchThemes = a.themes?.some((t) => t.name.toLowerCase().includes(q))
      return matchNote || matchQuote || matchChapter || matchThemes
    })
  }

  return list
})

async function loadNotes() {
  const currentBookId = props.bookId ?? store.bookId
  if (currentBookId) {
    await fetchAnnotations({ bookId: currentBookId })
  } else {
    await fetchAnnotations()
  }
}

function handleJumpToPage(page: number) {
  emit('goToPage', page)
  store.goToPage(page)
  if (props.isMobile) {
    emit('close')
  }
}

function startEdit(item: AnnotationItem) {
  editingAnnotationId.value = item.id
  editNoteText.value = item.note || ''
}

function cancelEdit() {
  editingAnnotationId.value = null
  editNoteText.value = ''
}

async function handleSaveNote(id: number) {
  if (isSavingNote.value) return
  isSavingNote.value = true
  try {
    await updateAnnotationNote(id, editNoteText.value.trim())
    editingAnnotationId.value = null
    editNoteText.value = ''
    showFeedback('Anotação atualizada com sucesso!')
  } catch (err: any) {
    showFeedback('Falha ao salvar anotação.', 'error')
  } finally {
    isSavingNote.value = false
  }
}

async function handleConfirmDelete(id: number) {
  deletingId.value = null
  try {
    await deleteAnnotation(id)
    showFeedback('Anotação removida com sucesso.')
  } catch (err: any) {
    showFeedback('Falha ao excluir anotação.', 'error')
  }
}

async function handleCreateFlashcard(item: AnnotationItem) {
  try {
    await convertAnnotationToFlashcard(
      item.id,
      item.selectedText ? `Sobre: "${item.selectedText.slice(0, 100)}..."` : `Reflexão (Pág. ${getPageNumber(item) || 1})`,
      item.note || item.selectedText || 'Revisão conceitual'
    )
    showFeedback('Flashcard criado a partir da anotação!')
  } catch (err: any) {
    showFeedback('Falha ao gerar flashcard.', 'error')
  }
}

async function handleSaveQuickNote() {
  const text = quickNoteText.value.trim()
  if (!text || isSavingQuickNote.value) return
  isSavingQuickNote.value = true

  try {
    const currentBookId = props.bookId ?? store.bookId ?? 1
    await createAnnotation({
      bookId: currentBookId,
      cfi: `page:${store.currentPage}`,
      chapterTitle: `Página ${store.currentPage}`,
      note: text,
      progress: store.progressPercentage,
      bookTitle: store.title || props.bookTitle,
    })
    quickNoteText.value = ''
    isQuickNoteOpen.value = false
    showFeedback('Nota rápida adicionada!')
  } catch (err: any) {
    showFeedback('Falha ao criar nota rápida.', 'error')
  } finally {
    isSavingQuickNote.value = false
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

watch(
  () => [props.bookId, store.bookId],
  () => {
    loadNotes()
  },
  { immediate: true },
)

onMounted(() => {
  loadNotes()
})

defineExpose({
  refresh: loadNotes,
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(120, 108, 94, 0.2);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 108, 94, 0.4);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
