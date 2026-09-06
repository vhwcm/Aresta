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

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          @click="isCreateDidacticModalOpen = true"
          class="px-5 py-2.5 rounded-full bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-interface font-semibold transition-all flex items-center gap-2"
          title="Criar Novo Livreto Didático com IA"
        >
          <SparklesIcon class="w-4 h-4" />
          <span>Novo Livreto IA</span>
        </button>

        <NuxtLink
          to="/upload"
          class="px-5 py-2.5 rounded-full bg-accent/20 hover:bg-accent text-accent hover:text-white border border-accent/40 text-xs font-interface font-semibold transition-all flex items-center gap-2"
          title="Fazer Upload de Livro"
        >
          <UploadIcon class="w-4 h-4" />
          <span>Enviar Arquivo</span>
        </NuxtLink>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Estante Pessoal do Usuário Logado -->
    <section class="flex flex-col gap-10 animate-in fade-in duration-500">

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

      <!-- Filtros por Status e Temas do Grafo -->
      <div class="flex flex-col gap-4 border-b border-divider pb-5">
        <!-- Linha 1: Filtro por Status -->
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs font-technical uppercase font-bold text-textSecondary">Filtrar:</span>
          <button
            v-for="filter in ['TODOS', 'LENDO', 'LIDO', 'QUERO_LER', 'ABANDONADO']"
            :key="filter"
            @click="statusFilter = filter"
            class="px-3 py-1 rounded-xl text-xs font-technical transition-all"
            :class="statusFilter === filter ? 'bg-accent text-white font-bold shadow' : 'bg-white/5 text-textSecondary hover:text-textPrimary'"
          >
            {{ getFilterLabel(filter) }}
          </button>
        </div>

        <!-- Linha 2: Filtro por Temas / Tags do Grafo -->
        <div class="flex items-center gap-2 flex-wrap pt-3 border-t border-divider/40">
          <span class="text-xs font-technical uppercase font-bold text-textSecondary flex items-center gap-1.5 mr-1">
            <NetworkIcon class="w-3.5 h-3.5 text-accent" />
            Temas do Grafo:
          </span>

          <button
            @click="selectedThemeId = null"
            class="px-3 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5"
            :class="selectedThemeId === null ? 'bg-textPrimary text-bgApp font-bold shadow-sm' : 'bg-white/5 text-textSecondary hover:text-textPrimary'"
          >
            <span>Todos os Temas</span>
            <span class="text-[10px] opacity-70">({{ userBooks.length }})</span>
          </button>

          <button
            v-for="theme in availableThemes"
            :key="theme.id"
            @click="selectedThemeId = selectedThemeId === theme.id ? null : theme.id"
            class="px-3 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border"
            :style="selectedThemeId === theme.id ? {
              backgroundColor: (theme.color || '#E57B55'),
              borderColor: (theme.color || '#E57B55'),
              color: '#FFFFFF',
              boxShadow: '0 2px 8px ' + (theme.color || '#E57B55') + '40'
            } : {
              backgroundColor: (theme.color || '#E57B55') + '10',
              borderColor: (theme.color || '#E57B55') + '30',
              color: 'inherit'
            }"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
            <span class="font-medium">{{ theme.name }}</span>
            <span class="text-[10px] opacity-70">({{ countByTheme(theme.id) }})</span>
          </button>

          <NuxtLink
            to="/grafo"
            class="text-xs text-accent hover:underline font-technical ml-auto flex items-center gap-1 hover:opacity-80 transition-all"
            title="Abrir Mapa Mental Completo"
          >
            <NetworkIcon class="w-3.5 h-3.5" />
            <span>Ver Grafo</span>
          </NuxtLink>
        </div>
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
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="font-editorial text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">{{ item.title }}</h3>
                  <!-- Badge do Formato (EPUB / PDF / DIDACTIC) -->
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-technical uppercase font-bold tracking-wider shrink-0 shadow-sm"
                    :class="{
                      'text-amber-400 bg-amber-500/10 border border-amber-500/30': getBookFormat(item.filePath) === 'EPUB',
                      'text-sky-400 bg-sky-500/10 border border-sky-500/30': getBookFormat(item.filePath) === 'PDF',
                      'text-purple-400 bg-purple-500/10 border border-purple-500/30': getBookFormat(item.filePath) === 'DIDACTIC'
                    }"
                  >
                    {{ getBookFormat(item.filePath) === 'DIDACTIC' ? 'IA DIDÁTICO' : getBookFormat(item.filePath) }}
                  </span>
                </div>

                <!-- Tags / Temas do Livro -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-for="theme in (item.themes || [])"
                    :key="theme.id"
                    @click.stop="selectedThemeId = selectedThemeId === theme.id ? null : theme.id"
                    class="cursor-pointer text-[10px] font-technical uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 border transition-all hover:scale-105"
                    :style="{
                      borderColor: (theme.color || '#E57B55') + '60',
                      backgroundColor: (theme.color || '#E57B55') + '18',
                      color: theme.color || '#E57B55'
                    }"
                    :title="`Filtrar estante por '${theme.name}'`"
                  >
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
                    <span>{{ theme.name }}</span>
                  </span>

                  <!-- Botão de Editar / Adicionar Tags -->
                  <button
                    @click="openTagModal(item)"
                    class="text-[10px] font-technical text-textSecondary hover:text-accent border border-dashed border-divider hover:border-accent px-2 py-0.5 rounded-md flex items-center gap-1 transition-all bg-white/5 hover:bg-accent/10"
                    title="Vincular ou gerenciar nós do mapa mental neste livro"
                  >
                    <TagIcon class="w-3 h-3" />
                    <span>{{ (item.themes && item.themes.length > 0) ? 'Editar Temas' : '+ Adicionar Tema' }}</span>
                  </button>
                </div>
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
              class="p-3 rounded-xl bg-white/5 border border-divider text-textSecondary hover:text-textPrimary transition-all"
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
        <p class="text-xs text-textSecondary font-interface max-w-sm">
          Faça o upload de um livro (EPUB/PDF) ou crie um livreto didático com IA para começar sua jornada.
        </p>
        <div class="flex items-center gap-3 mt-2">
          <NuxtLink
            to="/upload"
            class="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all flex items-center gap-2"
          >
            <UploadIcon class="w-4 h-4" />
            <span>Enviar Arquivo</span>
          </NuxtLink>
          <button
            @click="isCreateDidacticModalOpen = true"
            class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-2"
          >
            <SparklesIcon class="w-4 h-4" />
            <span>Novo Livreto IA</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Modal para Gerenciar Temas/Tags do Livro -->
    <div v-if="tagModalBook" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="bg-bgPanel border border-divider rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 text-textPrimary">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center shrink-0">
              <TagIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold font-editorial">Vincular Temas do Grafo</h3>
              <p class="text-xs text-textSecondary line-clamp-1 font-interface">
                {{ tagModalBook.title }}
              </p>
            </div>
          </div>
          <button @click="tagModalBook = null" class="p-2 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Lista de Temas Disponíveis para Seleção -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-technical uppercase font-bold text-textSecondary">Selecione os temas vinculados:</span>
            <span class="text-xs font-technical text-accent">{{ selectedThemeIdsForModal.length }} selecionado(s)</span>
          </div>

          <div v-if="availableThemes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="theme in availableThemes"
              :key="theme.id"
              @click="toggleModalTheme(theme.id)"
              class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200"
              :class="selectedThemeIdsForModal.includes(Number(theme.id))
                ? 'border-accent bg-accent/15 shadow-sm'
                : 'border-divider bg-white/5 hover:border-divider/80 hover:bg-white/10'"
            >
              <div class="flex items-center gap-2.5 truncate">
                <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
                <span class="text-xs font-interface font-medium truncate">{{ theme.name }}</span>
              </div>
              <CheckIcon
                class="w-4 h-4 shrink-0 transition-opacity"
                :class="selectedThemeIdsForModal.includes(Number(theme.id)) ? 'text-accent opacity-100' : 'opacity-0'"
              />
            </div>
          </div>

          <div v-else class="text-center py-6 border border-dashed border-divider rounded-2xl text-xs text-textSecondary">
            Você ainda não possui temas criados no seu Mapa Mental.
          </div>
        </div>

        <!-- Seção: Criar Novo Tema Rápido -->
        <div class="pt-3 border-t border-divider space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-technical uppercase font-bold text-textSecondary">Criar Novo Tema no Grafo</span>
            <button
              @click="showCreateThemeInline = !showCreateThemeInline"
              class="text-xs text-accent hover:underline font-semibold flex items-center gap-1"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>{{ showCreateThemeInline ? 'Fechar' : 'Novo Tema' }}</span>
            </button>
          </div>

          <div v-if="showCreateThemeInline" class="flex flex-col sm:flex-row items-center gap-2 bg-white/5 border border-divider p-3 rounded-2xl">
            <input
              v-model="newThemeName"
              type="text"
              placeholder="Nome do tema (ex: Estoicismo)"
              class="flex-1 w-full bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accent"
              @keyup.enter="handleCreateThemeInline"
            />
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <input v-model="newThemeColor" type="color" class="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer" />
              <button
                @click="handleCreateThemeInline"
                :disabled="!newThemeName.trim() || creatingTheme"
                class="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              >
                <PlusIcon class="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Rodapé / Ações -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button @click="tagModalBook = null" class="px-5 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary transition-all">
            Cancelar
          </button>
          <button
            @click="handleSaveBookThemes"
            :disabled="savingThemes"
            class="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-lg flex items-center gap-2"
          >
            <span v-if="savingThemes" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>

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
          <button @click="isLoginModalOpen = false" class="px-5 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary transition-all">
            Continuar Explorando
          </button>
          <NuxtLink to="/login" class="px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-lg">
            Fazer Login
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Modal de Criação de Livreto Didático com IA -->
    <div v-if="isCreateDidacticModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="bg-bgPanel border border-divider rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-textPrimary">
        <div class="flex items-center justify-between border-b border-divider pb-4">
          <div class="flex items-center gap-2 text-purple-400">
            <SparklesIcon class="w-5 h-5" />
            <h3 class="text-xl font-editorial text-textPrimary">Novo Livreto Didático com IA</h3>
          </div>
          <button @click="isCreateDidacticModalOpen = false" class="text-textSecondary hover:text-textPrimary text-sm font-technical">
            ✕ Fechar
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-xs text-textSecondary font-interface leading-relaxed">
            A IA didática vai estruturar um livro completo, paginado para celular, com diagramas visuais Mermaid, analogias intuitivas e callouts pedagógicos.
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-technical text-textSecondary uppercase">Título do Livreto (Opcional):</label>
            <input
              v-model="newBookletTitle"
              type="text"
              placeholder="Ex: Caderno de Algoritmos & Grafos"
              class="w-full bg-bgApp border border-divider rounded-xl px-3.5 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-technical text-textSecondary uppercase">Tópico / Pergunta Central (*):</label>
            <textarea
              v-model="newBookletTopic"
              rows="3"
              placeholder="Ex: Como funciona a curva de esquecimento de Ebbinghaus e como otimizar a repetição espaçada?"
              class="w-full bg-bgApp border border-divider rounded-xl p-3.5 text-xs text-textPrimary focus:outline-none focus:border-accent resize-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-technical text-textSecondary uppercase">Vincular Tema do Grafo:</label>
              <select
                v-model="newBookletThemeId"
                class="bg-bgApp border border-divider rounded-xl p-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
              >
                <option :value="null">Sem Tema Específico</option>
                <option v-for="node in availableThemes" :key="node.id" :value="Number(node.id)">
                  {{ node.name }}
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-technical text-textSecondary uppercase">Profundidade:</label>
              <select
                v-model="newBookletDepth"
                class="bg-bgApp border border-divider rounded-xl p-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
              >
                <option value="standard">Padrão (~4 págs, 1 Mermaid)</option>
                <option value="quick_summary">Resumo (~2 págs)</option>
                <option value="deep_dive">Aprofundado (~6 págs, 2 Mermaids)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button @click="isCreateDidacticModalOpen = false" class="px-5 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary transition-all">
            Cancelar
          </button>
          <button
            @click="handleCreateDidacticBooklet"
            :disabled="!newBookletTopic.trim() || didactic.isGenerating.value"
            class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            <SparklesIcon v-if="!didactic.isGenerating.value" class="w-4 h-4" />
            <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ didactic.isGenerating.value ? 'Gerando Livreto...' : 'Criar e Abrir no Leitor' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BookIcon,
  LibraryIcon,
  PlusIcon,
  PlayIcon,
  NetworkIcon,
  CheckCircleIcon,
  TrashIcon,
  Trash2Icon,
  BookOpenIcon,
  LogInIcon,
  UploadIcon,
  TagIcon,
  XIcon,
  CheckIcon,
  SparklesIcon
} from 'lucide-vue-next'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'

