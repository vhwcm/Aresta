<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden bg-transparent text-textPrimary">

    <!-- VISUALIZAÇÃO 1: GRAFO INTERATIVO -->
    <div v-if="!selectedNode" class="w-full h-full flex flex-col relative overflow-hidden">
      <!-- State de Carregamento -->
      <div v-if="loading && (!graphData.nodes || graphData.nodes.length === 0)" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bgApp/90">
        <div class="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
        <p class="text-[10px] font-technical text-textSecondary uppercase tracking-widest">Carregando Conexões...</p>
      </div>

      <!-- Canvas D3 no modo configurado (compacto ou tela cheia) -->
      <GraphCanvas
        :nodes="graphData.nodes || []"
        :edges="graphData.edges || []"
        :is-compact="isCompact"
        :search-query="effectiveSearchQuery"
        :show-controls="showControls"
        @select-node="handleSelectNode"
        @open-create-node="isCreateModalOpen = true"
        @open-connect-modal="isConnectModalOpen = true"
        @connect-nodes="handleConnectNodesPayload"
        @delete-edge="handleDeleteEdge"
      />
    </div>

    <!-- VISUALIZAÇÃO 2: DETALHES DO TEMA CLICADO (ABAS: NOTAS, TUDO, FLASHCARDS) -->
    <div v-else class="w-full h-full flex flex-col bg-bgPanel/95 backdrop-blur-xl z-20 relative animate-fadeIn">

      <!-- Cabeçalho com Seta de Voltar para o Grafo e Ações de Tag -->
      <div class="p-4 sm:p-5 border-b border-divider flex flex-col gap-3.5 bg-bgApp/40 shrink-0">
        <div class="flex items-center justify-between gap-3">
          <button
            @click="goBackToGraph"
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors w-fit group cursor-pointer"
            title="Voltar para o Grafo"
          >
            <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar para o Grafo</span>
          </button>

          <!-- Ações Rápidas da Tag (Editar / Excluir) -->
          <div v-if="canManageTag && !isEditingTag && !isDeletingTag" class="flex items-center gap-1.5 shrink-0">
            <button
              @click="startEditTag"
              data-testid="edit-tag-btn"
              class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary border border-divider text-xs font-interface font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Editar tag"
            >
              <Edit2Icon class="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              @click="startDeleteTag"
              data-testid="delete-tag-btn"
              class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-interface font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Excluir tag"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        <!-- MODO EDIÇÃO DA TAG -->
        <div v-if="isEditingTag" class="p-3.5 rounded-2xl bg-white/[0.03] border border-accent/40 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-technical uppercase font-bold tracking-wider text-accent">
              Editar Tag
            </span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                @click="editTagColor = color"
                class="w-4 h-4 rounded-full border transition-all cursor-pointer"
                :class="editTagColor === color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <input
              v-model="editTagName"
              ref="editTagNameInputRef"
              type="text"
              placeholder="Nome da tag..."
              maxlength="30"
              class="bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
              @keyup.enter="handleSaveEditTag"
              @keyup.esc="cancelEditTag"
            />
            <input
              v-model="editTagDescription"
              type="text"
              placeholder="Descrição (opcional)..."
              class="bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
              @keyup.enter="handleSaveEditTag"
              @keyup.esc="cancelEditTag"
            />
          </div>

          <span v-if="editTagError" class="text-[11px] text-rose-400 font-interface">
            {{ editTagError }}
          </span>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              @click="cancelEditTag"
              class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="handleSaveEditTag"
              :disabled="!editTagName.trim() || isSavingTag"
              data-testid="save-edit-tag-btn"
              class="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckIcon class="w-3.5 h-3.5" />
              <span>{{ isSavingTag ? 'Salvando...' : 'Salvar' }}</span>
            </button>
          </div>
        </div>

        <!-- MODO CONFIRMAÇÃO DE EXCLUSÃO DA TAG -->
        <div v-else-if="isDeletingTag" class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2.5 text-xs">
          <div class="flex items-center gap-2 text-rose-300 font-medium">
            <AlertTriangleIcon class="w-4 h-4 shrink-0 text-rose-400" />
            <span>Excluir tag «{{ selectedNode.name }}»?</span>
          </div>
          <p class="text-textSecondary text-[11px] leading-relaxed">
            <template v-if="displayedBooks.length > 0 || displayedNotes.length > 0">
              Esta tag está vinculada a elementos do seu acervo.
              Ela será desvinculada dos livros, notas e do grafo.
            </template>
            <template v-else>
              A tag será removida permanentemente do acervo e do grafo de conhecimento.
            </template>
          </p>
          <span v-if="deleteTagError" class="text-[11px] text-rose-400 font-interface">
            {{ deleteTagError }}
          </span>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              @click="cancelDeleteTag"
              class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="handleConfirmDeleteTag"
              :disabled="isDeletingTagLoading"
              data-testid="confirm-delete-tag-btn"
              class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>{{ isDeletingTagLoading ? 'Excluindo...' : 'Confirmar Exclusão' }}</span>
            </button>
          </div>
        </div>

        <!-- MODO VISUALIZAÇÃO PADRÃO DO CABEÇALHO -->
        <div v-else class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 rounded-full shadow-md shrink-0"
              :style="{ backgroundColor: selectedNode.color || '#E57B55' }"
            ></div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base sm:text-lg font-bold font-interface text-textPrimary leading-tight truncate max-w-[280px]">
                {{ selectedNode.name || selectedNode.title }}
              </h2>
              <p class="text-xs text-textSecondary font-technical mt-0.5">
                {{ displayedAnnotations.length }} {{ displayedAnnotations.length === 1 ? 'anotação' : 'anotações' }} •
                {{ displayedBooks.length }} {{ displayedBooks.length === 1 ? 'livro conectado' : 'livros conectados' }} •
                {{ displayedFlashcards.length }} flashcards
              </p>
            </div>
          </div>

          <p v-if="selectedNode.description" class="text-xs sm:text-sm text-textSecondary font-light leading-relaxed line-clamp-2">
            {{ selectedNode.description }}
          </p>
        </div>

        <!-- BARRAS / ABAS SUPERIORES DO TEMA -->
        <div class="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-divider/60">
          <div class="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-divider/80 rounded-2xl">
            <!-- Aba 1: Anotações (Ativa Inicialmente por Padrão) -->
            <button
              @click="activeThemeTab = 'annotations'"
              data-testid="theme-tab-annotations"
              class="px-3.5 py-1.5 rounded-xl text-xs font-interface font-medium transition-all flex items-center gap-2 cursor-pointer"
              :class="activeThemeTab === 'annotations' ? 'bg-accent text-white shadow-sm font-semibold' : 'text-textSecondary hover:text-textPrimary'"
            >
              <QuoteIcon class="w-3.5 h-3.5" />
              <span>Anotações</span>
              <span
                class="text-[10px] font-technical px-1.5 py-0.5 rounded-full"
                :class="activeThemeTab === 'annotations' ? 'bg-white/20 text-white' : 'bg-white/5 text-textSecondary'"
              >
                {{ displayedAnnotations.length }}
              </span>
            </button>

            <!-- Aba 2: Tudo (Notas, Canvas, Links, Livros, etc.) -->
            <button
              @click="activeThemeTab = 'all'"
              data-testid="theme-tab-all"
              class="px-3.5 py-1.5 rounded-xl text-xs font-interface font-medium transition-all flex items-center gap-2 cursor-pointer"
              :class="activeThemeTab === 'all' ? 'bg-accent text-white shadow-sm font-semibold' : 'text-textSecondary hover:text-textPrimary'"
            >
              <LayersIcon class="w-3.5 h-3.5" />
              <span>Tudo</span>
              <span
                class="text-[10px] font-technical px-1.5 py-0.5 rounded-full"
                :class="activeThemeTab === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-textSecondary'"
              >
                {{ totalAllItemsCount }}
              </span>
            </button>

            <!-- Aba 3: Flashcards (Somente deste tema) -->
            <button
              @click="activeThemeTab = 'flashcards'"
              data-testid="theme-tab-flashcards"
              class="px-3.5 py-1.5 rounded-xl text-xs font-interface font-medium transition-all flex items-center gap-2 cursor-pointer"
              :class="activeThemeTab === 'flashcards' ? 'bg-accent text-white shadow-sm font-semibold' : 'text-textSecondary hover:text-textPrimary'"
            >
              <BrainIcon class="w-3.5 h-3.5" />
              <span>Flashcards</span>
              <span
                class="text-[10px] font-technical px-1.5 py-0.5 rounded-full"
                :class="activeThemeTab === 'flashcards' ? 'bg-white/20 text-white' : 'bg-white/5 text-textSecondary'"
              >
                {{ displayedFlashcards.length }}
              </span>
            </button>
          </div>

          <!-- Ação rápida contextual da aba ativa -->
          <div v-if="activeThemeTab === 'all'" class="flex items-center gap-2">
            <button
              @click="handleCreateNoteInTheme"
              data-testid="create-note-in-theme-btn"
              class="px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-interface font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Criar nova nota vinculada a este tema"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>Nova Nota</span>
            </button>
          </div>
          <div v-else-if="activeThemeTab === 'flashcards' && displayedFlashcards.length > 0" class="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-divider">
            <button
              @click="flashcardViewMode = 'study'"
              class="px-2.5 py-1 rounded-lg text-[11px] font-interface transition-all cursor-pointer"
              :class="flashcardViewMode === 'study' ? 'bg-accent text-white' : 'text-textSecondary hover:text-textPrimary'"
            >
              Praticar
            </button>
            <button
              @click="flashcardViewMode = 'list'"
              class="px-2.5 py-1 rounded-lg text-[11px] font-interface transition-all cursor-pointer"
              :class="flashcardViewMode === 'list' ? 'bg-accent text-white' : 'text-textSecondary hover:text-textPrimary'"
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      <!-- CORPO PRINCIPAL COM CONTEÚDO DAS ABAS -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">

        <!-- CONTEÚDO ABA 1: ANOTAÇÕES DO LEITOR (INICIALMENTE ATIVA) -->
        <div v-if="activeThemeTab === 'annotations'" class="space-y-3">
          <div v-if="displayedAnnotations.length > 0" class="space-y-3">
            <div
              v-for="anno in displayedAnnotations"
              :key="anno.id"
              @click="handleOpenAnnotation(anno)"
              class="p-4 rounded-2xl bg-bgApp/80 border border-divider/70 hover:border-accent/40 flex flex-col gap-2.5 transition-all group cursor-pointer shadow-xs"
            >
              <!-- Cabeçalho da Anotação: Título do Livro, Capítulo e Cor -->
              <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical">
                <div class="flex items-center gap-1.5 truncate max-w-[80%]">
                  <BookOpenIcon class="w-3.5 h-3.5 text-accent shrink-0" />
                  <span class="font-semibold text-textPrimary truncate">{{ anno.bookTitle || 'Livro no acervo' }}</span>
                  <span v-if="anno.chapterTitle" class="text-textSecondary/70 truncate">• {{ anno.chapterTitle }}</span>
                </div>

                <span
                  v-if="anno.color"
                  class="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  :style="{ backgroundColor: anno.color }"
                  title="Cor do destaque"
                ></span>
              </div>

              <!-- Citação (Texto Selecionado / Marcado) -->
              <blockquote
                v-if="anno.selectedText"
                class="border-l-4 pl-3.5 py-1.5 text-xs sm:text-sm italic font-serif text-textPrimary leading-relaxed bg-white/[0.02] rounded-r-xl"
                :style="{ borderLeftColor: anno.color || '#E57B55' }"
              >
                "<span v-html="renderInlineMarkdown(anno.selectedText)"></span>"
              </blockquote>

              <!-- Nota / Reflexão Pessoal -->
              <div v-if="anno.note" class="text-xs font-interface text-textPrimary leading-relaxed">
                <span v-if="anno.selectedText" class="text-[10px] font-technical uppercase text-accent font-semibold block mb-0.5">Sua Nota:</span>
                <p v-html="renderInlineMarkdown(anno.note)"></p>
              </div>

              <!-- Rodapé da Anotação com Ação de Leitura -->
              <div class="flex items-center justify-between text-[10px] font-technical text-textSecondary pt-1 border-t border-divider/40">
                <span>{{ formatDate(anno.updatedAt) }}</span>
                <button
                  @click.stop="handleOpenAnnotation(anno)"
                  class="text-accent hover:underline inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  title="Abrir no leitor"
                >
                  <span>Ver no texto</span>
                  <ExternalLinkIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Estado Vazio: Nenhuma anotação -->
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-divider rounded-2xl text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <QuoteIcon class="w-6 h-6 text-textSecondary opacity-50" />
            </div>
            <div>
              <p class="text-sm font-semibold text-textPrimary">Nenhuma anotação neste tema</p>
              <p class="text-xs text-textSecondary mt-1 max-w-sm">
                Ainda não existem anotações ou trechos destacados nos livros vinculados a «{{ selectedNode.name }}».
              </p>
            </div>
            <button
              v-if="displayedBooks.length > 0"
              @click="handleSelectBook(displayedBooks[0])"
              class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md mt-1"
            >
              <BookOpenIcon class="w-3.5 h-3.5" />
              <span>Abrir «{{ displayedBooks[0]?.title }}»</span>
            </button>
          </div>
        </div>

        <!-- CONTEÚDO ABA 2: TUDO (LIVROS, NOTAS, QUADROS, DESENHOS, LINKS, TRECHOS) -->
        <div v-else-if="activeThemeTab === 'all'" class="space-y-4">
          <!-- Filtros de Tipo dentro da Aba Tudo -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              v-for="filter in subFilterOptions"
              :key="filter.id"
              @click="allSubFilter = filter.id as any"
              class="px-2.5 py-1 rounded-xl text-xs font-interface font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
              :class="allSubFilter === filter.id ? 'bg-white/15 text-textPrimary border border-white/20' : 'bg-white/5 text-textSecondary border border-divider hover:text-textPrimary'"
            >
              <span>{{ filter.label }}</span>
              <span class="text-[10px] font-technical opacity-70">({{ filter.count }})</span>
            </button>
          </div>

          <!-- Lista Unificada de Itens -->
          <div v-if="filteredAllItems.length > 0" class="space-y-2.5">
            <div
              v-for="item in filteredAllItems"
              :key="item.id"
              @click="handleOpenUnifiedItem(item)"
              class="flex items-center justify-between bg-bgApp/80 border border-divider/70 hover:border-accent/40 p-3.5 rounded-2xl transition-all group cursor-pointer shadow-xs"
            >
              <div class="flex items-center gap-3.5 min-w-0 flex-1">
                <!-- Ícone / Capa do Item -->
                <div class="w-11 h-14 rounded-lg bg-white/5 border border-divider shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                  <img
                    v-if="item.coverPath"
                    :src="getCoverUrl(item.coverPath, item.raw?.bookId || item.raw?.id)"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                  <BookIcon v-else-if="item.type === 'book'" class="w-5 h-5 text-blue-400" />
                  <PenToolIcon v-else-if="item.type === 'drawing'" class="w-5 h-5 text-purple-400" />
                  <FileTextIcon v-else-if="item.type === 'note'" class="w-5 h-5 text-indigo-400" />
                  <LayoutIcon v-else-if="item.type === 'canvas'" class="w-5 h-5 text-emerald-400" />
                  <GlobeIcon v-else-if="item.type === 'link'" class="w-5 h-5 text-cyan-400" />
                  <BookmarkIcon v-else class="w-5 h-5 text-amber-400" />
                </div>

                <!-- Detalhes do Item -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs sm:text-sm font-semibold text-textPrimary truncate group-hover:text-accent transition-colors">
                      {{ item.title }}
                    </h4>
                    <span
                      class="text-[9px] font-technical uppercase font-bold px-1.5 py-0.5 rounded"
                      :class="getItemTypeBadgeClass(item.type)"
                    >
                      {{ getItemTypeLabel(item.type) }}
                    </span>
                  </div>

                  <p v-if="item.subtitle" class="text-xs text-textSecondary mt-0.5 truncate">
                    {{ item.subtitle }}
                  </p>

                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span v-if="item.type === 'book' && item.raw?.status" class="text-[10px] font-technical uppercase font-bold px-2 py-0.5 rounded-md" :class="getStatusBadgeClass(item.raw.status)">
                      {{ getStatusLabel(item.raw.status) }}
                    </span>
                    <span v-if="item.folder" class="text-[10px] font-technical text-textSecondary">
                      📁 {{ item.folder }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                @click.stop="handleOpenUnifiedItem(item)"
                class="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all shrink-0 ml-2 cursor-pointer"
                :title="item.type === 'book' ? 'Ver livro' : 'Abrir recurso'"
              >
                <BookOpenIcon v-if="item.type === 'book'" class="w-4 h-4" />
                <ExternalLinkIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Estado Vazio: Nenhum item em Tudo -->
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-divider rounded-2xl text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <LayersIcon class="w-6 h-6 text-textSecondary opacity-50" />
            </div>
            <div>
              <p class="text-sm font-semibold text-textPrimary">Nenhum recurso encontrado</p>
              <p class="text-xs text-textSecondary mt-1 max-w-sm">
                Não há livros, notas, quadros ou links correspondentes ao filtro selecionado neste tema.
              </p>
            </div>
          </div>
        </div>

        <!-- CONTEÚDO ABA 3: FLASHCARDS (SOMENTE DESTE TEMA) -->
        <div v-else-if="activeThemeTab === 'flashcards'" class="space-y-4">
          <!-- Modo Estudo Interativo (Flip 3D) -->
          <div v-if="flashcardViewMode === 'study' && displayedFlashcards.length > 0" class="flex flex-col items-center gap-4 py-2">
            <!-- Barra de Progresso do Estudo -->
            <div class="flex items-center justify-between gap-3 w-full max-w-lg text-xs font-technical text-textSecondary px-1">
              <span>Card {{ currentCardIndex + 1 }} de {{ displayedFlashcards.length }}</span>
              <div class="w-28 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full bg-accent transition-all duration-300 rounded-full"
                  :style="{ width: `${((currentCardIndex + 1) / displayedFlashcards.length) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Cartão 3D Flip Interativo -->
            <div
              v-if="currentCard"
              class="card-scene w-full max-w-lg min-h-[360px] sm:min-h-[320px] h-[380px] sm:h-80 cursor-pointer select-none"
              @click="isCardFlipped = !isCardFlipped"
            >
              <div class="card-object" :class="{ 'is-flipped': isCardFlipped }">
                <!-- FRENTE (Pergunta) -->
                <div class="card-face card-front p-5 sm:p-7 flex flex-col justify-between rounded-3xl bg-bgApp border border-divider hover:border-accent/40 shadow-xl backdrop-blur-xl transition-all overflow-hidden">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-white/5 border border-divider font-technical text-[10px] text-textSecondary truncate max-w-[140px] sm:max-w-[200px]">
                      {{ currentCard.sourceTitle || currentCard.bookTitle || selectedNode.name }}
                    </span>
                    <span class="font-technical text-[10px] text-accent flex items-center gap-1 shrink-0">
                      <RotateCwIcon class="w-3 h-3" />
                      Clique para virar
                    </span>
                  </div>

                  <div class="my-auto text-center px-1 sm:px-2 py-2 flex flex-col items-center justify-center overflow-y-auto max-h-[220px] sm:max-h-[180px] custom-scrollbar">
                    <span class="font-technical text-[10px] sm:text-[11px] uppercase tracking-wider text-textSecondary mb-2 block font-medium">
                      Conceito & Revisão
                    </span>
                    <h3
                      class="font-interface text-base sm:text-xl font-semibold text-textPrimary leading-snug break-words"
                      v-html="renderInlineMarkdown(currentCard.question)"
                    ></h3>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-t border-divider/40 pt-2">
                    <span>Nível {{ currentCard.repetitionLevel || 0 }}</span>
                    <span class="text-accent">Toque para ver a resposta</span>
                  </div>
                </div>

                <!-- VERSO (Resposta) -->
                <div class="card-face card-back p-5 sm:p-7 flex flex-col justify-between rounded-3xl bg-bgApp border border-accent/40 shadow-xl backdrop-blur-xl overflow-hidden">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-technical text-[10px] text-accent uppercase tracking-wider shrink-0">
                      Resposta
                    </span>
                    <button
                      v-if="currentCard.sourceUrl"
                      @click.stop="handleOpenCardSource(currentCard)"
                      class="flex items-center gap-1 text-[10px] font-technical text-accent hover:underline cursor-pointer shrink-0"
                    >
                      <ExternalLinkIcon class="w-3 h-3" />
                      <span>Ver Fonte</span>
                    </button>
                  </div>

                  <div class="my-auto text-center px-1 sm:px-2 py-2 overflow-y-auto max-h-[220px] sm:max-h-[180px] custom-scrollbar">
                    <p
                      class="font-interface text-xs sm:text-sm md:text-base text-textPrimary leading-relaxed break-words"
                      v-html="renderInlineMarkdown(currentCard.answer)"
                    ></p>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-t border-divider/40 pt-2">
                    <span>Repetição Espaçada</span>
                    <span class="text-accent">Aresta Memory</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botões de Autoavaliação quando virado -->
            <div v-if="isCardFlipped && currentCard" class="flex flex-wrap items-center justify-center gap-2 pt-2 animate-fadeIn w-full max-w-lg">
              <button
                @click="handleRateCard('hard')"
                class="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-interface text-xs font-medium transition-all cursor-pointer flex-1"
              >
                Difícil (Repetir amanhã)
              </button>
              <button
                @click="handleRateCard('good')"
                class="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-interface text-xs font-medium transition-all cursor-pointer flex-1"
              >
                Bom (3 dias)
              </button>
              <button
                @click="handleRateCard('easy')"
                class="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-interface text-xs font-medium transition-all cursor-pointer flex-1"
              >
                Fácil (7 dias)
              </button>
            </div>

            <!-- Controles de Navegação Anterior / Próximo -->
            <div class="flex items-center justify-between w-full max-w-lg pt-1">
              <button
                @click="prevCard"
                :disabled="currentCardIndex === 0"
                class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary disabled:opacity-30 cursor-pointer"
              >
                Anterior
              </button>
              <span class="text-[11px] font-technical text-textSecondary">
                {{ displayedFlashcards.length - (currentCardIndex + 1) }} restantes
              </span>
              <button
                @click="nextCard"
                :disabled="currentCardIndex >= displayedFlashcards.length - 1"
                class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary disabled:opacity-30 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>

          <!-- Modo Lista de Todos os Cards do Tema -->
          <div v-else-if="flashcardViewMode === 'list' && displayedFlashcards.length > 0" class="space-y-2.5">
            <div
              v-for="card in displayedFlashcards"
              :key="card.id"
              class="p-4 rounded-2xl bg-bgApp/80 border border-divider/70 flex flex-col gap-2 hover:border-accent/40 transition-all shadow-xs"
            >
              <div class="flex items-center justify-between text-xs text-textSecondary">
                <span class="font-technical text-[10px] text-accent uppercase">Nível {{ card.repetitionLevel || 0 }}</span>
                <span v-if="card.nextReviewAt" class="font-technical text-[10px]">
                  Próxima revisão: {{ formatDate(card.nextReviewAt) }}
                </span>
              </div>
              <h5 class="text-xs sm:text-sm font-semibold text-textPrimary">
                {{ card.question }}
              </h5>
              <p class="text-xs text-textSecondary leading-relaxed line-clamp-2">
                {{ card.answer }}
              </p>
              <div v-if="card.sourceTitle" class="flex items-center justify-between text-[10px] font-technical text-textSecondary pt-1 border-t border-divider/50">
                <span>Fonte: {{ card.sourceTitle }}</span>
                <button
                  v-if="card.sourceUrl"
                  @click="handleOpenCardSource(card)"
                  class="text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLinkIcon class="w-3 h-3" />
                  <span>Ver Origem</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Estado Vazio: Nenhum flashcard neste tema -->
          <div v-else class="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-divider rounded-2xl text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <BrainIcon class="w-6 h-6 text-textSecondary opacity-50" />
            </div>
            <div>
              <p class="text-sm font-semibold text-textPrimary">Nenhum flashcard neste tema</p>
              <p class="text-xs text-textSecondary mt-1 max-w-sm">
                Não existem flashcards gerados a partir de notas ou livros vinculados a «{{ selectedNode.name }}».
              </p>
            </div>
            <NuxtLink
              to="/revisao"
              class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md mt-1"
            >
              <span>Ir para a Central de Revisão</span>
              <ExternalLinkIcon class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Rodapé com Ação de Voltar -->
      <div class="p-4 border-t border-divider bg-bgApp/60 shrink-0">
        <button
          @click="goBackToGraph"
          class="w-full bg-white/5 border border-divider text-textPrimary hover:bg-white/10 font-semibold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Voltar para o Grafo</span>
        </button>
      </div>
    </div>

    <!-- Gaveta Lateral de Anotações do Livro com Opção de Leitura -->
    <BookAnnotationsDrawer
      :is-open="isBookDrawerOpen"
      :book="selectedBookNode"
      @close="isBookDrawerOpen = false; selectedBookNode = null"
    />

    <!-- Gaveta Lateral de Detalhes e Edição da Nota -->
    <NoteDetailDrawer
      :is-open="isNoteDrawerOpen"
      :node="selectedNoteNode"
      @close="isNoteDrawerOpen = false; selectedNoteNode = null"
      @deleted="handleNoteDeleted"
      @saved="handleNoteSaved"
    />

    <!-- Modais para Criação e Conexão de Nós -->
    <CreateNodeModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateNode"
    />

    <ConnectNodesModal
      :is-open="isConnectModalOpen"
      :nodes="graphData.nodes || []"
      @close="isConnectModalOpen = false"
      @connect="handleConnectNodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  BookIcon,
  BookOpenIcon,
  Globe as GlobeIcon,
  Edit2Icon,
  Trash2Icon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  Brain as BrainIcon,
  Plus as PlusIcon,
  ExternalLink as ExternalLinkIcon,
  RotateCw as RotateCwIcon,
  Sparkles as SparklesIcon,
  Layout as LayoutIcon,
  PenTool as PenToolIcon,
  Bookmark as BookmarkIcon,
  Quote as QuoteIcon
} from 'lucide-vue-next'
import type { GraphNode, UserBookItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { useUserBooks } from '~/composables/useUserBooks'
import { useFlashcards } from '~/composables/useFlashcards'
import { getCoverUrl } from '~/utils/cover'
import { openExternalUrl } from '~/utils/urlOpener'
import { resolveNoteTitle } from '~/utils/noteTitle'

import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { linkRepo } from '~/adapters/database/repositories/LinkRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'
import type {
  LocalNote,
  LocalDrawingNote,
  LocalCanvasItem,
  LocalLinkItem,
  LocalAnnotation,
  LocalFlashcard
} from '~/adapters/database/types'

import GraphCanvas from '~/components/GraphCanvas.vue'
import BookAnnotationsDrawer from '~/components/graph/BookAnnotationsDrawer.vue'
import NoteDetailDrawer from '~/components/graph/NoteDetailDrawer.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'

const props = withDefaults(defineProps<{
  isCompact?: boolean
  searchQuery?: string
  showControls?: boolean
}>(), {
  isCompact: true,
  searchQuery: '',
  showControls: false,
})

const emit = defineEmits<{
  (e: 'selectNode', node: GraphNode): void
}>()

const presetColors = ['#E57B55', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']

const { activeTag, graphSearchQuery } = useWorkspaceSidebar()
const effectiveSearchQuery = computed(() => {
  return props.searchQuery || activeTag.value || graphSearchQuery.value || ''
})

const { graphData, loading, fetchGraph, createNode, updateNode, deleteNode, createConnection, linkBookToNode, unlinkEdge } = useGraph()
const { userBooks, fetchUserBooks } = useUserBooks()
const { reviewFlashcard } = useFlashcards()

// Abas de visualização do Tema
const activeThemeTab = ref<'annotations' | 'all' | 'flashcards'>('annotations')
const allSubFilter = ref<'all' | 'books' | 'notes' | 'canvases' | 'drawings' | 'links' | 'annotations'>('all')

// Coleções de dados locais para o tema
const allNotes = ref<LocalNote[]>([])
const allDrawings = ref<LocalDrawingNote[]>([])
const allCanvases = ref<LocalCanvasItem[]>([])
const allLinks = ref<LocalLinkItem[]>([])
const allAnnotations = ref<LocalAnnotation[]>([])
const allFlashcards = ref<LocalFlashcard[]>([])

// Flashcard Study Mode
const flashcardViewMode = ref<'study' | 'list'>('study')
const currentCardIndex = ref(0)
const isCardFlipped = ref(false)

const handleDeleteEdge = async (edge: any) => {
  try {
    await unlinkEdge(edge)
  } catch (err) {
    console.warn('[AppKnowledgeGraph] Falha ao desvincular aresta:', err)
  }
}

const selectedNode = ref<GraphNode | null>(null)
const selectedBookNode = ref<GraphNode | null>(null)
const selectedNoteNode = ref<GraphNode | null>(null)
const isBookDrawerOpen = ref(false)
const isNoteDrawerOpen = ref(false)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const canManageTag = computed(() => {
  if (!selectedNode.value) return false
  if (selectedNode.value.isRoot || selectedNode.value.id === -999) return false
  const isBook = selectedNode.value.type === 'book' || String(selectedNode.value.id).startsWith('book-')
  return !isBook
})

const isEditingTag = ref(false)
const editTagName = ref('')
const editTagColor = ref('#E57B55')
const editTagDescription = ref('')
const isSavingTag = ref(false)
const editTagError = ref<string | null>(null)
const editTagNameInputRef = ref<HTMLInputElement | null>(null)

const isDeletingTag = ref(false)
const isDeletingTagLoading = ref(false)
const deleteTagError = ref<string | null>(null)

const startEditTag = () => {
  if (!selectedNode.value) return
  isDeletingTag.value = false
  isEditingTag.value = true
  editTagName.value = selectedNode.value.name || ''
  editTagColor.value = selectedNode.value.color || '#E57B55'
  editTagDescription.value = selectedNode.value.description || ''
  editTagError.value = null
  nextTick(() => {
    editTagNameInputRef.value?.focus()
  })
}

const cancelEditTag = () => {
  isEditingTag.value = false
  editTagName.value = ''
  editTagDescription.value = ''
  editTagError.value = null
}

const handleSaveEditTag = async () => {
  if (!selectedNode.value) return
  const name = editTagName.value.trim()
  if (!name) {
    editTagError.value = 'O nome da tag não pode ser vazio'
    return
  }
  if (name.length > 30) {
    editTagError.value = 'O nome da tag deve ter no máximo 30 caracteres'
    return
  }
  isSavingTag.value = true
  editTagError.value = null
  try {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
    const targetId = !isNaN(rawId) ? rawId : selectedNode.value.id
    await updateNode(targetId, name, editTagColor.value, editTagDescription.value)
    selectedNode.value = {
      ...selectedNode.value,
      name,
      color: editTagColor.value,
      description: editTagDescription.value,
    }
    isEditingTag.value = false
  } catch (err: any) {
    console.error('Erro ao atualizar tag:', err)
    editTagError.value = err?.data?.error || err?.message || 'Falha ao atualizar tag'
  } finally {
    isSavingTag.value = false
  }
}

const startDeleteTag = () => {
  isEditingTag.value = false
  isDeletingTag.value = true
  deleteTagError.value = null
}

const cancelDeleteTag = () => {
  isDeletingTag.value = false
  deleteTagError.value = null
}

const handleConfirmDeleteTag = async () => {
  if (!selectedNode.value) return
  isDeletingTagLoading.value = true
  deleteTagError.value = null
  try {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
    const targetId = !isNaN(rawId) ? rawId : selectedNode.value.id
    await deleteNode(targetId)
    if (activeTag && activeTag.value && activeTag.value.toLowerCase() === (selectedNode.value.name || '').toLowerCase()) {
      activeTag.value = null
    }
    isDeletingTag.value = false
    selectedNode.value = null
  } catch (err: any) {
    console.error('Erro ao excluir tag:', err)
    deleteTagError.value = err?.data?.error || err?.message || 'Falha ao excluir tag'
  } finally {
    isDeletingTagLoading.value = false
  }
}

const handleSelectNode = (node: GraphNode) => {
  emit('selectNode', node)

  // 1. Livros: único que abre a gaveta de anotações antes
  const isBook = node.type === 'book' || String(node.id).startsWith('book-')
  if (isBook) {
    selectedBookNode.value = node
    isBookDrawerOpen.value = true
    return
  }

  // 2. Anotação dentro de livro: abre a gaveta de anotações daquele livro
  if (node.type === 'annotation') {
    const bookId = Number((node as any).bookId)
    if (bookId) {
      selectedBookNode.value = {
        id: `book-${bookId}`,
        rawId: bookId,
        type: 'book',
        name: (node as any).bookTitle || 'Livro',
        fullTitle: (node as any).bookTitle || 'Livro',
        coverPath: (node as any).bookCover || null,
      }
      isBookDrawerOpen.value = true
      return
    }
  }

  // 3. Notas de desenho: abrem direto na página de desenho
  const isDrawing = Boolean(node.isDrawing || (node as any).is_drawing || String(node.id).includes('drawing'))
  if (isDrawing) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    navigateTo(`/canvas/drawing/${rawId}`)
    return
  }

  // 4. Quadros: abrem direto no canvas
  if (node.type === 'canvas' || String(node.id).startsWith('canvas-')) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^canvas-/, '')
    navigateTo(`/canvas/${rawId}`)
    return
  }

  // 5. Notas: abrem direto no editor de notas
  const isNote = node.type === 'note' || String(node.id).startsWith('note-')
  if (isNote) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    navigateTo(`/canvas?id=${encodeURIComponent(rawId)}&view=note-editor`)
    return
  }

  if (node.type === 'folder') {
    const folderName = node.rawId || node.name
    navigateTo(`/canvas?folder=${encodeURIComponent(String(folderName))}`)
    return
  }

  // 6. Links: abrem diretamente no navegador padrão
  if (node.type === 'link' || (node as any).isLink || String(node.id).startsWith('link-')) {
    const url = (node as any).url
    if (url) {
      openExternalUrl(url)
      return
    }
  }

  selectedNode.value = node
  activeThemeTab.value = 'annotations'
  currentCardIndex.value = 0
  isCardFlipped.value = false
  loadThemeData()
}

