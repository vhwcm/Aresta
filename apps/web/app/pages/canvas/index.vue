<template>
  <div class="h-screen w-full flex bg-bgApp text-textPrimary overflow-hidden font-interface select-none">
    <!-- Sidebar Unificada com Árvore de Pastas & Arquivos -->
    <FolderTagSidebar
      :items="unifiedSidebarItems"
      :folders="unifiedFolders"
      :selected-folder="activeFolder"
      :selected-tag="activeTag"
      :selected-item-id="activeNote ? `note-${activeNote.id}` : null"
      title="Espaço Criativo"
      item-label="itens"
      v-model:collapsed="isSidebarCollapsed"
      @select-folder="handleSelectFolder"
      @select-tag="handleSelectTag"
      @select-item="handleSelectItemFromTree"
      @create-note="handleCreateNewNote"
      @create-folder="handleCreateFolder"
      @rename-folder="handleRenameFolder"
      @delete-folder="handleDeleteFolder"
    />

    <!-- Área Central / Workspace Hub -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Top Header & Ações Globais -->
      <header class="border-b border-divider bg-bgPanel/95 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-3 flex-shrink-0 z-10">
        <!-- DESKTOP / TABLET (>= md): Layout Espaçoso -->
        <div class="hidden md:flex items-center justify-between gap-3 max-w-7xl w-full mx-auto">
          <!-- Lado Esquerdo: Busca Unificada + Alternador Grafo/Grade -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Campo de Busca em Tempo Real Unificado -->
            <div class="flex-1 max-w-sm sm:max-w-md relative">
              <SearchIcon class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar livros, notas, temas, quadros e tags..."
                class="w-full pl-8 sm:pl-9 pr-7 py-1.5 rounded-xl bg-bgRoot border border-divider text-xs text-textPrimary focus:outline-none focus:border-accent placeholder:text-textSecondary font-interface shadow-inner"
              />
              <button
                v-if="searchQuery"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary text-xs cursor-pointer"
                @click="searchQuery = ''"
              >
                ✕
              </button>
            </div>

            <!-- Alternador de Visualização: Grafo de Conhecimento vs. Grade -->
            <div class="flex-shrink-0 flex items-center gap-1 p-1 rounded-xl bg-bgRoot border border-divider text-xs">
              <button
                class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                :class="viewLayout === 'graph' ? 'bg-accent text-white font-semibold shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                title="Exibir Grafo de Conhecimento interativo"
                @click="viewLayout = 'graph'"
              >
                <NetworkIcon class="w-3.5 h-3.5" />
                <span>Grafo</span>
              </button>
              <button
                class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                :class="viewLayout === 'grid' ? 'bg-accent text-white font-semibold shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                title="Exibir como galeria em grade"
                @click="viewLayout = 'grid'"
              >
                <LayoutGridIcon class="w-3.5 h-3.5" />
                <span>Grade</span>
              </button>
            </div>
          </div>

          <!-- Lado Direito: Botões de Ação Rápida -->
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <!-- Novo Desenho -->
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bgSurface hover:bg-primary/10 text-textPrimary hover:text-primary border border-divider hover:border-primary/40 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Criar nova nota de desenho estilo Samsung Notes"
              @click="handleCreateNewDrawing()"
            >
              <PenToolIcon class="w-3.5 h-3.5 text-primary" />
              <span>Novo Desenho</span>
            </button>

            <!-- Nova Nota -->
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bgSurface hover:bg-accent/10 text-textPrimary hover:text-accent border border-divider hover:border-accent/40 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Criar nova anotação em Markdown"
              @click="handleCreateNewNote()"
            >
              <FileTextIcon class="w-3.5 h-3.5 text-accent" />
              <span>Nova Nota</span>
            </button>

            <!-- Novo Link -->
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bgSurface hover:bg-emerald-500/10 text-textPrimary hover:text-emerald-500 border border-divider hover:border-emerald-500/40 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Adicionar novo link com título"
              @click="openNewLinkModal()"
            >
              <GlobeIcon class="w-3.5 h-3.5 text-emerald-500" />
              <span>Novo Link</span>
            </button>

            <!-- Novo Quadro -->
            <button
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-all shadow-sm shadow-accent/20 hover:scale-102 cursor-pointer disabled:opacity-50"
              :disabled="isCreating"
              title="Criar novo quadro infinito"
              @click="newCanvasModalOpen = true"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>Novo Quadro</span>
            </button>
          </div>
        </div>

        <!-- MOBILE (< md): Linha Única com Busca Expansível por Ícone de Lupa -->
        <div class="flex md:hidden items-center justify-between gap-1 w-full max-w-7xl mx-auto">
          <!-- Estado A: Busca Expansível Aberta -->
          <div v-if="isMobileSearchOpen" class="flex items-center gap-2 w-full animate-in fade-in duration-150">
            <div class="flex-1 relative">
              <SearchIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none" />
              <input
                ref="mobileSearchInputRef"
                v-model="searchQuery"
                type="text"
                placeholder="Buscar livros, notas, quadros..."
                class="w-full pl-9 pr-8 py-1.5 rounded-xl bg-bgRoot border border-accent/50 text-xs text-textPrimary focus:outline-none focus:border-accent placeholder:text-textSecondary font-interface shadow-inner"
                @keydown.esc="isMobileSearchOpen = false"
              />
              <button
                v-if="searchQuery"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary text-xs cursor-pointer p-0.5"
                @click="searchQuery = ''"
              >
                ✕
              </button>
            </div>
            <button
              class="px-3 py-1.5 rounded-xl bg-bgSurface hover:bg-bgElevated text-textSecondary hover:text-textPrimary border border-divider text-xs font-medium transition-all cursor-pointer shrink-0"
              @click="isMobileSearchOpen = false"
            >
              Fechar
            </button>
          </div>

          <!-- Estado B: Linha Única com Todos os Itens -->
          <div v-else class="flex items-center justify-between gap-1 w-full overflow-x-auto no-scrollbar py-0.5">
            <!-- Grupo Esquerdo: Sidebar + Busca (Ícone) + Alternador Grafo/Grade -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Botão Sidebar Drawer (Mobile) -->
              <button
                v-if="isSidebarCollapsed"
                class="p-2 rounded-xl bg-bgPanel hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all cursor-pointer shrink-0"
                title="Abrir pastas & tags"
                @click="isSidebarCollapsed = false"
              >
                <SidebarIcon class="w-4 h-4" />
              </button>

              <!-- Botão de Lupa (Expande a Busca) -->
              <button
                class="p-2 rounded-xl bg-bgPanel hover:bg-bgSurface border border-divider transition-all cursor-pointer shrink-0"
                :class="searchQuery ? 'text-accent border-accent/40 bg-accent/10' : 'text-textSecondary hover:text-textPrimary'"
                title="Buscar"
                @click="openMobileSearch"
              >
                <SearchIcon class="w-4 h-4" />
              </button>

              <!-- Alternador Grafo/Grade -->
              <div class="flex items-center gap-0.5 p-0.5 rounded-xl bg-bgRoot border border-divider text-xs shrink-0">
                <button
                  class="p-1.5 rounded-lg transition-all flex items-center cursor-pointer"
                  :class="viewLayout === 'graph' ? 'bg-accent text-white font-semibold shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                  title="Grafo"
                  @click="switchToGraphView"
                >
                  <NetworkIcon class="w-3.5 h-3.5" />
                </button>
                <button
                  class="p-1.5 rounded-lg transition-all flex items-center cursor-pointer"
                  :class="viewLayout === 'grid' ? 'bg-accent text-white font-semibold shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                  title="Grade"
                  @click="viewLayout = 'grid'"
                >
                  <LayoutGridIcon class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Botão Gatilho de Sincronização Dinâmica -->
              <button
                class="p-2 rounded-xl bg-bgPanel hover:bg-bgSurface border border-divider transition-all cursor-pointer shrink-0 relative flex items-center justify-center"
                :class="isSyncing ? 'text-accent border-accent/40 bg-accent/10' : 'text-textSecondary hover:text-textPrimary'"
                :title="isSyncing ? 'Sincronizando dados com outros dispositivos...' : (lastSyncFormatted ? `Sincronizar dados (Último sync: ${lastSyncFormatted})` : 'Sincronizar agora')"
                :disabled="isSyncing"
                @click="triggerManualSync"
              >
                <RefreshCwIcon class="w-4 h-4 transition-transform" :class="{ 'animate-spin': isSyncing }" />
                <span
                  v-if="pendingCount > 0"
                  class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-pulse"
                ></span>
              </button>
            </div>

            <!-- Grupo Direito: Novo Desenho + Nova Nota + Novo Quadro -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Novo Desenho -->
              <button
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bgSurface hover:bg-primary/10 text-textPrimary hover:text-primary border border-divider hover:border-primary/40 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Criar novo caderno de desenho"
                @click="handleCreateNewDrawing()"
              >
                <PenToolIcon class="w-3.5 h-3.5 text-primary" />
                <span class="hidden xs:inline">Novo Desenho</span>
              </button>

              <!-- Nova Nota -->
              <button
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bgSurface hover:bg-accent/10 text-textPrimary hover:text-accent border border-divider hover:border-accent/40 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Criar nova anotação em Markdown"
                @click="handleCreateNewNote()"
              >
                <FileTextIcon class="w-3.5 h-3.5 text-accent" />
                <span>Nova Nota</span>
              </button>

              <!-- Novo Link -->
              <button
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bgSurface hover:bg-emerald-500/10 text-textPrimary hover:text-emerald-500 border border-divider hover:border-emerald-500/40 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Adicionar novo link"
                @click="openNewLinkModal()"
              >
                <GlobeIcon class="w-3.5 h-3.5 text-emerald-500" />
                <span class="hidden xs:inline">Link</span>
              </button>

              <!-- Novo Quadro -->
              <button
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-all shadow-sm shadow-accent/20 hover:scale-102 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                :disabled="isCreating"
                title="Criar novo quadro infinito"
                @click="newCanvasModalOpen = true"
              >
                <PlusIcon class="w-3.5 h-3.5" />
                <span>Novo Quadro</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Chips de Filtros Ativos (Pasta, Tag, Busca) -->
        <div v-if="activeFolder || activeTag || searchQuery" class="max-w-7xl w-full mx-auto mt-2 sm:mt-2.5 flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs pt-2 border-t border-divider/40">
          <span class="text-textSecondary text-[11px]">Filtros ativos:</span>

          <span
            v-if="activeFolder"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-accent/15 border border-accent/30 text-accent font-medium text-xs"
          >
            <FolderIcon class="w-3 h-3" />
            <span>{{ activeFolder === '__uncategorized__' ? 'Sem pasta' : activeFolder }}</span>
            <button @click="activeFolder = null" class="hover:text-white cursor-pointer ml-1">✕</button>
          </span>

          <span
            v-if="activeTag"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-accent text-white font-medium text-xs shadow-xs"
          >
            <span>#{{ activeTag }}</span>
            <button @click="activeTag = null" class="hover:opacity-80 cursor-pointer ml-1">✕</button>
          </span>

          <span
            v-if="searchQuery"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-bgSurface border border-divider text-textPrimary text-xs"
          >
            <span>Busca: "{{ searchQuery }}"</span>
            <button @click="searchQuery = ''" class="hover:text-accent cursor-pointer ml-1">✕</button>
          </span>

          <button
            @click="clearAllFilters"
            class="text-[11px] text-textSecondary hover:text-accent underline ml-2 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      </header>

      <!-- Mensagem de Erro Global -->
      <div
        v-if="errorMessage"
        class="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between"
      >
        <span>{{ errorMessage }}</span>
        <button class="text-xs font-semibold underline hover:text-red-300 ml-4 cursor-pointer" @click="errorMessage = null">
          Fechar
        </button>
      </div>

      <!-- CORPO PRINCIPAL: MODO 1 - GRAFO DE CONHECIMENTO NO CENTRO (UNIFICADO) -->
      <div v-if="viewLayout === 'graph'" class="flex-1 relative overflow-hidden">
        <AppKnowledgeGraph
          :is-compact="false"
          :search-query="searchQuery"
          :show-controls="false"
          @select-node="handleSelectGraphNode"
        />
      </div>

      <!-- CORPO PRINCIPAL: MODO 2 - VISÃO EM GRADE / GALERIA DE CARDS -->
      <main
        v-else-if="viewLayout === 'grid'"
        class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pb-28"
      >
        <div class="max-w-7xl w-full mx-auto space-y-6">
          <div class="flex items-center justify-between text-xs text-textSecondary flex-wrap gap-3">
            <!-- Abas do Espaço Unificado: Todos / Quadros / Notas / Desenhos -->
            <div class="flex items-center gap-1 p-1 bg-bgPanel border border-divider rounded-xl">
              <button
                @click="setTab('all')"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'all' ? 'bg-accent text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
              >
                Todos
              </button>
              <button
                @click="setTab('canvases')"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'canvases' ? 'bg-accent text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
              >
                Quadros
              </button>
              <button
                @click="setTab('notes')"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'notes' ? 'bg-accent text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
              >
                Notas
              </button>
              <button
                @click="setTab('drawings')"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                :class="activeTab === 'drawings' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
              >
                <PenToolIcon class="w-3 h-3" />
                <span>Desenhos</span>
              </button>
            </div>

            <span class="font-mono">
              {{ displayItems.length }} {{ displayItems.length === 1 ? 'item exibido' : 'itens exibidos' }}
            </span>
          </div>

          <!-- Grade de Itens (Cards de Quadros e Cards de Notas) -->
          <div v-if="displayItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <template v-for="item in displayItems" :key="item.kind + '-' + item.id">
              <!-- CARD: QUADRO INFINITO (CANVAS) -->
              <div
                v-if="item.kind === 'canvas'"
                class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-accent/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none"
                @click="openCanvas(item.id)"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="flex items-center gap-1.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                        <LayoutGridIcon class="w-3 h-3" />
                        Quadro
                      </span>

                      <span
                        v-if="item.folder"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-textSecondary bg-bgSurface px-2 py-0.5 rounded-md border border-divider truncate max-w-[110px]"
                      >
                        <FolderIcon class="w-2.5 h-2.5 text-accent" />
                        <span class="truncate">{{ item.folder }}</span>
                      </span>
                    </div>

                    <!-- Ações Rápidas no Hover -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                      <button
                        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-accent transition-colors cursor-pointer"
                        title="Mover para pasta"
                        @click="openMoveModal(item.rawCanvas)"
                      >
                        <FolderInputIcon class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-accent transition-colors cursor-pointer"
                        title="Editar tags"
                        @click="openTagsModal(item.rawCanvas)"
                      >
                        <TagIcon class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
                        title="Duplicar quadro"
                        @click="handleDuplicate(item.id)"
                      >
                        <CopyIcon class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1 rounded-lg hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Excluir quadro"
                        @click="handleDeleteCanvas(item.id)"
                      >
                        <Trash2Icon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Título & Descrição do Quadro -->
                  <h3 class="text-sm md:text-base font-semibold text-textPrimary group-hover:text-accent transition-colors line-clamp-1 font-interface">
                    {{ item.title }}
                  </h3>
                  <p v-if="item.description" class="text-xs text-textSecondary mt-1 line-clamp-2 leading-relaxed">
                    {{ item.description }}
                  </p>
                  <p v-else class="text-xs text-textSecondary/50 mt-1 italic line-clamp-1">
                    Quadro infinito para conexões visuais.
                  </p>

                  <!-- Tags do Quadro -->
                  <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap gap-1 mt-3" @click.stop>
                    <button
                      v-for="tag in item.tags"
                      :key="tag"
                      @click="activeTag = tag"
                      class="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                      :class="activeTag === tag ? 'bg-accent text-white' : 'bg-bgSurface text-textSecondary hover:text-accent border border-divider'"
                    >
                      #{{ tag }}
                    </button>
                  </div>
                </div>

                <!-- Rodapé do Card do Quadro (Nós, Arestas e Data) -->
                <div class="flex items-center justify-between pt-3.5 mt-3.5 border-t border-divider/60 text-[11px] text-textSecondary">
                  <div class="flex items-center gap-2.5 font-mono">
                    <span class="inline-flex items-center gap-1 text-textSecondary/90" title="Nós no quadro">
                      <span>📝</span> {{ item.nodeCount || 0 }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-textSecondary/90" title="Conexões / Arestas">
                      <span>🔗</span> {{ item.edgeCount || 0 }}
                    </span>
                  </div>
                  <span class="text-[10px] text-textSecondary/70 font-mono">
                    {{ formatDate(item.updatedAt) }}
                  </span>
                </div>
              </div>

              <!-- CARD: ANOTAÇÃO LIVRE (NOTE) -->
              <div
                v-else-if="item.kind === 'note'"
                class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-indigo-500/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none"
                @click="openNoteEditor(item.rawNote)"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="flex items-center gap-1.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25">
                        <FileTextIcon class="w-3 h-3" />
                        Nota
                      </span>

                      <span
                        v-if="isHtmlNote(item.content)"
                        class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25"
                      >
                        <SparklesIcon class="w-3 h-3 text-amber-400" />
                        Síntese IA
                      </span>

                      <span
                        v-if="item.folder"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-textSecondary bg-bgSurface px-2 py-0.5 rounded-md border border-divider truncate max-w-[110px]"
                      >
                        <FolderIcon class="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                        <span class="truncate">{{ item.folder }}</span>
                      </span>
                    </div>

                    <!-- Ações Rápidas no Hover -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                      <button
                        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Abrir no editor"
                        @click="openNoteEditor(item.rawNote)"
                      >
                        <Edit3Icon class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1 rounded-lg hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Excluir nota"
                        @click="handleDeleteNote(item.id)"
                      >
                        <Trash2Icon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Título & Prévia de Conteúdo Markdown da Nota -->
                  <h3 class="text-sm md:text-base font-semibold text-textPrimary group-hover:text-indigo-400 transition-colors line-clamp-1 font-interface">
                    {{ item.title }}
                  </h3>
                  <p class="text-xs text-textSecondary mt-1 line-clamp-3 leading-relaxed font-sans">
                    {{ cleanMarkdownPreview(item.content) }}
                  </p>

                  <!-- Tags da Nota -->
                  <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap gap-1 mt-3" @click.stop>
                    <button
                      v-for="tag in item.tags"
                      :key="tag"
                      @click="activeTag = tag"
                      class="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                      :class="activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-bgSurface text-textSecondary hover:text-indigo-600 dark:hover:text-indigo-400 border border-divider'"
                    >
                      #{{ tag }}
                    </button>
                  </div>
                </div>

                <!-- Rodapé do Card da Nota -->
                <div class="flex items-center justify-between pt-3.5 mt-3.5 border-t border-divider/60 text-[11px] text-textSecondary">
                  <div class="flex items-center gap-2 font-mono">
                    <span v-if="item.linksCount && item.linksCount > 0" class="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-500/20 text-[10px]">
                      🔗 {{ item.linksCount }}
                    </span>
                    <span v-else class="text-[10px] text-textSecondary italic">
                      Markdown livre
                    </span>
                  </div>
                  <span class="text-[10px] text-textSecondary/70 font-mono">
                    {{ formatDate(item.updatedAt) }}
                  </span>
                </div>
              </div>

              <!-- CARD: NOTA DE DESENHO (DRAWING NOTE) -->
              <div
                v-else-if="item.kind === 'drawing'"
                class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-primary/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none"
                @click="openDrawing(item.id)"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="flex items-center gap-2">
                      <span class="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <PenToolIcon class="w-4 h-4" />
                      </span>
                      <span class="text-[11px] font-mono text-textSecondary uppercase tracking-wider">Desenho</span>
                    </div>
                    <span class="text-[11px] font-mono text-textSecondary/80 px-2 py-0.5 rounded bg-bgElevated">
                      {{ item.pagesCount }} pág{{ item.pagesCount > 1 ? 's' : '' }}
                    </span>
                  </div>

                  <h3 class="text-sm sm:text-base font-bold text-textPrimary group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {{ item.title }}
                  </h3>

                  <!-- Miniatura ou indicação visual de caderno -->
                  <div class="mt-3 w-full h-28 rounded-xl bg-bgElevated/60 border border-divider/40 flex items-center justify-center overflow-hidden">
                    <img
                      v-if="item.preview_url"
                      :src="item.preview_url"
                      alt="Preview"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="flex flex-col items-center gap-1.5 text-textSecondary/60">
                      <PenToolIcon class="w-6 h-6 text-primary/40" />
                      <span class="text-[10px] font-mono">Páginas Samsung Notes</span>
                    </div>
                  </div>

                  <div v-if="item.folder" class="mt-3 flex items-center gap-1 text-[11px] text-textSecondary">
                    <FolderIcon class="w-3 h-3" />
                    <span>{{ item.folder }}</span>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-divider/50 flex items-center justify-between text-[11px] text-textSecondary">
                  <span v-if="item.updatedAt">
                    {{ formatDate(item.updatedAt) }}
                  </span>
                  <button
                    class="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-textSecondary hover:text-red-500 transition-all cursor-pointer"
                    title="Excluir desenho"
                    @click.stop="handleDeleteDrawing(item.id)"
                  >
                    <Trash2Icon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- CARD: LINK EXTERNO / NÓ DE LINK -->
              <div
                v-else-if="item.kind === 'link'"
                class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-emerald-500/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none"
                @click="handleOpenLink(item.url)"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="flex items-center gap-1.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                        <GlobeIcon class="w-3 h-3" />
                        Link
                      </span>

                      <span
                        v-if="item.domain"
                        class="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-textSecondary bg-bgSurface px-2 py-0.5 rounded-md border border-divider truncate max-w-[120px]"
                      >
                        {{ item.domain }}
                      </span>

                      <span
                        v-if="item.folder"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-textSecondary bg-bgSurface px-2 py-0.5 rounded-md border border-divider truncate max-w-[100px]"
                      >
                        <FolderIcon class="w-2.5 h-2.5 text-emerald-500" />
                        <span class="truncate">{{ item.folder }}</span>
                      </span>
                    </div>

                    <!-- Ações Rápidas do Card no Hover -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                      <button
                        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-emerald-500 transition-colors cursor-pointer"
                        title="Copiar URL"
                        @click="copyUrl(item.url)"
                      >
                        <CopyIcon class="w-3.5 h-3.5" />
                      </button>
                      <button
                        class="p-1 rounded-lg hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Excluir link"
                        @click="handleDeleteLink(item.id)"
                      >
                        <Trash2Icon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Título do Link com Favicon -->
                  <div class="flex items-start gap-2.5 mt-1">
                    <div class="w-7 h-7 rounded-lg bg-bgElevated border border-divider/60 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                      <img
                        v-if="item.favicon"
                        :src="item.favicon"
                        alt="Favicon"
                        class="w-4 h-4 object-contain"
                        @error="(e: any) => e.target.style.display = 'none'"
                      />
                      <GlobeIcon v-else class="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-sm md:text-base font-semibold text-textPrimary group-hover:text-emerald-400 transition-colors line-clamp-1 font-interface">
                        {{ item.title }}
                      </h3>
                      <p class="text-xs text-textSecondary/80 mt-0.5 line-clamp-1 truncate font-mono text-[11px]">
                        {{ item.url }}
                      </p>
                    </div>
                  </div>

                  <!-- Tags do Link -->
                  <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap gap-1 mt-3" @click.stop>
                    <button
                      v-for="tag in item.tags"
                      :key="tag"
                      @click="activeTag = tag"
                      class="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                      :class="activeTag === tag ? 'bg-emerald-500 text-white' : 'bg-bgSurface text-textSecondary hover:text-emerald-400 border border-divider'"
                    >
                      #{{ tag }}
                    </button>
                  </div>
                </div>

                <!-- Rodapé do Card: Abrir no Navegador e Data -->
                <div class="flex items-center justify-between pt-3.5 mt-3.5 border-t border-divider/60 text-[11px] text-textSecondary">
                  <span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <ExternalLinkIcon class="w-3.5 h-3.5" />
                    <span>Abrir no navegador</span>
                  </span>
                  <span v-if="item.updatedAt" class="text-[10px] text-textSecondary/70 font-mono">
                    {{ formatDate(item.updatedAt) }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- Estado Vazio -->
          <div
            v-else-if="!isCanvasLoading && !isNotesLoading"
            class="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-divider bg-bgPanel/40"
          >
            <div class="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl mb-4">
              ✨
            </div>
            <h3 class="text-base md:text-lg font-semibold text-textPrimary">Nenhum item encontrado</h3>
            <p class="text-xs md:text-sm text-textSecondary max-w-md mt-1 mb-6">
              {{ activeFolder || activeTag || searchQuery ? 'Nenhum quadro ou nota corresponde aos filtros selecionados.' : 'Comece a criar ideias, notas em Markdown ou quadros infinitos de conexões.' }}
            </p>
            <div class="flex items-center gap-3">
              <button
                class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bgSurface hover:bg-bgElevated border border-divider text-textPrimary text-xs font-semibold transition-all cursor-pointer shadow-sm"
                @click="handleCreateNewNote()"
              >
                <FileTextIcon class="w-4 h-4 text-accent" />
                <span>Criar Nova Nota</span>
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-accent/20"
                @click="newCanvasModalOpen = true"
              >
                <PlusIcon class="w-4 h-4" />
                <span>Criar Novo Quadro</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- CORPO PRINCIPAL: MODO 3 - VISÃO DO EDITOR INTEGRADO -->
      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <!-- Coluna de Edição da Nota Ativa via NoteEditorPane -->
        <NoteEditorPane
          v-if="activeNote"
          :note="activeNote"
          :folders="unifiedFolders"
          :canvases="canvasesList"
          @update:note="activeNote = $event"
          @save="scheduleSaveNote"
          @delete="handleDeleteNote"
          @close="handleCloseNoteEditor"
        />

        <!-- Estado de Carregamento da Nota -->
        <div v-else-if="isNotesLoading" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bgDarker select-none">
          <div class="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
          <p class="text-xs font-technical text-textSecondary uppercase tracking-widest">Carregando anotação...</p>
        </div>

        <!-- Estado Vazio no Modo Split quando nenhuma nota estiver selecionada -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bgDarker select-none">
          <div class="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-3xl mb-4">
            📝
          </div>
          <h3 class="text-base font-semibold text-textPrimary">Nenhuma nota selecionada</h3>
          <p class="text-xs text-textSecondary mt-1 max-w-sm">
            Selecione uma nota da árvore ao lado ou crie uma nova anotação.
          </p>
          <button
            class="mt-4 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            @click="handleCreateNewNote()"
          >
            + Criar Nota
          </button>
        </div>
      </div>
    </div>

    <!-- Modais Reutilizáveis de Ação (Canvas) -->
    <CanvasActionModals
      v-model:new-canvas-modal-open="newCanvasModalOpen"
      v-model:move-modal-open="moveModalOpen"
      v-model:tags-modal-open="tagsModalOpen"
      :target-canvas="targetCanvas"
      :folders="unifiedFolders"
      :available-tags="availableTags"
      :is-creating="isCreating"
      :initial-folder="activeFolder"
      :initial-tag="activeTag"
      @confirm-create="handleConfirmCreateCanvas"
      @confirm-move="handleConfirmMoveCanvas"
      @confirm-tags="handleConfirmTagsCanvas"
    />

    <!-- Modal: Novo Link -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="newLinkModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          @click.self="newLinkModalOpen = false"
        >
          <div class="w-full max-w-md bg-bgPanel border border-divider rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div class="flex items-center justify-between border-b border-divider/60 pb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <GlobeIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-textPrimary">Adicionar Novo Link</h3>
                  <p class="text-[11px] text-textSecondary">Crie um nó de link no Grafo e Espaço Criativo</p>
                </div>
              </div>
              <button
                type="button"
                class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 cursor-pointer"
                @click="newLinkModalOpen = false"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-textPrimary mb-1">Endereço Web (URL)</label>
                <div class="relative flex items-center">
                  <GlobeIcon class="w-3.5 h-3.5 text-textSecondary absolute left-3" />
                  <input
                    v-model="newLinkUrl"
                    type="url"
                    placeholder="https://exemplo.com/artigo"
                    class="w-full pl-8 pr-3 py-2 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-emerald-500 shadow-inner"
                    @keydown.enter.prevent="handleConfirmCreateLink"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-textPrimary mb-1">Título do Link (Opcional)</label>
                <input
                  v-model="newLinkTitle"
                  type="text"
                  placeholder="Ex: Documentação Oficial, Artigo..."
                  class="w-full px-3 py-2 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-emerald-500 shadow-inner"
                  @keydown.enter.prevent="handleConfirmCreateLink"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-textPrimary mb-1">Pasta (Opcional)</label>
                <input
                  v-model="newLinkFolder"
                  type="text"
                  placeholder="Ex: Recursos, Artigos..."
                  class="w-full px-3 py-2 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-divider/60">
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer"
                @click="newLinkModalOpen = false"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
                :disabled="!newLinkUrl.trim()"
                @click="handleConfirmCreateLink"
              >
                Adicionar Link
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import {
  SearchIcon,
  PlusIcon,
  FolderIcon,
  FolderInputIcon,
  TagIcon,
  CopyIcon,
  Trash2Icon,
  SidebarIcon,
  LayoutGridIcon,
  FileTextIcon,
  Edit3Icon,
  NetworkIcon,
  PenTool as PenToolIcon,
  Sparkles as SparklesIcon,
  Globe as GlobeIcon,
  ExternalLink as ExternalLinkIcon,
  Link as LinkIcon,
  X as XIcon,
  RefreshCw as RefreshCwIcon,
} from 'lucide-vue-next'
import FolderTagSidebar, { type SidebarTreeItem } from '~/components/FolderTagSidebar.vue'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import CanvasActionModals from '~/components/canvas/CanvasActionModals.vue'
import NoteEditorPane from '~/components/notes/NoteEditorPane.vue'
import AppKnowledgeGraph from '~/components/graph/AppKnowledgeGraph.vue'
import { useCanvas } from '~/composables/useCanvas'
import { useNotes } from '~/composables/useNotes'
import { useDrawing } from '~/composables/useDrawing'
import { useGraph } from '~/composables/useGraph'
import { useLinks } from '~/composables/useLinks'
import { useDriveSync } from '~/composables/useDriveSync'
import { openExternalUrl, sanitizeUrl, cleanUrlTitle } from '~/utils/urlOpener'
import type { CanvasSummary } from '~/interfaces/canvas'
import type { NoteItem } from '~/interfaces/note'

const auth = useAuth()
const route = useRoute()
const router = useRouter()

const isSidebarCollapsed = ref(false)
const searchQuery = ref('')
const activeFolder = ref<string | null>((route?.query?.folder as string) || null)
const activeTag = ref<string | null>((route?.query?.tag as string) || null)

// Busca expansível no mobile
const isMobileSearchOpen = ref(false)
const mobileSearchInputRef = ref<HTMLInputElement | null>(null)

const openMobileSearch = async () => {
  isMobileSearchOpen.value = true
  await nextTick()
  mobileSearchInputRef.value?.focus()
}

// Controle de abas: 'all' | 'canvases' | 'notes' | 'drawings'
const activeTab = ref<'all' | 'canvases' | 'notes' | 'drawings'>('all')

// Controle de layout: 'graph' (Grafo de Conhecimento Central) | 'grid' (Galeria) | 'note-editor' (Editor Live Preview)
const viewLayout = ref<'graph' | 'grid' | 'note-editor'>(
  (route?.query?.view as string) === 'grid'
    ? 'grid'
    : (route?.query?.view as string) === 'split' || (route?.query?.view as string) === 'note-editor'
      ? 'note-editor'
      : 'graph'
)

// Nota ativa no editor
const activeNote = ref<NoteItem | null>(null)
let noteSaveTimeout: any = null

const isCreating = ref(false)
const errorMessage = ref<string | null>(null)

// Modais Canvas
const newCanvasModalOpen = ref(false)
const moveModalOpen = ref(false)
const tagsModalOpen = ref(false)
const targetCanvas = ref<CanvasSummary | null>(null)

// Composables
const {
  canvasesList,
  canvasFolders,
  isLoading: isCanvasLoading,
  fetchCanvases,
  fetchCanvasFolders,
  createCanvas,
  updateCanvasMetadata,
  deleteCanvas,
  duplicateCanvas,
} = useCanvas()

const {
  notesList,
  folders: noteFolders,
  isLoading: isNotesLoading,
  fetchNotes,
  fetchFolders: fetchNoteFolders,
  createNote,
  updateNote,
  deleteNote,
  loadNote,
} = useNotes()

const {
  drawingsList,
  isLoading: isDrawingsLoading,
  fetchDrawings,
  createDrawing,
  deleteDrawing,
} = useDrawing()

const {
  linksList,
  linkFolders,
  isLoading: isLinksLoading,
  fetchLinks,
  createLink,
  removeLink,
} = useLinks()

const { graphData, fetchGraph: fetchUnifiedGraph, createConnection, linkBookToNode } = useGraph()
const { isSyncing, lastSyncFormatted, pendingCount, sync: triggerManualSync } = useDriveSync()

// Modal Novo Link
const newLinkModalOpen = ref(false)
const newLinkUrl = ref('')
const newLinkTitle = ref('')
const newLinkFolder = ref('')

const openNewLinkModal = () => {
  newLinkUrl.value = ''
  newLinkTitle.value = ''
  newLinkFolder.value = activeFolder.value && activeFolder.value !== '__uncategorized__' ? activeFolder.value : ''
  newLinkModalOpen.value = true
}

const handleConfirmCreateLink = async () => {
  const url = sanitizeUrl(newLinkUrl.value)
  if (!url) return
  const title = cleanUrlTitle(url, newLinkTitle.value)
  await createLink({
    url,
    title,
    folder: newLinkFolder.value.trim() || null
  })
  newLinkModalOpen.value = false
  newLinkUrl.value = ''
  newLinkTitle.value = ''
  newLinkFolder.value = ''
  fetchUnifiedGraph()
}

const handleOpenLink = async (url: string) => {
  await openExternalUrl(url)
}

const handleDeleteLink = async (id: string) => {
  await removeLink(id)
  fetchUnifiedGraph()
}

const copyUrl = (url: string) => {
  if (typeof navigator !== 'undefined') {
    navigator.clipboard.writeText(url)
  }
}

const handleConnectNodesPayload = async (payload: any) => {
  try {
    if (payload.sourceType === 'book' && payload.targetType === 'theme') {
      await linkBookToNode(Number(payload.targetRawId || payload.targetId), Number(payload.sourceRawId || payload.sourceId))
    } else if (payload.sourceType === 'theme' && payload.targetType === 'book') {
      await linkBookToNode(Number(payload.sourceRawId || payload.sourceId), Number(payload.targetRawId || payload.targetId))
    } else {
      const sourceId = payload.sourceId ?? payload.sourceRawId
      const targetId = payload.targetId ?? payload.targetRawId
      if (sourceId !== undefined && targetId !== undefined) {
        await createConnection(sourceId, targetId)
      }
    }
  } catch (err) {
    console.warn('[canvas/index] Falha ao persistir conexão no backend:', err)
  }
}

const handleSelectGraphNode = async (node: any) => {
  if (node.type === 'canvas' || String(node.id).startsWith('canvas-')) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^canvas-/, '')
    openCanvas(rawId)
  } else if ((node.type === 'note' && (node.isDrawing || (node as any).is_drawing)) || String(node.id).includes('drawing')) {
    // Desenhos têm type='note' no grafo mas isDrawing=true — navegam para a página de desenho
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    openDrawing(rawId)
  } else if (node.type === 'note' || String(node.id).startsWith('note-')) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    const strippedId = rawId.replace(/^note-/, '')
    const target = notesList.value.find((n) => {
      const nId = String(n.id)
      return nId === rawId || nId.replace(/^note-/, '') === strippedId || nId === `note-${strippedId}`
    })
    if (target) {
      openNoteEditor(target)
    } else {
      const loaded = await loadNote(rawId)
      if (loaded) openNoteEditor(loaded)
    }
  } else if (node.type === 'book') {
    // Gaveta de anotações do livro é tratada dentro do próprio AppKnowledgeGraph
  } else if (node.type === 'annotation') {
    if (node.bookId) {
      navigateTo(`/reader?bookId=${node.bookId}${node.cfi ? '&cfi=' + encodeURIComponent(node.cfi) : ''}`)
    }
  } else if (node.type === 'folder') {
    const folderName = node.rawId || String(node.id).replace(/^folder-/, '')
    activeFolder.value = decodeURIComponent(folderName)
    viewLayout.value = 'grid'
  } else if (node.type === 'link' || (node as any).isLink || String(node.id).startsWith('link-')) {
    const url = node.url || (node as any).rawLink?.url
    if (url) {
      await openExternalUrl(url)
    }
  } else if (node.type === 'theme') {
    viewLayout.value = 'graph'
  }
}