import type { UserBookItem } from '~/interfaces/graph'
import { useUserBooks } from '~/composables/useUserBooks'
import { useGraph } from '~/composables/useGraph'
import { useAuth } from '~/composables/useAuth'
import { getCoverUrl, getBookFormat } from '~/utils/cover'

const auth = useAuth()
const statusFilter = ref('TODOS')
const selectedThemeId = ref<number | string | null>(null)
const isLoginModalOpen = ref(false)

const router = useRouter()
const didactic = useDidacticBooklet()
const isCreateDidacticModalOpen = ref(false)
const newBookletTitle = ref('')
const newBookletTopic = ref('')
const newBookletThemeId = ref<number | null>(null)
const newBookletDepth = ref<'quick_summary' | 'standard' | 'deep_dive'>('standard')

const handleCreateDidacticBooklet = async () => {
  if (!newBookletTopic.value.trim()) return
  try {
    const result = await didactic.createBooklet({
      title: newBookletTitle.value.trim() || undefined,
      topic: newBookletTopic.value.trim(),
      theme_id: newBookletThemeId.value || undefined,
      depth_level: newBookletDepth.value,
    })
    isCreateDidacticModalOpen.value = false
    newBookletTitle.value = ''
    newBookletTopic.value = ''
    newBookletThemeId.value = null
    if (auth.isLoggedIn.value) {
      await fetchUserBooks()
    }
    if (result.book?.id) {
      await router.push(`/reader?bookId=${result.book.id}`)
    }
  } catch (err) {
    console.error('Erro ao criar livreto didático:', err)
  }
}