const handleSelectBook = (book: any) => {
  selectedBookNode.value = {
    id: `book-${book.bookId || book.id}`,
    rawId: book.bookId || book.id,
    type: 'book',
    name: book.title,
    fullTitle: book.title,
    author: book.author,
    summary: book.summary,
    coverPath: book.coverPath,
    filePath: book.filePath,
  }
  isBookDrawerOpen.value = true
}

const goBackToGraph = () => {
  isEditingTag.value = false
  isDeletingTag.value = false
  editTagError.value = null
  deleteTagError.value = null
  selectedNode.value = null
  activeThemeTab.value = 'annotations'
  currentCardIndex.value = 0
  isCardFlipped.value = false
}

const handleNoteDeleted = () => {
  selectedNoteNode.value = null
  fetchGraph()
  loadThemeData()
}

const handleNoteSaved = () => {
  fetchGraph()
  loadThemeData()
}

const loadThemeData = async () => {
  try {
    const [notes, drawings, canvases, links, annotations, flashcards] = await Promise.all([
      noteRepo.getAll().catch(() => []),
      drawingNoteRepo.getAll().catch(() => []),
      canvasRepo.getAll().catch(() => []),
      linkRepo.getAll().catch(() => []),
      annotationRepo.getAll().catch(() => []),
      flashcardRepo.getAll().catch(() => []),
    ])
    allNotes.value = notes
    allDrawings.value = drawings
    allCanvases.value = canvases
    allLinks.value = links
    allAnnotations.value = annotations
    allFlashcards.value = flashcards
  } catch (err) {
    console.warn('[AppKnowledgeGraph] Erro ao carregar dados locais:', err)
  }
}

