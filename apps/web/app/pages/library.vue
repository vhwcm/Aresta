<template>
  <div class="flex flex-col gap-6 sm:gap-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header: Title, Tags Filter and Actions -->
    <header class="flex flex-col gap-3.5 sm:gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <!-- Lado Esquerdo: Título Estante + Tags de Temas ao lado -->
        <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
          <div class="flex items-center gap-2 shrink-0">
            <BookIcon class="w-4 h-4 text-accent" />
            <h1 class="font-technical text-xs uppercase font-bold tracking-widest text-textSecondary">
              Estante
            </h1>
          </div>

          <!-- Divisor vertical no desktop quando houver conteúdo -->
          <div v-if="availableThemes.length > 0 || userBooks.length > 0" class="hidden sm:block h-3.5 w-px bg-divider"></div>

          <!-- Tags de Temas no Desktop (ao lado da palavra Estante) -->
          <div class="hidden sm:flex items-center gap-1.5 flex-wrap">
            <button
              @click="selectedThemeId = null"
              class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 shrink-0"
              :class="selectedThemeId === null ? 'bg-textPrimary text-bgApp font-bold shadow-sm' : 'bg-white/5 text-textSecondary hover:text-textPrimary border border-divider'"
            >
              <span>Todos os Temas</span>
              <span class="text-[10px] opacity-70">({{ userBooks.length }})</span>
            </button>

            <button
              v-for="theme in availableThemes"
              :key="theme.id"
              @click="toggleThemeFilter(theme)"
              class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border shrink-0"
              :style="isThemeSelected(theme) ? {
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
              <span class="text-[10px] opacity-70">({{ countByTheme(theme) }})</span>
            </button>
          </div>

          <!-- No Mobile: Tags ao lado da palavra Estante -->
          <div class="flex sm:hidden items-center gap-1.5 min-w-0 flex-1 justify-start">
            <!-- Quando cabe em uma linha (até 1 tema) -->
            <template v-if="availableThemes.length <= 1">
              <button
                @click="selectedThemeId = null"
                class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 shrink-0"
                :class="selectedThemeId === null ? 'bg-textPrimary text-bgApp font-bold shadow-sm' : 'bg-white/5 text-textSecondary hover:text-textPrimary border border-divider'"
              >
                <span>Todos os Temas</span>
                <span class="text-[10px] opacity-70">({{ userBooks.length }})</span>
              </button>

              <button
                v-for="theme in availableThemes"
                :key="theme.id"
                @click="toggleThemeFilter(theme)"
                class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border shrink-0"
                :style="isThemeSelected(theme) ? {
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
                <span class="text-[10px] opacity-70">({{ countByTheme(theme) }})</span>
              </button>
            </template>

            <!-- Quando não couber mais em uma linha (> 1 tema): exibe tag selecionada/todos + botão de lista que colapsa para baixo -->
            <template v-else>
              <button
                v-if="selectedThemeId === null"
                @click="isMobileThemeListOpen = !isMobileThemeListOpen"
                class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 bg-textPrimary text-bgApp font-bold shadow-sm shrink-0 truncate max-w-[130px]"
              >
                <span class="truncate">Todos os Temas</span>
                <span class="text-[10px] opacity-70">({{ userBooks.length }})</span>
              </button>

              <button
                v-else-if="selectedTheme"
                @click="selectedThemeId = null"
                class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border shrink-0 truncate max-w-[130px]"
                :style="{
                  backgroundColor: (selectedTheme.color || '#E57B55'),
                  borderColor: (selectedTheme.color || '#E57B55'),
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px ' + (selectedTheme.color || '#E57B55') + '40'
                }"
                title="Clique para desmarcar tema"
              >
                <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-white"></span>
                <span class="truncate font-medium">{{ selectedTheme.name }}</span>
                <XIcon class="w-3 h-3 shrink-0 ml-0.5" />
              </button>

              <button
                @click="isMobileThemeListOpen = !isMobileThemeListOpen"
                data-testid="toggle-mobile-themes-btn"
                class="px-2 py-1 rounded-xl border border-divider bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary flex items-center gap-1 text-[11px] font-technical transition-all shrink-0"
                :class="{ 'bg-white/10 text-accent border-accent/40': isMobileThemeListOpen }"
                :title="isMobileThemeListOpen ? 'Fechar temas' : 'Abrir temas'"
              >
                <span>{{ availableThemes.length }} temas</span>
                <ChevronDownIcon
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="{ 'rotate-180': isMobileThemeListOpen }"
                />
              </button>
            </template>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            @click="isManageThemesModalOpen = true"
            data-testid="manage-themes-btn"
            class="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-textSecondary hover:text-white border border-divider text-xs font-interface font-semibold transition-all flex items-center justify-center gap-2"
            title="Gerenciar e Editar Temas da Estante"
          >
            <TagIcon class="w-4 h-4 shrink-0" />
            <span>Gerenciar Temas</span>
          </button>

          <button
            @click="isCreateDidacticModalOpen = true"
            class="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-interface font-semibold transition-all flex items-center justify-center gap-2"
            title="Criar Novo Livreto Didático com IA"
          >
            <SparklesIcon class="w-4 h-4 shrink-0" />
            <span>Novo Livreto IA</span>
          </button>

          <NuxtLink
            to="/upload"
            class="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-accent/20 hover:bg-accent text-accent hover:text-white border border-accent/40 text-xs font-interface font-semibold transition-all flex items-center justify-center gap-2"
            title="Fazer Upload de Livro"
          >
            <UploadIcon class="w-4 h-4 shrink-0" />
            <span>Enviar Arquivo</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Lista que colapsa para baixo no mobile quando não couber em uma linha -->
      <div
        v-if="isMobileThemeListOpen && availableThemes.length > 1"
        data-testid="mobile-themes-dropdown"
        class="sm:hidden flex flex-col gap-2 p-3 bg-white/[0.03] border border-divider rounded-2xl animate-in slide-in-from-top-2 fade-in duration-200"
      >
        <div class="flex items-center justify-between pb-1 border-b border-divider/40">
          <span class="text-[11px] font-technical uppercase font-bold text-textSecondary">Filtrar por Tema</span>
          <button
            @click="isMobileThemeListOpen = false"
            class="text-[11px] font-technical text-accent hover:underline"
          >
            Fechar
          </button>
        </div>

        <div class="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
          <button
            @click="selectedThemeId = null; isMobileThemeListOpen = false"
            class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 shrink-0"
            :class="selectedThemeId === null ? 'bg-textPrimary text-bgApp font-bold shadow-sm' : 'bg-white/5 text-textSecondary hover:text-textPrimary border border-divider'"
          >
            <span>Todos os Temas</span>
            <span class="text-[10px] opacity-70">({{ userBooks.length }})</span>
          </button>

          <button
            v-for="theme in availableThemes"
            :key="theme.id"
            @click="toggleThemeFilter(theme); isMobileThemeListOpen = false"
            class="px-2.5 py-1 rounded-xl text-xs font-technical transition-all flex items-center gap-1.5 border shrink-0"
            :style="isThemeSelected(theme) ? {
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
            <span class="text-[10px] opacity-70">({{ countByTheme(theme) }})</span>
          </button>
        </div>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Estante Pessoal do Usuário Logado -->
    <section class="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500">

      <!-- Lista da Estante em Grade Responsiva -->
      <div v-if="filteredUserBooks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
        <div
          v-for="item in filteredUserBooks"
          :key="item.userBookId"
          @click="openReader(item)"
          data-testid="user-book-card"
          class="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-divider hover:border-accent/40 rounded-2xl p-4 sm:p-4.5 lg:p-5 transition-all duration-300 flex items-center gap-3.5 sm:gap-4 lg:gap-4.5 shadow-lg hover:shadow-xl cursor-pointer"
          :title="`Clique para abrir ${item.title} no leitor`"
        >
          <!-- Capa do Livro (clique abre o leitor) -->
          <div
            class="w-16 h-24 sm:w-18 sm:h-26 lg:w-20 lg:h-28 shrink-0 rounded-xl border border-divider overflow-hidden bg-white/5 shadow-md flex items-center justify-center group-hover:scale-105 group-hover:border-accent/40 transition-all duration-300"
          >
            <img
              v-if="resolveBookCover(item)"
              :src="resolveBookCover(item)"
              class="w-full h-full object-cover"
              :alt="item.title"
            />
            <BookOpenIcon v-else class="w-6 h-6 sm:w-7 sm:h-7 text-textSecondary" />
          </div>

          <!-- Conteúdo -->
          <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-2 sm:gap-2.5">
            <div class="flex flex-col gap-1.5 min-w-0">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <h3
                  class="font-editorial text-base sm:text-lg lg:text-xl font-light text-textPrimary group-hover:text-accent transition-colors line-clamp-1 break-words"
                  :title="item.title"
                >
                  {{ item.title }}
                </h3>
                <!-- Badge IA Didático se aplicável (não exibe EPUB ou PDF) -->
                <span
                  v-if="getBookFormat(item.filePath) === 'DIDACTIC'"
                  class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-technical uppercase font-bold tracking-wider shrink-0 shadow-sm text-purple-400 bg-purple-500/10 border border-purple-500/30"
                >
                  IA DIDÁTICO
                </span>
              </div>

              <!-- Tags / Temas do Livro -->
              <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                <span
                  v-for="theme in (item.themes || [])"
                  :key="theme.id"
                  @click.stop="toggleThemeFilter(theme)"
                  class="cursor-pointer text-[10px] font-technical uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 border transition-all hover:scale-105 shrink-0"
                  :style="{
                    borderColor: (theme.color || '#E57B55') + (isThemeSelected(theme) ? 'CC' : '60'),
                    backgroundColor: (theme.color || '#E57B55') + (isThemeSelected(theme) ? '35' : '18'),
                    color: theme.color || '#E57B55',
                    boxShadow: isThemeSelected(theme) ? '0 0 8px ' + (theme.color || '#E57B55') + '40' : 'none'
                  }"
                  :title="`Filtrar estante por '${theme.name}'`"
                >
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
                  <span class="truncate max-w-[100px] sm:max-w-[120px]">{{ theme.name }}</span>
                </span>

                <!-- Botão de Editar / Adicionar Tags -->
                <button
                  @click.stop="openTagModal(item)"
                  class="text-[10px] font-technical text-textSecondary hover:text-accent border border-dashed border-divider hover:border-accent px-2 py-0.5 rounded-md flex items-center gap-1 transition-all bg-white/5 hover:bg-accent/10 shrink-0"
                  title="Vincular ou gerenciar nós do mapa mental neste livro"
                >
                  <TagIcon class="w-3 h-3" />
                  <span>{{ (item.themes && item.themes.length > 0) ? 'Editar Temas' : '+ Adicionar Tema' }}</span>
                </button>
              </div>
            </div>

            <!-- Progresso de Leitura (Porcentagem Não Editável) -->
            <div class="flex items-center gap-2.5 text-xs font-technical text-textSecondary">
              <div class="w-16 sm:w-20 md:w-24 h-1.5 rounded-full bg-white/10 overflow-hidden shrink-0">
                <div
                  class="h-full bg-accent transition-all duration-300 rounded-full"
                  :style="{ width: `${getBookProgress(item)}%` }"
                ></div>
              </div>
              <span class="font-medium shrink-0">{{ getBookProgress(item) }}%</span>
            </div>
          </div>

          <!-- Ações à Direita -->
          <div class="shrink-0 flex items-center gap-1 sm:gap-1.5">
            <button
              @click.stop="promptDeleteBook(item)"
              data-testid="delete-book-btn"
              class="p-2 sm:p-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remover da Estante"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
            <ChevronRightIcon class="w-4 h-4 sm:w-5 sm:h-5 text-textSecondary/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </div>
        </div>
      </div>

      <!-- Estado Vazio -->
      <div v-else class="text-center py-16 border border-dashed border-divider rounded-3xl flex flex-col items-center gap-4">
        <LibraryIcon class="w-10 h-10 text-textSecondary/40" />
        <h3 class="font-editorial text-2xl text-textPrimary font-light">
          {{ userBooks.length === 0 ? 'Comece uma leitura' : 'Sua estante está vazia nesta categoria' }}
        </h3>
        <p class="text-xs sm:text-sm text-textSecondary font-interface max-w-sm">
          {{ userBooks.length === 0
            ? 'Você ainda não possui nenhum livro na sua estante. Faça upload do seu primeiro arquivo (EPUB ou PDF) para começar sua jornada.'
            : 'Ajuste os filtros de temas para visualizar outras obras da sua estante.'
          }}
        </p>
        <div class="flex items-center gap-3 mt-2">
          <NuxtLink
            to="/upload"
            data-testid="start-reading-btn"
            class="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <UploadIcon class="w-4 h-4" />
            <span>Comece uma leitura</span>
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
              @click="toggleModalTheme(theme)"
              class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200"
              :class="isModalThemeSelected(theme)
                ? 'border-accent bg-accent/15 shadow-sm'
                : 'border-divider bg-white/5 hover:border-divider/80 hover:bg-white/10'"
            >
              <div class="flex items-center gap-2.5 truncate">
                <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: theme.color || '#E57B55' }"></span>
                <span class="text-xs font-interface font-medium truncate">{{ theme.name }}</span>
              </div>
              <CheckIcon
                class="w-4 h-4 shrink-0 transition-opacity"
                :class="isModalThemeSelected(theme) ? 'text-accent opacity-100' : 'opacity-0'"
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
              maxlength="30"
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

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-technical text-textSecondary uppercase">Vincular Tema do Grafo:</label>
            <select
              v-model="newBookletThemeId"
              class="bg-bgApp border border-divider rounded-xl p-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
            >
              <option :value="null">Sem Tema Específico</option>
              <option v-for="node in availableThemes" :key="node.id" :value="getNumericThemeId(node)">
                {{ node.name }}
              </option>
            </select>
          </div>

          <!-- Alerta de Erro de Geração de IA -->
          <div
            v-if="didacticError"
            class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-interface text-red-400 flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircleIcon class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1 leading-relaxed">
              {{ didacticError }}
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

    <!-- Modal de Confirmação de Remoção de Livro -->
    <ConfirmModal
      :is-open="showDeleteBookModal"
      title="Remover Livro da Estante"
      subtitle="Ação Destrutiva"
      :description="deleteBookModalDescription"
      confirm-text="Remover Livro"
      action-type="delete"
      variant="danger"
      :loading="isDeletingBook"
      @confirm="confirmDeleteBook"
      @cancel="cancelDeleteBook"
    >
      <template #extra v-if="bookNotesCount > 0 || bookFlashcardsCount > 0">
        <div
          data-testid="book-notes-warning-box"
          class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2 text-rose-300 text-xs font-interface"
        >
          <div class="flex items-center gap-2 font-medium text-rose-200">
            <AlertTriangleIcon class="w-4 h-4 text-rose-400 shrink-0" />
            <span>Atenção: este livro contém dados vinculados</span>
          </div>
          <p class="text-textSecondary text-xs leading-relaxed">
            Todas as <strong class="text-rose-300">{{ bookNotesCount }} {{ bookNotesCount === 1 ? 'anotação' : 'anotações' }}</strong>
            <template v-if="bookFlashcardsCount > 0">
              e <strong class="text-rose-300">{{ bookFlashcardsCount }} {{ bookFlashcardsCount === 1 ? 'flashcard' : 'flashcards' }}</strong>
            </template>
            gerados a partir desta obra serão <strong class="text-rose-200">excluídos permanentemente</strong> junto com o livro.
          </p>
        </div>
      </template>
    </ConfirmModal>

    <!-- Modal para Gerenciar Temas da Estante -->
    <ManageThemesModal
      :is-open="isManageThemesModalOpen"
      :themes="availableThemes"
      :books-count-by-theme="countByTheme"
      @close="isManageThemesModalOpen = false"
      @theme-created="handleThemeCreated"
      @theme-updated="handleThemeUpdated"
      @theme-deleted="handleThemeDeleted"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BookIcon,
  LibraryIcon,
  PlusIcon,
  PlayIcon,
  CheckCircleIcon,
  TrashIcon,
  Trash2Icon,
  BookOpenIcon,
  LogInIcon,
  UploadIcon,
  TagIcon,
  XIcon,
  CheckIcon,
  SparklesIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  AlertCircleIcon
} from 'lucide-vue-next'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'

