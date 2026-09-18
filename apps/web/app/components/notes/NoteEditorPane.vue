<template>
  <main class="flex-1 flex flex-col bg-bgApp overflow-hidden">
    <!-- Corpo do Editor -->
    <div
      class="flex-1 p-2 sm:p-4 md:p-6 overflow-hidden bg-bgDarker flex flex-col relative"
      data-testid="editor-wrapper"
      @mouseup="handleTextSelection"
      @keyup="handleTextSelection"
    >
      <!-- Feedback Toast -->
      <Transition name="fade">
        <div
          v-if="toastMessage"
          class="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in max-w-[calc(100vw-2rem)]"
        >
          <CheckCircle2Icon class="w-4 h-4 text-emerald-400 shrink-0" />
          <span class="truncate">{{ toastMessage }}</span>
        </div>
      </Transition>

      <!-- Cartão Principal do Documento -->
      <div class="flex-1 bg-bgPanel rounded-2xl border border-divider shadow-sm overflow-hidden flex flex-col relative">
        <!-- BARRA ÚNICA NO TOPO DA ANOTAÇÃO (Responsiva no mobile) -->
        <div class="w-full bg-bgSurface border-b border-divider px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap shrink-0 backdrop-blur-sm touch-pan-x z-20">
          <!-- Grupo da Esquerda: Formatação, Pasta, Tags e Vínculos -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <!-- Formatação de Texto -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Seletor de Títulos / Cabeçalhos -->
              <select
                v-model="selectedHeading"
                class="bg-bgElevated border border-divider/80 rounded-lg px-2 py-1 text-xs text-textPrimary focus:outline-none focus:border-accent cursor-pointer h-8 min-h-[32px] shrink-0 font-medium"
                title="Estilo de texto ou cabeçalho"
                @change="applyHeading"
                data-testid="select-heading"
              >
                <option value="p">Normal (p)</option>
                <option value="h1">Título 1 (H1)</option>
                <option value="h2">Título 2 (H2)</option>
                <option value="h3">Título 3 (H3)</option>
              </select>

              <!-- Botão Negrito -->
              <button
                type="button"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 border border-divider/80 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                title="Negrito (Ctrl+B)"
                @click="applyBold"
                data-testid="btn-format-bold"
              >
                B
              </button>

              <!-- Botão Itálico -->
              <button
                type="button"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 border border-divider/80 italic text-xs shrink-0 cursor-pointer transition-colors"
                title="Itálico (Ctrl+I)"
                @click="applyItalic"
                data-testid="btn-format-italic"
              >
                I
              </button>
            </div>

            <!-- Separador Vertical -->
            <div class="h-4 w-px bg-divider/80 mx-0.5 shrink-0"></div>

            <!-- Seletor de Pasta da Nota -->
            <div class="flex items-center gap-1 shrink-0">
              <FolderIcon class="w-3.5 h-3.5 text-accent shrink-0 hidden sm:inline" />
              <select
                v-model="localNote.folder"
                class="bg-bgElevated border border-divider/80 rounded-lg px-2 py-1 text-xs text-textPrimary focus:outline-none focus:border-accent cursor-pointer h-8 min-h-[32px] max-w-[120px] sm:max-w-[160px] truncate"
                title="Pasta da nota"
                @change="onInput"
                data-testid="select-folder"
              >
                <option :value="null">Sem pasta</option>
                <option v-for="f in folders" :key="f" :value="f">📁 {{ f }}</option>
              </select>
            </div>

            <!-- Separador Vertical -->
            <div class="h-4 w-px bg-divider/80 mx-0.5 shrink-0"></div>

            <!-- Botão e Popover de Tags -->
            <div class="relative inline-block shrink-0">
              <button
                type="button"
                class="px-2.5 h-8 rounded-lg bg-bgElevated hover:bg-bgSurface text-xs text-textSecondary hover:text-textPrimary border border-divider/80 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                :class="{ 'border-accent/60 text-accent font-semibold': isTagsPopoverOpen || (localNote.tags && localNote.tags.length > 0) }"
                title="Gerenciar tags da nota"
                @click="isTagsPopoverOpen = !isTagsPopoverOpen"
                data-testid="btn-toggle-tags"
              >
                <TagIcon class="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Tags</span>
                <span
                  v-if="localNote.tags && localNote.tags.length > 0"
                  class="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent text-[10px] font-bold"
                >
                  {{ localNote.tags.length }}
                </span>
              </button>

              <!-- Painel Popover Flutuante de Tags -->
              <div
                v-if="isTagsPopoverOpen"
                class="absolute left-0 top-10 w-72 sm:w-80 bg-bgPanel border border-divider rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 max-w-[calc(100vw-2rem)]"
                data-testid="tags-popover"
              >
                <div class="flex items-center justify-between border-b border-divider/60 pb-2">
                  <span class="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
                    <TagIcon class="w-3.5 h-3.5 text-accent" />
                    Tags da Nota
                  </span>
                  <button
                    type="button"
                    class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    @click="isTagsPopoverOpen = false"
                  >
                    <XIcon class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Lista de Tags Ativas -->
                <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  <span
                    v-for="(tag, idx) in localNote.tags"
                    :key="tag"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-medium border border-accent/20"
                  >
                    #{{ tag }}
                    <button
                      type="button"
                      class="hover:text-white cursor-pointer ml-0.5 text-accent/80"
                      title="Remover tag"
                      @click="removeTag(idx)"
                    >
                      ✕
                    </button>
                  </span>
                  <span v-if="!localNote.tags || localNote.tags.length === 0" class="text-[11px] text-textSecondary italic">
                    Nenhuma tag atribuída.
                  </span>
                </div>

                <!-- Adicionar Nova Tag -->
                <div class="flex items-center gap-1.5 pt-1 border-t border-divider/60">
                  <input
                    v-model="newTagInput"
                    type="text"
                    placeholder="Nova tag (Enter ou vírgula)..."
                    class="flex-1 px-2.5 py-1 text-xs bg-bgSurface border border-divider rounded-lg text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                    @keydown.enter.prevent="addTag"
                    @keydown="handleTagKeyDown"
                    data-testid="input-new-tag"
                  />
                  <button
                    type="button"
                    class="px-2.5 py-1 text-xs rounded-lg bg-accent/20 hover:bg-accent text-accent hover:text-white font-medium transition-colors cursor-pointer"
                    @click="addTag"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Separador Vertical -->
            <div class="h-4 w-px bg-divider/80 mx-0.5 shrink-0"></div>

            <!-- Botão Vincular Universal (Quadros, Notas, Livros, Livretos) -->
            <button
              type="button"
              class="px-2.5 h-8 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent hover:text-white border border-accent/30 flex items-center gap-1.5 text-xs font-medium cursor-pointer shrink-0 transition-colors shadow-xs"
              title="Vincular Quadro, Nota, Livro ou Livreto"
              @click="openUniversalLinkModal"
              data-testid="btn-link-canvas"
            >
              <LinkIcon class="w-3.5 h-3.5" />
              <span>Vincular</span>
              <ChevronDownIcon class="w-3 h-3 opacity-70" />
            </button>
          </div>

          <!-- Grupo da Direita: Indicador para Notas HTML Sintetizadas e Ações -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            <div v-if="isHtmlNote" class="flex items-center gap-1.5 shrink-0">
              <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-semibold text-[11px] border border-amber-500/30">
                <SparklesIcon class="w-3 h-3" />
                Síntese de Desenho (HTML)
              </span>

              <div class="flex items-center gap-1 bg-bgElevated p-0.5 rounded-lg text-[11px] border border-divider">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded transition-all cursor-pointer"
                  :class="htmlViewMode === 'preview' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                  @click="htmlViewMode === 'preview'"
                >
                  Preview
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded transition-all cursor-pointer"
                  :class="htmlViewMode === 'code' ? 'bg-primary text-white font-medium shadow-xs' : 'text-textSecondary hover:text-textPrimary'"
                  @click="htmlViewMode = 'code'"
                >
                  Código
                </button>
              </div>

              <button
                type="button"
                class="text-[11px] px-2 py-1 rounded bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all flex items-center gap-1 cursor-pointer"
                title="Copiar HTML"
                @click="copyHtmlContent"
              >
                <CopyIcon class="w-3 h-3" />
                <span class="hidden sm:inline">{{ copiedHtml ? 'Copiado!' : 'Copiar' }}</span>
              </button>
            </div>

            <!-- Botão Excluir Nota -->
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-divider/80 hover:border-red-500/30 transition-colors cursor-pointer shrink-0"
              title="Excluir Nota"
              @click="$emit('delete', localNote.id)"
              data-testid="btn-delete-note"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Conteúdo do Editor -->
        <template v-if="isHtmlNote">
          <div
            v-if="htmlViewMode === 'preview'"
            class="flex-1 overflow-y-auto p-4 sm:p-6 select-text custom-scrollbar prose dark:prose-invert max-w-none text-textPrimary leading-relaxed flex flex-col"
          >
            <!-- Título Inline estilo Obsidian dentro da página -->
            <div class="mb-4 pb-2 border-b border-divider/40 not-prose shrink-0">
              <input
                v-model="localNote.title"
                type="text"
                placeholder="Sem título"
                class="w-full bg-transparent border-none text-2xl sm:text-3xl font-bold font-serif text-textPrimary placeholder:text-textSecondary/40 focus:outline-none transition-colors leading-tight"
                @input="onInput"
              />
            </div>
            <div class="synthesized-html-container" v-html="localNote.content"></div>
          </div>
          <div v-else class="flex-1 flex flex-col p-4 sm:p-6">
            <div class="mb-4 pb-2 border-b border-divider/40 shrink-0">
              <input
                v-model="localNote.title"
                type="text"
                placeholder="Sem título"
                class="w-full bg-transparent border-none text-2xl sm:text-3xl font-bold font-serif text-textPrimary placeholder:text-textSecondary/40 focus:outline-none transition-colors leading-tight"
                @input="onInput"
              />
            </div>
            <textarea
              v-model="localNote.content"
              class="w-full flex-1 font-mono text-xs bg-transparent text-textPrimary focus:outline-none resize-none select-text custom-scrollbar"
              placeholder="Código HTML da anotação..."
              @input="onInput"
            ></textarea>
          </div>
        </template>

        <!-- Editor Único Live Preview Milkdown -->
        <div
          v-else
          class="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar flex flex-col"
        >
          <!-- Título Inline estilo Obsidian dentro da página -->
          <div class="mb-4 pb-2 border-b border-divider/40 shrink-0">
            <input
              v-model="localNote.title"
              type="text"
              placeholder="Sem título"
              class="w-full bg-transparent border-none text-2xl sm:text-3xl font-bold font-serif text-textPrimary placeholder:text-textSecondary/40 focus:outline-none transition-colors leading-tight"
              @input="onInput"
              @keydown.enter.prevent="focusEditor"
              @keydown.down="focusEditor"
              data-testid="input-note-title"
            />
          </div>

          <MilkdownEditor
            ref="milkdownRef"
            v-model="localNote.content"
            placeholder="Comece a escrever sua nota... O Live Preview renderiza automaticamente. Use 'Vincular' para associar quadros, notas, livros ou livretos."
            @update:model-value="onInput"
          />
        </div>

        <!-- Barra flutuante de criação de anotação ou flashcard a partir do trecho selecionado -->
        <Transition name="fade">
          <div
            v-if="selectedSnippet"
            class="absolute bottom-4 right-4 flex items-center gap-2 p-1.5 rounded-2xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl transition-all animate-in fade-in z-30 ring-1 ring-white/10 max-w-[calc(100vw-2rem)]"
            data-testid="note-selection-toolbar"
          >
            <div class="hidden sm:flex items-center gap-1 pl-1 pr-2 border-r border-divider/60 text-[11px] text-textSecondary font-technical">
              <span class="truncate max-w-[140px] italic">"{{ selectedSnippet }}"</span>
            </div>

            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-textPrimary font-technical text-xs font-semibold transition-all cursor-pointer hover:scale-102 active:scale-98"
              title="Criar anotação ou reflexão a partir do trecho selecionado"
              @mousedown.prevent.stop="openModalForAnnotation"
              data-testid="btn-create-note-from-snippet"
            >
              <MessageSquareIcon class="w-3.5 h-3.5 text-accent" />
              <span>Anotar</span>
            </button>

            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-technical text-xs font-semibold hover:bg-accent/90 transition-all cursor-pointer shadow-md hover:scale-102 active:scale-98"
              title="Criar Flashcard a partir do trecho selecionado"
              @mousedown.prevent.stop="openModalForFlashcard"
              data-testid="btn-create-flashcard-from-snippet"
            >
              <SparklesIcon class="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>

            <button
              type="button"
              class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
              title="Fechar barra"
              @mousedown.prevent.stop="selectedSnippet = ''"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Modal de Anotação e Flashcard com suporte à Nota -->
    <ReaderAnnotationModal
      :is-open="isAnnotationModalOpen"
      :initial-text="currentSelectedSnippet"
      :current-page="1"
      :book-id="1"
      :book-title="localNote.title || 'Nota'"
      :chapter-title="`Nota: ${localNote.title || 'Sem título'}`"
      :cfi="`note:${localNote.id}`"
      :note-id="String(localNote.id)"
      :initial-want-note="modalInitialWantNote"
      :initial-want-flashcard="modalInitialWantFlashcard"
      @close="isAnnotationModalOpen = false"
      @created="handleAnnotationCreated"
    />

    <!-- MODAL UNIVERSAL DE VÍNCULOS (Quadros, Notas, Livros, Livretos) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isUniversalLinkModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          @click.self="isUniversalLinkModalOpen = false"
        >
          <div class="w-full max-w-lg bg-bgPanel border border-divider rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <!-- Modal Header -->
            <div class="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-divider flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <LinkIcon class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-textPrimary">Vincular Conteúdo</h3>
                  <p class="text-[11px] text-textSecondary">Vincular Quadro, Nota, Livro ou Livreto Didático</p>
                </div>
              </div>
              <button
                type="button"
                class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
                @click="isUniversalLinkModalOpen = false"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Abas do Modal (Scrollável no mobile) -->
            <div class="flex border-b border-divider bg-bgSurface/30 px-3 pt-2 gap-1 overflow-x-auto no-scrollbar flex-nowrap text-xs">
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                :class="activeLinkTab === 'canvas' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeLinkTab = 'canvas'"
                data-testid="tab-link-canvas"
              >
                <span>🎨 Quadro</span>
              </button>
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                :class="activeLinkTab === 'note' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeLinkTab = 'note'"
                data-testid="tab-link-note"
              >
                <span>📝 Nota</span>
              </button>
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                :class="activeLinkTab === 'book' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeLinkTab = 'book'"
                data-testid="tab-link-book"
              >
                <span>📖 Livro</span>
              </button>
              <button
                type="button"
                class="px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                :class="activeLinkTab === 'booklet' ? 'border-accent text-accent font-semibold' : 'border-transparent text-textSecondary hover:text-textPrimary'"
                @click="activeLinkTab = 'booklet'"
                data-testid="tab-link-booklet"
              >
                <span>📚 Livreto</span>
              </button>
            </div>

            <!-- Campo de Busca Universal -->
            <div v-if="activeLinkTab !== 'canvas' || activeCanvasSubTab === 'existing'" class="p-3 border-b border-divider bg-bgSurface/20">
              <div class="relative flex items-center">
                <SearchIcon class="w-3.5 h-3.5 text-textSecondary absolute left-3" />
                <input
                  v-model="universalSearchQuery"
                  type="text"
                  :placeholder="searchPlaceholder"
                  class="w-full pl-8 pr-3 py-1.5 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <!-- ABA 1: QUADRO (CANVAS) -->
            <div v-if="activeLinkTab === 'canvas'" class="flex flex-col flex-1 overflow-hidden">
              <!-- Sub-abas: Existente vs Novo -->
              <div class="flex border-b border-divider/60 bg-bgSurface/20 px-3 py-1.5 gap-2 text-xs">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  :class="activeCanvasSubTab === 'existing' ? 'bg-accent/20 text-accent font-medium' : 'text-textSecondary hover:text-textPrimary'"
                  @click="activeCanvasSubTab = 'existing'"
                >
                  Quadro Existente
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  :class="activeCanvasSubTab === 'new' ? 'bg-accent/20 text-accent font-medium' : 'text-textSecondary hover:text-textPrimary'"
                  @click="activeCanvasSubTab = 'new'"
                >
                  + Criar Novo Quadro
                </button>
              </div>

              <!-- Lista de Quadros Existentes -->
              <div v-if="activeCanvasSubTab === 'existing'" class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[320px]">
                <div
                  v-for="c in filteredCanvases"
                  :key="c.id"
                  class="group p-2.5 sm:p-3 rounded-xl border border-divider/60 hover:border-accent/40 bg-bgSurface/40 hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                  @click="selectCanvasToLink(c)"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-textPrimary group-hover:text-accent transition-colors truncate">
                        {{ c.title || 'Quadro Sem Título' }}
                      </span>
                      <span v-if="c.nodeCount" class="text-[10px] px-1.5 py-0.2 rounded bg-bgElevated text-textSecondary border border-divider/50">
                        {{ c.nodeCount }} nós
                      </span>
                    </div>
                    <div class="text-[11px] text-textSecondary/70 mt-0.5 truncate">
                      ID: {{ c.id }}
                    </div>
                  </div>

                  <button
                    type="button"
                    class="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer min-h-[32px]"
                    @click.stop="selectCanvasToLink(c)"
                    data-testid="btn-select-canvas"
                  >
                    <span>Vincular</span>
                    <span>🔗</span>
                  </button>
                </div>

                <div v-if="filteredCanvases.length === 0" class="p-8 text-center text-textSecondary text-xs">
                  <p>Nenhum quadro encontrado.</p>
                  <button
                    type="button"
                    class="mt-2 text-accent hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    @click="activeCanvasSubTab = 'new'"
                  >
                    Criar um novo quadro agora →
                  </button>
                </div>
              </div>

              <!-- Criar Novo Quadro na Hora -->
              <div v-else class="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-center">
                <div>
                  <label class="block text-xs font-medium text-textSecondary mb-1.5">Título do Novo Quadro</label>
                  <input
                    v-model="newCanvasTitle"
                    type="text"
                    placeholder="Ex: Arquitetura do Sistema, Mapa Mental..."
                    class="w-full px-3.5 py-2 text-xs bg-bgSurface border border-divider rounded-xl text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
                    @keydown.enter.prevent="createNewCanvasAndLink"
                  />
                </div>

                <div class="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer"
                    @click="activeCanvasSubTab = 'existing'"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    class="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    :disabled="isCreatingCanvas"
                    @click="createNewCanvasAndLink"
                  >
                    <PlusIcon class="w-3.5 h-3.5" />
                    <span>{{ isCreatingCanvas ? 'Criando...' : 'Criar e Vincular' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- ABA 2: NOTA -->
            <div v-else-if="activeLinkTab === 'note'" class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[320px]">
              <div
                v-for="n in filteredNotes"
                :key="n.id"
                class="group p-2.5 sm:p-3 rounded-xl border border-divider/60 hover:border-blue-400/40 bg-bgSurface/40 hover:bg-blue-500/5 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                @click="selectNoteToLink(n)"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <FileTextIcon class="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span class="text-xs font-semibold text-textPrimary group-hover:text-blue-400 transition-colors truncate">
                      {{ n.title || 'Nota Sem Título' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-textSecondary/70 mt-0.5 truncate">
                    {{ n.folder ? `📁 ${n.folder}` : 'Sem pasta' }}
                  </div>
                </div>

                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer min-h-[32px]"
                  @click.stop="selectNoteToLink(n)"
                  data-testid="btn-select-note"
                >
                  <span>Vincular</span>
                  <span>🔗</span>
                </button>
              </div>

              <div v-if="filteredNotes.length === 0" class="p-8 text-center text-textSecondary text-xs">
                <p>Nenhuma outra nota encontrada.</p>
              </div>
            </div>

            <!-- ABA 3: LIVRO -->
            <div v-else-if="activeLinkTab === 'book'" class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[320px]">
              <div
                v-for="b in filteredBooks"
                :key="b.id"
                class="group p-2.5 sm:p-3 rounded-xl border border-divider/60 hover:border-emerald-400/40 bg-bgSurface/40 hover:bg-emerald-500/5 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                @click="selectBookToLink(b)"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <BookOpenIcon class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span class="text-xs font-semibold text-textPrimary group-hover:text-emerald-400 transition-colors truncate">
                      {{ b.title || 'Livro Sem Título' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-textSecondary/70 mt-0.5 truncate">
                    {{ b.author || 'Autor Desconhecido' }}
                  </div>
                </div>

                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer min-h-[32px]"
                  @click.stop="selectBookToLink(b)"
                  data-testid="btn-select-book"
                >
                  <span>Vincular</span>
                  <span>🔗</span>
                </button>
              </div>

              <div v-if="filteredBooks.length === 0" class="p-8 text-center text-textSecondary text-xs">
                <p>Nenhum livro encontrado na biblioteca.</p>
              </div>
            </div>

            <!-- ABA 4: LIVRETO DIDÁTICO -->
            <div v-else-if="activeLinkTab === 'booklet'" class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[320px]">
              <div
                v-for="bk in filteredBooklets"
                :key="bk.id"
                class="group p-2.5 sm:p-3 rounded-xl border border-divider/60 hover:border-purple-400/40 bg-bgSurface/40 hover:bg-purple-500/5 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                @click="selectBookletToLink(bk)"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <BookMarkedIcon class="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span class="text-xs font-semibold text-textPrimary group-hover:text-purple-400 transition-colors truncate">
                      {{ bk.title || 'Livreto Didático' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-textSecondary/70 mt-0.5 truncate">
                    {{ bk.topic ? `Tema: ${bk.topic}` : 'Livreto gerado por IA' }}
                  </div>
                </div>

                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer min-h-[32px]"
                  @click.stop="selectBookletToLink(bk)"
                  data-testid="btn-select-booklet"
                >
                  <span>Vincular</span>
                  <span>🔗</span>
                </button>
              </div>

              <div v-if="filteredBooklets.length === 0" class="p-8 text-center text-textSecondary text-xs">
                <p>Nenhum livreto didático encontrado.</p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-4 sm:px-5 py-3 border-t border-divider bg-bgSurface/20 flex items-center justify-end">
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer"
                @click="isUniversalLinkModalOpen = false"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FolderIcon,
  TagIcon,
  Trash2Icon,
  MessageSquareIcon,
  SparklesIcon,
  XIcon,
  CheckCircle2Icon,
  Copy as CopyIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Link as LinkIcon,
  ChevronDown as ChevronDownIcon,
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  BookMarked as BookMarkedIcon,
} from 'lucide-vue-next'
import MilkdownEditor from '~/components/MilkdownEditor.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'
import { extractTitleFromMarkdown } from '~/utils/noteTitle'
import type { NoteItem } from '~/interfaces/note'
import type { CanvasSummary } from '~/interfaces/canvas'
import type { AnnotationItem } from '~/composables/useAnnotations'
import type { LocalBook } from '~/adapters/database/types'

const props = defineProps<{
  note: NoteItem
  folders: string[]
  canvases: CanvasSummary[]
}>()

const emit = defineEmits<{
  (_e: 'update:note', _note: NoteItem): void
  (_e: 'save', _note: NoteItem): void
  (_e: 'delete', _id: string): void
  (_e: 'close'): void
}>()

const normalizeInitialTitle = (t?: string) => {
  const clean = (t || '').trim()
  if (clean.toLowerCase() === 'nova nota' || clean.toLowerCase() === 'nota sem título') return ''
  return clean
}

const localNote = ref<NoteItem>({
  ...props.note,
  title: normalizeInitialTitle(props.note.title),
  tags: Array.isArray(props.note.tags) ? [...props.note.tags] : []
})

const milkdownRef = ref<any>(null)
const selectedHeading = ref('p')
const isTagsPopoverOpen = ref(false)
const newTagInput = ref('')

const selectedSnippet = ref('')
const currentSelectedSnippet = ref('')
const isAnnotationModalOpen = ref(false)
const modalInitialWantNote = ref(false)
const modalInitialWantFlashcard = ref(false)
const toastMessage = ref('')
let toastTimer: any = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3500)
}

function handleTextSelection() {
  if (typeof window === 'undefined') return
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (text && text.length > 2) {
    selectedSnippet.value = text
  } else {
    selectedSnippet.value = ''
  }
}

function openModalForAnnotation() {
  if (!selectedSnippet.value) return
  currentSelectedSnippet.value = selectedSnippet.value
  modalInitialWantNote.value = true
  modalInitialWantFlashcard.value = false
  isAnnotationModalOpen.value = true
  selectedSnippet.value = ''
}

function openModalForFlashcard() {
  if (!selectedSnippet.value) return
  currentSelectedSnippet.value = selectedSnippet.value
  modalInitialWantNote.value = false
  modalInitialWantFlashcard.value = true
  isAnnotationModalOpen.value = true
  selectedSnippet.value = ''
}

function handleAnnotationCreated(created: AnnotationItem) {
  isAnnotationModalOpen.value = false
  selectedSnippet.value = ''
  if (created.hasFlashcard) {
    showToast('Flashcard gerado a partir do trecho!')
  } else {
    showToast('Anotação criada a partir do trecho!')
  }
}

watch(
  () => props.note,
  (newVal) => {
    localNote.value = {
      ...newVal,
      title: normalizeInitialTitle(newVal.title),
      tags: Array.isArray(newVal.tags) ? [...newVal.tags] : []
    }
  },
  { deep: true }
)

watch(
  () => localNote.value.content,
  (newContent) => {
    if (!localNote.value.title || localNote.value.title === 'Nota') {
      const extracted = extractTitleFromMarkdown(newContent)
      if (extracted) {
        localNote.value.title = extracted
        onInput()
      }
    }
  }
)

const onInput = () => {
  emit('update:note', localNote.value)
  emit('save', localNote.value)
}

const addTag = () => {
  const clean = newTagInput.value.trim().replace(/^#/, '')
  if (!localNote.value.tags) localNote.value.tags = []
  if (clean && !localNote.value.tags.includes(clean)) {
    localNote.value.tags.push(clean)
    onInput()
  }
  newTagInput.value = ''
}

const handleTagKeyDown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    addTag()
  }
}

const removeTag = (idx: number) => {
  if (!localNote.value.tags) return
  localNote.value.tags.splice(idx, 1)
  onInput()
}

// Transição suave do título para o editor (estilo Obsidian)
const focusEditor = () => {
  milkdownRef.value?.focus?.()
}

// Formatação rica delegada ao Milkdown via editorView
const applyBold = () => {
  milkdownRef.value?.toggleBold?.()
}

const applyItalic = () => {
  milkdownRef.value?.toggleItalic?.()
}

const applyHeading = () => {
  const val = selectedHeading.value
  if (val === 'p') {
    milkdownRef.value?.setParagraph?.()
  } else if (val === 'h1') {
    milkdownRef.value?.setHeading?.(1)
  } else if (val === 'h2') {
    milkdownRef.value?.setHeading?.(2)
  } else if (val === 'h3') {
    milkdownRef.value?.setHeading?.(3)
  }
}

// Inserção de link e sincronização com a nota
const insertMarkdownLink = (label: string, protocol: string, id: string | number) => {
  const linkText = `[${label}](${protocol}:${id}) `
  if (milkdownRef.value?.insertText) {
    try {
      milkdownRef.value.insertText(linkText)
      setTimeout(() => {
        if (milkdownRef.value?.getContent) {
          localNote.value.content = milkdownRef.value.getContent()
          onInput()
        }
      }, 30)
      return
    } catch {
      // fallback
    }
  }

  // Fallback se o ref ainda não estiver montado ou em modo texto direto
  const current = localNote.value.content || ''
  localNote.value.content = current + (current.endsWith('\n') || !current ? '' : '\n\n') + linkText
  onInput()
}

// Estado do Modal Universal de Vínculos
const isUniversalLinkModalOpen = ref(false)
const activeLinkTab = ref<'canvas' | 'note' | 'book' | 'booklet'>('canvas')
const activeCanvasSubTab = ref<'existing' | 'new'>('existing')
const universalSearchQuery = ref('')
const newCanvasTitle = ref('')
const isCreatingCanvas = ref(false)

const allNotes = ref<any[]>([])
const allBooks = ref<LocalBook[]>([])
const allBooklets = ref<any[]>([])

const searchPlaceholder = computed(() => {
  switch (activeLinkTab.value) {
    case 'canvas': return 'Buscar quadro por título...'
    case 'note': return 'Buscar nota por título ou conteúdo...'
    case 'book': return 'Buscar livro por título ou autor...'
    case 'booklet': return 'Buscar livreto didático por tema...'
    default: return 'Buscar...'
  }
})

const loadUniversalData = async () => {
  try {
    const [notes, books] = await Promise.all([
      noteRepo.getAll().catch(() => []),
      bookRepo.getAll().catch(() => []),
    ])
    allNotes.value = notes || []
    allBooks.value = books || []
  } catch (err) {
    console.warn('[NoteEditorPane] Erro ao carregar notas e livros:', err)
  }

  try {
    const didactic = useDidacticBooklet()
    const booklets = await didactic.fetchBooklets().catch(() => [])
    allBooklets.value = booklets || []
  } catch (err) {
    console.warn('[NoteEditorPane] Erro ao carregar livretos didáticos:', err)
  }
}

onMounted(() => {
  loadUniversalData()
})

const openUniversalLinkModal = () => {
  universalSearchQuery.value = ''
  newCanvasTitle.value = ''
  activeCanvasSubTab.value = (props.canvases && props.canvases.length > 0) ? 'existing' : 'new'
  isUniversalLinkModalOpen.value = true
  loadUniversalData()
}

const filteredCanvases = computed(() => {
  const list = props.canvases || []
  const q = universalSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q))
  )
})

const filteredNotes = computed(() => {
  const list = allNotes.value.filter((n) => String(n.id) !== String(localNote.value.id))
  const q = universalSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (n) =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q))
  )
})

