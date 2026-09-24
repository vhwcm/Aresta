<template>
  <!-- Backdrop no mobile quando expandido -->
  <div
    v-if="!isCollapsed"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
    @click="toggleCollapse"
  />

  <aside
    class="flex flex-col bg-bgPanel border-r border-divider h-full transition-all duration-300 flex-shrink-0 select-none"
    :class="[
      isCollapsed
        ? 'hidden md:flex w-16'
        : 'fixed md:relative inset-y-0 left-0 z-50 w-full md:w-72 max-w-full md:max-w-none shadow-2xl md:shadow-none'
    ]"
  >
    <!-- Top Header do Sidebar -->
    <div
      class="h-14 border-b border-divider/60 flex items-center flex-shrink-0 transition-all"
      :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-2.5 md:px-3 gap-2'"
    >
      <div v-if="!isCollapsed" class="flex items-center gap-1.5 flex-1 min-w-0">
        <NuxtLink to="/" class="flex items-center group cursor-pointer shrink-0" title="Ir para Início">
          <ArestaLogoGraph :size="24" use-image :to="null" class="!p-0 group-hover:scale-105 transition-transform" />
        </NuxtLink>

        <!-- Botão de Alternância de Tema -->
        <button
          @click="toggleThemeMode"
          class="p-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center border border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
          :title="themeMode === 'dark' ? 'Tema: Escuro (clique para Claro)' : (themeMode === 'light' ? 'Tema: Claro (clique para Livro)' : 'Tema: Livro (clique para Escuro)')"
          aria-label="Alternar tema da interface"
        >
          <SunIcon v-if="themeMode === 'light'" class="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
          <PaletteIcon v-else-if="themeMode === 'sepia'" class="w-4 h-4 text-amber-600 dark:text-amber-300 hover:scale-110 transition-transform" />
          <MoonIcon v-else class="w-4 h-4 text-accent hover:-rotate-12 transition-transform" />
        </button>

        <!-- Lupa de Pesquisa dos Títulos dos Nós do Grafo -->
        <button
          @click="toggleGraphSearch"
          class="p-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center border"
          :class="isGraphSearchOpen || graphSearchQuery
            ? 'bg-accent/15 text-accent border-accent/40 shadow-xs'
            : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'"
          title="Pesquisar nós do grafo"
          aria-label="Pesquisar nós do grafo"
        >
          <SearchIcon class="w-3.5 h-3.5" />
        </button>

        <!-- Indicador de Ofensiva ao lado da lupa -->
        <ReadingStreak compact align="sidebar" />
      </div>

      <!-- Botão Minimizar/Expandir Sidebar -->
      <button
        @click="toggleCollapse"
        class="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        :title="isCollapsed ? 'Expandir painel' : 'Recolher painel'"
      >
        <SidebarIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Barra de Pesquisa de Nós do Grafo (Ativada pela Lupa) -->
    <div
      v-if="isGraphSearchOpen && !isCollapsed"
      class="px-2.5 py-2 border-b border-divider/60 bg-bgRoot/70 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <SearchIcon class="w-3.5 h-3.5 text-accent shrink-0" />
      <input
        ref="graphSearchInputRef"
        v-model="graphSearchQuery"
        type="text"
        placeholder="Pesquisar nós do grafo..."
        class="w-full bg-transparent text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none font-interface"
        @input="onGraphSearchInput"
        @keyup.esc="closeGraphSearch"
      />
      <button
        v-if="graphSearchQuery"
        @click="clearGraphSearch"
        class="p-0.5 rounded text-textSecondary hover:text-textPrimary cursor-pointer text-xs"
        title="Limpar pesquisa"
      >
        ✕
      </button>
      <button
        @click="closeGraphSearch"
        class="p-0.5 rounded text-textSecondary hover:text-textPrimary cursor-pointer text-xs ml-0.5"
        title="Fechar busca"
      >
        ✕
      </button>
    </div>

    <!-- Conteúdo Scrollável -->
    <div class="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
      <!-- MODO COLAPSADO: Ícones Rápidos de Navegação & Acesso -->
      <div v-if="isCollapsed" class="flex flex-col items-center gap-1.5 pt-1">
        <!-- 1. Logo / Início -->
        <NuxtLink
          to="/"
          class="p-2 rounded-xl transition-all cursor-pointer border"
          :class="isHomeActive ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          title="Início"
        >
          <HomeIcon class="w-4 h-4" />
        </NuxtLink>

        <!-- 2. Livros / Biblioteca -->
        <NuxtLink
          to="/library"
          class="p-2 rounded-xl transition-all cursor-pointer border"
          :class="isBooksActive ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          title="Meus Livros"
        >
          <BookOpenIcon class="w-4 h-4" />
        </NuxtLink>

        <!-- 3. Revisão -->
        <NuxtLink
          to="/revisao"
          class="p-2 rounded-xl transition-all cursor-pointer border"
          :class="isReviewActive ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          title="Revisão (Flashcards)"
        >
          <BrainIcon class="w-4 h-4" />
        </NuxtLink>

        <!-- 4. Minha Conta -->
        <NuxtLink
          to="/conta"
          class="p-2 rounded-xl transition-all cursor-pointer border"
          :class="isAccountActive ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          title="Minha Conta"
        >
          <UserIcon class="w-4 h-4" />
        </NuxtLink>

        <div class="w-8 h-px bg-divider/60 my-1"></div>

        <!-- Botão Diário no modo colapsado (Antes do Livro - Circulado com Amarelo) -->
        <button
          @click="$emit('open-journal')"
          class="p-2 rounded-xl transition-all cursor-pointer border border-amber-500/40 hover:border-amber-500 relative group"
          :class="isJournalActive ? 'bg-amber-500/20 text-amber-500 border-amber-500 shadow-xs' : 'bg-amber-500/[0.08] text-amber-500 hover:bg-amber-500/15'"
          title="Diário Sequencial de Anotações"
        >
          <BookOpenCheckIcon class="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        </button>

        <!-- Botão Gerenciar Tags no modo colapsado (Circulado com Azul) -->
        <button
          @click="isManageTagsModalOpen = true"
          class="p-2 rounded-xl transition-all cursor-pointer border border-blue-500/40 hover:border-blue-500 bg-blue-500/[0.08] text-blue-500 hover:bg-blue-500/15 relative group"
          title="Gerenciar Tags"
          data-testid="manage-tags-collapsed-btn"
        >
          <TagIcon class="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
        </button>

        <div class="w-8 h-px bg-divider/60 my-0.5"></div>

        <!-- Miniatura de Leitura Ativa no modo colapsado -->
        <NuxtLink
          v-if="hasActiveBook"
          :to="activeBookReaderLink"
          class="p-1 rounded-xl transition-all cursor-pointer border border-divider hover:border-accent/50 group relative mb-0.5"
          :title="`Continuar lendo: ${activeBookTitle} (${activeBookProgress}%)`"
        >
          <div class="w-10 h-14 rounded-lg overflow-hidden bg-neutral-900 border border-divider shadow-xs relative group-hover:scale-105 transition-transform">
            <img
              v-if="activeBookCoverUrl && !coverError"
              :src="activeBookCoverUrl"
              :alt="activeBookTitle"
              @error="coverError = true"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full p-1 flex flex-col justify-between bg-neutral-800 text-left border-l border-accent">
              <span class="text-[7px] font-technical text-accent font-bold">A</span>
            </div>
          </div>
        </NuxtLink>

        <div class="w-8 h-px bg-divider/60 my-0.5"></div>

        <!-- Botão Sem Pasta no modo colapsado -->
        <button
          @click="$emit('select-folder', '__uncategorized__')"
          class="p-2 rounded-xl transition-all cursor-pointer border"
          :class="!isJournalActive && selectedFolder === '__uncategorized__' ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          title="Sem pasta"
        >
          <InboxIcon class="w-4 h-4" />
        </button>

        <div class="w-8 h-px bg-divider/60 my-1"></div>

        <!-- Pastas no modo colapsado -->
        <div
          v-for="folder in allFolders"
          :key="folder"
          @click="$emit('select-folder', folder)"
          class="p-2 rounded-xl transition-all cursor-pointer relative group border"
          :class="!isJournalActive && selectedFolder === folder ? 'bg-accent/15 text-accent border-accent/30 shadow-xs' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'"
          :title="'Pasta: ' + folder"
        >
          <FolderIcon class="w-4 h-4 text-amber-500 dark:text-amber-400/80 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
        </div>
      </div>

      <!-- MODO EXPANDIDO: Navegação Global + Leitura Ativa + Árvore Hierárquica -->
      <div v-else class="space-y-3">
        <!-- SEÇÃO: NAVEGAÇÃO PRINCIPAL ARESTA (Em retângulos sem margem lateral + ícones maiores) -->
        <div class="-mx-2.5 -mt-2.5 grid grid-cols-5 divide-x divide-divider/60 border-b border-divider/60 bg-bgRoot/40 shadow-xs">
          <!-- 1. Início -->
          <NuxtLink
            to="/"
            class="flex items-center justify-center h-11 transition-all cursor-pointer group relative"
            :class="isHomeActive && !isJournalActive && selectedFolder === null && selectedTag === null
              ? 'bg-accent/15 text-accent font-semibold border-b-2 border-b-accent'
              : 'text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
            title="Início"
            aria-label="Início"
          >
            <HomeIcon class="w-5 h-5 transition-transform group-hover:scale-110" />
          </NuxtLink>

          <!-- 2. Livros (Estante) -->
          <NuxtLink
            to="/library"
            class="flex items-center justify-center h-11 transition-all cursor-pointer group relative"
            :class="isBooksActive
              ? 'bg-accent/15 text-accent font-semibold border-b-2 border-b-accent'
              : 'text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
            title="Meus Livros"
            aria-label="Meus Livros"
          >
            <BookOpenIcon class="w-5 h-5 transition-transform group-hover:scale-110" />
          </NuxtLink>

          <!-- 3. Revisão -->
          <NuxtLink
            to="/revisao"
            class="flex items-center justify-center h-11 transition-all cursor-pointer group relative"
            :class="isReviewActive
              ? 'bg-accent/15 text-accent font-semibold border-b-2 border-b-accent'
              : 'text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
            title="Revisão (Flashcards & Resumos)"
            aria-label="Revisão"
          >
            <BrainIcon class="w-5 h-5 transition-transform group-hover:scale-110" />
          </NuxtLink>

          <!-- 4. Minha Conta -->
          <NuxtLink
            to="/conta"
            class="flex items-center justify-center h-11 transition-all cursor-pointer group relative"
            :class="isAccountActive
              ? 'bg-accent/15 text-accent font-semibold border-b-2 border-b-accent'
              : 'text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
            title="Minha Conta"
            aria-label="Minha Conta"
          >
            <UserIcon class="w-5 h-5 transition-transform group-hover:scale-110" />
          </NuxtLink>

          <!-- 5. Botão de Adicionar Geral (Ao lado da Conta) -->
          <div class="relative h-11" ref="addDropdownRef">
            <button
              @click="isAddMenuOpen = !isAddMenuOpen"
              class="w-full h-full flex items-center justify-center transition-all cursor-pointer bg-accent hover:bg-accent/90 text-white active:scale-95 group"
              title="Criar novo item"
              aria-label="Criar novo item"
            >
              <PlusIcon class="w-5 h-5 transition-transform duration-200" :class="{ 'rotate-45': isAddMenuOpen }" />
            </button>

            <!-- Menu Dropdown -->
            <div
              v-if="isAddMenuOpen"
              class="absolute right-1 top-full mt-1.5 w-48 p-1.5 rounded-2xl bg-bgPanel border border-divider shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
            >
              <button
                @click="handleAddAction('note')"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer text-left"
              >
                <FileTextIcon class="w-4 h-4 text-accent shrink-0" />
                <div class="flex flex-col">
                  <span class="font-medium">Nova Nota</span>
                  <span class="text-[10px] text-textSecondary">Anotação em Markdown</span>
                </div>
              </button>

              <button
                @click="handleAddAction('drawing')"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-left"
              >
                <PenToolIcon class="w-4 h-4 text-primary shrink-0" />
                <div class="flex flex-col">
                  <span class="font-medium">Novo Desenho</span>
                  <span class="text-[10px] text-textSecondary">Estilo Samsung Notes</span>
                </div>
              </button>

              <button
                @click="handleAddAction('link')"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer text-left"
              >
                <GlobeIcon class="w-4 h-4 text-emerald-500 shrink-0" />
                <div class="flex flex-col">
                  <span class="font-medium">Novo Link</span>
                  <span class="text-[10px] text-textSecondary">Link web com título</span>
                </div>
              </button>

              <button
                @click="handleAddAction('canvas')"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer text-left"
              >
                <LayoutGridIcon class="w-4 h-4 text-accent shrink-0" />
                <div class="flex flex-col">
                  <span class="font-medium">Novo Quadro</span>
                  <span class="text-[10px] text-textSecondary">Canvas visual infinito</span>
                </div>
              </button>

              <div class="h-px bg-divider/60 my-1"></div>

              <button
                @click="handleAddAction('folder')"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer text-left"
              >
                <FolderPlusIcon class="w-4 h-4 text-amber-500 shrink-0" />
                <div class="flex flex-col">
                  <span class="font-medium">Nova Pasta</span>
                  <span class="text-[10px] text-textSecondary">Organizar na árvore</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- 1. Botão do Diário Sequencial (Colado na barra superior de navegação) -->
        <div class="-mx-2.5 !mt-0">
          <button
            @click="$emit('open-journal')"
            class="w-full flex items-center justify-between px-3.5 py-2.5 text-xs md:text-sm transition-all cursor-pointer border-b border-amber-500/30 hover:border-amber-500/60 group"
            :class="isJournalActive
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold'
              : 'bg-amber-500/[0.06] hover:bg-amber-500/[0.12] text-amber-700 dark:text-amber-300/90 font-medium'"
            title="Abrir Diário Sequencial"
          >
            <div class="flex items-center gap-2.5 truncate">
              <BookOpenCheckIcon class="w-4 h-4 flex-shrink-0 text-amber-500 group-hover:scale-110 transition-transform" />
              <span class="truncate font-interface font-semibold text-xs md:text-sm">Diário</span>
            </div>
            <ChevronRightIcon class="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        <!-- 2. SEÇÃO DA LEITURA ATIVA (Abaixo do Diário - Reta de ponta a ponta) -->
        <div v-if="hasActiveBook" class="-mx-2.5 !mt-0">
          <NuxtLink
            :to="activeBookReaderLink"
            class="group/reading w-full flex items-center gap-3 px-3.5 py-2.5 bg-bgSurface/50 hover:bg-bgSurface border-b border-divider/60 hover:border-accent/40 transition-all duration-200 cursor-pointer select-none"
            :title="`Continuar lendo: ${activeBookTitle}`"
          >
            <!-- Capa do Livro em Destaque Ampliado -->
            <div class="w-14 h-20 rounded-md overflow-hidden shrink-0 border border-divider/80 bg-neutral-900 shadow-sm relative group-hover/reading:scale-105 transition-transform duration-200">
              <img
                v-if="activeBookCoverUrl && !coverError"
                :src="activeBookCoverUrl"
                :alt="activeBookTitle"
                @error="coverError = true"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full p-1.5 flex flex-col justify-between bg-neutral-800 text-left border-l-2 border-accent">
                <span class="text-[8px] font-technical text-accent uppercase font-bold tracking-wider">Aresta</span>
                <span class="text-[9px] font-editorial text-white line-clamp-3 leading-tight font-medium">{{ activeBookTitle }}</span>
              </div>
              <!-- Efeito lombada / iluminação 3D -->
              <div class="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
            </div>

            <!-- Detalhes do Livro & Progresso -->
            <div class="flex-1 min-w-0 flex flex-col justify-between py-1 gap-1.5">
              <div class="flex flex-col min-w-0">
                <span class="font-editorial text-xs sm:text-sm font-semibold text-textPrimary group-hover/reading:text-accent transition-colors line-clamp-2 leading-tight">
                  {{ activeBookTitle }}
                </span>
                <span class="font-interface text-[11px] text-textSecondary truncate mt-0.5">
                  {{ latestUserBook?.author || 'Autor Desconhecido' }}
                </span>
              </div>

              <!-- Barra de Progresso Fina e Elegante -->
              <div class="w-full flex items-center gap-2 pt-0.5">
                <div class="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    class="h-full bg-accent rounded-full transition-all duration-300"
                    :style="{ width: `${activeBookProgress}%` }"
                  ></div>
                </div>
                <PlayIcon class="w-3.5 h-3.5 text-accent group-hover/reading:scale-110 shrink-0 transition-transform" />
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Visualização do Grafo de Conhecimento no Mobile (Abaixo do Livro - 100% largura e quadrado) -->
        <div v-if="isMobileScreen" class="block md:hidden w-full pt-1 pb-1">
          <div class="w-full aspect-square rounded-2xl overflow-hidden border border-divider/80 bg-bgRoot/80 shadow-md relative">
            <AppKnowledgeGraph
              :is-compact="true"
              :search-query="activeTag || graphSearchQuery"
              :show-controls="false"
              class="w-full h-full"
            />
          </div>
        </div>

        <!-- 3. Seção Integrada: Gerenciar Tags com Tags Embutidas (Reta de ponta a ponta) -->
        <div class="-mx-2.5 !mt-0">
          <div
            class="border-b transition-all duration-200"
            :class="isTagsExpanded
              ? 'border-blue-500/40 bg-blue-500/[0.04] dark:bg-blue-500/[0.07] shadow-xs'
              : 'border-blue-500/30 bg-blue-500/[0.02] hover:border-blue-500/50'"
          >
            <!-- Cabeçalho do Card: Gerenciar Tags -->
            <div
              class="w-full flex items-center justify-between px-3.5 py-2.5 transition-all select-none group"
            >
              <!-- Botão principal que abre o modal de gerenciar tags -->
              <button
                @click="isManageTagsModalOpen = true"
                data-testid="manage-tags-sidebar-btn"
                class="flex items-center gap-2.5 truncate flex-1 text-left cursor-pointer group/title text-blue-700 dark:text-blue-300 hover:text-blue-600"
                title="Abrir Gerenciador de Tags"
              >
                <TagIcon class="w-4 h-4 flex-shrink-0 text-blue-500 group-hover/title:scale-110 transition-transform" />
                <span class="truncate font-interface font-semibold text-xs md:text-sm text-blue-700 dark:text-blue-300">
                  Gerenciar Tags
                </span>
              </button>

              <!-- Ações do lado direito: Contador + Chevron de expansão/recolhimento das tags embutidas -->
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold">
                  {{ availableTags.length }}
                </span>

                <button
                  @click="isTagsExpanded = !isTagsExpanded"
                  class="px-3 py-1 rounded-lg text-blue-500/80 hover:text-blue-600 hover:bg-blue-500/15 transition-all cursor-pointer flex items-center justify-center"
                  :title="isTagsExpanded ? 'Recolher tags' : 'Expandir tags'"
                  data-testid="toggle-tags-expand-btn"
                >
                  <ChevronDownIcon
                    class="w-4 h-4 transition-transform duration-200"
                    :class="{ '-rotate-90': !isTagsExpanded }"
                  />
                </button>
              </div>
            </div>

            <!-- Tags Embutidas diretamente dentro do bloco de Gerenciar Tags -->
            <div
              v-show="isTagsExpanded"
              class="px-3.5 pb-2.5 pt-1.5 border-t border-blue-500/15 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <!-- Nuvem de Chips das Tags Embutidas (Clique para selecionar / Clique novamente para desselecionar) -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="tagItem in availableTags"
                  :key="tagItem.name"
                  @click="toggleTag(tagItem.name)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border"
                  :class="isTagSelected(tagItem.name)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold ring-1 ring-blue-500/40'
                    : 'bg-bgSurface/80 border-blue-500/20 text-textSecondary hover:border-blue-500/50 hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'"
                  :title="isTagSelected(tagItem.name) ? `Desmarcar filtro #${tagItem.name}` : `Filtrar por #${tagItem.name}`"
                >
                  <span class="font-mono text-[11px]" :class="isTagSelected(tagItem.name) ? 'text-white/80' : 'text-blue-500/80'">#</span>
                  <span class="font-interface truncate max-w-[130px]">{{ tagItem.name }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors"
                    :class="isTagSelected(tagItem.name) ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-300'"
                  >
                    {{ tagItem.count }}
                  </span>
                </button>

                <div v-if="availableTags.length === 0" class="px-1 py-1 text-[11px] text-textSecondary/70 italic">
                  Nenhuma tag criada ainda.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Estrutura em Árvore (Pastas e Arquivos Aninhados) -->
        <div class="pt-1.5">

          <!-- Input inline para criar nova pasta -->
          <div v-if="isCreatingFolder" class="px-2 py-1 mb-2">
            <div class="flex items-center gap-1.5 p-1 rounded-lg bg-bgRoot border border-accent/50 shadow-inner">
              <FolderIcon class="w-3.5 h-3.5 text-accent flex-shrink-0 ml-1" />
              <input
                ref="newFolderInputRef"
                v-model="newFolderName"
                type="text"
                placeholder="Nome da pasta..."
                class="w-full bg-transparent text-xs text-textPrimary focus:outline-none font-interface"
                @keyup.enter="handleCreateFolder"
                @keyup.esc="isCreatingFolder = false; newFolderName = ''"
              />
              <button
                @click="handleCreateFolder"
                class="px-2 py-0.5 rounded text-[10px] bg-accent text-white font-medium cursor-pointer hover:bg-accent/90 transition-colors"
              >
                OK
              </button>
              <button
                @click="isCreatingFolder = false; newFolderName = ''"
                class="px-1 text-[11px] text-textSecondary hover:text-textPrimary cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Mensagem quando tag selecionada não tem itens -->
          <div
            v-if="selectedTag && visibleFolders.length === 0 && uncategorizedItems.length === 0"
            class="px-3 py-4 text-center text-[11px] text-textSecondary/70 bg-bgSurface/40 rounded-xl border border-divider/60 space-y-1 my-2"
          >
            <p>Nenhum item com a tag <span class="text-accent font-mono">#{{ selectedTag }}</span></p>
            <button
              @click="$emit('select-tag', null)"
              class="text-[10px] text-accent hover:underline cursor-pointer"
            >
              Limpar filtro de tag
            </button>
          </div>

          <!-- Árvore: Lista de Pastas com Arquivos Aninhados -->
          <div v-else class="space-y-1">
            <div
              v-for="folder in visibleFolders"
              :key="folder"
              class="space-y-0.5"
            >
              <!-- Linha da Pasta -->
              <div
                class="group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs md:text-sm transition-all cursor-pointer border"
                :class="selectedFolder === folder
                  ? 'bg-accent/15 text-accent border-accent/30 font-medium'
                  : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium'"
                @click="selectFolder(folder)"
              >
                <div class="flex items-center gap-1.5 truncate min-w-0 pr-2">
                  <!-- Botão de Expandir/Recolher Árvore -->
                  <button
                    class="p-0.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-textSecondary hover:text-textPrimary cursor-pointer transition-transform"
                    @click.stop="toggleFolderExpand(folder)"
                    title="Expandir ou recolher pasta"
                  >
                    <ChevronRightIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="{ 'rotate-90 text-accent': expandedFolders.has(folder) }"
                    />
                  </button>

                  <FolderIcon
                    class="w-3.5 h-3.5 flex-shrink-0 transition-colors"
                    :class="selectedFolder === folder ? 'text-accent' : 'text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300'"
                  />
                  <span class="truncate">{{ folder }}</span>
                </div>

                <div class="flex items-center gap-1">
                  <span
                    class="text-[11px] px-1.5 py-0.2 rounded-full font-mono transition-colors"
                    :class="selectedFolder === folder ? 'bg-accent/20 text-accent' : 'text-slate-600 dark:text-textSecondary/60 bg-slate-100 dark:bg-white/[0.04] group-hover:text-textPrimary'"
                  >
                    {{ getFolderItems(folder).length }}
                  </span>

                  <!-- Ações Rápidas da Pasta -->
                  <div class="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-bgSurface/90 backdrop-blur-xs border border-divider/60 rounded-md p-0.5 shadow-xs transition-opacity ml-1">
                    <button
                      @click.stop="$emit('create-note', folder)"
                      class="p-1 hover:text-accent hover:bg-accent/10 rounded transition-colors text-textSecondary cursor-pointer"
                      title="Nova nota nesta pasta"
                    >
                      <PlusIcon class="w-3 h-3" />
                    </button>
                    <button
                      @click.stop="openRenameModal(folder)"
                      class="p-1 hover:text-accent hover:bg-accent/10 rounded transition-colors text-textSecondary cursor-pointer"
                      title="Renomear pasta"
                    >
                      <Edit3Icon class="w-3 h-3" />
                    </button>
                    <button
                      @click.stop="handleDeleteFolder(folder)"
                      class="p-1 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors text-textSecondary cursor-pointer"
                      title="Excluir pasta"
                    >
                      <Trash2Icon class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Itens/Arquivos Aninhados dentro da Pasta (Tree Children) -->
              <div
                v-if="expandedFolders.has(folder)"
                class="pl-3.5 pr-1 py-1 space-y-1 border-l border-divider ml-4 my-0.5"
              >
                <div
                  v-for="item in getFolderItems(folder)"
                  :key="item.id"
                  class="group/file relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all border"
                  :class="selectedItemId === item.id
                    ? 'bg-accent/15 text-accent font-medium border-accent/30 shadow-xs'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
                  @click="clickItem(item)"
                >
                  <div class="flex items-center gap-2 truncate min-w-0 pr-2">
                    <!-- Ícone do Item -->
                    <div
                      class="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      :class="[
                        item.kind === 'canvas' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        item.kind === 'book' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        item.kind === 'drawing' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        item.kind === 'link' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      ]"
                    >
                      <LayoutGridIcon v-if="item.kind === 'canvas'" class="w-3.5 h-3.5" />
                      <BookOpenIcon v-else-if="item.kind === 'book'" class="w-3.5 h-3.5" />
                      <PenToolIcon v-else-if="item.kind === 'drawing'" class="w-3.5 h-3.5" />
                      <GlobeIcon v-else-if="item.kind === 'link'" class="w-3.5 h-3.5" />
                      <FileTextIcon v-else class="w-3.5 h-3.5" />
                    </div>

                    <span class="truncate font-interface text-xs">{{ item.title || (item.kind === 'canvas' ? 'Quadro sem título' : item.kind === 'book' ? 'Livro sem título' : 'Nota sem título') }}</span>
                  </div>

                  <!-- Micro Badge Elegante -->
                  <span
                    class="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded font-semibold transition-all"
                    :class="[
                      item.kind === 'canvas' ? 'bg-amber-50 dark:bg-accent/10 text-amber-700 dark:text-accent/90 border border-amber-200 dark:border-accent/20' :
                      item.kind === 'book' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400/90 border border-blue-200 dark:border-blue-500/20' :
                      item.kind === 'drawing' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400/90 border border-purple-200 dark:border-purple-500/20' :
                      item.kind === 'link' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400/90 border border-emerald-200 dark:border-emerald-500/20' :
                      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400/90 border border-indigo-200 dark:border-indigo-500/20'
                    ]"
                  >
                    {{ item.kind === 'canvas' ? 'quadro' : item.kind === 'book' ? 'livro' : item.kind === 'drawing' ? 'desenho' : item.kind === 'link' ? 'link' : 'nota' }}
                  </span>
                </div>

                <div v-if="getFolderItems(folder).length === 0" class="px-2 py-1 text-[10px] text-textSecondary italic">
                  {{ selectedTag ? 'Nenhum item com a tag nesta pasta' : 'Pasta vazia' }}
                </div>
              </div>
            </div>

            <!-- Seção de Arquivos Sem Pasta (Na Raiz) -->
            <div v-if="!selectedTag || uncategorizedItems.length > 0" class="space-y-0.5 pt-1">
              <div
                class="group relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs md:text-sm transition-all cursor-pointer border"
                :class="selectedFolder === '__uncategorized__'
                  ? 'bg-accent/15 text-accent border-accent/30 font-medium'
                  : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium'"
              >
                <div class="flex items-center gap-1.5 truncate min-w-0 pr-2" @click="selectFolder('__uncategorized__')">
                  <button
                    class="p-0.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-textSecondary hover:text-textPrimary cursor-pointer transition-transform"
                    @click.stop="toggleFolderExpand('__uncategorized__')"
                    title="Expandir ou recolher arquivos sem pasta"
                  >
                    <ChevronRightIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="{ 'rotate-90 text-accent': expandedFolders.has('__uncategorized__') }"
                    />
                  </button>

                  <InboxIcon
                    class="w-3.5 h-3.5 flex-shrink-0 transition-colors"
                    :class="selectedFolder === '__uncategorized__' ? 'text-accent' : 'text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300'"
                  />
                  <span class="truncate">Sem pasta</span>
                </div>

                <span
                  class="text-[11px] px-1.5 py-0.2 rounded-full font-mono transition-colors"
                  :class="selectedFolder === '__uncategorized__' ? 'bg-accent/20 text-accent' : 'text-slate-600 dark:text-textSecondary/60 bg-slate-100 dark:bg-white/[0.04] group-hover:text-textPrimary'"
                >
                  {{ uncategorizedItems.length }}
                </span>
              </div>

              <!-- Itens/Arquivos na Raiz (Sem Pasta) -->
              <div
                v-if="expandedFolders.has('__uncategorized__')"
                class="pl-3.5 pr-1 py-1 space-y-1 border-l border-divider ml-4 my-0.5"
              >
                <div
                  v-for="item in uncategorizedItems"
                  :key="item.id"
                  class="group/file relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all border"
                  :class="selectedItemId === item.id
                    ? 'bg-accent/15 text-accent font-medium border-accent/30 shadow-xs'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'"
                  @click="clickItem(item)"
                >
                  <div class="flex items-center gap-2 truncate min-w-0 pr-2">
                    <div
                      class="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      :class="[
                        item.kind === 'canvas' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        item.kind === 'book' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        item.kind === 'drawing' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        item.kind === 'link' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      ]"
                    >
                      <LayoutGridIcon v-if="item.kind === 'canvas'" class="w-3.5 h-3.5" />
                      <BookOpenIcon v-else-if="item.kind === 'book'" class="w-3.5 h-3.5" />
                      <PenToolIcon v-else-if="item.kind === 'drawing'" class="w-3.5 h-3.5" />
                      <GlobeIcon v-else-if="item.kind === 'link'" class="w-3.5 h-3.5" />
                      <FileTextIcon v-else class="w-3.5 h-3.5" />
                    </div>
                    <span class="truncate font-interface text-xs">{{ item.title || (item.kind === 'canvas' ? 'Quadro sem título' : item.kind === 'book' ? 'Livro sem título' : 'Nota sem título') }}</span>
                  </div>

                  <!-- Micro Badge Elegante -->
                  <span
                    class="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded font-semibold transition-all"
                    :class="[
                      item.kind === 'canvas' ? 'bg-amber-50 dark:bg-accent/10 text-amber-700 dark:text-accent/90 border border-amber-200 dark:border-accent/20' :
                      item.kind === 'book' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400/90 border border-blue-200 dark:border-blue-500/20' :
                      item.kind === 'drawing' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400/90 border border-purple-200 dark:border-purple-500/20' :
                      item.kind === 'link' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400/90 border border-emerald-200 dark:border-emerald-500/20' :
                      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400/90 border border-indigo-200 dark:border-indigo-500/20'
                    ]"
                  >
                    {{ item.kind === 'canvas' ? 'quadro' : item.kind === 'book' ? 'livro' : item.kind === 'drawing' ? 'desenho' : item.kind === 'link' ? 'link' : 'nota' }}
                  </span>
                </div>

                <div v-if="uncategorizedItems.length === 0" class="px-2 py-1 text-[10px] text-textSecondary italic">
                  Nenhum arquivo sem pasta
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Renomear Pasta -->
    <div
      v-if="renameModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div class="bg-bgPanel border border-divider rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
        <h3 class="text-sm font-semibold text-textPrimary font-interface">Renomear Pasta</h3>
        <input
          v-model="renameFolderNewName"
          type="text"
          class="w-full px-3 py-2 rounded-xl bg-bgRoot border border-divider text-sm text-textPrimary focus:outline-none focus:border-accent font-interface"
          placeholder="Novo nome..."
          @keyup.enter="confirmRenameFolder"
        />
        <div class="flex items-center justify-end gap-2">
          <button
            @click="renameModalOpen = false"
            class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="confirmRenameFolder"
            class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-semibold text-white cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Global de Gerenciamento de Tags -->
    <ManageThemesModal
      :is-open="isManageTagsModalOpen"
      :themes="allModalThemes"
      :books-count-by-theme="getThemeBooksCount"
      @close="isManageTagsModalOpen = false"
      @theme-created="handleThemeCreatedOrChanged"
      @theme-updated="handleThemeCreatedOrChanged"
      @theme-deleted="handleThemeDeleted"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  FolderIcon,
  LayersIcon,
  InboxIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  SidebarIcon,
  ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  LayoutGridIcon,
  FileTextIcon,
  PenTool as PenToolIcon,
  Globe as GlobeIcon,
  FolderPlus as FolderPlusIcon,
  Play as PlayIcon,
  BookOpenCheck as BookOpenCheckIcon,
  Home as HomeIcon,
  BookOpen as BookOpenIcon,
  Book as BookIcon,
  FileCode2 as FileCode2Icon,
  ShoppingBag as ShoppingBagIcon,
  Brain as BrainIcon,
  User as UserIcon,
  Network as NetworkIcon,
  Search as SearchIcon,
  Tag as TagIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Palette as PaletteIcon
} from 'lucide-vue-next'
import { useUserBooks } from '~/composables/useUserBooks'
import { useGraph } from '~/composables/useGraph'
import { useSettings } from '~/composables/useSettings'
import { resolveBookCover } from '~/utils/cover'
import { loadGraphMeta } from '~/utils/graphMeta'
import AppKnowledgeGraph from '~/components/graph/AppKnowledgeGraph.vue'
import ManageThemesModal from '~/components/ManageThemesModal.vue'
import ReadingStreak from '~/components/ReadingStreak.vue'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'