import type { UserBookItem } from '~/interfaces/graph'
import { useUserBooks } from '~/composables/useUserBooks'
import { useGraph } from '~/composables/useGraph'
import { useAuth } from '~/composables/useAuth'
import { useAnnotations } from '~/composables/useAnnotations'
import { useFlashcards } from '~/composables/useFlashcards'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'
import { getCoverUrl, getBookFormat, resolveBookCover } from '~/utils/cover'
import { getApiBase } from '~/utils/apiBase'

import ConfirmModal from '~/components/ConfirmModal.vue'
import ManageThemesModal from '~/components/ManageThemesModal.vue'

const auth = useAuth()
const statusFilter = ref('TODOS')
const selectedThemeId = ref<number | string | null>(null)
const isMobileThemeListOpen = ref(false)
const isLoginModalOpen = ref(false)
const isManageThemesModalOpen = ref(false)

const router = useRouter()
const route = useRoute()
const didactic = useDidacticBooklet()
const isCreateDidacticModalOpen = ref(false)
const didacticError = ref<string | null>(null)
const newBookletTitle = ref('')
const newBookletTopic = ref('')
const newBookletThemeId = ref<number | null>(null)
const newBookletParentBookId = ref<number | null>(null)

watch(isCreateDidacticModalOpen, (isOpen) => {
  if (isOpen) {
    didacticError.value = null
  }
})