const filteredBooks = computed(() => {
  const list = allBooks.value || []
  const q = universalSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (b) =>
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q))
  )
})

const filteredBooklets = computed(() => {
  const list = allBooklets.value || []
  const q = universalSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (bk) =>
      (bk.title && bk.title.toLowerCase().includes(q)) ||
      (bk.topic && bk.topic.toLowerCase().includes(q))
  )
})

const selectCanvasToLink = (canvas: CanvasSummary) => {
  isUniversalLinkModalOpen.value = false
  const title = canvas.title || 'Quadro'
  insertMarkdownLink(`🎨 ${title}`, 'canvas', canvas.id)
  showToast(`Link para o quadro "${title}" vinculado!`)
}

const selectNoteToLink = (noteItem: any) => {
  isUniversalLinkModalOpen.value = false
  const title = noteItem.title || 'Nota'
  insertMarkdownLink(`📝 ${title}`, 'note', noteItem.id)
  showToast(`Link para a nota "${title}" vinculado!`)
}

const selectBookToLink = (bookItem: LocalBook) => {
  isUniversalLinkModalOpen.value = false
  const title = bookItem.title || 'Livro'
  insertMarkdownLink(`📖 ${title}`, 'book', bookItem.id)
  showToast(`Link para o livro "${title}" vinculado!`)
}