const tagModalBook = ref<UserBookItem | null>(null)
const selectedThemeIdsForModal = ref<number[]>([])
const showCreateThemeInline = ref(false)
const newThemeName = ref('')
const newThemeColor = ref('#E57B55')
const creatingTheme = ref(false)
const savingThemes = ref(false)

const {
  userBooks,
  fetchUserBooks,
  addUserBook,
  updateUserBook,
  setBookThemes,
  deleteUserBook,
  deleteUserBookByBookId,
  isBookInShelf
} = useUserBooks()
const { graphData, fetchGraph, createNode } = useGraph()

const availableThemes = computed(() => graphData.value.nodes || [])

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
  return userBooks.value.filter((b: UserBookItem) => b.status === status).length
}

const countByTheme = (themeId: number | string) => {
  return userBooks.value.filter((b: UserBookItem) => b.themes?.some((t: any) => String(t.id) === String(themeId))).length
}

const filteredUserBooks = computed(() => {
  return userBooks.value
    .filter((b: UserBookItem) => {
      const matchesStatus = statusFilter.value === 'TODOS' || b.status === statusFilter.value
      const matchesTheme = selectedThemeId.value === null || (b.themes && b.themes.some((t: any) => String(t.id) === String(selectedThemeId.value)))
      return matchesStatus && matchesTheme
    })
    .slice()
    .sort((a: UserBookItem, b: UserBookItem) => {
      const timeA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
      const timeB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
      if (timeA !== timeB) {
        return timeB - timeA
      }
      return (b.userBookId || 0) - (a.userBookId || 0)
    })
})