const handleCreateDidacticBooklet = async () => {
  if (!newBookletTopic.value.trim()) return
  didacticError.value = null
  try {
    const result = await didactic.createBooklet({
      title: newBookletTitle.value.trim() || undefined,
      topic: newBookletTopic.value.trim(),
      theme_id: newBookletThemeId.value || undefined,
      parent_book_id: newBookletParentBookId.value || undefined,
    })
    isCreateDidacticModalOpen.value = false
    newBookletTitle.value = ''
    newBookletTopic.value = ''
    newBookletThemeId.value = null
    newBookletParentBookId.value = null
    didacticError.value = null
    if (auth.isLoggedIn.value) {
      await fetchUserBooks()
    }
    if (result.book?.id) {
      await router.push(`/reader?bookId=${result.book.id}`)
    }
  } catch (err: any) {
    console.error('Erro ao criar livreto didático:', err)
    didacticError.value =
      err.message ||
      'Não foi possível gerar a explicação com Inteligência Artificial no momento. Por favor, tente novamente em instantes.'
  }
}

const tagModalBook = ref<UserBookItem | null>(null)
const selectedThemeIdsForModal = ref<number[]>([])
const showCreateThemeInline = ref(false)
const newThemeName = ref('')
const newThemeColor = ref('#E57B55')
const creatingTheme = ref(false)
const savingThemes = ref(false)

