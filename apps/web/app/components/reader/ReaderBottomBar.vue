<template>
  <!-- 1. Layout Lateral Esquerdo no Desktop / Telas Horizontais -->
  <aside
    v-if="isHorizontalComputed"
    class="reader-lateral-bar reader-bottom-bar shrink-0 h-full select-none transition-all duration-300 flex flex-col items-start justify-center pl-0 pr-2 py-3 sm:py-4 z-20 pointer-events-auto bg-transparent border-0 gap-3.5 sm:gap-4"
    role="toolbar"
    aria-label="Barra lateral do leitor"
    id="reader-unified-bar"
  >
    <!-- Capa do Livro Alinhada com os Botões de Controle -->
    <div class="shrink-0 flex flex-col items-start justify-center select-none pl-2 sm:pl-3">
      <img
        v-if="bookCoverUrl"
        :src="bookCoverUrl"
        :alt="store.title"
        class="w-[96px] sm:w-[104px] max-h-[155px] aspect-[2/3] object-cover block rounded-[6px] shadow-sm"
        :title="store.title"
      />
      <div
        v-else
        class="w-[96px] sm:w-[104px] aspect-[2/3] flex flex-col items-center justify-center p-2 text-center bg-accent/10 text-accent font-editorial rounded-[6px] shadow-sm"
      >
        <BookOpenIcon class="w-7 h-7 sm:w-8 sm:h-8 opacity-80 mb-1" />
        <span class="text-[11px] font-editorial line-clamp-2 opacity-70 leading-tight">{{ store.title || 'Livro' }}</span>
      </div>
    </div>

    <!-- Bloco de 6 Ícones Maiores LOGO EMBAIXO da Capa (2 Colunas x 3 Linhas) -->
    <div class="grid grid-rows-3 grid-cols-2 gap-2 sm:gap-2.5 shrink-0 select-none pl-2 sm:pl-3">
      <!-- 1. Linha 1 / Col 1 (1º Ícone): Anotações do Livro -->
      <button
        @click="handleToggleNotes"
        class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
        :class="isNotesActiveComputed ? 'text-accent font-bold bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
        :title="isNotesActiveComputed ? 'Ocultar anotações do livro' : 'Abrir anotações e reflexões deste livro'"
        aria-label="Abrir ou fechar notas do livro"
        id="btn-view-notes"
      >
        <HighlighterIcon class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
      </button>

      <!-- 2. Linha 1 / Col 2: Configurações de Leitura (Popover de Aparência) -->
      <div class="relative flex items-center justify-center" ref="appearanceWrapperRef">
        <button
          @click="isAppearancePopoverOpen = !isAppearancePopoverOpen"
          class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 relative flex items-center justify-center cursor-pointer"
          :class="isAppearancePopoverOpen ? 'text-accent bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
          title="Configurações de leitura, páginas e modos"
          aria-label="Configurações de leitura"
          id="btn-appearance-toggle"
        >
          <SettingsIcon class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
        </button>

        <!-- Popover Flutuante de Configurações (Abre ao lado da barra lateral no Desktop, centralizado verticalmente) -->
        <div
          v-if="isAppearancePopoverOpen"
          class="fixed top-1/2 -translate-y-1/2 left-[128px] sm:left-[138px] md:left-[148px] w-[92vw] max-w-[340px] rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto border animate-fadeIn"
          :class="themePopoverClass"
          role="dialog"
          aria-label="Controle de aparência e fundo de leitura"
        >
          <!-- Seção 1: Quantidade de Páginas e Percentual Lido -->
          <div
            class="flex items-center justify-between p-3 rounded-xl border select-none transition-colors"
            :class="themeBorderClass"
          >
            <div class="flex flex-col">
              <span class="text-[10px] font-technical uppercase tracking-wider font-semibold" :class="themeSubtextClass">
                Páginas do Livro
              </span>
              <span class="text-sm font-technical font-bold text-accent">
                Pág. {{ pageDisplay }}
              </span>
            </div>
            <span
              v-if="store.totalPages > 0"
              class="px-2.5 py-1 rounded-full text-xs font-technical font-semibold bg-accent/15 text-accent"
            >
              {{ progressPercentageComputed }}%
            </span>
          </div>

          <!-- Seção 2: Fundo da Leitura -->
          <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
            <span
              class="text-[11px] font-technical uppercase tracking-wider font-semibold"
              :class="themeSubtextClass"
            >
              Fundo da Leitura
            </span>
            <div class="grid grid-cols-3 gap-1.5">
              <!-- Amarelado -->
              <button
                @click="store.setReaderTheme('sepia')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                :class="store.readerTheme === 'sepia'
                  ? 'bg-amber-400/20 border-amber-600 text-amber-950 font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                title="Fundo amarelado suave estilo livro físico"
              >
                <div class="w-4 h-4 rounded-full border border-amber-600/30 bg-[#f5eedc] mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'sepia'" class="w-2.5 h-2.5 text-amber-950 stroke-[3]" />
                </div>
                <span class="text-[11px]">Livro</span>
              </button>

              <!-- Branco -->
              <button
                @click="store.setReaderTheme('white')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                :class="store.readerTheme === 'white'
                  ? 'bg-accent/15 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                title="Fundo branco claro"
              >
                <div class="w-4 h-4 rounded-full border border-slate-300 bg-[#ffffff] mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'white'" class="w-2.5 h-2.5 text-slate-800 stroke-[3]" />
                </div>
                <span class="text-[11px]">Branco</span>
              </button>

              <!-- Preto -->
              <button
                @click="store.setReaderTheme('black')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                :class="store.readerTheme === 'black'
                  ? 'bg-white/20 border-accent text-white font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                title="Fundo preto noturno"
              >
                <div class="w-4 h-4 rounded-full border border-white/30 bg-[#000000] mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'black'" class="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
                <span class="text-[11px]">Preto</span>
              </button>
            </div>
          </div>

          <!-- Seção 3: Modo de Leitura (Páginas vs Scroll) -->
          <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
            <span
              class="text-[11px] font-technical uppercase tracking-wider font-semibold"
              :class="themeSubtextClass"
            >
              Modo de Leitura
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="store.setReadingMode('paginated')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readingMode !== 'scroll'
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-mode-paginated"
              >
                <BookOpenIcon class="w-3.5 h-3.5" />
                <span>Páginas</span>
              </button>

              <button
                @click="store.setReadingMode('scroll')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readingMode === 'scroll'
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-mode-scroll"
              >
                <ScrollTextIcon class="w-3.5 h-3.5" />
                <span>Scroll</span>
              </button>
            </div>
          </div>

          <!-- Seção 4: Distribuição de Folhas & Largura -->
          <div
            v-if="store.readingMode !== 'scroll' || store.documentType === 'epub'"
            class="flex flex-col gap-2 pt-2 border-t"
            :class="themeBorderClass"
          >
            <span
              class="text-[11px] font-technical uppercase tracking-wider font-semibold"
              :class="themeSubtextClass"
            >
              Distribuição de Folhas
            </span>
            <div v-if="store.readingMode !== 'scroll'" class="grid grid-cols-2 gap-1.5">
              <button
                @click="store.setTwoPageMode(false)"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="!store.isTwoPageMode
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-set-one-page"
              >
                <FileTextIcon class="w-3.5 h-3.5" />
                <span>1 Folha</span>
              </button>

              <button
                @click="store.setTwoPageMode(true)"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.isTwoPageMode
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-set-two-page"
              >
                <BookOpenIcon class="w-3.5 h-3.5" />
                <span>2 Folhas</span>
              </button>
            </div>

            <!-- Centralizado vs 100% Largo (EPUB) -->
            <div v-if="store.documentType === 'epub'" class="grid grid-cols-2 gap-1.5 mt-1">
              <button
                @click="store.setReaderWidthMode('centered')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readerWidthMode === 'centered'
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-width-centered"
              >
                <Minimize2Icon class="w-3.5 h-3.5" />
                <span>Centralizado</span>
              </button>

              <button
                @click="store.setReaderWidthMode('wide')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readerWidthMode === 'wide'
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-width-wide"
              >
                <Maximize2Icon class="w-3.5 h-3.5" />
                <span>Largo</span>
              </button>
            </div>
          </div>

          <!-- Seção 5: Tamanho da Fonte -->
          <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
            <div class="flex items-center justify-between">
              <span
                class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                :class="themeSubtextClass"
              >
                Tamanho da Fonte
              </span>
              <span class="text-[11px] font-technical font-mono font-semibold" :class="themeTextClass">
                {{ store.fontSize || 15 }}px
              </span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="store.decreaseFontSize(2)"
                :disabled="(store.fontSize || 15) <= 12"
                class="flex items-center justify-center gap-1 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
                :class="'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-decrease-font-size"
              >
                <MinusIcon class="w-3.5 h-3.5" />
                <span>A-</span>
              </button>

              <button
                @click="store.increaseFontSize(2)"
                :disabled="(store.fontSize || 15) >= 36"
                class="flex items-center justify-center gap-1 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
                :class="'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-increase-font-size"
              >
                <PlusIcon class="w-3.5 h-3.5" />
                <span>A+</span>
              </button>
            </div>
          </div>

          <!-- Seção 6: Modo Foco (X Linhas) -->
          <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
            <div class="flex items-center justify-between">
              <span
                class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                :class="themeSubtextClass"
              >
                Modo Foco
              </span>
              <button
                @click="store.toggleFocusMode()"
                class="flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all cursor-pointer select-none active:scale-95"
                :class="store.isFocusMode
                  ? 'bg-accent/20 border-accent text-accent font-semibold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                id="btn-toggle-focus-inside-popover"
              >
                <span class="text-[10px] font-semibold">
                  {{ store.isFocusMode ? 'Ativo' : 'Inativo' }}
                </span>
              </button>
            </div>

            <div class="grid grid-cols-5 gap-1">
              <button
                v-for="count in [1, 2, 3, 4, 5]"
                :key="'focus-lines-' + count"
                @click="store.setFocusLineCount(count); if (!store.isFocusMode) store.toggleFocusMode()"
                class="flex items-center justify-center py-1 rounded-lg border text-xs font-technical font-semibold transition-all cursor-pointer active:scale-95"
                :class="store.focusLineCount === count && store.isFocusMode
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
              >
                {{ count }}L
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Linha 2 / Col 1: Diminuir Tamanho da Fonte (Zoom Out) -->
      <button
        @click="store.decreaseFontSize(2)"
        :disabled="(store.fontSize || 15) <= 12"
        class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        :class="themeButtonClass"
        :title="'Diminuir tamanho da fonte (' + (store.fontSize || 15) + 'px)'"
        aria-label="Diminuir tamanho da fonte"
        id="btn-font-decrease"
      >
        <AArrowDownIcon class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
      </button>

      <!-- 4. Linha 2 / Col 2: Aumentar Tamanho da Fonte (Zoom In) -->
      <button
        @click="store.increaseFontSize(2)"
        :disabled="(store.fontSize || 15) >= 36"
        class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        :class="themeButtonClass"
        :title="'Aumentar tamanho da fonte (' + (store.fontSize || 15) + 'px)'"
        aria-label="Aumentar tamanho da fonte"
        id="btn-font-increase"
      >
        <AArrowUpIcon class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
      </button>

      <!-- 5. Linha 3 / Col 1 (Mais de baixo): Voltar à Biblioteca -->
      <button
        @click="$emit('close')"
        class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
        :class="themeButtonClass"
        title="Voltar à biblioteca"
        aria-label="Voltar à biblioteca"
        id="btn-close-book"
      >
        <ArrowLeftIcon class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
      </button>

      <!-- 6. Linha 3 / Col 2 (Mais de baixo): Alternar Modo Zen -->
      <button
        @click="$emit('toggleZenMode')"
        class="p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
        :class="isZenMode ? 'text-accent font-bold bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
        :title="isZenMode ? 'Sair do Modo Zen' : 'Entrar no Modo Zen'"
        :aria-label="isZenMode ? 'Sair do Modo Zen' : 'Entrar no Modo Zen'"
        id="btn-bottom-zen-mode"
      >
        <Minimize2Icon v-if="isZenMode" class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
        <Maximize2Icon v-else class="w-7 h-7 sm:w-7.5 sm:h-7.5 stroke-[1.85]" />
      </button>
    </div>
  </aside>

  <!-- 2. Layout Inferior no Mobile / Telas Verticais -->
  <footer
    v-else
    class="reader-unified-bottom-bar reader-bottom-bar shrink-0 w-full select-none transition-all duration-300 flex items-end overflow-visible bg-transparent border-0 pointer-events-none"
    role="toolbar"
    aria-label="Barra de ferramentas do leitor"
    id="reader-unified-bar"
  >
    <!-- Container Alinhado Colado na Esquerda com Capa Pequena e Botões de Baixo da Capa -->
    <div
      class="pointer-events-auto flex flex-col items-start gap-1.5 sm:gap-2 pb-2 sm:pb-3 overflow-visible select-none"
      :style="bottomBarContainerStyle"
    >
      <!-- 1. Capa do Livro Pequena e Colada na Esquerda -->
      <div
        class="shrink-0 flex items-center justify-start select-none"
      >
        <img
          v-if="bookCoverUrl"
          :src="bookCoverUrl"
          :alt="store.title"
          class="h-[105px] sm:h-[120px] w-auto max-w-[85px] sm:max-w-[95px] object-contain block rounded-[6px] shadow-sm"
          :title="store.title"
        />
        <div
          v-else
          class="h-[105px] sm:h-[120px] w-[75px] sm:w-[85px] aspect-[2/3] flex flex-col items-center justify-center p-2 text-center bg-accent/10 text-accent font-editorial rounded-[6px] shadow-sm"
        >
          <BookOpenIcon class="w-6 h-6 opacity-80" />
        </div>
      </div>

      <!-- 2. Bloco Harmonioso de 6 Ícones Soltos (De baixo da capa!) -->
      <div class="grid grid-rows-2 grid-cols-3 gap-1 sm:gap-1.5 shrink-0 select-none">
        <!-- 1. Linha Superior / Col 1: Voltar à Biblioteca -->
        <button
          @click="$emit('close')"
          class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
          :class="themeButtonClass"
          title="Voltar à biblioteca"
          aria-label="Voltar à biblioteca"
          id="btn-close-book"
        >
          <ArrowLeftIcon class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
        </button>

        <!-- 2. Linha Superior / Col 2: Diminuir Tamanho da Fonte (Zoom Out) -->
        <button
          @click="store.decreaseFontSize(2)"
          :disabled="(store.fontSize || 15) <= 12"
          class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          :class="themeButtonClass"
          :title="'Diminuir tamanho da fonte (' + (store.fontSize || 15) + 'px)'"
          aria-label="Diminuir tamanho da fonte"
          id="btn-font-decrease"
        >
          <AArrowDownIcon class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
        </button>

        <!-- 3. Linha Superior / Col 3: Aumentar Tamanho da Fonte (Zoom In) -->
        <button
          @click="store.increaseFontSize(2)"
          :disabled="(store.fontSize || 15) >= 36"
          class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          :class="themeButtonClass"
          :title="'Aumentar tamanho da fonte (' + (store.fontSize || 15) + 'px)'"
          aria-label="Aumentar tamanho da fonte"
          id="btn-font-increase"
        >
          <AArrowUpIcon class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
        </button>

        <!-- 4. Linha Inferior / Col 1: Alternar Modo Zen -->
        <button
          @click="$emit('toggleZenMode')"
          class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
          :class="isZenMode ? 'text-accent font-bold bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
          :title="isZenMode ? 'Sair do Modo Zen' : 'Entrar no Modo Zen'"
          :aria-label="isZenMode ? 'Sair do Modo Zen' : 'Entrar no Modo Zen'"
          id="btn-bottom-zen-mode"
        >
          <Minimize2Icon v-if="isZenMode" class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
          <Maximize2Icon v-else class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
        </button>

        <!-- 5. Linha Inferior / Col 2: Anotações do Livro -->
        <button
          @click="handleToggleNotes"
          class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
          :class="isNotesActiveComputed ? 'text-accent font-bold bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
          :title="isNotesActiveComputed ? 'Ocultar anotações do livro' : 'Abrir anotações e reflexões deste livro'"
          aria-label="Abrir ou fechar notas do livro"
          id="btn-view-notes"
        >
          <HighlighterIcon class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
        </button>

        <!-- 6. Linha Inferior / Col 3: Configurações de Leitura -->
        <div class="relative flex items-center justify-center" ref="appearanceWrapperRef">
          <button
            @click="isAppearancePopoverOpen = !isAppearancePopoverOpen"
            class="p-2 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-90 relative flex items-center justify-center cursor-pointer"
            :class="isAppearancePopoverOpen ? 'text-accent bg-accent/15 ring-1 ring-accent/30' : themeButtonClass"
            title="Configurações de leitura, páginas e modos"
            aria-label="Configurações de leitura"
            id="btn-appearance-toggle"
          >
            <SettingsIcon class="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
          </button>

          <!-- Popover Flutuante de Configurações (Abre acima da barra centralizado no mobile) -->
          <div
            v-if="isAppearancePopoverOpen"
            class="fixed bottom-[22dvh] left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 w-[92vw] max-w-[340px] rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto border animate-fadeIn"
            :class="themePopoverClass"
            role="dialog"
            aria-label="Controle de aparência e fundo de leitura"
          >
            <!-- Seção 1: Quantidade de Páginas e Percentual Lido -->
            <div
              class="flex items-center justify-between p-3 rounded-xl border select-none transition-colors"
              :class="themeBorderClass"
            >
              <div class="flex flex-col">
                <span class="text-[10px] font-technical uppercase tracking-wider font-semibold" :class="themeSubtextClass">
                  Páginas do Livro
                </span>
                <span class="text-sm font-technical font-bold text-accent">
                  Pág. {{ pageDisplay }}
                </span>
              </div>
              <span
                v-if="store.totalPages > 0"
                class="px-2.5 py-1 rounded-full text-xs font-technical font-semibold bg-accent/15 text-accent"
              >
                {{ progressPercentageComputed }}%
              </span>
            </div>

            <!-- Seção 2: Fundo da Leitura -->
            <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
              <span
                class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                :class="themeSubtextClass"
              >
                Fundo da Leitura
              </span>
              <div class="grid grid-cols-3 gap-1.5">
                <!-- Amarelado -->
                <button
                  @click="store.setReaderTheme('sepia')"
                  class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                  :class="store.readerTheme === 'sepia'
                    ? 'bg-amber-400/20 border-amber-600 text-amber-950 font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  title="Fundo amarelado suave estilo livro físico"
                >
                  <div class="w-4 h-4 rounded-full border border-amber-600/30 bg-[#f5eedc] mb-1 flex items-center justify-center">
                    <CheckIcon v-if="store.readerTheme === 'sepia'" class="w-2.5 h-2.5 text-amber-950 stroke-[3]" />
                  </div>
                  <span class="text-[11px]">Livro</span>
                </button>

                <!-- Branco -->
                <button
                  @click="store.setReaderTheme('white')"
                  class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                  :class="store.readerTheme === 'white'
                    ? 'bg-accent/15 border-accent text-accent font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  title="Fundo branco claro"
                >
                  <div class="w-4 h-4 rounded-full border border-slate-300 bg-[#ffffff] mb-1 flex items-center justify-center">
                    <CheckIcon v-if="store.readerTheme === 'white'" class="w-2.5 h-2.5 text-slate-800 stroke-[3]" />
                  </div>
                  <span class="text-[11px]">Branco</span>
                </button>

                <!-- Preto -->
                <button
                  @click="store.setReaderTheme('black')"
                  class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center"
                  :class="store.readerTheme === 'black'
                    ? 'bg-white/20 border-accent text-white font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  title="Fundo preto noturno"
                >
                  <div class="w-4 h-4 rounded-full border border-white/30 bg-[#000000] mb-1 flex items-center justify-center">
                    <CheckIcon v-if="store.readerTheme === 'black'" class="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                  <span class="text-[11px]">Preto</span>
                </button>
              </div>
            </div>

            <!-- Seção 3: Modo de Leitura (Páginas vs Scroll) -->
            <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
              <span
                class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                :class="themeSubtextClass"
              >
                Modo de Leitura
              </span>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="store.setReadingMode('paginated')"
                  class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                  :class="store.readingMode !== 'scroll'
                    ? 'bg-accent/20 border-accent text-accent font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  id="btn-mode-paginated"
                >
                  <BookOpenIcon class="w-3.5 h-3.5" />
                  <span>Páginas</span>
                </button>

                <button
                  @click="store.setReadingMode('scroll')"
                  class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                  :class="store.readingMode === 'scroll'
                    ? 'bg-accent/20 border-accent text-accent font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  id="btn-mode-scroll"
                >
                  <ScrollTextIcon class="w-3.5 h-3.5" />
                  <span>Scroll</span>
                </button>
              </div>
            </div>

            <!-- Seção 4: Tamanho da Fonte -->
            <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
              <div class="flex items-center justify-between">
                <span
                  class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                  :class="themeSubtextClass"
                >
                  Tamanho da Fonte
                </span>
                <span class="text-[11px] font-technical font-mono font-semibold" :class="themeTextClass">
                  {{ store.fontSize || 15 }}px
                </span>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="store.decreaseFontSize(2)"
                  :disabled="(store.fontSize || 15) <= 12"
                  class="flex items-center justify-center gap-1 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
                  :class="'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  id="btn-decrease-font-size"
                >
                  <MinusIcon class="w-3.5 h-3.5" />
                  <span>A-</span>
                </button>

                <button
                  @click="store.increaseFontSize(2)"
                  :disabled="(store.fontSize || 15) >= 36"
                  class="flex items-center justify-center gap-1 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
                  :class="'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  id="btn-increase-font-size"
                >
                  <PlusIcon class="w-3.5 h-3.5" />
                  <span>A+</span>
                </button>
              </div>
            </div>

            <!-- Seção 6: Modo Foco (X Linhas) -->
            <div class="flex flex-col gap-2 pt-2 border-t" :class="themeBorderClass">
              <div class="flex items-center justify-between">
                <span
                  class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                  :class="themeSubtextClass"
                >
                  Modo Foco
                </span>
                <button
                  @click="store.toggleFocusMode()"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all cursor-pointer select-none active:scale-95"
                  :class="store.isFocusMode
                    ? 'bg-accent/20 border-accent text-accent font-semibold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                  id="btn-toggle-focus-inside-popover"
                >
                  <span class="text-[10px] font-semibold">
                    {{ store.isFocusMode ? 'Ativo' : 'Inativo' }}
                  </span>
                </button>
              </div>

              <div class="grid grid-cols-5 gap-1">
                <button
                  v-for="count in [1, 2, 3, 4, 5]"
                  :key="'focus-lines-' + count"
                  @click="store.setFocusLineCount(count); if (!store.isFocusMode) store.toggleFocusMode()"
                  class="flex items-center justify-center py-1 rounded-lg border text-xs font-technical font-semibold transition-all cursor-pointer active:scale-95"
                  :class="store.focusLineCount === count && store.isFocusMode
                    ? 'bg-accent/20 border-accent text-accent font-bold'
                    : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
                >
                  {{ count }}L
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  AArrowDownIcon,
  AArrowUpIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  HighlighterIcon,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PlusIcon,
  ScrollTextIcon,
  SettingsIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