const getFilterLabel = (filter: string) => {
  switch (filter) {
    case 'TODOS': return 'Todos'
    case 'LENDO': return 'Lendo'
    case 'LIDO': return 'Lidos'
    case 'QUERO_LER': return 'Quero Ler'
    case 'ABANDONADO': return 'Abandonados'
    default: return filter
  }
}

const openTagModal = (book: UserBookItem) => {
  tagModalBook.value = book
  selectedThemeIdsForModal.value = (book.themes || []).map((t: any) => t.id)
  showCreateThemeInline.value = false
  newThemeName.value = ''
}

const toggleModalTheme = (themeId: number | string) => {
  const numId = Number(themeId)
  if (isNaN(numId)) return
  const idx = selectedThemeIdsForModal.value.indexOf(numId)
  if (idx > -1) {
    selectedThemeIdsForModal.value.splice(idx, 1)
  } else {
    selectedThemeIdsForModal.value.push(numId)
  }
}

const handleCreateThemeInline = async () => {
  if (!newThemeName.value.trim()) return
  creatingTheme.value = true
  try {
    const created = await createNode(newThemeName.value.trim(), newThemeColor.value)
    if (created && created.id) {
      const numId = Number(created.id)
      if (!isNaN(numId)) {
        selectedThemeIdsForModal.value.push(numId)
      }
    }
    newThemeName.value = ''
    showCreateThemeInline.value = false
  } catch (e) {
    console.error('Erro ao criar tema:', e)
  } finally {
    creatingTheme.value = false
  }
}

const handleSaveBookThemes = async () => {
  if (!tagModalBook.value) return
  savingThemes.value = true
  try {
    await setBookThemes(tagModalBook.value.userBookId, selectedThemeIdsForModal.value)
    await fetchGraph()
    tagModalBook.value = null
  } catch (e) {
    console.error('Erro ao salvar temas do livro:', e)
  } finally {
    savingThemes.value = false
  }
}

onMounted(() => {
  if (auth.isLoggedIn.value) {
    fetchUserBooks()
    fetchGraph()
  }
})
</script>