const bookToDelete = ref<UserBookItem | null>(null)
const showDeleteBookModal = ref(false)
const isDeletingBook = ref(false)
const bookNotesCount = ref(0)
const bookFlashcardsCount = ref(0)
const isCheckingBookContents = ref(false)


const deleteBookModalDescription = computed(() => {
  const title = bookToDelete.value?.title || 'este livro'
  if (bookNotesCount.value > 0 || bookFlashcardsCount.value > 0) {
    return `Tem certeza de que deseja remover «${title}» da sua estante? O progresso da leitura, anotações e flashcards vinculados serão removidos permanentemente.`
  }
  return `Tem certeza de que deseja remover «${title}» da sua estante? O progresso da leitura será removido.`
})

const {
  userBooks,
  fetchUserBooks,
  addUserBook,
  updateUserBook,
  setBookThemes,
  recordBookAccess,
  deleteUserBook,
  deleteUserBookByBookId,
  isBookInShelf
} = useUserBooks()
const { graphData, fetchGraph, createNode } = useGraph()

const getNumericThemeId = (themeOrId: any): number => {
  if (themeOrId === null || themeOrId === undefined) return 0
  if (typeof themeOrId === 'object') {
    if (themeOrId.rawId !== undefined && !isNaN(Number(themeOrId.rawId))) {
      return Number(themeOrId.rawId)
    }
    return getNumericThemeId(themeOrId.id)
  }
  if (typeof themeOrId === 'number' && !isNaN(themeOrId)) return themeOrId
  const raw = String(themeOrId).replace(/^theme-/, '')
  const parsed = Number(raw)
  return isNaN(parsed) ? 0 : parsed
}