const connectedNodeIds = computed(() => {
  const ids = new Set<string>()
  if (!selectedNode.value) return ids
  const themeNodeId = String(selectedNode.value.id)
  for (const edge of graphData.value.edges || []) {
    const s = String(typeof edge.source === 'object' ? (edge.source as any).id : edge.source)
    const t = String(typeof edge.target === 'object' ? (edge.target as any).id : edge.target)
    if (s === themeNodeId) ids.add(t)
    else if (t === themeNodeId) ids.add(s)
  }
  return ids
})

const displayedBooks = computed<UserBookItem[]>(() => {
  if (!selectedNode.value) return []
  // Se for o Nó Central (Meu Conhecimento)
  if (selectedNode.value.isRoot || selectedNode.value.id === -999) {
    return userBooks.value
  }
  // Se porventura um nó de livro for selecionado como nó ativo
  if (selectedNode.value.type === 'book' || String(selectedNode.value.id).startsWith('book-')) {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace('book-', ''))
    const found = userBooks.value.filter((ub) => ub.bookId === rawId)
    if (found.length > 0) return found
    return [{
      userBookId: rawId,
      bookId: rawId,
      title: selectedNode.value.name || selectedNode.value.title || '',
      author: selectedNode.value.author,
      summary: selectedNode.value.summary,
      coverPath: selectedNode.value.coverPath,
      status: 'LENDO',
      currentPage: 1,
    }]
  }
  // Caso contrário, livros vinculados a este tema específico
  const themeRawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  const themeNodeId = String(selectedNode.value.id)

  // 1. Livros vinculados nos metadados de userBooks (por id do tema ou nome da tag)
  const matchedBooks: UserBookItem[] = userBooks.value.filter((b) => {
    return (b.themes || []).some((t: any) => {
      const tNumId = Number(typeof t === 'object' ? (t.rawId ?? t.id) : t)
      if (themeRawId && !isNaN(tNumId) && tNumId === themeRawId) return true
      const tName = (typeof t === 'object' ? t.name : String(t) || '').trim().toLowerCase()
      if (themeName && tName && tName === themeName) return true
      return false
    })
  })

  // 2. Livros conectados via arestas do grafo
  const connectedBookIds = new Set<number>()
  for (const edge of graphData.value.edges || []) {
    const s = String(typeof edge.source === 'object' ? (edge.source as any).id : edge.source)
    const t = String(typeof edge.target === 'object' ? (edge.target as any).id : edge.target)
    if (s === themeNodeId && t.startsWith('book-')) {
      const bId = Number(t.replace('book-', ''))
      if (!isNaN(bId)) connectedBookIds.add(bId)
    } else if (t === themeNodeId && s.startsWith('book-')) {
      const bId = Number(s.replace('book-', ''))
      if (!isNaN(bId)) connectedBookIds.add(bId)
    }
  }

  for (const bId of connectedBookIds) {
    if (!matchedBooks.some((b) => b.bookId === bId || (b as any).id === bId)) {
      const found = userBooks.value.find((b) => b.bookId === bId || (b as any).id === bId)
      if (found) {
        matchedBooks.push(found)
      } else {
        const bookNode = (graphData.value.nodes || []).find((n) => n.id === `book-${bId}` || n.rawId === bId)
        if (bookNode) {
          matchedBooks.push({
            userBookId: bId,
            bookId: bId,
            title: bookNode.name || bookNode.title || 'Livro',
            author: bookNode.author,
            summary: bookNode.summary,
            coverPath: bookNode.coverPath,
            status: 'LENDO',
            currentPage: 1,
          })
        }
      }
    }
  }

  if (matchedBooks.length > 0) return matchedBooks

  // 3. Fallback para nós que já possuam books no payload
  return ((selectedNode.value as any).books || []) as any
})