const route = useRoute()
const { themeMode, toggleThemeMode } = useSettings()

const { userBooks, fetchUserBooks } = useUserBooks()
const { graphData, fetchGraph } = useGraph()
const isManageTagsModalOpen = ref(false)
const isTagsExpanded = ref(false)

const allModalThemes = computed(() => {
  const list: Array<{ id: string | number; rawId?: number | string; name: string; color?: string; type?: string }> = []
  const seen = new Set<string>()

  // 1. Temas do graphData
  const nodes = (graphData.value.nodes || []).filter((node: any) => {
    if (node.type && node.type !== 'theme') return false
    if (typeof node.id === 'string' && (node.id.startsWith('book-') || node.id.startsWith('note-') || node.id.startsWith('canvas-'))) {
      return false
    }
    return true
  })

  for (const n of nodes) {
    const name = String(n.name || n.title || '').trim()
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      list.push({
        id: n.id,
        rawId: n.rawId,
        name,
        color: n.color || '#E57B55',
        type: 'theme'
      })
    }
  }

  // 2. Temas dos livros do usuário
  if (Array.isArray(userBooks.value)) {
    for (const b of userBooks.value) {
      for (const t of b.themes || []) {
        const name = String(t.name || '').trim()
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({
            id: t.id || `theme-${Date.now()}`,
            rawId: t.rawId || t.id,
            name,
            color: t.color || '#E57B55',
            type: 'theme'
          })
        }
      }
    }
  }

  // 3. graphMeta fallback se houver
  try {
    const meta = loadGraphMeta()
    if (Array.isArray(meta?.themes)) {
      for (const t of meta.themes) {
        const name = String(t.name || '').trim()
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({
            id: t.id || `theme-${Date.now()}`,
            rawId: t.rawId || t.id,
            name,
            color: t.color || '#E57B55',
            type: 'theme'
          })
        }
      }
    }
  } catch {}

  // 4. Tags de itens da árvore
  for (const item of props.items) {
    for (const tag of item.tags || []) {
      const name = String(tag || '').trim()
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        list.push({
          id: `tag-${name}`,
          rawId: name,
          name,
          color: '#3B82F6',
          type: 'theme'
        })
      }
    }
  }

  return list
})

