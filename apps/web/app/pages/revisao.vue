<template>
  <div class="flex flex-col gap-8 pb-16">
    <!-- Abas Internas da Revisão -->
    <header class="flex items-center justify-between gap-4">
      <div class="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-divider">
        <button
          @click="activeTab = 'flashcards'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'flashcards' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
        >
          <LayersIcon class="w-4 h-4" />
          Flashcards ({{ displayCards.length }})
        </button>
        <button
          @click="activeTab = 'summaries'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'summaries' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
        >
          <FileTextIcon class="w-4 h-4" />
          Resumos & Anotações ({{ summaries.length }})
        </button>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- SEÇÃO 1: FLASHCARDS (Repetição Espaçada 3D) -->
    <section v-if="activeTab === 'flashcards'" class="flex flex-col gap-8">
      <!-- Barra de Controle e Filtro de Livros -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="font-technical text-xs text-textSecondary">Filtrar por Obra:</span>
          <AppSelect
            v-model="selectedBookFilter"
            :options="bookFilterOptions"
            :icon="BookOpenIcon"
            placeholder="Todas as Obras"
            search-placeholder="Buscar obra..."
          />
        </div>

        <div class="flex items-center gap-3 text-xs font-technical text-textSecondary">
          <span>Card {{ filteredCards.length > 0 ? currentCardIndex + 1 : 0 }} de {{ filteredCards.length }}</span>
          <div class="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-accent transition-all duration-300 rounded-full"
              :style="{ width: `${filteredCards.length > 0 ? ((currentCardIndex + 1) / filteredCards.length) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- ESTADO VAZIO: Sem flashcards -->
      <div
        v-if="filteredCards.length === 0 && !flashcards.isLoading.value"
        class="flex flex-col items-center justify-center p-12 rounded-3xl bg-bgPanel/60 border border-divider text-center gap-4 max-w-xl mx-auto"
      >
        <div class="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
          <BrainIcon class="w-6 h-6" />
        </div>
        <h3 class="font-editorial text-2xl font-light text-textPrimary">Nenhum Flashcard Pendente</h3>
        <p class="font-interface text-sm text-textSecondary max-w-md">
          Você não possui flashcards pendentes de revisão hoje. Continue lendo seus livros e adicionando anotações para gerar novos cards inteligentes.
        </p>
        <NuxtLink
          :to="availableBooks.length === 0 ? '/upload' : '/'"
          class="px-5 py-2.5 rounded-full bg-accent text-white font-interface text-xs font-medium hover:bg-accent/90 transition-all shadow-md mt-2 flex items-center gap-2"
        >
          <UploadIcon v-if="availableBooks.length === 0" class="w-4 h-4" />
          <span>{{ availableBooks.length === 0 ? 'Comece uma leitura' : 'Voltar para Leitura' }}</span>
        </NuxtLink>
      </div>

      <!-- Container do Flashcard Interativo (Flip 3D) -->
      <div v-else-if="currentCard" class="flex flex-col items-center gap-6">
        <div
          class="card-scene w-full max-w-xl h-80 cursor-pointer select-none"
          @click="isFlipped = !isFlipped"
        >
          <div class="card-object" :class="{ 'is-flipped': isFlipped }">
            <!-- FACE FRENTE (Pergunta) -->
            <div class="card-face card-front p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-divider hover:border-accent/40 shadow-2xl backdrop-blur-xl transition-all">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-divider font-technical text-[10px] text-textSecondary uppercase tracking-wider truncate max-w-[240px]">
                  {{ currentCard.bookTitle }}
                </span>
                <span class="font-technical text-[10px] text-accent flex items-center gap-1">
                  <RotateCwIcon class="w-3 h-3" />
                  Clique para virar
                </span>
              </div>

              <div class="my-auto text-center px-4">
                <span class="font-technical text-xs uppercase tracking-widest text-textSecondary mb-2 block font-medium">
                  {{ formatCardType(currentCard.cardType) }}
                </span>
                <h3 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary leading-snug">
                  {{ currentCard.question }}
                </h3>
              </div>

              <div class="flex items-center justify-between text-xs text-textSecondary font-interface">
                <span v-if="currentCard.chapterTitle" class="truncate max-w-[200px]">
                  {{ currentCard.chapterTitle }}
                </span>
                <span v-else>Toque no cartão para ver a resposta</span>

                <!-- Link para a Fonte Original -->
                <NuxtLink
                  v-if="getSourceUrl(currentCard)"
                  :to="getSourceUrl(currentCard)!"
                  class="flex items-center gap-1 text-[11px] font-technical text-accent hover:underline px-2.5 py-0.5 rounded-lg bg-accent/10 border border-accent/25 transition-all hover:bg-accent/20 cursor-pointer"
                  @click.stop
                  title="Abrir a fonte original deste cartão"
                >
                  <ExternalLinkIcon class="w-3 h-3" />
                  <span>{{ currentCard.sourceType === 'canvas_note' ? 'Ver Nota' : 'Ver fonte' }}</span>
                </NuxtLink>

                <span class="font-technical text-[10px] text-accent font-semibold">Nível {{ currentCard.repetitionLevel }}</span>
              </div>
            </div>

            <!-- FACE VERSO (Resposta) -->
            <div class="card-face card-back p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-accent/40 shadow-2xl backdrop-blur-xl">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-technical text-[10px] text-accent uppercase tracking-wider">
                  Resposta Explicada
                </span>
                <span v-if="currentCard.chapterTitle" class="font-technical text-[10px] text-textSecondary truncate max-w-[200px]">
                  {{ currentCard.chapterTitle }}
                </span>
              </div>

              <div class="my-auto text-center px-4 overflow-y-auto max-h-44">
                <p class="font-interface text-sm md:text-base text-textPrimary leading-relaxed font-normal">
                  {{ currentCard.answer }}
                </p>
              </div>

              <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-t border-divider pt-2">
                <span>Repetição Espaçada</span>
                <NuxtLink
                  v-if="getSourceUrl(currentCard)"
                  :to="getSourceUrl(currentCard)!"
                  class="text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  @click.stop
                  title="Abrir a fonte original deste cartão"
                >
                  <ExternalLinkIcon class="w-3 h-3" />
                  <span>{{ currentCard.sourceType === 'canvas_note' ? 'Ver Nota' : 'Ver fonte' }}</span>
                </NuxtLink>
                <span v-else class="text-accent">Aresta Memory Engine</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de Autoavaliação da Repetição Espaçada -->
        <div v-if="isFlipped" class="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            @click="rateCurrentCard('hard')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Difícil (Repetir amanhã)
          </button>
          <button
            @click="rateCurrentCard('good')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Bom (3 dias)
          </button>
          <button
            @click="rateCurrentCard('easy')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Fácil (7 dias)
          </button>
          
          <button
            @click="openDidacticModal"
            class="px-4 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent font-interface text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Gerar ou anexar livro didático explicativo"
          >
            <SparklesIcon class="w-4 h-4" />
            Explicar com IA (Livreto)
          </button>
        </div>

        <!-- Controles de Navegação Anterior/Próximo -->
        <div class="flex items-center gap-4 text-xs font-interface text-textSecondary">
          <button
            @click="prevCard"
            :disabled="currentCardIndex === 0"
            class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            <ChevronLeftIcon class="w-4 h-4" /> Anterior
          </button>
          <button
            @click="nextCard"
            :disabled="currentCardIndex >= filteredCards.length - 1"
            class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            Próximo <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- SEÇÃO 2: RESUMOS & ANOTAÇÕES GERADAS POR IA -->
    <section v-if="activeTab === 'summaries'" class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 class="font-editorial text-2xl font-light text-textPrimary">
            Sínteses e Anotações Inteligentes
          </h3>
          <p class="font-technical text-xs text-textSecondary mt-0.5">
            {{ userSummaries.length > 0 ? `${userSummaries.length} anotação(ões) organizada(s) por temas` : 'Extraídas de marcações ativas' }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Botão Nova Anotação Direta -->
          <button
            @click="isNewAnnotationModalOpen = true"
            class="px-4 py-2 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            data-testid="btn-new-annotation"
          >
            <PlusIcon class="w-3.5 h-3.5" />
            <span>Nova Anotação</span>
          </button>

          <!-- Filtro por Obra na aba de anotações -->
          <div class="flex items-center gap-2">
            <span class="font-technical text-xs text-textSecondary">Obra:</span>
            <AppSelect
              v-model="selectedSummaryBookFilter"
              :options="summaryBookFilterOptions"
              :icon="BookOpenIcon"
              placeholder="Todas as Obras"
              search-placeholder="Buscar obra..."
            />
          </div>
        </div>
      </div>

      <!-- Barra de Filtros Rápidos por Tema (Chips / Pills) -->
      <div v-if="allUniqueThemes.length > 0" class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span class="font-technical text-[11px] text-textSecondary uppercase tracking-wider flex items-center gap-1 mr-1">
          <TagIcon class="w-3 h-3" /> Temas:
        </span>
        <button
          @click="selectedThemeFilter = 'all'"
          class="px-3 py-1 rounded-full text-xs font-interface transition-all border shrink-0 cursor-pointer"
          :class="selectedThemeFilter === 'all'
            ? 'bg-accent text-white border-accent shadow-sm'
            : 'bg-white/5 text-textSecondary border-divider hover:text-textPrimary'"
        >
          Todos ({{ summaries.length }})
        </button>
        <button
          v-for="t in allUniqueThemes"
          :key="t.name"
          @click="selectedThemeFilter = t.name"
          class="px-3 py-1 rounded-full text-xs font-interface transition-all border shrink-0 cursor-pointer"
          :class="selectedThemeFilter === t.name
            ? 'bg-accent text-white border-accent shadow-sm'
            : 'bg-white/5 text-textSecondary border-divider hover:text-textPrimary'"
        >
          #{{ t.name }}
        </button>
        <button
          @click="selectedThemeFilter = 'no_theme'"
          class="px-3 py-1 rounded-full text-xs font-interface transition-all border shrink-0 cursor-pointer"
          :class="selectedThemeFilter === 'no_theme'
            ? 'bg-accent text-white border-accent shadow-sm'
            : 'bg-white/5 text-textSecondary border-divider hover:text-textPrimary'"
        >
          Sem Tema
        </button>
      </div>

      <!-- Estado Vazio: nenhuma anotação encontrada -->
      <div
        v-if="filteredSummaries.length === 0 && !annotationsLoading"
        class="flex flex-col items-center justify-center p-12 rounded-3xl bg-bgPanel/60 border border-divider text-center gap-4 max-w-xl mx-auto"
      >
        <div class="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
          <FileTextIcon class="w-6 h-6" />
        </div>
        <h3 class="font-editorial text-2xl font-light text-textPrimary">Nenhuma Anotação Encontrada</h3>
        <p class="font-interface text-sm text-textSecondary max-w-md">
          Você ainda não possui anotações registradas para este filtro. Crie uma nova anotação ou faça destaques no leitor de livros.
        </p>
        <button
          @click="isNewAnnotationModalOpen = true"
          class="px-5 py-2.5 rounded-full bg-accent text-white font-interface text-xs font-medium hover:bg-accent/90 transition-all shadow-md mt-2 flex items-center gap-2 cursor-pointer"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Criar Anotação Agora</span>
        </button>
      </div>

      <!-- Grupos Visuais de Anotações por Tema -->
      <div v-else class="flex flex-col gap-8">
        <div
          v-for="group in groupedSummariesByTheme"
          :key="group.themeName"
          class="flex flex-col gap-4"
        >
          <!-- Cabeçalho do Grupo de Tema -->
          <div class="flex items-center gap-2 border-b border-divider pb-2">
            <span class="text-sm">🏷️</span>
            <h4 class="font-editorial text-lg font-medium text-textPrimary">
              {{ group.themeName }}
            </h4>
            <span class="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-technical text-[10px] font-semibold">
              {{ group.items.length }} {{ group.items.length === 1 ? 'anotação' : 'anotações' }}
            </span>
          </div>

          <!-- Cards das Anotações no Tema -->
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="summary in group.items"
              :key="summary.id"
              class="p-6 md:p-7 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] border border-divider transition-all flex flex-col gap-4"
              data-testid="annotation-card"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-divider pb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-technical text-[10px] font-semibold uppercase">
                    {{ summary.bookTitle }}
                  </span>
                  <span v-if="summary.chapter" class="text-xs font-interface text-textSecondary">· {{ summary.chapter }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-technical text-[10px] text-textSecondary">{{ summary.date }}</span>
                  <button
                    v-if="summary.annotationId"
                    @click="removeAnnotation(summary.annotationId)"
                    class="text-textSecondary hover:text-rose-400 transition-colors p-1"
                    title="Excluir anotação e flashcard associado"
                    data-testid="btn-delete-annotation"
                  >
                    <Trash2Icon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <h4 class="font-editorial text-xl font-light text-textPrimary">
                  {{ summary.topic }}
                </h4>
                <blockquote
                  v-if="summary.highlightQuote"
                  class="p-4 rounded-xl bg-white/5 border-l-2 border-accent text-xs font-interface italic text-textPrimary/90 leading-relaxed"
                >
                  "{{ summary.highlightQuote }}"
                </blockquote>
              </div>

              <!-- Resumo estruturado pela IA ou Nota do Leitor -->
              <div v-if="summary.aiSynthesis" class="flex flex-col gap-1.5 bg-white/[0.02] p-4 rounded-xl border border-divider/50">
                <span class="font-technical text-[10px] uppercase font-semibold text-accent tracking-wider flex items-center gap-1.5">
                  <SparklesIcon class="w-3.5 h-3.5" />
                  {{ summary.isUserNote ? 'Anotação / Reflexão' : 'Síntese Aresta IA' }}
                </span>
                <p class="font-interface text-xs text-textSecondary leading-relaxed whitespace-pre-wrap">
                  {{ summary.aiSynthesis }}
                </p>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <!-- Tags / Temas da anotação -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span v-for="tag in summary.tags" :key="tag" class="font-technical text-[10px] text-textSecondary bg-white/5 px-2 py-0.5 rounded">
                    #{{ tag }}
                  </span>
                </div>

                <!-- Ações e Rastreamento de Fonte -->
                <div class="flex items-center gap-2">
                  <!-- Link para a fonte (Livro ou Canvas) -->
                  <NuxtLink
                    v-if="summary.sourceType === 'canvas_note' && summary.noteId"
                    :to="`/canvas?tab=notes&noteId=${summary.noteId}`"
                    class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 text-textSecondary hover:text-textPrimary font-interface text-xs transition-colors flex items-center gap-1.5"
                    title="Ver nota no Canvas"
                  >
                    <ExternalLinkIcon class="w-3.5 h-3.5" />
                    <span>Ver no Canvas</span>
                  </NuxtLink>
                  <NuxtLink
                    v-else-if="summary.bookId"
                    :to="`/reader?bookId=${summary.bookId}`"
                    class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 text-textSecondary hover:text-textPrimary font-interface text-xs transition-colors flex items-center gap-1.5"
                    title="Abrir livro no leitor"
                  >
                    <BookOpenIcon class="w-3.5 h-3.5" />
                    <span>Abrir Obra ↗</span>
                  </NuxtLink>

                  <!-- Alternância de Status do Flashcard -->
                  <div class="flex items-center gap-2">
                    <template v-if="summary.hasFlashcard">
                      <span
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-technical text-[10px] font-semibold uppercase"
                        data-testid="badge-flashcard-active"
                      >
                        <CheckIcon class="w-3 h-3" />
                        Flashcard Ativo
                      </span>
                      <button
                        @click="handleToggleFlashcard(summary)"
                        :disabled="isTogglingFlashcard === summary.annotationId"
                        class="px-2.5 py-1.5 rounded-lg border border-divider hover:border-rose-500/40 hover:bg-rose-500/10 text-textSecondary hover:text-rose-400 font-interface text-xs transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="Desvincular e remover flashcard do deck diário"
                        data-testid="btn-toggle-flashcard"
                      >
                        <XIcon class="w-3 h-3" />
                        <span>Desativar</span>
                      </button>
                    </template>
                    <button
                      v-else
                      @click="handleToggleFlashcard(summary)"
                      :disabled="isTogglingFlashcard === summary.annotationId"
                      class="px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/15 hover:bg-accent/25 text-accent font-interface text-xs transition-all flex items-center gap-1.5 font-medium shadow-sm disabled:opacity-50 cursor-pointer"
                      title="Gerar flashcard com IA a partir desta anotação"
                      data-testid="btn-toggle-flashcard"
                    >
                      <SparklesIcon class="w-3.5 h-3.5" />
                      <span>{{ isTogglingFlashcard === summary.annotationId ? 'Gerando...' : 'Criar Flashcard (IA)' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MODAL DE EXPLICAÇÃO DIDÁTICA COM IA (LIVRETO / CADERNO) -->
    <div
      v-if="isDidacticModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-bgPanel border border-divider rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6">
        <div class="flex items-center justify-between border-b border-divider pb-4">
          <div class="flex items-center gap-2 text-accent">
            <SparklesIcon class="w-5 h-5" />
            <h3 class="font-editorial text-xl text-textPrimary">Didactic AI Tutor</h3>
          </div>
          <button
            @click="isDidacticModalOpen = false"
            class="text-textSecondary hover:text-textPrimary text-sm font-technical"
          >
            ✕ Fechar
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            A IA didática vai estruturar uma explicação visual paginada com analogias, diagramas Mermaid e callouts sobre o conceito deste flashcard:
          </p>

          <div class="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-divider text-xs font-interface text-textPrimary">
            <strong>Tópico:</strong> {{ currentCard?.question }}
          </div>

          <!-- Seleção de Modo: Novo Livreto vs Appendar em Livreto Existente -->
          <div class="flex flex-col gap-2">
            <label class="font-technical text-xs text-textSecondary uppercase">Destino da Explicação:</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="selectedBookletMode = 'new'"
                class="px-3 py-2.5 rounded-xl border text-xs font-interface font-medium transition-all text-center"
                :class="selectedBookletMode === 'new' ? 'border-accent bg-accent/15 text-accent' : 'border-divider text-textSecondary hover:border-textSecondary'"
              >
                📖 Novo Livreto Avulso
              </button>
              <button
                type="button"
                @click="selectedBookletMode = 'append'"
                :disabled="didactic.booklets.value.length === 0"
                class="px-3 py-2.5 rounded-xl border text-xs font-interface font-medium transition-all text-center disabled:opacity-40"
                :class="selectedBookletMode === 'append' ? 'border-accent bg-accent/15 text-accent' : 'border-divider text-textSecondary hover:border-textSecondary'"
              >
                📎 Anexar a Caderno ({{ didactic.booklets.value.length }})
              </button>
            </div>
          </div>

          <!-- Seletor de Livreto Existente quando Modo = 'append' -->
          <div v-if="selectedBookletMode === 'append'" class="flex flex-col gap-1.5">
            <label class="font-technical text-xs text-textSecondary">Selecione o Livreto Didático:</label>
            <AppSelect
              v-model="selectedTargetBookletId"
              :options="bookletOptions"
              placeholder="Selecione um caderno didático"
              search-placeholder="Buscar caderno..."
            />
          </div>

          <!-- Seletor de Profundidade -->
          <div class="flex flex-col gap-1.5">
            <label class="font-technical text-xs text-textSecondary">Profundidade Didática:</label>
            <AppSelect
              v-model="selectedDepth"
              :options="depthOptions"
              placeholder="Selecione a profundidade"
            />
          </div>

          <!-- Alerta de Erro de Geração de IA -->
          <div
            v-if="didacticError"
            class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-interface text-red-400 flex items-start gap-2.5 animate-in fade-in"
          >
            <span class="text-base leading-none">⚠️</span>
            <div class="flex-1 leading-relaxed">
              {{ didacticError }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button
            @click="isDidacticModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-interface text-textSecondary hover:text-textPrimary"
          >
            Cancelar
          </button>
          <button
            @click="generateDidacticBooklet"
            :disabled="didactic.isGenerating.value"
            class="px-5 py-2.5 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <SparklesIcon v-if="!didactic.isGenerating.value" class="w-4 h-4" />
            <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ didactic.isGenerating.value ? 'Gerando Livreto...' : 'Gerar e Abrir no Leitor' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para Nova Anotação Direta -->
    <ReaderAnnotationModal
      :is-open="isNewAnnotationModalOpen"
      :initial-text="''"
      :current-page="1"
      :book-id="1"
      :book-title="'Anotação Avulsa'"
      :chapter-title="'Anotações Avulsas'"
      @close="isNewAnnotationModalOpen = false"
      @created="handleNewAnnotationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayersIcon,
  FileTextIcon,
  RotateCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  BrainIcon,
  SparklesIcon,
  Trash2Icon,
  BookOpenIcon,
  UploadIcon,
  ExternalLinkIcon,
  CheckIcon,
  XIcon,
  TagIcon
} from 'lucide-vue-next'
import { useReadingStreak } from '~/composables/useReadingStreak'
import { useFlashcards, type FlashcardItem } from '~/composables/useFlashcards'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'
import { useAnnotations } from '~/composables/useAnnotations'
import { useUserBooks } from '~/composables/useUserBooks'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import AppSelect from '~/components/AppSelect.vue'

interface AnnotationSummary {
  id: string
  bookTitle: string
  chapter: string
  topic: string
  highlightQuote: string
  aiSynthesis: string
  date: string
  tags: string[]
  annotationId?: number
  bookId?: number
  isUserNote?: boolean
  hasFlashcard?: boolean
  flashcardId?: number
  sourceType?: 'book' | 'canvas_note'
  noteId?: string | null
  cfi?: string
  themes?: Array<{ id: number; name: string; color?: string | null }>
}

const activeTab = ref<'flashcards' | 'summaries'>('flashcards')
const selectedBookFilter = ref('all')
const selectedSummaryBookFilter = ref('all')
const selectedThemeFilter = ref('all')
const isNewAnnotationModalOpen = ref(false)
const isTogglingFlashcard = ref<number | null>(null)

const streak = useReadingStreak()
const flashcards = useFlashcards()
const {
  annotations: userAnnotations,
  loading: annotationsLoading,
  fetchAnnotations,
  deleteAnnotation,
  toggleAnnotationFlashcard,
  checkFlashcardStatus,
  convertAnnotationToFlashcard
} = useAnnotations()
const { userBooks, fetchUserBooks } = useUserBooks()

const currentCardIndex = ref(0)
const isFlipped = ref(false)

const displayCards = computed<FlashcardItem[]>(() => {
  return flashcards.dailyDeck.value
})

const bookTitlesMap = computed(() => {
  const map = new Map<number, string>()
  for (const b of userBooks.value) {
    if (b.bookId && b.title) {
      map.set(Number(b.bookId), b.title)
    }
  }
  return map
})

const availableBooks = computed(() => {
  const map = new Map<string, { title: string; ids: Set<string>; count: number }>()
  for (const c of displayCards.value) {
    const title = c.bookTitle?.trim() || (c.bookId ? bookTitlesMap.value.get(Number(c.bookId)) : null) || (c.bookId ? `Livro #${c.bookId}` : 'Sem título')
    if (!map.has(title)) {
      map.set(title, { title, ids: new Set(), count: 0 })
    }
    const entry = map.get(title)!
    if (c.bookId) entry.ids.add(String(c.bookId))
    entry.count++
  }
  for (const a of userAnnotations.value) {
    const title = a.bookTitle?.trim() || (a.bookId ? bookTitlesMap.value.get(Number(a.bookId)) : null) || (a.bookId ? `Livro #${a.bookId}` : 'Sem título')
    if (!map.has(title)) {
      map.set(title, { title, ids: new Set(), count: 0 })
    }
    const entry = map.get(title)!
    if (a.bookId) entry.ids.add(String(a.bookId))
  }
  return Array.from(map.values())
})

const bookFilterOptions = computed(() => {
  const options: { value: string; label: string; count?: number }[] = [
    {
      value: 'all',
      label: 'Todas as Obras',
      count: displayCards.value.length
    }
  ]

  for (const b of availableBooks.value) {
    const primaryId = Array.from(b.ids)[0] || b.title
    const cardCount = displayCards.value.filter((c) => {
      const title = c.bookTitle?.trim() || (c.bookId ? bookTitlesMap.value.get(Number(c.bookId)) : null) || (c.bookId ? `Livro #${c.bookId}` : '')
      return title === b.title || (c.bookId && b.ids.has(String(c.bookId)))
    }).length

    options.push({
      value: primaryId,
      label: b.title,
      count: cardCount > 0 ? cardCount : undefined
    })
  }
  return options
})

const filteredCards = computed(() => {
  if (selectedBookFilter.value === 'all') return displayCards.value
  const group = availableBooks.value.find((b) => b.title === selectedBookFilter.value || b.ids.has(selectedBookFilter.value))
  return displayCards.value.filter((c) => {
    const title = c.bookTitle?.trim() || (c.bookId ? bookTitlesMap.value.get(Number(c.bookId)) : null) || (c.bookId ? `Livro #${c.bookId}` : '')
    if (group) {
      return group.title === title || (c.bookId && group.ids.has(String(c.bookId)))
    }
    return title === selectedBookFilter.value || (c.bookId && String(c.bookId) === selectedBookFilter.value)
  })
})

const currentCard = computed(() => filteredCards.value[currentCardIndex.value] || null)

const formatCardType = (cardType?: string) => {
  switch (cardType) {
    case 'REAL_SITUATION':
      return 'Situação Real'
    case 'CONCEPT_UNION':
      return 'União de Conceitos'
    default:
      return 'Relembração de Conceito'
  }
}

const getSourceUrl = (card: FlashcardItem | null) => {
  if (!card) return null
  if (card.sourceUrl) return card.sourceUrl
  if (card.noteId) return `/canvas?tab=notes&noteId=${card.noteId}`
  if (card.bookId) return `/reader?bookId=${card.bookId}`
  return null
}

const userSummaries = computed<AnnotationSummary[]>(() => {
  return userAnnotations.value.map((a) => {
    let dateStr = ''
    try {
      if (a.createdAt) {
        const d = new Date(a.createdAt)
        dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      }
    } catch {
      dateStr = a.createdAt || ''
    }

    const isNote = a.sourceType === 'canvas_note' || Boolean(a.noteId) || a.cfi?.startsWith('note:')
    const noteId = a.noteId || (a.cfi?.startsWith('note:') ? a.cfi.replace(/^note:/, '') : null)
    const title = a.bookTitle || (isNote ? 'Nota no Canvas' : (bookTitlesMap.value.get(Number(a.bookId)) || `Livro #${a.bookId}`))
    const chapter = a.chapterTitle || (isNote ? 'Trecho da Nota' : 'Anotação de Leitura')
    const quote = a.selectedText?.trim() || ''
    const noteText = a.note?.trim() || ''

    let topic = isNote ? 'Trecho de Nota' : 'Anotação de Leitura'
    if (noteText) {
      topic = noteText.length > 70 ? `${noteText.slice(0, 67)}...` : noteText
    } else if (quote) {
      topic = quote.length > 70 ? `${quote.slice(0, 67)}...` : quote
    } else if (a.chapterTitle) {
      topic = a.chapterTitle
    }

    const synthesis = noteText || (quote ? 'Destaque registrado durante a leitura.' : '')

    const tags = a.themes && a.themes.length > 0
      ? a.themes.map((t) => t.name)
      : [isNote ? 'Notas' : 'Leitura']

    return {
      id: `annotation-${a.id}`,
      bookTitle: title,
      chapter,
      topic,
      highlightQuote: quote || (!quote && noteText ? noteText : ''),
      aiSynthesis: synthesis,
      date: dateStr,
      tags,
      annotationId: a.id,
      bookId: a.bookId,
      isUserNote: true,
      hasFlashcard: Boolean(a.hasFlashcard || a.flashcardId),
      flashcardId: a.flashcardId,
      sourceType: isNote ? ('canvas_note' as const) : ('book' as const),
      noteId,
      cfi: a.cfi,
      themes: a.themes || []
    }
  })
})

const summaries = computed<AnnotationSummary[]>(() => {
  return userSummaries.value
})

const allUniqueThemes = computed(() => {
  const map = new Map<string, { id: string; name: string }>()
  for (const a of userAnnotations.value) {
    if (a.themes && a.themes.length > 0) {
      for (const t of a.themes) {
        if (!map.has(t.name)) {
          map.set(t.name, { id: t.name, name: t.name })
        }
      }
    }
  }
  return Array.from(map.values())
})

const availableSummaryBooks = computed(() => {
  const map = new Map<string, { title: string; ids: Set<string>; count: number }>()
  for (const s of summaries.value) {
    const title = s.bookTitle?.trim() || (s.bookId ? `Livro #${s.bookId}` : 'Sem título')
    if (!map.has(title)) {
      map.set(title, { title, ids: new Set(), count: 0 })
    }
    const entry = map.get(title)!
    if (s.bookId) {
      entry.ids.add(String(s.bookId))
    }
    entry.count++
  }
  return Array.from(map.values())
})

const summaryBookFilterOptions = computed(() => {
  const options: { value: string; label: string; count?: number }[] = [
    {
      value: 'all',
      label: 'Todas as Obras',
      count: summaries.value.length
    }
  ]

  for (const b of availableSummaryBooks.value) {
    const primaryId = Array.from(b.ids)[0] || b.title
    options.push({
      value: primaryId,
      label: b.title,
      count: b.count > 0 ? b.count : undefined
    })
  }
  return options
})

const depthOptions = [
  { value: 'standard', label: 'Padrão Equilibrado (~4 páginas, 1 Mermaid)' },
  { value: 'quick_summary', label: 'Resumo Rápido (~2 páginas)' },
  { value: 'deep_dive', label: 'Aprofundamento Completo (~6 páginas, 2 Mermaids)' }
]

const bookletOptions = computed(() => {
  return didactic.booklets.value.map((b) => ({
    value: b.book_id,
    label: `${b.title} (${b.chapters?.length || 1} capítulos)`
  }))
})

const filteredSummaries = computed(() => {
  let list = summaries.value
  if (selectedSummaryBookFilter.value !== 'all') {
    const group = availableSummaryBooks.value.find((b) => b.title === selectedSummaryBookFilter.value || b.ids.has(selectedSummaryBookFilter.value))
    list = list.filter((s) => {
      const title = s.bookTitle?.trim() || (s.bookId ? `Livro #${s.bookId}` : '')
      const idKey = s.bookId ? String(s.bookId) : ''
      if (group) {
        return group.title === title || (idKey && group.ids.has(idKey))
      }
      return title === selectedSummaryBookFilter.value || idKey === selectedSummaryBookFilter.value
    })
  }
  if (selectedThemeFilter.value !== 'all') {
    if (selectedThemeFilter.value === 'no_theme') {
      list = list.filter((s) => !s.themes || s.themes.length === 0)
    } else {
      list = list.filter((s) => s.themes && s.themes.some((t) => t.name === selectedThemeFilter.value))
    }
  }
  return list
})

const groupedSummariesByTheme = computed(() => {
  const groups: { themeName: string; items: AnnotationSummary[] }[] = []
  const themeMap = new Map<string, AnnotationSummary[]>()
  const noThemeList: AnnotationSummary[] = []

  for (const s of filteredSummaries.value) {
    if (s.themes && s.themes.length > 0) {
      for (const t of s.themes) {
        if (!themeMap.has(t.name)) {
          themeMap.set(t.name, [])
        }
        themeMap.get(t.name)!.push(s)
      }
    } else {
      noThemeList.push(s)
    }
  }

  for (const [name, items] of themeMap.entries()) {
    const uniqueItems = items.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    groups.push({ themeName: name, items: uniqueItems })
  }

  if (noThemeList.length > 0) {
    groups.push({ themeName: 'Sem Tema', items: noThemeList })
  }

  return groups
})

const handleToggleFlashcard = async (summary: AnnotationSummary) => {
  if (!summary.annotationId) return
  isTogglingFlashcard.value = summary.annotationId
  try {
    await toggleAnnotationFlashcard(summary.annotationId)
    await flashcards.fetchDailyDeck()
  } catch (err) {
    console.error('Erro ao alternar status do flashcard:', err)
  } finally {
    isTogglingFlashcard.value = null
  }
}

const handleNewAnnotationCreated = async () => {
  await fetchAnnotations()
  await flashcards.fetchDailyDeck()
}

onMounted(async () => {
  try {
    await Promise.allSettled([
      flashcards.fetchDailyDeck(),
      fetchAnnotations(),
      fetchUserBooks()
    ])
  } catch (e) {
    // Fallback gracioso
  }
})

const removeAnnotation = async (id: number) => {
  try {
    await deleteAnnotation(id)
  } catch (err) {
    console.error('Erro ao excluir anotação:', err)
  }
}

const nextCard = () => {
  if (currentCardIndex.value < filteredCards.value.length - 1) {
    isFlipped.value = false
    currentCardIndex.value++
  }
}

const prevCard = () => {
  if (currentCardIndex.value > 0) {
    isFlipped.value = false
    currentCardIndex.value--
  }
}

const rateCurrentCard = async (rating: 'hard' | 'good' | 'easy') => {
  if (!currentCard.value) return

  try {
    if (flashcards.dailyDeck.value.length > 0) {
      await flashcards.reviewFlashcard(currentCard.value.id, rating)
    } else {
      void streak.recordFlashcardReview(1)
    }
  } catch (err) {
    console.error('Erro ao avaliar flashcard:', err)
  }

  if (currentCardIndex.value < filteredCards.value.length - 1) {
    nextCard()
  } else {
    isFlipped.value = false
  }
}

const createCardFromSummary = async (summary: AnnotationSummary) => {
  if (summary.annotationId) {
    try {
      await convertAnnotationToFlashcard(
        summary.annotationId,
        `Qual a importância de "${summary.topic}"?`,
        summary.aiSynthesis
      )
      await flashcards.fetchDailyDeck()
    } catch (e) {
      console.warn('Erro ao criar flashcard da anotação:', e)
    }
  }
  selectedBookFilter.value = 'all'
  activeTab.value = 'flashcards'
  currentCardIndex.value = Math.max(0, filteredCards.value.length - 1)
}

const router = useRouter()
const didactic = useDidacticBooklet()
const isDidacticModalOpen = ref(false)
const didacticError = ref<string | null>(null)
const selectedBookletMode = ref<'new' | 'append'>('new')
const selectedTargetBookletId = ref<number | null>(null)
const selectedDepth = ref<'quick_summary' | 'standard' | 'deep_dive'>('standard')

const openDidacticModal = async () => {
  didacticError.value = null
  isDidacticModalOpen.value = true
  await didactic.fetchBooklets()
  if (didactic.booklets.value.length > 0 && !selectedTargetBookletId.value) {
    selectedTargetBookletId.value = didactic.booklets.value[0]?.book_id ?? null
  }
}

const generateDidacticBooklet = async () => {
  if (!currentCard.value) return
  didacticError.value = null

  const topic = currentCard.value.question
  const title = `Didático: ${currentCard.value.question.slice(0, 45)}...`

  try {
    if (selectedBookletMode.value === 'append' && selectedTargetBookletId.value) {
      const result = await didactic.appendChapter(selectedTargetBookletId.value, {
        topic,
        flashcard_id: currentCard.value.id,
        depth_level: selectedDepth.value,
      })
      isDidacticModalOpen.value = false
      const bookId = result.book?.id || selectedTargetBookletId.value
      await router.push(`/reader?bookId=${bookId}`)
    } else {
      const result = await didactic.createBooklet({
        title,
        topic,
        flashcard_id: currentCard.value.id,
        depth_level: selectedDepth.value,
      })
      isDidacticModalOpen.value = false
      if (result.book?.id) {
        await router.push(`/reader?bookId=${result.book.id}`)
      }
    }
  } catch (err: any) {
    console.error('Erro ao gerar livro didático com IA:', err)
    didacticError.value =
      err.message ||
      'Não foi possível gerar a explicação com Inteligência Artificial no momento. Por favor, tente novamente em instantes.'
  }
}
</script>

<style scoped>
.card-scene {
  perspective: 1200px;
}

.card-object {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-object.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
</style>