const selectBookletToLink = (bookletItem: any) => {
  isUniversalLinkModalOpen.value = false
  const title = bookletItem.title || 'Livreto'
  const targetId = bookletItem.book?.id || bookletItem.id
  insertMarkdownLink(`📚 ${title}`, 'booklet', targetId)
  showToast(`Link para o livreto "${title}" vinculado!`)
}

const createNewCanvasAndLink = async () => {
  const title = newCanvasTitle.value.trim() || 'Novo Quadro'
  isCreatingCanvas.value = true
  try {
    const newId = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    await canvasRepo.save({
      id: newId,
      name: title,
      document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    })

    isUniversalLinkModalOpen.value = false
    insertMarkdownLink(`🎨 ${title}`, 'canvas', newId)
    showToast(`Quadro "${title}" criado e vinculado com sucesso!`)
  } catch (err) {
    console.error('Erro ao criar novo quadro:', err)
    showToast('Erro ao criar novo quadro.')
  } finally {
    isCreatingCanvas.value = false
  }
}

// Navegação de cliques em links de quadros, notas, livros ou livretos
const handleEditorClick = (event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) return

  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href') || ''

  // 1. Quadro (Canvas)
  let canvasId = ''
  if (href.startsWith('canvas:')) {
    canvasId = href.replace(/^canvas:/, '')
  } else if (href.includes('/canvas/')) {
    const match = href.match(/\/canvas\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) canvasId = match[1]
  }

  if (canvasId) {
    event.preventDefault()
    navigateUrl(`/canvas/${canvasId}`)
    return
  }

  // 2. Nota
  if (href.startsWith('note:')) {
    event.preventDefault()
    const noteId = href.replace(/^note:/, '')
    navigateUrl(`/notes?id=${noteId}`)
    return
  }

  // 3. Livro
  if (href.startsWith('book:')) {
    event.preventDefault()
    const bookId = href.replace(/^book:/, '')
    navigateUrl(`/reader?bookId=${bookId}`)
    return
  }

  // 4. Livreto Didático
  if (href.startsWith('booklet:')) {
    event.preventDefault()
    const bookletId = href.replace(/^booklet:/, '')
    navigateUrl(`/reader?bookId=${bookletId}`)
    return
  }
}