const getThemeBooksCount = (themeOrId: any): number => {
  const themeName = (typeof themeOrId === 'object' ? themeOrId.name : String(themeOrId || '')).trim().toLowerCase()
  if (!themeName || !Array.isArray(userBooks.value)) return 0
  return userBooks.value.filter((b: any) => {
    return (b.themes || []).some((t: any) => (t.name || '').trim().toLowerCase() === themeName)
  }).length
}

const handleThemeCreatedOrChanged = async () => {
  try {
    await Promise.allSettled([
      fetchGraph(),
      fetchUserBooks()
    ])
  } catch {}
}

const handleThemeDeleted = async () => {
  try {
    await Promise.allSettled([
      fetchGraph(),
      fetchUserBooks()
    ])
  } catch {}
}

const { graphSearchQuery, activeTag } = useWorkspaceSidebar()
const isGraphSearchOpen = ref(false)
const graphSearchInputRef = ref<HTMLInputElement | null>(null)

const toggleGraphSearch = () => {
  isGraphSearchOpen.value = !isGraphSearchOpen.value
  if (isGraphSearchOpen.value) {
    if (props.viewLayout !== 'graph') {
      emit('update:view-layout', 'graph')
    }
    nextTick(() => {
      graphSearchInputRef.value?.focus()
    })
  }
}