const getThemeName = (themeOrId: any): string => {
  if (!themeOrId) return ''
  if (typeof themeOrId === 'object' && themeOrId.name) return String(themeOrId.name).trim()
  if (typeof themeOrId === 'string' && isNaN(Number(themeOrId.replace(/^theme-/, '')))) return themeOrId.trim()
  return ''
}

const themeMatches = (themeA: any, themeB: any): boolean => {
  if (!themeA || !themeB) return false

  // 1. Comparação por ID numérico / normalizado
  const numA = getNumericThemeId(themeA)
  const numB = getNumericThemeId(themeB)
  if (numA > 0 && numB > 0 && numA === numB) {
    return true
  }

  // 2. Comparação por string de ID (caso seja string sem ser numérico)
  const rawIdA = typeof themeA === 'object' ? String(themeA.id || themeA.rawId || '') : String(themeA)
  const rawIdB = typeof themeB === 'object' ? String(themeB.id || themeB.rawId || '') : String(themeB)
  const cleanIdA = rawIdA.replace(/^theme-/, '')
  const cleanIdB = rawIdB.replace(/^theme-/, '')
  if (cleanIdA && cleanIdB && cleanIdA.toLowerCase() === cleanIdB.toLowerCase()) {
    return true
  }

  // 3. Comparação por Nome do tema (case-insensitive)
  const nameA = getThemeName(themeA).toLowerCase()
  const nameB = getThemeName(themeB).toLowerCase()
  if (nameA && nameB && nameA === nameB) {
    return true
  }

  return false
}