const props = defineProps<{
  isNotesActive?: boolean
  isZenMode?: boolean
  isHorizontal?: unknown
  coverUrl?: string
  bookLeft?: number
  bookWidth?: number
}>()

const emit = defineEmits<{
  (_e: 'close'): void
  (_e: 'toggleZenMode'): void
  (_e: 'openSavedPages'): void
  (_e: 'openAnnotation'): void
  (_e: 'toggleNotes'): void
}>()

const store = useReaderStore()
const bookCoverUrl = computed(() => props.coverUrl || store.coverUrl || '')
const isAppearancePopoverOpen = ref(false)
const appearanceWrapperRef = ref<HTMLElement | null>(null)

const isMobileScreen = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
function checkScreenSize() {
  if (typeof window !== 'undefined') {
    isMobileScreen.value = window.innerWidth < 768
  }
}

const isHorizontalComputed = computed(() => {
  if (typeof props.isHorizontal === 'boolean') {
    return props.isHorizontal
  }
  const isMobile = isMobileScreen.value || (typeof window !== 'undefined' && window.innerWidth < 768)
  return !isMobile
})

const bottomBarContainerStyle = computed(() => {
  // Mobile / Telas verticais: extrema esquerda com respiro suave de 8px
  return {
    paddingLeft: '8px',
    justifyContent: 'flex-start',
  }
})