const onGraphSearchInput = () => {
  if (props.viewLayout !== 'graph') {
    emit('update:view-layout', 'graph')
  }
}

const clearGraphSearch = () => {
  graphSearchQuery.value = ''
  nextTick(() => {
    graphSearchInputRef.value?.focus()
  })
}

const closeGraphSearch = () => {
  isGraphSearchOpen.value = false
}

export interface SidebarTreeItem {
  id: string
  title?: string
  kind?: 'canvas' | 'note' | 'drawing' | 'link' | 'book'
  folder?: string | null
  tags?: string[]
  bookId?: number
}

const props = withDefaults(
  defineProps<{
    items: SidebarTreeItem[]
    folders: string[]
    selectedFolder?: string | null
    selectedTag?: string | null
    selectedItemId?: string | null
    isJournalActive?: boolean
    title?: string
    itemLabel?: string
    collapsed?: boolean
    viewLayout?: 'graph' | 'grid' | 'journal'
  }>(),
  {
    selectedFolder: null,
    selectedTag: null,
    selectedItemId: null,
    isJournalActive: false,
    title: 'Biblioteca',
    itemLabel: 'itens',
    collapsed: false,
    viewLayout: 'graph'
  }
)

const emit = defineEmits<{
  (_e: 'select-folder', _folder: string | null): void
  (_e: 'select-tag', _tag: string | null): void
  (_e: 'select-item', _item: SidebarTreeItem): void
  (_e: 'open-journal'): void
  (_e: 'create-note', _folder?: string): void
  (_e: 'create-drawing'): void
  (_e: 'create-link'): void
  (_e: 'create-canvas'): void
  (_e: 'create-folder', _name: string): void
  (_e: 'rename-folder', _payload: { oldName: string; newName: string }): void
  (_e: 'delete-folder', _name: string): void
  (_e: 'update:collapsed', _collapsed: boolean): void
  (_e: 'update:view-layout', _layout: 'graph' | 'grid'): void
}>()