function navigateUrl(url: string) {
  if (typeof navigateTo === 'function') {
    navigateTo(url)
  } else if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

const isHtmlNote = computed(() => {
  const c = localNote.value?.content || ''
  return /<([a-z]+)[^>]*>[\s\S]*?<\/\1>/i.test(c) || c.includes('synthesized-html-container') || c.includes('aresta-drawing-synthesis')
})

const htmlViewMode = ref<'preview' | 'code'>('preview')
const copiedHtml = ref(false)

function copyHtmlContent() {
  if (!localNote.value?.content) return
  navigator.clipboard.writeText(localNote.value.content)
  copiedHtml.value = true
  setTimeout(() => {
    copiedHtml.value = false
  }, 2000)
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

:deep(.aresta-drawing-synthesis) {
  font-family: inherit;
}
:deep(.aresta-drawing-synthesis h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-textPrimary, inherit);
}
:deep(.aresta-drawing-synthesis table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}
:deep(.aresta-drawing-synthesis th),
:deep(.aresta-drawing-synthesis td) {
  border: 1px solid rgba(125, 125, 125, 0.2);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
:deep(.aresta-drawing-synthesis th) {
  background-color: rgba(125, 125, 125, 0.08);
  font-weight: 600;
}
:deep(.aresta-drawing-synthesis ul),
:deep(.aresta-drawing-synthesis ol) {
  padding-left: 1.25rem;
  margin: 0.75rem 0;
}
</style>