const isThemeSelected = (theme: any): boolean => {
  if (selectedThemeId.value === null || selectedThemeId.value === undefined) return false
  return themeMatches(theme, selectedThemeId.value)
}

const toggleThemeFilter = (theme: any) => {
  if (isThemeSelected(theme)) {
    selectedThemeId.value = null
  } else {
    selectedThemeId.value = theme.rawId || theme.id
  }
}

const availableThemes = computed(() => {
  const nodes = (graphData.value.nodes || []).filter((node: any) => {
    if (node.type && node.type !== 'theme') return false
    if (typeof node.id === 'string' && (node.id.startsWith('book-') || node.id.startsWith('note-') || node.id.startsWith('canvas-'))) {
      return false
    }
    return true
  })

  const list: any[] = [...nodes]
  for (const book of userBooks.value) {
    for (const bt of book.themes || []) {
      const exists = list.some((item) => themeMatches(item, bt))
      if (!exists) {
        const numId = getNumericThemeId(bt) || Date.now()
        list.push({
          id: `theme-${numId}`,
          rawId: numId,
          name: bt.name,
          color: bt.color || '#E57B55',
          type: 'theme',
        })
      }
    }
  }

  return list
})

const selectedTheme = computed(() => {
  if (selectedThemeId.value === null || selectedThemeId.value === undefined) return null
  return availableThemes.value.find((t: any) => isThemeSelected(t)) || null
})