// Sincroniza query params da rota
const syncFromRoute = async () => {
  let hasExplicitTab = false
  if (route?.query?.tab) {
    hasExplicitTab = true
    const tabStr = String(route.query.tab).toLowerCase()
    if (tabStr === 'notes' || tabStr === 'note') activeTab.value = 'notes'
    else if (tabStr === 'canvases' || tabStr === 'canvas') activeTab.value = 'canvases'
    else if (tabStr === 'drawings' || tabStr === 'drawing') activeTab.value = 'drawings'
    else activeTab.value = 'all'
  }
  if (route?.query?.folder !== undefined) {
    activeFolder.value = (route.query.folder as string) || null
  }
  if (route?.query?.tag !== undefined) {
    activeTag.value = (route.query.tag as string) || null
  }

  const noteParam = (route?.query?.note || route?.query?.id) as string | undefined
  if (noteParam) {
    const note = await loadNote(noteParam)
    if (note) {
      activeNote.value = note
      viewLayout.value = 'note-editor'
    } else {
      if (route?.query?.view === 'grid' || (!route?.query?.view && hasExplicitTab)) {
        viewLayout.value = 'grid'
      } else if (route?.query?.view === 'split' || route?.query?.view === 'note-editor') {
        viewLayout.value = 'note-editor'
      } else if (route?.query?.view === 'graph') {
        viewLayout.value = 'graph'
      }
    }
  } else {
    if (route?.query?.view === 'grid' || (!route?.query?.view && hasExplicitTab)) {
      viewLayout.value = 'grid'
    } else if (route?.query?.view === 'split' || route?.query?.view === 'note-editor') {
      viewLayout.value = 'note-editor'
    } else if (route?.query?.view === 'graph') {
      viewLayout.value = 'graph'
    }
  }
}

