<template>
  <div class="h-screen w-full flex bg-bgRoot text-textPrimary overflow-hidden font-interface select-none">
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
      <header class="border-b border-divider bg-bgPanel/80 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-3 flex-shrink-0 z-10">
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
                class="w-full pl-8 sm:pl-9 pr-7 py-1.5 rounded-xl bg-bgRoot border border-divider text-xs text-textPrimary focus:outline-none focus:border-accent placeholder:text-textSecondary/50 font-interface shadow-inner"
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
            <!-- Nova Nota -->
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bgSurface hover:bg-accent/10 text-textPrimary hover:text-accent border border-divider hover:border-accent/40 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Criar nova anotação em Markdown"
              @click="handleCreateNewNote()"
            >
              <FileTextIcon class="w-3.5 h-3.5 text-accent" />
              <span>Nova Nota</span>
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
                class="w-full pl-9 pr-8 py-1.5 rounded-xl bg-bgRoot border border-accent/50 text-xs text-textPrimary focus:outline-none focus:border-accent placeholder:text-textSecondary/50 font-interface shadow-inner"
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
                  @click="viewLayout = 'graph'"
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
            </div>

            <!-- Grupo Direito: Nova Nota + Novo Quadro -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Nova Nota -->
              <button
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bgSurface hover:bg-accent/10 text-textPrimary hover:text-accent border border-divider hover:border-accent/40 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
                title="Criar nova anotação em Markdown"
                @click="handleCreateNewNote()"
              >
                <FileTextIcon class="w-3.5 h-3.5 text-accent" />
                <span>Nova Nota</span>
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

      <!-- CORPO PRINCIPAL: MODO 1 - GRAFO DE CONHECIMENTO NO CENTRO -->
      <div v-if="viewLayout === 'graph'" class="flex-1 relative overflow-hidden">
        <GraphCanvas
          :nodes="graphData.nodes || []"
          :edges="graphData.edges || []"
          :search-query="searchQuery"
          :show-controls="false"
          @select-node="handleSelectGraphNode"
          @open-create-node="newCanvasModalOpen = true"
        />
      </div>

      <!-- CORPO PRINCIPAL: MODO 2 - VISÃO EM GRADE / GALERIA DE CARDS -->
      <main
        v-else-if="viewLayout === 'grid'"
        class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pb-28"
      >
        <div class="max-w-7xl w-full mx-auto space-y-6">
          <div class="flex items-center justify-between text-xs text-textSecondary">
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
                v-else
                class="group relative flex flex-col justify-between p-5 rounded-2xl bg-bgPanel border border-divider hover:border-indigo-500/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none"
                @click="openNoteEditor(item.rawNote)"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <div class="flex items-center gap-1.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                        <FileTextIcon class="w-3 h-3" />
                        Nota
                      </span>

                      <span
                        v-if="item.folder"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-textSecondary bg-bgSurface px-2 py-0.5 rounded-md border border-divider truncate max-w-[110px]"
                      >
                        <FolderIcon class="w-2.5 h-2.5 text-indigo-400" />
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
                      :class="activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-bgSurface text-textSecondary hover:text-indigo-400 border border-divider'"
                    >
                      #{{ tag }}
                    </button>
                  </div>
                </div>

                <!-- Rodapé do Card da Nota -->
                <div class="flex items-center justify-between pt-3.5 mt-3.5 border-t border-divider/60 text-[11px] text-textSecondary">
                  <div class="flex items-center gap-2 font-mono">
                    <span v-if="item.linksCount && item.linksCount > 0" class="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 text-[10px]">
                      🔗 {{ item.linksCount }}
                    </span>
                    <span v-else class="text-[10px] text-textSecondary/60 italic">
                      Markdown livre
                    </span>
                  </div>
                  <span class="text-[10px] text-textSecondary/70 font-mono">
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
          @close="viewLayout = 'graph'"
        />

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  NetworkIcon
} from 'lucide-vue-next'
import FolderTagSidebar, { type SidebarTreeItem } from '~/components/FolderTagSidebar.vue'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import CanvasActionModals from '~/components/canvas/CanvasActionModals.vue'
import NoteEditorPane from '~/components/notes/NoteEditorPane.vue'
import GraphCanvas from '~/components/GraphCanvas.vue'
import { useCanvas } from '~/composables/useCanvas'
import { useNotes } from '~/composables/useNotes'
import { useGraph } from '~/composables/useGraph'
import type { CanvasSummary } from '~/interfaces/canvas'
import type { NoteItem } from '~/interfaces/note'

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