const isNotesActiveComputed = computed(() => {
  return Boolean(props.isNotesActive)
})

function handleToggleNotes() {
  emit('toggleNotes')
}

// Progresso e Exibição de Páginas
const pageDisplay = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = Math.min(leftNum + 1, store.totalPages)
    return leftNum === rightNum
      ? `${leftNum}/${store.totalPages}`
      : `${leftNum}-${rightNum}/${store.totalPages}`
  }
  return store.totalPages > 0 ? `${store.currentPage}/${store.totalPages}` : `${store.currentPage}`
})

const progressPercentageComputed = computed(() => {
  if (!store.document || store.totalPages <= 0) return 0
  return Math.round((store.currentPage / store.totalPages) * 100)
})

// Classes de Tema e Botões Soltos (sem blur e sem fundo na barra)
const themeButtonClass = computed(() => {
  if (store.readerTheme === 'sepia') {
    return 'text-[#5a4e44] hover:text-[#2a2521] hover:bg-black/5 active:bg-black/10'
  }
  if (store.readerTheme === 'white') {
    return 'text-gray-600 hover:text-gray-900 hover:bg-black/5 active:bg-black/10'
  }
  return 'text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15'
})

const themeBorderClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'border-[#dfd5c0]'
  if (store.readerTheme === 'white') return 'border-gray-200'
  return 'border-white/10'
})

const themeTextClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'text-[#2a2521]'
  if (store.readerTheme === 'white') return 'text-gray-900'
  return 'text-white'
})

const themeSubtextClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'text-[#786C5E]'
  if (store.readerTheme === 'white') return 'text-gray-500'
  return 'text-textSecondary'
})

const themePopoverClass = computed(() => {
  if (store.readerTheme === 'sepia') {
    return 'bg-[#FAF5E8] border-[#dfd5c0] text-[#2a2521]'
  }
  if (store.readerTheme === 'white') {
    return 'bg-white border-gray-200 text-gray-900'
  }
  return 'bg-[#0d0d10] border-white/10 text-[#f2f2f2]'
})

function handleClickOutside(event: MouseEvent) {
  if (
    isAppearancePopoverOpen.value &&
    appearanceWrapperRef.value &&
    !appearanceWrapperRef.value.contains(event.target as Node)
  ) {
    isAppearancePopoverOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isAppearancePopoverOpen.value) {
      isAppearancePopoverOpen.value = false
    }
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize)
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.reader-unified-bottom-bar {
  height: 20dvh;
  min-height: 105px;
  max-height: 20dvh;
}

.reader-lateral-bar {
  width: 116px;
  min-width: 116px;
  max-width: 116px;
  height: 100%;
}
</style>
