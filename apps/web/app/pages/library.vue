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

      <!-- Tab Navigation & Action -->
      <div class="flex items-center gap-3">
        <div class="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full border border-divider w-max">
          <button
            @click="activeTab = 'catalog'"
            class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'catalog' ? 'bg-textPrimary text-bgApp shadow-md' : 'text-textSecondary hover:text-textPrimary'"
          >
            <CompassIcon class="w-4 h-4" />
            Catálogo Geral
          </button>
          <button
            @click="handleSelectMyBooksTab"
            class="px-6 py-2 rounded-full font-interface text-sm font-medium transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'my-books' ? 'bg-textPrimary text-bgApp shadow-md' : 'text-textSecondary hover:text-textPrimary'"
          >
            <LibraryIcon class="w-4 h-4" />
            Minha Estante
          </button>
        </div>

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

            <!-- Badge de Formato (EPUB / PDF / DIDACTIC) -->
            <div class="absolute top-2.5 right-2.5 z-10">
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-technical uppercase font-bold tracking-wider shadow backdrop-blur-md"
                :class="{
                  'bg-amber-500/20 text-amber-300 border border-amber-500/40': getBookFormat(book.filePath) === 'EPUB',
                  'bg-sky-500/20 text-sky-300 border border-sky-500/40': getBookFormat(book.filePath) === 'PDF',
                  'bg-purple-500/20 text-purple-300 border border-purple-500/40': getBookFormat(book.filePath) === 'DIDACTIC'
                }"
              >
                {{ getBookFormat(book.filePath) === 'DIDACTIC' ? 'IA DIDÁTICO' : getBookFormat(book.filePath) }}
              </span>
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
        <p class="text-xs text-textSecondary font-interface">
          Acesse a aba <strong>Catálogo Geral</strong> para pegar livros e adicioná-los à sua biblioteca.
        </p>
        <button @click="activeTab = 'catalog'" class="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all">
          Explorar Catálogo
        </button>
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
  CompassIcon,
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
import { useCatalog } from '~/composables/useCatalog'
import { useUserBooks } from '~/composables/useUserBooks'
import { useGraph } from '~/composables/useGraph'
import { useAuth } from '~/composables/useAuth'
import { getCoverUrl, getBookFormat } from '~/utils/cover'

const activeTab = ref<'catalog' | 'my-books'>('catalog')
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
    await fetchCatalog()
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

const { books: catalogBooks, loading: catalogLoading, fetchCatalog } = useCatalog()
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
const auth = useAuth()

const availableThemes = computed(() => graphData.value.nodes || [])

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
  return userBooks.value.filter((b: UserBookItem) => b.status === status).length
}

const countByTheme = (themeId: number | string) => {
  return userBooks.value.filter((b: UserBookItem) => b.themes?.some((t: any) => String(t.id) === String(themeId))).length
}

const filteredUserBooks = computed(() => {
  return userBooks.value.filter((b: UserBookItem) => {
    const matchesStatus = statusFilter.value === 'TODOS' || b.status === statusFilter.value
    const matchesTheme = selectedThemeId.value === null || (b.themes && b.themes.some((t: any) => String(t.id) === String(selectedThemeId.value)))
    return matchesStatus && matchesTheme
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
  fetchCatalog()
  if (auth.isLoggedIn.value) {
    fetchUserBooks()
    fetchGraph()
  }
})
</script>