const promptDeleteBook = async (book: UserBookItem) => {
  bookToDelete.value = book
  showDeleteBookModal.value = true
  isCheckingBookContents.value = true
  bookNotesCount.value = 0
  bookFlashcardsCount.value = 0

  try {
    const bookId = book.bookId || book.userBookId
    const localNotes = await annotationRepo.getAll({ bookId })
    const localNotesUserBook = book.userBookId !== bookId ? await annotationRepo.getAll({ bookId: book.userBookId }) : []
    const allNotes = [...localNotes, ...localNotesUserBook]
    const noteIds = new Set(allNotes.map((n) => n.id))
    let notesCount = noteIds.size

    const allCards = await flashcardRepo.getAll()
    const matchingCards = allCards.filter(
      (c) =>
        Number(c.bookId) === Number(bookId) ||
        Number(c.bookId) === Number(book.userBookId) ||
        (c.annotationId && noteIds.has(c.annotationId))
    )
    let flashcardsCount = matchingCards.length

    if (auth.isLoggedIn.value && auth.token.value) {
      try {
        const apiNotes = await $fetch<any[]>(`${getApiBase()}/annotations/book/${bookId}`, {
          headers: { Authorization: `Bearer ${auth.token.value}` }
        }).catch(() => [])
        if (Array.isArray(apiNotes) && apiNotes.length > 0) {
          notesCount = Math.max(notesCount, apiNotes.length)
          const remoteCards = apiNotes.filter((n) => n.flashcard || n.hasFlashcard)
          flashcardsCount = Math.max(flashcardsCount, remoteCards.length)
        }
      } catch {}
    }

    bookNotesCount.value = notesCount
    bookFlashcardsCount.value = flashcardsCount
  } catch (err) {
    console.warn('[library] Erro ao verificar conteúdo do livro para remoção:', err)
  } finally {
    isCheckingBookContents.value = false
  }
}

const cancelDeleteBook = () => {
  showDeleteBookModal.value = false
  bookToDelete.value = null
  bookNotesCount.value = 0
  bookFlashcardsCount.value = 0
}

const confirmDeleteBook = async () => {
  if (!bookToDelete.value) return
  isDeletingBook.value = true
  try {
    const targetBook = bookToDelete.value
    await deleteUserBook(targetBook.userBookId)
    const { deleteAnnotationsByBookId } = useAnnotations()
    const { deleteFlashcardsByBookId } = useFlashcards()
    await deleteAnnotationsByBookId(targetBook.bookId)
    await deleteFlashcardsByBookId(targetBook.bookId)
    if (targetBook.userBookId !== targetBook.bookId) {
      await deleteAnnotationsByBookId(targetBook.userBookId)
      await deleteFlashcardsByBookId(targetBook.userBookId)
    }
    try {
      await fetchGraph()
    } catch {}
    showDeleteBookModal.value = false
    bookToDelete.value = null
    bookNotesCount.value = 0
    bookFlashcardsCount.value = 0
  } catch (e) {
    console.error('Erro ao remover livro da estante:', e)
  } finally {
    isDeletingBook.value = false
  }
}

const handleStatusChange = async (userBookId: number, status: string, page: number) => {
  await updateUserBook(userBookId, status, page)
}

const getBookProgress = (item: UserBookItem): number => {
  if (item.status === 'LIDO') return 100
  if (item.status === 'QUERO_LER') return 0
  if ((item as any).progress !== undefined && (item as any).progress !== null) {
    return Math.min(100, Math.max(0, Math.round(Number((item as any).progress))))
  }
  const total = (item as any).totalPages || (item as any).total_pages
  if (total && total > 0 && typeof item.currentPage === 'number') {
    return Math.min(100, Math.max(0, Math.round((item.currentPage / total) * 100)))
  }
  if (typeof item.currentPage === 'number' && item.currentPage > 0) {
    return Math.min(100, Math.max(0, Math.round(item.currentPage)))
  }
  return 0
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'LENDO':
      return 'bg-[#E57B55]/15 border-[#E57B55]/30 text-[#E57B55] hover:border-[#E57B55]/60'
    case 'LIDO':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
    case 'QUERO_LER':
      return 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:border-sky-500/60'
    case 'ABANDONADO':
      return 'bg-stone-500/15 border-stone-500/30 text-stone-300 hover:border-stone-500/60'
    default:
      return 'bg-white/5 border-divider text-textSecondary'
  }
}