watch(() => route.query, () => { syncFromRoute() }, { deep: true })

const handleDataSynced = async () => {
  try {
    await Promise.all([
      fetchCanvases(),
      fetchCanvasFolders(),
      fetchNotes(),
      fetchNoteFolders(),
      fetchDrawings(),
      fetchLinks(),
      fetchUnifiedGraph(),
    ])
  } catch {}
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('aresta:data-synced', handleDataSynced)
  }

  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }

  if (!auth.isLoggedIn.value) return

  try {
    await handleDataSynced()
    await syncFromRoute()
  } catch (err: any) {
    console.error('Erro ao carregar dados do Hub:', err)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('aresta:data-synced', handleDataSynced)
  }
})

watch(viewLayout, (val) => {
  if (val === 'graph') {
    fetchUnifiedGraph()
  }
})

const setTab = (tab: 'all' | 'canvases' | 'notes' | 'drawings') => {
  activeTab.value = tab
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'all' ? undefined : tab
    }
  })
}

const clearAllFilters = () => {
  activeFolder.value = null
  activeTag.value = null
  searchQuery.value = ''
}

// União de pastas de quadros, notas, desenhos e links
const unifiedFolders = computed(() => {
  const set = new Set<string>([...canvasFolders.value, ...noteFolders.value, ...linkFolders.value])
  for (const c of canvasesList.value) {
    if (c.folder) set.add(c.folder)
  }
  for (const n of notesList.value) {
    if (n.folder) set.add(n.folder)
  }
  for (const d of drawingsList.value) {
    if (d.folder) set.add(d.folder)
  }
  for (const l of linksList.value) {
    if (l.folder) set.add(l.folder)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

// Itens combinados para contagem e renderização na FolderTagSidebar Tree View
const unifiedSidebarItems = computed<SidebarTreeItem[]>(() => {
  const cItems: SidebarTreeItem[] = canvasesList.value.map((c) => ({
    id: `canvas-${c.id}`,
    title: c.title || 'Quadro sem título',
    kind: 'canvas',
    folder: c.folder,
    tags: c.tags
  }))
  const nItems: SidebarTreeItem[] = notesList.value.map((n) => ({
    id: `note-${n.id}`,
    title: n.title || 'Nota sem título',
    kind: 'note',
    folder: n.folder,
    tags: n.tags
  }))
  const dItems: SidebarTreeItem[] = drawingsList.value.map((d) => ({
    id: `drawing-${d.id}`,
    title: d.title || 'Desenho sem título',
    kind: 'drawing' as any,
    folder: d.folder,
    tags: d.tags
  }))
  const lItems: SidebarTreeItem[] = linksList.value.map((l) => ({
    id: `link-${l.id}`,
    title: l.title || l.domain || 'Link',
    kind: 'link' as any,
    folder: l.folder,
    tags: l.tags
  }))
  return [...cItems, ...nItems, ...dItems, ...lItems]
})

const totalCombinedCount = computed(() => {
  return canvasesList.value.length + notesList.value.length + linksList.value.length
})

// Lista unificada de todas as tags existentes em quadros, notas e links
const availableTags = computed<string[]>(() => {
  const counts: Record<string, number> = {}
  for (const item of canvasesList.value) {
    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        const clean = typeof t === 'string' ? t.trim() : ''
        if (clean) counts[clean] = (counts[clean] || 0) + 1
      }
    }
  }
  for (const note of notesList.value) {
    if (Array.isArray(note.tags)) {
      for (const t of note.tags) {
        const clean = typeof t === 'string' ? t.trim() : ''
        if (clean) counts[clean] = (counts[clean] || 0) + 1
      }
    }
  }
  for (const l of linksList.value) {
    if (Array.isArray(l.tags)) {
      for (const t of l.tags) {
        const clean = typeof t === 'string' ? t.trim() : ''
        if (clean) counts[clean] = (counts[clean] || 0) + 1
      }
    }
  }
  return Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b))
})