// Controle de abas: 'all' | 'canvases' | 'notes'
const activeTab = ref<'all' | 'canvases' | 'notes'>('all')

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

const { graphData, fetchGraph: fetchUnifiedGraph } = useGraph()

const handleSelectGraphNode = async (node: any) => {
  if (node.type === 'canvas') {
    const rawId = String(node.rawId || node.id).replace('canvas-', '')
    openCanvas(rawId)
  } else if (node.type === 'note') {
    const rawId = String(node.rawId || node.id).replace('note-', '')
    const target = notesList.value.find((n) => n.id === rawId)
    if (target) {
      openNoteEditor(target)
    } else {
      const loaded = await loadNote(rawId)
      if (loaded) openNoteEditor(loaded)
    }
  } else if (node.type === 'book') {
    const bookId = node.rawId || String(node.id).replace('book-', '')
    navigateTo(`/reader?bookId=${bookId}`)
  } else if (node.type === 'annotation') {
    if (node.bookId) {
      navigateTo(`/reader?bookId=${node.bookId}${node.cfi ? '&cfi=' + encodeURIComponent(node.cfi) : ''}`)
    }
  } else if (node.type === 'folder') {
    const folderName = node.rawId || String(node.id).replace(/^folder-/, '')
    activeFolder.value = decodeURIComponent(folderName)
    viewLayout.value = 'grid'
  } else if (node.type === 'theme') {
    viewLayout.value = 'graph'
  }
}

// Sincroniza query params da rota
const syncFromRoute = () => {
  if (route?.query?.tab) {
    const tabStr = String(route.query.tab).toLowerCase()
    if (tabStr === 'notes' || tabStr === 'note') activeTab.value = 'notes'
    else if (tabStr === 'canvases' || tabStr === 'canvas') activeTab.value = 'canvases'
    else activeTab.value = 'all'
  }
  if (route?.query?.folder !== undefined) {
    activeFolder.value = (route.query.folder as string) || null
  }
  if (route?.query?.tag !== undefined) {
    activeTag.value = (route.query.tag as string) || null
  }
  if (route?.query?.view === 'grid') {
    viewLayout.value = 'grid'
  } else if (route?.query?.view === 'split' || route?.query?.view === 'note-editor') {
    viewLayout.value = 'note-editor'
  }
}

watch(() => route.query, syncFromRoute, { deep: true })

onMounted(async () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }

  syncFromRoute()

  try {
    await Promise.all([
      fetchCanvases(),
      fetchCanvasFolders(),
      fetchNotes(),
      fetchNoteFolders(),
      fetchUnifiedGraph(),
    ])

    // Se houver id de nota na rota, abre direto no editor
    if (route.query.id && typeof route.query.id === 'string') {
      const note = await loadNote(route.query.id)
      if (note) {
        activeNote.value = note
        viewLayout.value = 'note-editor'
      }
    }
  } catch (err: any) {
    console.error('Erro ao carregar dados do Hub:', err)
  }
})

watch(viewLayout, (val) => {
  if (val === 'graph') {
    fetchUnifiedGraph()
  }
})

const setTab = (tab: 'all' | 'canvases' | 'notes') => {
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

// União de pastas de quadros e de notas
const unifiedFolders = computed(() => {
  const set = new Set<string>([...canvasFolders.value, ...noteFolders.value])
  for (const c of canvasesList.value) {
    if (c.folder) set.add(c.folder)
  }
  for (const n of notesList.value) {
    if (n.folder) set.add(n.folder)
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
  return [...cItems, ...nItems]
})

const totalCombinedCount = computed(() => {
  return canvasesList.value.length + notesList.value.length
})

// Lista unificada de todas as tags existentes em quadros e notas
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

type DisplayItem = DisplayCanvasItem | DisplayNoteItem

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

  return items.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return timeB - timeA
  })
})

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
    title: 'Nova Nota',
    content: '# Nova Anotação\n\nComece a digitar seu pensamento aqui...',
    folder,
    tags
  })

  if (created) {
    activeNote.value = { ...created, tags: Array.isArray(created.tags) ? [...created.tags] : [] }
    viewLayout.value = 'note-editor'
  }
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

const cleanMarkdownPreview = (text?: string) => {
  if (!text) return ''
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/\[\[.*?\]\]/g, '')
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