const isCollapsed = ref(props.collapsed ?? false)
const expandedFolders = ref<Set<string>>(new Set(['__uncategorized__']))

const isBooksSubmenuOpen = ref(false)

const isHomeActive = computed(() => {
  return route.path === '/' || route.path.startsWith('/canvas')
})

const isBooksActive = computed(() => {
  return route.path.startsWith('/library') || route.path.startsWith('/conversor') || route.path === '/loja'
})

const isReviewActive = computed(() => {
  return route.path.startsWith('/revisao')
})

const isAccountActive = computed(() => {
  return route.path.startsWith('/conta')
})

// Abre o submenu automaticamente se a rota atual for de livros
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/library') || path.startsWith('/conversor') || path === '/loja') {
      isBooksSubmenuOpen.value = true
    }
  },
  { immediate: true }
)

const coverError = ref(false)

const isAddMenuOpen = ref(false)
const addDropdownRef = ref<HTMLElement | null>(null)

const handleGlobalClick = (e: MouseEvent) => {
  if (addDropdownRef.value && !addDropdownRef.value.contains(e.target as Node)) {
    isAddMenuOpen.value = false
  }
}

onMounted(() => {
  if (userBooks.value.length === 0) {
    void fetchUserBooks()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleGlobalClick)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleGlobalClick)
  }
})