// Manipuladores da Sidebar de Pastas e Tags
const handleSelectFolder = (folder: string | null) => {
  activeFolder.value = folder
}

const handleSelectTag = (tag: string | null) => {
  activeTag.value = tag
}

const handleSelectItemFromTree = (item: SidebarTreeItem) => {
  if (item.kind === 'canvas') {
    const rawId = item.id.replace(/^canvas-/, '')
    openCanvas(rawId)
  } else if ((item.kind as string) === 'link') {
    const rawId = item.id.replace(/^link-/, '')
    const found = linksList.value.find((l) => l.id === rawId)
    if (found?.url) {
      openExternalUrl(found.url)
    }
  } else {
    const rawId = item.id.replace(/^note-/, '')
    const found = notesList.value.find((n) => n.id === rawId)
    if (found) {
      openNoteEditor(found)
    }
  }
}

const handleCreateFolder = (name: string) => {
  if (!canvasFolders.value.includes(name)) canvasFolders.value.push(name)
  if (!noteFolders.value.includes(name)) noteFolders.value.push(name)
}

const handleRenameFolder = async ({ oldName, newName }: { oldName: string; newName: string }) => {
  const cIdx = canvasFolders.value.indexOf(oldName)
  if (cIdx !== -1) canvasFolders.value[cIdx] = newName
  const nIdx = noteFolders.value.indexOf(oldName)
  if (nIdx !== -1) noteFolders.value[nIdx] = newName

  // Atualiza em canvases
  for (const item of canvasesList.value) {
    if (item.folder === oldName) {
      await updateCanvasMetadata(item.id, { folder: newName })
    }
  }

  // Atualiza em notas
  for (const n of notesList.value) {
    if (n.folder === oldName) {
      await updateNote(n.id, { folder: newName })
    }
  }

  if (activeFolder.value === oldName) activeFolder.value = newName
  if (activeNote.value && activeNote.value.folder === oldName) {
    activeNote.value.folder = newName
  }
}