const getCleanSnippet = (content?: string | null): string => {
  if (!content) return ''
  return content
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`~_\[\]()]/g, '')
    .trim()
    .slice(0, 120)
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

const renderInlineMarkdown = (text?: string | null): string => {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[0.9em]">$1</code>')
}

const displayedNotes = computed(() => {
  if (!selectedNode.value) return []
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()

  const result: any[] = []

  // Notas Markdown / Texto
  for (const n of allNotes.value) {
    const hasTag = (n.tags || []).some((t: string) => t.trim().toLowerCase() === themeName)
    const isConnected = connectedNodeIds.value.has(`note-${n.id}`) || connectedNodeIds.value.has(String(n.id))
    const titleMatch = (n.title || '').toLowerCase().includes(`#${themeName}`)
    if (hasTag || isConnected || titleMatch) {
      result.push({
        id: String(n.id),
        rawId: n.id,
        type: 'note',
        isDrawing: false,
        title: resolveNoteTitle(n.title, n.content),
        snippet: getCleanSnippet(n.content),
        folder: n.folder || null,
        tags: n.tags || [],
        updatedAt: n.updated_at || n.created_at,
      })
    }
  }

  // Notas de Desenho
  for (const d of allDrawings.value) {
    const hasTag = (d.tags || []).some((t: string) => t.trim().toLowerCase() === themeName)
    const isConnected = connectedNodeIds.value.has(`note-${d.id}`) || connectedNodeIds.value.has(String(d.id))
    if (hasTag || isConnected) {
      result.push({
        id: String(d.id),
        rawId: d.id,
        type: 'drawing',
        isDrawing: true,
        title: d.title || 'Desenho',
        snippet: 'Anotação visual / desenho no canvas',
        folder: d.folder || null,
        tags: d.tags || [],
        updatedAt: d.updated_at || d.created_at,
      })
    }
  }

  return result
})