const handleAddAction = (action: 'note' | 'drawing' | 'link' | 'canvas' | 'folder') => {
  isAddMenuOpen.value = false
  if (action === 'note') {
    emit('create-note', props.selectedFolder && props.selectedFolder !== '__uncategorized__' ? props.selectedFolder : undefined)
  } else if (action === 'drawing') {
    emit('create-drawing')
  } else if (action === 'link') {
    emit('create-link')
  } else if (action === 'canvas') {
    emit('create-canvas')
  } else if (action === 'folder') {
    isCreatingFolder.value = true
    nextTick(() => {
      newFolderInputRef.value?.focus()
    })
  }
}

// Leitura ativa mais recente
const latestUserBook = computed(() => {
  if (!userBooks.value || userBooks.value.length === 0) return null
  const sorted = [...userBooks.value].sort((a, b) => {
    const timeA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
    const timeB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return (b.userBookId || 0) - (a.userBookId || 0)
  })
  return sorted[0] || null
})

const hasActiveBook = computed(() => !!latestUserBook.value)
const activeBookTitle = computed(() => latestUserBook.value?.title || '')
const activeBookCoverUrl = computed(() => {
  if (latestUserBook.value) {
    return resolveBookCover(latestUserBook.value)
  }
  return ''
})

const activeBookCurrentPage = computed(() => latestUserBook.value?.currentPage || 0)
const activeBookTotalPages = computed(() => (latestUserBook.value as any)?.totalPages || (latestUserBook.value as any)?.total_pages || 128)