const countByStatus = (status: string) => {
  return userBooks.value.filter((b: UserBookItem) => b.status === status).length
}

const countByTheme = (themeOrId: any) => {
  return userBooks.value.filter((b: UserBookItem) => {
    return (b.themes || []).some((t: any) => themeMatches(t, themeOrId))
  }).length
}

const openReader = (item: UserBookItem) => {
  const page = typeof item.currentPage === 'number' && item.currentPage > 0 ? item.currentPage : 1
  void recordBookAccess(item.userBookId || item.bookId)
  router.push(`/reader?bookId=${item.bookId}&page=${page}`)
}

const filteredUserBooks = computed(() => {
  return userBooks.value
    .filter((b: UserBookItem) => {
      if (selectedThemeId.value === null || selectedThemeId.value === undefined) return true
      return (b.themes || []).some((t: any) => themeMatches(t, selectedThemeId.value))
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
  selectedThemeIdsForModal.value = (book.themes || [])
    .map((t: any) => getNumericThemeId(t))
    .filter((id) => id > 0)
  showCreateThemeInline.value = false
  newThemeName.value = ''
  fetchGraph()
}

const isModalThemeSelected = (themeOrId: any): boolean => {
  const numId = getNumericThemeId(themeOrId)
  if (!numId) return false
  return selectedThemeIdsForModal.value.includes(numId)
}

const toggleModalTheme = (themeOrId: any) => {
  const numId = getNumericThemeId(themeOrId)
  if (!numId) return
  const idx = selectedThemeIdsForModal.value.indexOf(numId)
  if (idx > -1) {
    selectedThemeIdsForModal.value.splice(idx, 1)
  } else {
    selectedThemeIdsForModal.value.push(numId)
  }
}

const handleCreateThemeInline = async () => {
  const name = newThemeName.value.trim()
  if (!name || name.length > 30) return null
  creatingTheme.value = true
  try {
    const created = await createNode(name, newThemeColor.value)
    if (created) {
      const numId = getNumericThemeId(created)
      if (numId && !selectedThemeIdsForModal.value.includes(numId)) {
        selectedThemeIdsForModal.value.push(numId)
      }
    }
    newThemeName.value = ''
    showCreateThemeInline.value = false
    return created
  } catch (e) {
    console.error('Erro ao criar tema:', e)
    return null
  } finally {
    creatingTheme.value = false
  }
}

const handleSaveBookThemes = async () => {
  if (!tagModalBook.value) return
  savingThemes.value = true
  try {
    if (newThemeName.value && newThemeName.value.trim()) {
      await handleCreateThemeInline()
    }
    const bookTargetId = tagModalBook.value.userBookId || tagModalBook.value.bookId
    await setBookThemes(bookTargetId, selectedThemeIdsForModal.value, availableThemes.value)
    await fetchGraph()
    tagModalBook.value = null
  } catch (e) {
    console.error('Erro ao salvar temas do livro:', e)
    tagModalBook.value = null
  } finally {
    savingThemes.value = false
  }
}

const handleThemeCreated = async () => {
  await fetchGraph()
}

const handleThemeUpdated = async () => {
  await fetchGraph()
  if (auth.isLoggedIn.value) {
    await fetchUserBooks()
  }
}

const handleThemeDeleted = async (deletedId: number | string) => {
  if (selectedThemeId.value !== null && themeMatches(deletedId, selectedThemeId.value)) {
    selectedThemeId.value = null
  }
  await fetchGraph()
  if (auth.isLoggedIn.value) {
    await fetchUserBooks()
  }
}

onMounted(() => {
  if (auth.isLoggedIn.value) {
    fetchUserBooks()
    fetchGraph()
  }

  if (route.query.createBooklet === 'true') {
    if (route.query.topic) {
      newBookletTopic.value = String(route.query.topic)
    }
    if (route.query.parentBookId) {
      newBookletParentBookId.value = Number(route.query.parentBookId)
    }
    isCreateDidacticModalOpen.value = true
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