const displayedCanvases = computed(() => {
  if (!selectedNode.value) return []
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  return allCanvases.value.filter((c: any) => {
    const hasTag = (c.tags || []).some((t: string) => t.trim().toLowerCase() === themeName)
    const isConnected = connectedNodeIds.value.has(`canvas-${c.id}`) || connectedNodeIds.value.has(String(c.id))
    return hasTag || isConnected
  }).map((c: any) => ({
    id: String(c.id),
    rawId: c.id,
    type: 'canvas',
    title: c.name || 'Quadro sem título',
    description: c.description || (c.nodeCount ? `${c.nodeCount} elementos no quadro` : 'Quadro infinito'),
    tags: c.tags || [],
    updatedAt: c.updated_at,
  }))
})

const displayedLinks = computed(() => {
  if (!selectedNode.value) return []
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  return allLinks.value.filter((l: any) => {
    const hasTag = (l.tags || []).some((t: string) => t.trim().toLowerCase() === themeName)
    const isConnected = connectedNodeIds.value.has(`link-${l.id}`) || connectedNodeIds.value.has(String(l.id))
    return hasTag || isConnected
  }).map((l: any) => ({
    id: String(l.id),
    rawId: l.id,
    type: 'link',
    title: l.title || l.domain || l.url,
    url: l.url,
    domain: l.domain,
    tags: l.tags || [],
    updatedAt: l.updated_at || l.created_at,
  }))
})