const handleDeleteFolder = async (folderName: string) => {
  canvasFolders.value = canvasFolders.value.filter((f) => f !== folderName)
  noteFolders.value = noteFolders.value.filter((f) => f !== folderName)

  for (const item of canvasesList.value) {
    if (item.folder === folderName) {
      await updateCanvasMetadata(item.id, { folder: null })
    }
  }
  for (const n of notesList.value) {
    if (n.folder === folderName) {
      await updateNote(n.id, { folder: null })
    }
  }

  if (activeFolder.value === folderName) activeFolder.value = null
  if (activeNote.value && activeNote.value.folder === folderName) {
    activeNote.value.folder = null
  }
}

// Filtros combinados de Busca + Pasta + Tag para Quadros
const filteredCanvases = computed(() => {
  return canvasesList.value.filter((c) => {
    if (activeFolder.value !== null) {
      if (activeFolder.value === '__uncategorized__') {
        if (c.folder) return false
      } else if (c.folder !== activeFolder.value) {
        return false
      }
    }

    if (activeTag.value !== null) {
      if (!c.tags || !c.tags.includes(activeTag.value)) return false
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = c.title?.toLowerCase().includes(q)
      const matchDesc = c.description?.toLowerCase().includes(q)
      const matchTag = c.tags?.some((t) => t.toLowerCase().includes(q))
      if (!matchTitle && !matchDesc && !matchTag) return false
    }

    return true
  })
})

