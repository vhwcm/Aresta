<template>
  <footer
    class="reader-bottom-bar border-t md:border-t-0 md:border-r px-3 py-2 sm:px-4 sm:py-2.5 md:px-2 md:py-3.5 flex flex-row md:flex-col items-center justify-between z-20 shrink-0 gap-2 md:gap-3 order-last md:order-first w-full md:w-16 md:h-full select-none transition-colors duration-200"
    :class="{
      'bg-[#f5eedc] border-[#dfd5c0] text-[#2a2521]': store.readerTheme === 'sepia',
      'bg-white border-gray-200 text-gray-900': store.readerTheme === 'white',
      'bg-[#121315] border-divider text-textPrimary': store.readerTheme === 'black' || !store.readerTheme,
    }"
    role="toolbar"
    aria-label="Barra de ferramentas do leitor"
  >
    <!-- Grupo 1: Sair da Leitura & Progresso (Mobile: Esquerda | Tablet/Desktop: Topo) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0 md:w-full">
      <!-- Botão Sair -->
      <button
        @click="$emit('close')"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border text-xs font-semibold transition-all active:scale-95 group"
        :class="store.readerTheme === 'sepia'
          ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
          : (store.readerTheme === 'white'
            ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
            : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10')"
        aria-label="Sair da leitura"
        id="btn-close-book"
        title="Sair da leitura"
      >
        <ArrowLeftIcon class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span class="hidden xs:inline md:hidden">Sair</span>
      </button>

      <!-- Indicador de Progresso e Página -->
      <div
        class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:py-2 md:px-0.5 rounded-xl border text-xs font-semibold text-center"
        :class="store.readerTheme === 'sepia'
          ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c]'
          : (store.readerTheme === 'white'
            ? 'bg-gray-100 border-gray-200 text-gray-700'
            : 'bg-white/5 border-divider text-textSecondary')"
        :title="`Progresso da leitura: ${store.progressPercentage}% (${pageDisplay})`"
        aria-label="Progresso da leitura"
      >
        <span class="text-accent font-bold font-technical text-xs md:text-[11px] leading-tight">
          {{ store.progressPercentage }}%
        </span>
        <span
          class="hidden sm:inline md:inline text-[11px] md:text-[9px] font-technical leading-tight"
          :class="store.readerTheme === 'sepia' ? 'text-[#786C5E]' : (store.readerTheme === 'white' ? 'text-gray-500' : 'text-textSecondary/60')"
        >
          <span class="md:hidden">({{ pageDisplay }})</span>
          <span class="hidden md:inline font-mono">{{ pageDisplayShort }}</span>
        </span>
      </div>
    </div>

    <!-- Divisor sutil em telas tablet/desktop -->
    <div
      class="hidden md:block w-7 h-px shrink-0"
      :class="store.readerTheme === 'sepia' ? 'bg-[#dfd5c0]' : (store.readerTheme === 'white' ? 'bg-gray-200' : 'bg-divider/60')"
    ></div>

    <!-- Grupo 2: Ação de Anotação, Configurações de Leitura & Modos (Mobile: Centro | Tablet/Desktop: Centro) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5">
      <!-- Botão Anotar -->
      <button
        @click="$emit('openAnnotation')"
        class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-3 py-1.5 sm:px-4 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md active:scale-95 group"
        title="Criar anotação nesta página"
        aria-label="Criar anotação"
      >
        <HighlighterIcon class="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span class="text-xs md:hidden">Anotar</span>
      </button>

      <!-- Botão Aparência & Configurações de Leitura (Fundo, Tipografia, Folhas e Largura) -->
      <div class="relative" ref="appearanceWrapperRef">
        <button
          @click="isAppearancePopoverOpen = !isAppearancePopoverOpen"
          class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95 group relative"
          :class="isAppearancePopoverOpen
            ? 'bg-accent/20 border-accent text-accent shadow-sm'
            : (store.readerTheme === 'sepia'
              ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
              : (store.readerTheme === 'white'
                ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
                : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
          title="Aparência e configurações de leitura (Tema, tipografia, páginas e layout)"
          aria-label="Aparência de leitura"
          id="btn-appearance-toggle"
        >
          <!-- Ícone com indicador de cor do tema -->
          <div class="relative">
            <PaletteIcon class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span
              class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black/40 shadow-xs"
              :class="{
                'bg-[#f5eedc]': store.readerTheme === 'sepia',
                'bg-[#ffffff]': store.readerTheme === 'white',
                'bg-[#121214]': store.readerTheme === 'black'
              }"
            />
          </div>
          <span class="text-xs md:text-[9px] font-technical font-medium leading-tight">
            {{ store.readerTheme === 'sepia' ? 'Livro' : (store.readerTheme === 'white' ? 'Branco' : 'Preto') }}
          </span>
        </button>

        <!-- Popover Flutuante de Aparência & Configurações de Leitura (Mobile: Centralizado acima da barra | Desktop: Abre para a direita) -->
        <div
          v-if="isAppearancePopoverOpen"
          class="fixed bottom-16 left-1/2 -translate-x-1/2 w-[92vw] max-w-[320px] md:absolute md:left-full md:top-1/2 md:translate-x-0 md:-translate-y-1/2 md:bottom-auto md:w-72 border rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3.5 animate-fadeIn"
          :class="{
            'bg-[#f5eedc] border-[#dfd5c0] text-[#2a2521]': store.readerTheme === 'sepia',
            'bg-white border-gray-200 text-gray-900': store.readerTheme === 'white',
            'bg-[#18181b] border-white/10 text-[#f2f2f2]': store.readerTheme === 'black' || !store.readerTheme,
          }"
          role="dialog"
          aria-label="Controle de aparência e fundo de leitura"
        >
          <!-- Seção de Fundo / Tema de Leitura -->
          <div class="flex flex-col gap-2">
            <span
              class="text-[11px] font-technical uppercase tracking-wider font-semibold"
              :class="store.readerTheme === 'sepia' ? 'text-[#786C5E]' : (store.readerTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
            >
              Fundo da Leitura
            </span>
            <div class="grid grid-cols-3 gap-1.5">
              <!-- Amarelado (Livro) -->
              <button
                @click="store.setReaderTheme('sepia')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'sepia'
                  ? 'bg-amber-400/25 border-amber-600 text-amber-950 shadow-sm font-bold'
                  : (store.readerTheme === 'white'
                    ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-textSecondary hover:text-textPrimary')"
                title="Fundo amarelado suave estilo livro físico"
              >
                <div class="w-5 h-5 rounded-full border border-amber-600/30 bg-[#f5eedc] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'sepia'" class="w-3 h-3 text-amber-950 stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Amarelado</span>
                <span class="text-[9px] opacity-70">Livro</span>
              </button>

              <!-- Branco -->
              <button
                @click="store.setReaderTheme('white')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'white'
                  ? 'bg-accent/15 border-accent text-accent shadow-sm font-bold'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-textSecondary hover:text-textPrimary')"
                title="Fundo branco claro"
              >
                <div class="w-5 h-5 rounded-full border border-slate-300 bg-[#ffffff] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'white'" class="w-3 h-3 text-slate-800 stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Branco</span>
                <span class="text-[9px] opacity-70">Clássico</span>
              </button>

              <!-- Preto -->
              <button
                @click="store.setReaderTheme('black')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'black'
                  ? 'bg-white/20 border-accent text-white shadow-sm font-bold'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : (store.readerTheme === 'white'
                      ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-textSecondary hover:text-textPrimary'))"
                title="Fundo preto noturno"
              >
                <div class="w-5 h-5 rounded-full border border-white/30 bg-[#121214] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'black'" class="w-3 h-3 text-white stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Preto</span>
                <span class="text-[9px] opacity-70">Noturno</span>
              </button>
            </div>
          </div>

          <!-- Seção de Diagramação e Largura de Leitura -->
          <div
            class="flex flex-col gap-2 pt-2 border-t"
            :class="store.readerTheme === 'sepia' ? 'border-[#dfd5c0]' : (store.readerTheme === 'white' ? 'border-gray-200' : 'border-white/10')"
          >
            <span
              class="text-[11px] font-technical uppercase tracking-wider font-semibold"
              :class="store.readerTheme === 'sepia' ? 'text-[#786C5E]' : (store.readerTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
            >
              Distribuição e Largura
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <!-- 1 Folha vs 2 Folhas -->
              <button
                @click="store.setTwoPageMode(false)"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="!store.isTwoPageMode
                  ? 'bg-accent/20 border-accent text-accent font-bold shadow-sm'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : (store.readerTheme === 'white'
                      ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
                title="Exibir 1 folha (página única)"
              >
                <FileTextIcon class="w-3.5 h-3.5" />
                <span>1 Folha</span>
              </button>

              <button
                @click="store.setTwoPageMode(true)"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.isTwoPageMode
                  ? 'bg-accent/20 border-accent text-accent font-bold shadow-sm'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : (store.readerTheme === 'white'
                      ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
                title="Exibir 2 folhas lado a lado"
              >
                <BookOpenIcon class="w-3.5 h-3.5" />
                <span>2 Folhas</span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-1.5">
              <!-- Centralizado vs 100% Largo -->
              <button
                @click="store.setReaderWidthMode('centered')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readerWidthMode === 'centered'
                  ? 'bg-accent/20 border-accent text-accent font-bold shadow-sm'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : (store.readerTheme === 'white'
                      ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
                title="Página centralizada no meio com margens clássicas"
              >
                <Minimize2Icon class="w-3.5 h-3.5" />
                <span>Centralizado</span>
              </button>

              <button
                @click="store.setReaderWidthMode('wide')"
                class="flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all"
                :class="store.readerWidthMode === 'wide'
                  ? 'bg-accent/20 border-accent text-accent font-bold shadow-sm'
                  : (store.readerTheme === 'sepia'
                    ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:bg-[#ebe0c8] hover:text-[#2a2521]'
                    : (store.readerTheme === 'white'
                      ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
                title="Páginas ocupam quase 100% do espaço de leitura"
              >
                <Maximize2Icon class="w-3.5 h-3.5" />
                <span>100% Largo</span>
              </button>
            </div>
          </div>

          <!-- Seção de Tamanho de Texto e Fonte (Apenas EPUB) -->
          <div
            v-if="store.documentType === 'epub'"
            class="flex flex-col gap-2 pt-2 border-t"
            :class="store.readerTheme === 'sepia' ? 'border-[#dfd5c0]' : (store.readerTheme === 'white' ? 'border-gray-200' : 'border-white/10')"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-[11px] font-technical uppercase tracking-wider font-semibold"
                :class="store.readerTheme === 'sepia' ? 'text-[#786C5E]' : (store.readerTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
              >
                Tamanho da Fonte
              </span>
              <button
                @click="store.resetFontSize()"
                class="text-[10px] text-accent hover:underline font-technical font-bold"
                title="Redefinir para 18px"
              >
                Padrão
              </button>
            </div>

            <!-- Controles A- e A+ -->
            <div
              class="flex items-center justify-between gap-2 rounded-xl p-1.5 border"
              :class="store.readerTheme === 'sepia'
                ? 'bg-[#f0e7d3] border-[#dfd5c0]'
                : (store.readerTheme === 'white'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white/5 border-white/10')"
            >
              <button
                @click="store.decreaseFontSize(2)"
                :disabled="store.fontSize <= 12"
                class="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-sm font-semibold transition-all active:scale-95"
                :class="store.readerTheme === 'sepia'
                  ? 'bg-[#ebe0c8] text-[#2a2521] hover:bg-[#dfd5c0]'
                  : (store.readerTheme === 'white'
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    : 'bg-white/10 hover:bg-white/20 text-textPrimary')"
                title="Diminuir tamanho da fonte"
                aria-label="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <span
                class="font-technical font-bold text-sm px-2"
                :class="store.readerTheme === 'sepia' ? 'text-[#2a2521]' : (store.readerTheme === 'white' ? 'text-gray-900' : 'text-textPrimary')"
              >
                {{ store.fontSize }} px
              </span>
              <button
                @click="store.increaseFontSize(2)"
                :disabled="store.fontSize >= 36"
                class="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-base font-semibold transition-all active:scale-95"
                :class="store.readerTheme === 'sepia'
                  ? 'bg-[#ebe0c8] text-[#2a2521] hover:bg-[#dfd5c0]'
                  : (store.readerTheme === 'white'
                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    : 'bg-white/10 hover:bg-white/20 text-textPrimary')"
                title="Aumentar tamanho da fonte"
                aria-label="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>

            <!-- Botão Mais Tipografia -->
            <button
              @click="$emit('openTypography'); isAppearancePopoverOpen = false"
              class="w-full py-1.5 px-2 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all mt-1 font-medium"
              :class="store.readerTheme === 'sepia'
                ? 'bg-[#f0e7d3] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#ebe0c8]'
                : (store.readerTheme === 'white'
                  ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-textSecondary hover:text-textPrimary')"
            >
              <TypeIcon class="w-3.5 h-3.5 text-accent" />
              <span>Mais Fontes & Tipografia</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Botão Rápido de Ajuste de Tamanho da Fonte (A- / A+) (Apenas Desktop/Tablet) -->
      <div
        v-if="store.documentType === 'epub'"
        class="hidden md:flex md:flex-col items-center justify-center rounded-xl border p-0.5"
        :class="store.readerTheme === 'sepia'
          ? 'bg-[#f5eedc] border-[#dfd5c0]'
          : (store.readerTheme === 'white'
            ? 'bg-gray-100 border-gray-200'
            : 'bg-white/5 border-divider')"
        title="Ajustar tamanho da fonte diretamente na leitura"
      >
        <button
          @click="store.increaseFontSize(2)"
          :disabled="store.fontSize >= 36"
          class="w-6 h-6 md:w-10 md:h-5 flex items-center justify-center rounded-lg text-xs font-bold hover:bg-accent/20 hover:text-accent transition-all active:scale-95 disabled:opacity-30"
          title="Aumentar tamanho da fonte (A+)"
          aria-label="Aumentar fonte"
          id="btn-quick-font-increase"
        >
          A+
        </button>
        <span
          class="text-[10px] md:text-[8px] font-technical font-bold px-1 select-none"
          :class="store.readerTheme === 'sepia' ? 'text-[#786C5E]' : (store.readerTheme === 'white' ? 'text-gray-500' : 'text-textSecondary')"
        >
          {{ store.fontSize }}
        </span>
        <button
          @click="store.decreaseFontSize(2)"
          :disabled="store.fontSize <= 12"
          class="w-6 h-6 md:w-10 md:h-5 flex items-center justify-center rounded-lg text-[11px] md:text-[10px] font-bold hover:bg-accent/20 hover:text-accent transition-all active:scale-95 disabled:opacity-30"
          title="Diminuir tamanho da fonte (A-)"
          aria-label="Diminuir fonte"
          id="btn-quick-font-decrease"
        >
          A-
        </button>
      </div>

      <!-- Botão Alternar 1 Folha / 2 Folhas (Desktop/Tablet) -->
      <button
        v-if="store.totalPages > 1"
        @click="store.toggleTwoPageMode()"
        class="hidden md:flex flex-col items-center justify-center md:w-11 md:h-11 rounded-xl border text-xs font-semibold transition-all active:scale-95 group"
        :class="store.isTwoPageMode
          ? 'bg-accent/15 border-accent text-accent shadow-sm'
          : (store.readerTheme === 'sepia'
            ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
            : (store.readerTheme === 'white'
              ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
              : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
        :title="store.isTwoPageMode ? 'Modo 2 Folhas ativo (Clique para 1 Folha)' : 'Modo 1 Folha ativo (Clique para 2 Folhas)'"
        aria-label="Alternar modo de páginas"
        id="btn-toggle-two-page"
      >
        <BookOpenIcon v-if="store.isTwoPageMode" class="w-4 h-4 text-accent" />
        <FileTextIcon v-else class="w-4 h-4 text-textSecondary group-hover:text-textPrimary" />
        <span class="text-[8px] font-technical font-medium leading-none mt-0.5">
          {{ store.isTwoPageMode ? '2 Folhas' : '1 Folha' }}
        </span>
      </button>

      <!-- Botão Alternar Largura: Centralizado vs 100% Largo (Desktop/Tablet) -->
      <button
        @click="store.toggleReaderWidthMode()"
        class="hidden md:flex flex-col items-center justify-center md:w-11 md:h-11 rounded-xl border text-xs font-semibold transition-all active:scale-95 group"
        :class="store.readerWidthMode === 'wide'
          ? 'bg-accent/15 border-accent text-accent shadow-sm'
          : (store.readerTheme === 'sepia'
            ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
            : (store.readerTheme === 'white'
              ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
              : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
        :title="store.readerWidthMode === 'wide' ? 'Modo 100% Largo ativo (Clique para Modo Centralizado)' : 'Modo Centralizado ativo (Clique para 100% Largo)'"
        aria-label="Alternar largura de leitura"
        id="btn-toggle-width-mode"
      >
        <Maximize2Icon v-if="store.readerWidthMode === 'wide'" class="w-4 h-4 text-accent" />
        <Minimize2Icon v-else class="w-4 h-4 text-textSecondary group-hover:text-textPrimary" />
        <span class="text-[8px] font-technical font-medium leading-none mt-0.5">
          {{ store.readerWidthMode === 'wide' ? '100% Largo' : 'Centro' }}
        </span>
      </button>
    </div>

    <!-- Divisor sutil em telas tablet/desktop -->
    <div
      class="hidden md:block w-7 h-px shrink-0"
      :class="store.readerTheme === 'sepia' ? 'bg-[#dfd5c0]' : (store.readerTheme === 'white' ? 'bg-gray-200' : 'bg-divider/60')"
    ></div>

    <!-- Grupo 3: Marcação de Página, Páginas Salvas, Grafo & Zen (Mobile: Direita | Tablet/Desktop: Base) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
      <!-- Botão Marcar Página -->
      <button
        @click="store.toggleBookmark()"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95"
        :class="store.isCurrentPageBookmarked
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
          : (store.readerTheme === 'sepia'
            ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
            : (store.readerTheme === 'white'
              ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
              : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
        :title="store.isCurrentPageBookmarked ? 'Página marcada (clique para desmarcar)' : 'Marcar esta página'"
        aria-label="Marcar ou desmarcar página atual"
      >
        <BookmarkIcon
          class="w-4 h-4 transition-transform active:scale-125"
          :class="{ 'fill-current text-amber-500': store.isCurrentPageBookmarked }"
        />
        <span class="hidden md:hidden">
          {{ store.isCurrentPageBookmarked ? 'Marcada' : 'Marcar' }}
        </span>
      </button>

      <!-- Botão Ver Páginas Salvas -->
      <button
        @click="$emit('openSavedPages')"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border text-xs font-semibold transition-all relative active:scale-95"
        :class="store.readerTheme === 'sepia'
          ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
          : (store.readerTheme === 'white'
            ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
            : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10')"
        title="Ver páginas salvas"
        aria-label="Abrir lista de páginas salvas"
      >
        <BookmarkCheckIcon class="w-4 h-4 text-accent" />
        <span class="hidden lg:hidden">Salvas</span>
        <span
          v-if="store.savedPages.length > 0"
          class="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] text-center text-[9px] rounded-full bg-accent text-white font-bold font-technical shadow-sm"
        >
          {{ store.savedPages.length }}
        </span>
      </button>

      <!-- Botão Notas do Livro -->
      <button
        @click="handleToggleNotes"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95"
        :class="isNotesActiveComputed
          ? 'bg-accent text-white border-accent shadow-sm'
          : (store.readerTheme === 'sepia'
            ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
            : (store.readerTheme === 'white'
              ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
              : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'))"
        :title="isNotesActiveComputed ? 'Recolher notas do livro' : 'Ver notas deste livro'"
        aria-label="Abrir ou fechar notas do livro"
        id="btn-book-notes"
      >
        <FileTextIcon class="w-4 h-4" :class="isNotesActiveComputed ? 'text-white' : 'text-accent'" />
        <span class="hidden sm:inline md:hidden">Notas</span>
      </button>

      <!-- Botão Modo Zen (Foco) -->
      <button
        @click="store.toggleZenMode()"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border text-xs font-semibold transition-all active:scale-95 group"
        :class="store.readerTheme === 'sepia'
          ? 'bg-[#f5eedc] border-[#dfd5c0] text-[#5c4d3c] hover:text-[#2a2521] hover:bg-[#EBE2CE]'
          : (store.readerTheme === 'white'
            ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200'
            : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10')"
        title="Entrar no Modo Zen / Foco (Pressione Esc, Z ou Voltar para sair)"
        aria-label="Entrar no Modo Zen"
        id="btn-zen-mode"
      >
        <Maximize2Icon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
        <span class="hidden sm:inline md:hidden">Zen</span>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  ArrowLeftIcon,
  BookmarkIcon,
  BookmarkCheckIcon,
  BookOpenIcon,
  CheckIcon,
  FileTextIcon,
  HighlighterIcon,
  Maximize2Icon,
  Minimize2Icon,
  PaletteIcon,
  TypeIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

const props = defineProps<{
  isNotesActive?: boolean
  isGraphActive?: boolean
}>()

const emit = defineEmits<{
  (_e: 'close'): void
  (_e: 'openSavedPages'): void
  (_e: 'openAnnotation'): void
  (_e: 'toggleNotes'): void
  (_e: 'toggleGraph'): void
  (_e: 'openTypography'): void
}>()

const isNotesActiveComputed = computed(() => {
  if (typeof props.isNotesActive === 'boolean') return props.isNotesActive
  return Boolean(props.isGraphActive)
})

function handleToggleNotes() {
  emit('toggleNotes')
  emit('toggleGraph')
}

const store = useReaderStore()
const isAppearancePopoverOpen = ref(false)
const appearanceWrapperRef = ref<HTMLElement | null>(null)

const pageDisplay = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = Math.min(leftNum + 1, store.totalPages)
    return leftNum === rightNum
      ? `${leftNum}/${store.totalPages}`
      : `${leftNum}-${rightNum}/${store.totalPages}`
  }
  return `${store.currentPage}/${store.totalPages}`
})

const pageDisplayShort = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = Math.min(leftNum + 1, store.totalPages)
    return leftNum === rightNum ? `${leftNum}` : `${leftNum}-${rightNum}`
  }
  return `${store.currentPage}/${store.totalPages}`
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
  if (event.key === 'Escape' && isAppearancePopoverOpen.value) {
    isAppearancePopoverOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.reader-bottom-bar {
  min-height: 52px;
}

@media (min-width: 768px) {
  .reader-bottom-bar {
    min-height: 100%;
  }
}
</style>