const displayedAnnotations = computed(() => {
  if (!selectedNode.value) return []
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  const themeRawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
  const bookIds = new Set(displayedBooks.value.map((b) => b.bookId))

  return allAnnotations.value.filter((a: any) => {
    const hasTheme = (a.themes || []).some((t: any) => {
      const tName = (typeof t === 'object' ? t.name : String(t) || '').trim().toLowerCase()
      const tId = Number(typeof t === 'object' ? (t.rawId ?? t.id) : t)
      return (themeName && tName === themeName) || (!isNaN(tId) && tId === themeRawId)
    })
    const isConnected = connectedNodeIds.value.has(`annotation-${a.id}`) || connectedNodeIds.value.has(String(a.id))
    const isFromThemeBook = a.bookId && bookIds.has(a.bookId)
    return hasTheme || isConnected || isFromThemeBook
  }).map((a: any) => ({
    id: String(a.id),
    rawId: a.id,
    type: 'annotation',
    title: a.selectedText ? `«${a.selectedText.slice(0, 80)}...»` : (a.note || 'Destaque no leitor'),
    subtitle: a.note || a.chapterTitle || a.bookTitle,
    selectedText: a.selectedText,
    note: a.note,
    bookId: a.bookId,
    bookTitle: a.bookTitle,
    chapterTitle: a.chapterTitle,
    cfi: a.cfi,
    color: a.color || '#F59E0B',
    updatedAt: a.updated_at || a.createdAt,
  }))
})