const activeBookProgress = computed(() => {
  if (!hasActiveBook.value) return 0
  if (latestUserBook.value?.status === 'LIDO') return 100
  if (latestUserBook.value?.status === 'QUERO_LER' && !latestUserBook.value?.currentPage) return 0
  if ((latestUserBook.value as any)?.progress !== undefined && (latestUserBook.value as any)?.progress !== null) {
    return Math.min(100, Math.max(0, Math.round(Number((latestUserBook.value as any).progress))))
  }
  return Math.min(100, Math.round((activeBookCurrentPage.value / (activeBookTotalPages.value || 1)) * 100))
})

const activeBookReaderLink = computed(() => {
  if (latestUserBook.value?.bookId) {
    const page = typeof latestUserBook.value.currentPage === 'number' && latestUserBook.value.currentPage > 0 ? latestUserBook.value.currentPage : 1
    return `/reader?bookId=${latestUserBook.value.bookId}&page=${page}`
  }
  return '/library'
})

watch(
  () => props.collapsed,
  (val) => {
    if (val !== undefined && val !== isCollapsed.value) {
      isCollapsed.value = val
    }
  }
)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

const toggleFolderExpand = (folder: string) => {
  if (expandedFolders.value.has(folder)) {
    expandedFolders.value.delete(folder)
  } else {
    expandedFolders.value.add(folder)
  }
}