// Filtros combinados de Busca + Pasta + Tag para Notas
const filteredNotes = computed(() => {
  return notesList.value.filter((n) => {
    if (activeFolder.value !== null) {
      if (activeFolder.value === '__uncategorized__') {
        if (n.folder) return false
      } else if (n.folder !== activeFolder.value) {
        return false
      }
    }

    if (activeTag.value !== null) {
      if (!n.tags || !n.tags.includes(activeTag.value)) return false
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = n.title?.toLowerCase().includes(q)
      const matchContent = n.content?.toLowerCase().includes(q)
      const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q))
      if (!matchTitle && !matchContent && !matchTag) return false
    }

    return true
  })
})

// Filtros combinados de Busca + Pasta + Tag para Desenhos
const filteredDrawings = computed(() => {
  return drawingsList.value.filter((d) => {
    if (activeFolder.value !== null) {
      if (activeFolder.value === '__uncategorized__') {
        if (d.folder) return false
      } else if (d.folder !== activeFolder.value) {
        return false
      }
    }

    if (activeTag.value !== null) {
      if (!d.tags || !d.tags.includes(activeTag.value)) return false
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = d.title?.toLowerCase().includes(q)
      const matchTag = d.tags?.some((t) => t.toLowerCase().includes(q))
      if (!matchTitle && !matchTag) return false
    }

    return true
  })
})