const displayedFlashcards = computed(() => {
  if (!selectedNode.value) return []
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  const noteIds = new Set(displayedNotes.value.map((n) => String(n.rawId || n.id)))
  const bookIds = new Set(displayedBooks.value.map((b) => Number(b.bookId || (b as any).id)))
  const annIds = new Set(displayedAnnotations.value.map((a) => Number(a.rawId || a.id)))

  return allFlashcards.value.filter((card: any) => {
    // 1. Vinculado a uma nota deste tema
    if (card.noteId && noteIds.has(String(card.noteId))) return true
    if (card.sourceUrl && [...noteIds].some((nId) => card.sourceUrl.includes(nId))) return true

    // 2. Vinculado a um livro deste tema
    if (card.bookId && bookIds.has(Number(card.bookId))) return true

    // 3. Vinculado a uma anotação deste tema
    if (card.annotationId && annIds.has(Number(card.annotationId))) return true

    // 4. Correspondência por título da fonte ou do livro
    const sTitle = (card.sourceTitle || '').toLowerCase()
    const bTitle = (card.bookTitle || '').toLowerCase()
    if (sTitle.includes(themeName) || bTitle.includes(themeName)) return true

    // 5. Menção direta ao tema na pergunta, resposta ou nota
    const q = (card.question || '').toLowerCase()
    const a = (card.answer || '').toLowerCase()
    const n = (card.note || '').toLowerCase()
    if (q.includes(themeName) || a.includes(themeName) || n.includes(themeName)) return true

    return false
  })
})

const currentCard = computed(() => {
  if (displayedFlashcards.value.length === 0) return null
  return displayedFlashcards.value[currentCardIndex.value] || null
})

const displayedAllItems = computed(() => {
  const items: any[] = []

  // Livros
  for (const book of displayedBooks.value) {
    items.push({
      id: `book-${book.bookId || (book as any).id}`,
      rawId: book.bookId || (book as any).id,
      type: 'book',
      title: book.title,
      subtitle: book.author || 'Livro no acervo',
      coverPath: book.coverPath,
      raw: book,
    })
  }

  // Notas
  for (const note of displayedNotes.value) {
    items.push({
      id: `note-${note.id}`,
      rawId: note.id,
      type: note.type,
      title: note.title,
      subtitle: note.snippet,
      folder: note.folder,
      raw: note,
    })
  }

  // Quadros (Canvases)
  for (const canvas of displayedCanvases.value) {
    items.push({
      id: `canvas-${canvas.id}`,
      rawId: canvas.id,
      type: 'canvas',
      title: canvas.title,
      subtitle: canvas.description,
      raw: canvas,
    })
  }

  // Links
  for (const link of displayedLinks.value) {
    items.push({
      id: `link-${link.id}`,
      rawId: link.id,
      type: 'link',
      title: link.title,
      subtitle: link.url,
      domain: link.domain,
      raw: link,
    })
  }

  // Anotações
  for (const anno of displayedAnnotations.value) {
    items.push({
      id: `anno-${anno.id}`,
      rawId: anno.id,
      type: 'annotation',
      title: anno.title,
      subtitle: anno.subtitle,
      raw: anno,
    })
  }

  return items
})