const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderInputRef = ref<HTMLInputElement | null>(null)

const renameModalOpen = ref(false)
const renamingFolderOldName = ref('')
const renameFolderNewName = ref('')

// Todas as pastas (união de pastas passadas com pastas presentes nos itens)
const allFolders = computed(() => {
  const set = new Set<string>(props.folders)
  for (const item of props.items) {
    if (item.folder) set.add(item.folder)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const totalItemsCount = computed(() => props.items.length)

// Itens filtrados pela tag ativa (se selecionada)
const filteredTreeItems = computed(() => {
  if (!props.selectedTag) return props.items
  return props.items.filter((item) => {
    return Array.isArray(item.tags) && item.tags.includes(props.selectedTag!)
  })
})

const uncategorizedItems = computed(() => {
  return filteredTreeItems.value.filter((i) => !i.folder)
})

const getFolderItems = (folderName: string) => {
  return filteredTreeItems.value.filter((i) => i.folder === folderName)
}

// Pastas visíveis: se uma tag estiver ativa, exibe apenas pastas com itens correspondentes
const visibleFolders = computed(() => {
  if (!props.selectedTag) return allFolders.value
  return allFolders.value.filter((f) => getFolderItems(f).length > 0)
})

// Auto-expande pastas que contêm itens da tag selecionada
watch(
  () => props.selectedTag,
  (tag) => {
    if (tag) {
      for (const folder of allFolders.value) {
        if (getFolderItems(folder).length > 0) {
          expandedFolders.value.add(folder)
        }
      }
      if (uncategorizedItems.value.length > 0) {
        expandedFolders.value.add('__uncategorized__')
      }
    }
  },
  { immediate: true }
)

// Lista de tags existentes e sua respectiva frequência (unificando temas e tags)
const availableTags = computed(() => {
  const counts: Record<string, number> = {}

  // 1. Tags de itens passados via props (notas, livros, quadros, desenhos, links)
  for (const item of props.items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const t of tags) {
      const clean = typeof t === 'string' ? t.trim() : ''
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1
      }
    }
  }

  // 2. Temas de livros do usuário (garante presença das tags mesmo com delay de props)
  if (Array.isArray(userBooks.value)) {
    for (const b of userBooks.value) {
      const themes = Array.isArray(b.themes) ? b.themes : []
      for (const th of themes) {
        const clean = typeof th?.name === 'string' ? th.name.trim() : ''
        if (clean && counts[clean] === undefined) {
          counts[clean] = 1
        }
      }
    }
  }

  // 3. Temas/Tags extras do graphMeta (tags criadas no grafo ou estante que ainda não possuem itens)
  try {
    const meta = loadGraphMeta()
    if (Array.isArray(meta?.themes)) {
      for (const th of meta.themes) {
        const clean = typeof th?.name === 'string' ? th.name.trim() : ''
        if (clean && counts[clean] === undefined) {
          counts[clean] = 0
        }
      }
    }
  } catch {}

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const closeIfMobile = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isCollapsed.value = true
    emit('update:collapsed', true)
  }
}

const selectFolder = (folder: string | null) => {
  closeIfMobile()
  if (folder && folder !== '__uncategorized__') {
    expandedFolders.value.add(folder)
  }
  emit('select-folder', folder)
}

const clickItem = (item: SidebarTreeItem) => {
  closeIfMobile()
  emit('select-item', item)
}

const isTagSelected = (tagName: string) => {
  const current = (props.selectedTag || activeTag.value || '').trim().toLowerCase()
  return current !== '' && current === tagName.trim().toLowerCase()
}

const toggleTag = (tagName: string) => {
  if (isTagSelected(tagName)) {
    activeTag.value = null
    emit('select-tag', null)
  } else {
    const cleanTag = tagName.trim()
    activeTag.value = cleanTag
    emit('select-tag', cleanTag)
  }
}

const handleCreateFolder = () => {
  const clean = newFolderName.value.trim()
  if (!clean) {
    isCreatingFolder.value = false
    return
  }
  emit('create-folder', clean)
  emit('select-folder', clean)
  expandedFolders.value.add(clean)
  newFolderName.value = ''
  isCreatingFolder.value = false
}

const openRenameModal = (folder: string) => {
  renamingFolderOldName.value = folder
  renameFolderNewName.value = folder
  renameModalOpen.value = true
}

const confirmRenameFolder = () => {
  const clean = renameFolderNewName.value.trim()
  if (clean && clean !== renamingFolderOldName.value) {
    emit('rename-folder', {
      oldName: renamingFolderOldName.value,
      newName: clean
    })
  }
  renameModalOpen.value = false
}

const handleDeleteFolder = (folder: string) => {
  if (confirm(`Tem certeza de que deseja excluir a pasta "${folder}"? Os itens serão movidos para "Sem pasta".`)) {
    emit('delete-folder', folder)
  }
}

const isMobileScreen = ref(false)

const updateMobileState = () => {
  if (typeof window !== 'undefined') {
    isMobileScreen.value = window.innerWidth < 768
  }
}

onMounted(() => {
  updateMobileState()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobileState, { passive: true })
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobileState)
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}
</style>