// Filtros combinados de Busca + Pasta + Tag para Links
const filteredLinks = computed(() => {
  return linksList.value.filter((l) => {
    if (activeFolder.value !== null) {
      if (activeFolder.value === '__uncategorized__') {
        if (l.folder) return false
      } else if (l.folder !== activeFolder.value) {
        return false
      }
    }

    if (activeTag.value !== null) {
      if (!l.tags || !l.tags.includes(activeTag.value)) return false
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = l.title?.toLowerCase().includes(q)
      const matchUrl = l.url?.toLowerCase().includes(q)
      const matchDomain = l.domain?.toLowerCase().includes(q)
      const matchTag = l.tags?.some((t) => t.toLowerCase().includes(q))
      if (!matchTitle && !matchUrl && !matchDomain && !matchTag) return false
    }

    return true
  })
})

// Lista combinada de itens unificados para renderização na Grade (ordenada por data mais recente)
interface DisplayItemBase {
  id: string
  title: string
  folder?: string | null
  tags?: string[]
  updatedAt?: string
}

interface DisplayCanvasItem extends DisplayItemBase {
  kind: 'canvas'
  description?: string | null
  nodeCount?: number
  edgeCount?: number
  rawCanvas: CanvasSummary
}

interface DisplayNoteItem extends DisplayItemBase {
  kind: 'note'
  content?: string
  linksCount?: number
  rawNote: NoteItem
}

interface DisplayDrawingItem extends DisplayItemBase {
  kind: 'drawing'
  pagesCount: number
  preview_url?: string | null
  rawDrawing: any
}

interface DisplayLinkItem extends DisplayItemBase {
  kind: 'link'
  url: string
  domain?: string
  favicon?: string | null
  rawLink: any
}

type DisplayItem = DisplayCanvasItem | DisplayNoteItem | DisplayDrawingItem | DisplayLinkItem

const displayItems = computed<DisplayItem[]>(() => {
  const items: DisplayItem[] = []

  if (activeTab.value === 'all' || activeTab.value === 'canvases') {
    for (const c of filteredCanvases.value) {
      items.push({
        kind: 'canvas',
        id: c.id,
        title: c.title || 'Quadro sem título',
        description: c.description,
        folder: c.folder,
        tags: c.tags,
        nodeCount: c.nodeCount,
        edgeCount: c.edgeCount,
        updatedAt: c.updatedAt,
        rawCanvas: c
      })
    }
  }

  if (activeTab.value === 'all' || activeTab.value === 'notes') {
    for (const n of filteredNotes.value) {
      items.push({
        kind: 'note',
        id: n.id,
        title: n.title || 'Nota sem título',
        content: n.content,
        folder: n.folder,
        tags: n.tags,
        linksCount: n.linksCount,
        updatedAt: n.updatedAt,
        rawNote: n
      })
    }
  }

  if (activeTab.value === 'all' || activeTab.value === 'drawings') {
    for (const d of filteredDrawings.value) {
      items.push({
        kind: 'drawing',
        id: d.id,
        title: d.title || 'Desenho sem título',
        folder: d.folder,
        tags: d.tags,
        pagesCount: d.pagesCount || 1,
        preview_url: d.preview_url,
        updatedAt: d.updated_at,
        rawDrawing: d
      })
    }
  }

  if (activeTab.value === 'all' || (activeTab.value as string) === 'links') {
    for (const l of filteredLinks.value) {
      items.push({
        kind: 'link',
        id: l.id,
        title: l.title || l.domain || 'Link',
        url: l.url,
        domain: l.domain,
        favicon: l.favicon,
        folder: l.folder,
        tags: l.tags,
        updatedAt: l.updated_at,
        rawLink: l
      })
    }
  }

  return items.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return timeB - timeA
  })
})