const subFilterOptions = computed(() => [
  { id: 'all', label: 'Todos', count: displayedAllItems.value.length },
  { id: 'books', label: 'Livros', count: displayedBooks.value.length },
  { id: 'notes', label: 'Notas', count: displayedNotes.value.filter((n) => !n.isDrawing).length },
  { id: 'drawings', label: 'Desenhos', count: displayedNotes.value.filter((n) => n.isDrawing).length },
  { id: 'canvases', label: 'Quadros', count: displayedCanvases.value.length },
  { id: 'links', label: 'Links', count: displayedLinks.value.length },
  { id: 'annotations', label: 'Trechos', count: displayedAnnotations.value.length },
])

const filteredAllItems = computed(() => {
  if (allSubFilter.value === 'all') return displayedAllItems.value
  if (allSubFilter.value === 'books') return displayedAllItems.value.filter((i) => i.type === 'book')
  if (allSubFilter.value === 'notes') return displayedAllItems.value.filter((i) => i.type === 'note')
  if (allSubFilter.value === 'drawings') return displayedAllItems.value.filter((i) => i.type === 'drawing')
  if (allSubFilter.value === 'canvases') return displayedAllItems.value.filter((i) => i.type === 'canvas')
  if (allSubFilter.value === 'links') return displayedAllItems.value.filter((i) => i.type === 'link')
  if (allSubFilter.value === 'annotations') return displayedAllItems.value.filter((i) => i.type === 'annotation')
  return displayedAllItems.value
})

const totalAllItemsCount = computed(() => displayedAllItems.value.length)

const handleCreateNoteInTheme = async () => {
  if (!selectedNode.value) return
  const themeName = selectedNode.value.name || selectedNode.value.title || 'Tema'
  const newNoteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()
  await noteRepo.save({
    id: newNoteId,
    title: `Nota sobre ${themeName}`,
    content: `# Nota sobre ${themeName}\n\n`,
    folder: null,
    tags: [themeName],
    created_at: now,
    updated_at: now,
  })
  await loadThemeData()
  navigateTo(`/canvas?id=${encodeURIComponent(newNoteId)}&view=note-editor`)
}

const handleOpenNote = (note: any) => {
  if (note.isDrawing) {
    navigateTo(`/canvas/drawing/${encodeURIComponent(String(note.rawId || note.id))}`)
  } else {
    navigateTo(`/canvas?id=${encodeURIComponent(String(note.rawId || note.id))}&view=note-editor`)
  }
}

const handleOpenAnnotation = (anno: any) => {
  if (anno?.cfi && anno?.bookId && !String(anno.cfi).startsWith('note:')) {
    navigateTo(`/reader?bookId=${anno.bookId}&cfi=${encodeURIComponent(anno.cfi)}`)
  } else if (anno?.bookId) {
    handleSelectBook({ bookId: anno.bookId, id: anno.bookId, title: anno.bookTitle })
  } else if (anno?.cfi && String(anno.cfi).startsWith('note:')) {
    const noteId = String(anno.cfi).replace(/^note:/, '')
    navigateTo(`/canvas?id=${encodeURIComponent(noteId)}&view=note-editor`)
  }
}

const handleOpenUnifiedItem = (item: any) => {
  if (item.type === 'book') {
    handleSelectBook(item.raw)
  } else if (item.type === 'note') {
    handleOpenNote(item.raw)
  } else if (item.type === 'drawing') {
    navigateTo(`/canvas/drawing/${encodeURIComponent(String(item.raw.id))}`)
  } else if (item.type === 'canvas') {
    navigateTo(`/canvas/${encodeURIComponent(String(item.raw.id))}`)
  } else if (item.type === 'link') {
    if (item.raw?.url) openExternalUrl(item.raw.url)
  } else if (item.type === 'annotation') {
    handleOpenAnnotation(item.raw)
  }
}

const handleOpenCardSource = (card: any) => {
  if (card.sourceUrl) {
    navigateTo(card.sourceUrl)
  } else if (card.noteId) {
    navigateTo(`/canvas?id=${encodeURIComponent(card.noteId)}&view=note-editor`)
  } else if (card.bookId) {
    navigateTo(`/reader?bookId=${card.bookId}`)
  }
}

const handleRateCard = async (rating: 'hard' | 'good' | 'easy') => {
  if (!currentCard.value) return
  try {
    await reviewFlashcard(currentCard.value.id, rating)
  } catch (e) {
    console.warn('[AppKnowledgeGraph] Erro ao avaliar flashcard:', e)
  }
  isCardFlipped.value = false
  if (currentCardIndex.value < displayedFlashcards.value.length - 1) {
    currentCardIndex.value++
  } else {
    // Fim da pilha: reinicia ou permanece no fim
    currentCardIndex.value = 0
  }
}

const nextCard = () => {
  if (currentCardIndex.value < displayedFlashcards.value.length - 1) {
    currentCardIndex.value++
    isCardFlipped.value = false
  }
}

const prevCard = () => {
  if (currentCardIndex.value > 0) {
    currentCardIndex.value--
    isCardFlipped.value = false
  }
}

const getItemTypeLabel = (type: string) => {
  switch (type) {
    case 'book': return 'Livro'
    case 'note': return 'Nota'
    case 'drawing': return 'Desenho'
    case 'canvas': return 'Quadro'
    case 'link': return 'Link'
    case 'annotation': return 'Trecho'
    default: return type
  }
}

const getItemTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'book': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'note': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    case 'drawing': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    case 'canvas': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'link': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    case 'annotation': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    default: return 'bg-white/5 text-textSecondary border border-divider'
  }
}

const handleCreateNode = async (payload: { name: string, color: string, description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
  isCreateModalOpen.value = false
}

const handleConnectNodes = async (payload: { sourceId: number, targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
  isConnectModalOpen.value = false
}

const handleConnectNodesPayload = async (payload: any) => {
  try {
    const sourceId = payload.sourceId ?? payload.sourceRawId
    const targetId = payload.targetId ?? payload.targetRawId
    if (sourceId !== undefined && targetId !== undefined) {
      await createConnection(sourceId, targetId)
    }
  } catch (err) {
    console.warn('[AppKnowledgeGraph] Falha ao persistir conexão:', err)
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'LENDO': return 'Lendo'
    case 'LIDO': return 'Lido'
    case 'QUERO_LER': return 'Quero Ler'
    case 'ABANDONADO': return 'Abandonado'
    default: return status
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'LENDO': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    case 'LIDO': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    case 'QUERO_LER': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
    default: return 'bg-white/10 text-textSecondary'
  }
}

const handleRemoteSync = () => {
  fetchGraph()
  fetchUserBooks()
  loadThemeData()
}

onMounted(() => {
  fetchGraph()
  fetchUserBooks()
  loadThemeData()
  if (typeof window !== 'undefined') {
    window.addEventListener('aresta:data-synced', handleRemoteSync)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('aresta:data-synced', handleRemoteSync)
  }
})
</script>

<style scoped>
.card-scene {
  perspective: 1000px;
}
.card-object {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}
.card-object.is-flipped {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
.card-back {
  transform: rotateY(180deg);
}
</style>