const openDrawing = async (id: string) => {
  await navigateTo(`/canvas/drawing/${id}`)
}

const handleCreateNewDrawing = async () => {
  try {
    const created = await createDrawing({
      title: 'Desenho',
      folder: activeFolder.value !== '__uncategorized__' ? activeFolder.value : null,
    })
    if (created?.id) {
      await navigateTo(`/canvas/drawing/${created.id}`)
    }
  } catch (err: any) {
    errorMessage.value = 'Erro ao criar nota de desenho.'
  }
}

const handleDeleteDrawing = async (id: string) => {
  if (confirm('Deseja excluir esta nota de desenho?')) {
    try {
      await deleteDrawing(id)
    } catch {
      errorMessage.value = 'Erro ao excluir nota de desenho.'
    }
  }
}

// Operações de Canvas
const openCanvas = async (id: string) => {
  await navigateTo(`/canvas/${id}`)
}

const handleConfirmCreateCanvas = async (payload: { title: string; description: string; folder: string | null; tags: string[] }) => {
  isCreating.value = true
  errorMessage.value = null

  try {
    const created = await createCanvas({
      title: payload.title,
      description: payload.description || null,
      folder: payload.folder,
      tags: payload.tags
    })

    newCanvasModalOpen.value = false
    if (created?.id) {
      await navigateTo(`/canvas/${created.id}`)
    }
  } catch (err: any) {
    console.error('Erro ao criar quadro:', err)
    errorMessage.value = 'Falha ao criar o quadro. Tente novamente.'
  } finally {
    isCreating.value = false
  }
}

const openMoveModal = (item: CanvasSummary) => {
  targetCanvas.value = item
  moveModalOpen.value = true
}

const handleConfirmMoveCanvas = async (folder: string | null) => {
  if (!targetCanvas.value) return
  await updateCanvasMetadata(targetCanvas.value.id, { folder })
  moveModalOpen.value = false
}

const openTagsModal = (item: CanvasSummary) => {
  targetCanvas.value = item
  tagsModalOpen.value = true
}

const handleConfirmTagsCanvas = async (tags: string[]) => {
  if (!targetCanvas.value) return
  await updateCanvasMetadata(targetCanvas.value.id, { tags })
  tagsModalOpen.value = false
}

const handleDuplicate = async (id: string) => {
  try {
    await duplicateCanvas(id)
  } catch (err) {
    console.error('Erro ao duplicar quadro:', err)
  }
}

const handleDeleteCanvas = async (id: string) => {
  if (confirm('Tem certeza de que deseja excluir este quadro?')) {
    try {
      await deleteCanvas(id)
    } catch (err) {
      console.error('Erro ao excluir quadro:', err)
    }
  }
}

// Operações de Notas
const selectNote = (note: NoteItem) => {
  activeNote.value = { ...note, tags: Array.isArray(note.tags) ? [...note.tags] : [] }
}

const openNoteEditor = (note: NoteItem) => {
  selectNote(note)
  viewLayout.value = 'note-editor'
}

const handleCreateNewNote = async (targetFolder?: string | Event) => {
  const folder = typeof targetFolder === 'string'
    ? (targetFolder === '__uncategorized__' ? null : targetFolder)
    : (activeFolder.value && activeFolder.value !== '__uncategorized__' ? activeFolder.value : null)
  const tags = activeTag.value ? [activeTag.value] : []

  const created = await createNote({
    title: 'Nota',
    content: '',
    folder,
    tags
  })

  if (created) {
    activeNote.value = { ...created, tags: Array.isArray(created.tags) ? [...created.tags] : [] }
    viewLayout.value = 'note-editor'
  }
}

const flushSaveNote = async () => {
  if (noteSaveTimeout) {
    clearTimeout(noteSaveTimeout)
    noteSaveTimeout = null
  }
  if (activeNote.value) {
    await updateNote(activeNote.value.id, {
      title: activeNote.value.title,
      content: activeNote.value.content,
      folder: activeNote.value.folder,
      tags: activeNote.value.tags || []
    })
    await fetchUnifiedGraph()
  }
}

const handleCloseNoteEditor = async () => {
  await flushSaveNote()
  viewLayout.value = 'graph'
}

const switchToGraphView = async () => {
  if (viewLayout.value === 'note-editor' && activeNote.value) {
    await flushSaveNote()
  }
  viewLayout.value = 'graph'
  await fetchUnifiedGraph()
}

const scheduleSaveNote = () => {
  if (!activeNote.value) return
  if (noteSaveTimeout) clearTimeout(noteSaveTimeout)
  noteSaveTimeout = setTimeout(async () => {
    if (activeNote.value) {
      await updateNote(activeNote.value.id, {
        title: activeNote.value.title,
        content: activeNote.value.content,
        folder: activeNote.value.folder,
        tags: activeNote.value.tags || []
      })
      await fetchUnifiedGraph()
    }
  }, 600)
}

const handleDeleteNote = async (id: string) => {
  if (confirm('Tem certeza de que deseja excluir esta nota?')) {
    await deleteNote(id)
    if (activeNote.value?.id === id) {
      activeNote.value = filteredNotes.value[0] || null
    }
  }
}

const isHtmlNote = (content?: string) => {
  if (!content) return false
  return /<([a-z]+)[^>]*>[\s\S]*?<\/\1>/i.test(content) || content.includes('synthesized-html-container') || content.includes('aresta-drawing-synthesis')
}

const cleanMarkdownPreview = (text?: string) => {
  if (!text) return ''
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/\[\[.*?\]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

if (typeof onBeforeRouteLeave === 'function') {
  onBeforeRouteLeave(async () => {
    if (noteSaveTimeout) {
      clearTimeout(noteSaveTimeout)
      noteSaveTimeout = null
      if (activeNote.value) {
        await updateNote(activeNote.value.id, {
          title: activeNote.value.title,
          content: activeNote.value.content,
          folder: activeNote.value.folder,
          tags: activeNote.value.tags ? [...activeNote.value.tags] : []
        })
      }
    }
  })
}

onBeforeUnmount(async () => {
  // Cancela o timer pendente e salva imediatamente para evitar perda
  // quando o usuário sai antes do debounce de 600ms disparar.
  if (noteSaveTimeout) {
    clearTimeout(noteSaveTimeout)
    noteSaveTimeout = null
    if (activeNote.value) {
      await updateNote(activeNote.value.id, {
        title: activeNote.value.title,
        content: activeNote.value.content,
        folder: activeNote.value.folder,
        tags: activeNote.value.tags ? [...activeNote.value.tags] : []
      })
    }
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
