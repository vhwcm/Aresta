<template>
  <div>
    <!-- ESTADO 1: USUÁRIO AUTENTICADO (Home do Leitor / Leitura Ativa) -->
    <div v-if="auth.isLoggedIn.value" data-testid="auth-home" class="flex flex-col gap-10 pb-20 animate-in fade-in duration-500">
      <!-- Top Bar Integrada da Home (Busca Desktop e Ofensiva no Canto Superior Direito) -->
      <div class="flex items-center justify-between gap-4">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          Leitura Ativa
        </div>

        <!-- Barra de Busca Cmd+K Integrada (Visível APENAS para Desktop) -->
        <div
          class="hidden md:flex flex-1 max-w-md mx-4 items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-divider hover:border-white/20 transition-all cursor-pointer group text-textSecondary"
          @click="commandPalette.open()"
          role="button"
          tabindex="0"
          aria-label="Abrir paleta de comandos"
        >
          <SearchIcon class="w-4 h-4 group-hover:text-textPrimary transition-colors" />
          <span class="text-xs font-interface font-normal truncate group-hover:text-textPrimary transition-colors">
            Explorar livros, conceitos ou comandos...
          </span>
          <div class="ml-auto flex items-center gap-1 font-technical text-[10px] uppercase font-semibold tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
            <span>Cmd</span>
            <span>K</span>
          </div>
        </div>

        <!-- Canto Superior Direito: Ofensiva em Dias (Ícone + Número em Dias) -->
        <div class="flex items-center gap-2 ml-auto">
          <ReadingStreak />
        </div>
      </div>

      <!-- BLOCO 1: ÚLTIMA LEITURA ATIVA (Clean, sem caixa, capa clicável e conversor em ícone) -->
      <section class="flex flex-row items-center sm:items-start gap-5 sm:gap-8">
        <!-- Capa do Livro (Clicável diretamente no mobile e desktop) -->
        <NuxtLink
          :to="activeBookReaderLink"
          class="relative shrink-0 group/cover cursor-pointer select-none"
          :title="`Continuar leitura de ${activeBookTitle}`"
        >
          <div class="w-24 sm:w-32 md:w-36 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-divider hover:border-accent/50 bg-neutral-900 flex items-center justify-center relative transition-all duration-300 group-hover/cover:scale-[1.02]">
            <img
              v-if="activeBookCoverUrl && !coverError"
              :src="activeBookCoverUrl"
              :alt="activeBookTitle"
              @error="coverError = true"
              class="w-full h-full object-cover"
            />
            <!-- Fallback se imagem falhar -->
            <div v-else class="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-neutral-800 to-neutral-950 text-left border-l-2 border-accent">
              <span class="font-technical text-[8px] uppercase tracking-wider text-accent font-semibold">Aresta</span>
              <span class="font-editorial text-xs sm:text-sm font-light text-white leading-tight line-clamp-3">{{ activeBookTitle }}</span>
              <span class="font-interface text-[9px] text-textSecondary">Machado de Assis</span>
            </div>

            <!-- Efeito de Lombada de Livro -->
            <div class="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none"></div>
          </div>
        </NuxtLink>

        <!-- Informações Compactas do Livro -->
        <div class="flex flex-col justify-between gap-3 flex-1 min-w-0">
          <div class="flex flex-col gap-1">
            <NuxtLink :to="activeBookReaderLink" class="hover:text-accent transition-colors">
              <h1 class="font-editorial text-2xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-tight truncate sm:whitespace-normal">
                {{ activeBookTitle }}
              </h1>
            </NuxtLink>

            <!-- Progresso Resumido (Tanto de Tanto) -->
            <div class="text-xs sm:text-sm font-technical text-textSecondary flex items-center gap-2">
              <span>Pág. {{ activeBookCurrentPage }} / {{ activeBookTotalPages }}</span>
              <span>·</span>
              <span class="text-accent font-medium">{{ activeBookProgress }}%</span>
            </div>
          </div>

          <!-- Botões de Ação Compactos (Seta para leitura e Ícone para Conversor) -->
          <div class="flex items-center gap-3 pt-1">
            <NuxtLink
              :to="activeBookReaderLink"
              class="bg-white text-black font-interface text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-gray-200 transition-all flex items-center gap-1.5 shadow-md"
              title="Continuar Leitura"
            >
              <span class="hidden sm:inline">Continuar</span>
              <ArrowRightIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </NuxtLink>

            <!-- Conversor: Sempre em formato de Ícone -->
            <NuxtLink
              to="/conversor"
              class="p-2 sm:p-2.5 rounded-full border border-divider bg-white/5 hover:bg-white/10 hover:border-accent/40 text-accent hover:text-white transition-all flex items-center justify-center"
              title="Converter PDF para EPUB"
              aria-label="Converter PDF para EPUB"
            >
              <FileCode2Icon class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <div class="h-px bg-divider/60 w-full"></div>

      <!-- BLOCO 2: ANOTAÇÕES DO ÚLTIMO LIVRO (Clean e sem caixas) -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
            <FileTextIcon class="w-3.5 h-3.5 text-accent" />
            Anotações & Destaques de {{ activeBookShortTitle }}
          </div>
          <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
            Ver todas →
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="note in activeBookNotes"
            :key="note.id"
            class="flex flex-col gap-2 py-2"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
                {{ note.chapter }} · Pág. {{ note.page }}
              </span>
              <span class="font-technical text-[10px] text-textSecondary">{{ note.date }}</span>
            </div>

            <blockquote class="border-l-2 border-accent pl-3 text-xs font-interface italic text-textPrimary/90 leading-relaxed">
              "{{ note.quote }}"
            </blockquote>

            <p class="font-interface text-xs text-textSecondary leading-relaxed pl-3">
              {{ note.insight }}
            </p>
          </div>
        </div>
      </section>

      <div class="h-px bg-divider/60 w-full"></div>

      <!-- BLOCO 3: FLASHCARDS DO DIA (Clean, sem caixa, com botão direto) -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
            <BrainIcon class="w-3.5 h-3.5 text-accent" />
            Flashcards do Dia
          </div>
          <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
            Central de Revisão →
          </NuxtLink>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
          <div class="flex flex-col gap-1.5 flex-1">
            <span class="font-technical text-[10px] text-accent uppercase font-semibold tracking-wider">
              1º Flashcard de Hoje · {{ dailyFlashcard.chapter }}
            </span>
            <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary leading-snug">
              {{ dailyFlashcard.question }}
            </h3>
          </div>

          <NuxtLink
            to="/revisao"
            class="bg-accent hover:bg-accent/90 text-white font-interface text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-md shrink-0"
          >
            <SparklesIcon class="w-3.5 h-3.5" />
            <span>Fazer Flashcard</span>
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- ESTADO 2: VISITANTE NÃO AUTENTICADO (Página Inicial Pública / Landing Page do Aresta) -->
    <div v-else data-testid="guest-landing" class="flex flex-col gap-16 py-8 md:py-12 animate-in fade-in duration-500">
      <!-- Seção Hero da Landing Page -->
      <section class="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
        <div class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
          <SparklesIcon class="w-3.5 h-3.5" />
          Leitor de Ebooks & Grafo de Conhecimento
        </div>

        <h1 class="font-editorial text-4xl sm:text-5xl md:text-6xl font-light text-textPrimary leading-[1.15]">
          Transforme sua leitura em uma <span class="text-accent italic">rede viva</span> de conhecimento.
        </h1>

        <p class="font-interface text-sm sm:text-base text-textSecondary max-w-2xl leading-relaxed">
          O <strong>Aresta</strong> é um ecossistema inteligente para leitura de arquivos EPUB e PDF, organização de acervo pessoal e mapeamento visual de conceitos conectados entre livros.
        </p>
      </section>

      <!-- Grade dos 4 Pilares do Aresta -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Pilar 1: Leitura Fluida -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-white/20 transition-colors">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <BookOpenIcon class="w-5 h-5" />
          </div>
          <h2 class="font-editorial text-lg font-light text-textPrimary">Leitura Imersiva</h2>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            Suporte integrado a EPUB e PDF com tipografia customizável e virada realista de páginas com física de folha.
          </p>
        </div>

        <!-- Pilar 2: Grafo de Conhecimento -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-white/20 transition-colors">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <NetworkIcon class="w-5 h-5" />
          </div>
          <h2 class="font-editorial text-lg font-light text-textPrimary">Grafo Conceitual</h2>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            Conecte nós de temas e ideias entre diferentes obras em um mapa mental vivo e navegável.
          </p>
        </div>

        <!-- Pilar 3: Flashcards & Síntese -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-white/20 transition-colors">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <BrainIcon class="w-5 h-5" />
          </div>
          <h2 class="font-editorial text-lg font-light text-textPrimary">Retenção Ativa</h2>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            Flashcards com repetição espaçada e sínteses geradas a partir de suas citações e anotações.
          </p>
        </div>

        <!-- Pilar 4: Conversor Inteligente -->
        <div class="p-6 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-white/20 transition-colors">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <FileCode2Icon class="w-5 h-5" />
          </div>
          <h2 class="font-editorial text-lg font-light text-textPrimary">Conversor PDF &rarr; EPUB</h2>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            Converta documentos técnicos e livros para formato responsivo adaptado para qualquer tela.
          </p>
        </div>
      </section>

      <!-- Card Central de Acesso Rápido / Autenticação Simplificada -->
      <section class="max-w-md w-full mx-auto p-8 rounded-3xl bg-white/[0.03] border border-divider/80 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        <!-- Alternador de Abas: Login / Cadastro -->
        <div class="flex items-center p-1 rounded-2xl bg-white/5 border border-divider">
          <button
            @click="authMode = 'login'"
            data-testid="tab-login"
            class="flex-1 py-2 rounded-xl font-interface text-xs font-medium transition-all text-center"
            :class="authMode === 'login' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-white'"
          >
            Acessar Conta
          </button>
          <button
            @click="authMode = 'register'"
            data-testid="tab-register"
            class="flex-1 py-2 rounded-xl font-interface text-xs font-medium transition-all text-center"
            :class="authMode === 'register' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-white'"
          >
            Criar Conta
          </button>
        </div>

        <!-- Alerta de Dica de Demonstração (Exibido na aba Login) -->
        <div v-if="authMode === 'login'" class="bg-accent/10 border border-accent/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-textPrimary">
          <KeyIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="font-semibold text-accent uppercase tracking-wider text-[9px]">Acesso Rápido Demo</span>
            <span class="font-technical text-textSecondary text-[11px]">
              Login: <strong>viktor</strong> · Senha: <strong>orlaweb123123#</strong>
            </span>
          </div>
        </div>

        <!-- Alerta de Erro de Autenticação -->
        <div v-if="authError" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircleIcon class="w-4 h-4 shrink-0" />
          <span>{{ authError }}</span>
        </div>

        <!-- Formulário de Login -->
        <form v-if="authMode === 'login'" @submit.prevent="handleQuickLogin" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Usuário ou E-mail
            </label>
            <div class="relative">
              <UserIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="loginIdentifier"
                type="text"
                required
                data-testid="login-input"
                placeholder="viktor"
                class="w-full bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Senha
            </label>
            <div class="relative">
              <LockIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="loginPassword"
                type="password"
                required
                data-testid="password-input"
                placeholder="••••••••••••"
                class="w-full bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isAuthLoading"
            data-testid="submit-login-btn"
            class="w-full mt-2 bg-white text-black font-interface font-medium text-xs sm:text-sm py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <span v-if="!isAuthLoading">Entrar no Aresta</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              Acessando...
            </span>
            <ArrowRightIcon v-if="!isAuthLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Formulário de Registro / Criar Conta -->
        <form v-else @submit.prevent="handleQuickRegister" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Nome Completo
            </label>
            <div class="relative">
              <UserIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerName"
                type="text"
                required
                data-testid="register-name-input"
                placeholder="Seu Nome"
                class="w-full bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              E-mail
            </label>
            <div class="relative">
              <MailIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerEmail"
                type="email"
                required
                data-testid="register-email-input"
                placeholder="seu.email@exemplo.com"
                class="w-full bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Senha (mínimo 6 caracteres)
            </label>
            <div class="relative">
              <LockIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerPassword"
                type="password"
                required
                minlength="6"
                data-testid="register-password-input"
                placeholder="••••••••••••"
                class="w-full bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isAuthLoading"
            data-testid="submit-register-btn"
            class="w-full mt-2 bg-accent text-white font-interface font-medium text-xs sm:text-sm py-3 rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="!isAuthLoading">Criar Conta e Começar</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Criando conta...
            </span>
            <ArrowRightIcon v-if="!isAuthLoading" class="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowRightIcon,
  BrainIcon,
  SparklesIcon,
  BookOpenIcon,
  NetworkIcon,
  FileCode2Icon,
  SearchIcon,
  FileTextIcon,
  UserIcon,
  LockIcon,
  MailIcon,
  KeyIcon,
  AlertCircleIcon
} from 'lucide-vue-next'
import ReadingStreak from '~/components/ReadingStreak.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettings } from '~/composables/useSettings'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { useUserBooks } from '~/composables/useUserBooks'
import { getCoverUrl } from '~/utils/cover'

const auth = useAuth()
const { loadFromServer } = useSettings()
const commandPalette = useCommandPalette()
const { userBooks, fetchUserBooks } = useUserBooks()

const coverError = ref(false)

// Estado da Autenticação na Landing Page
const authMode = ref<'login' | 'register'>('login')
const loginIdentifier = ref('viktor')
const loginPassword = ref('orlaweb123123#')

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

const isAuthLoading = ref(false)
const authError = ref('')

const handleQuickLogin = async () => {
  isAuthLoading.value = true
  authError.value = ''

  const result = await auth.login(loginIdentifier.value, loginPassword.value)
  isAuthLoading.value = false

  if (result.success) {
    void loadFromServer()
    try {
      await fetchUserBooks()
    } catch (e) {
      // Silencioso
    }
  } else {
    authError.value = result.error || 'Falha ao autenticar. Verifique o usuário e a senha.'
  }
}

const handleQuickRegister = async () => {
  isAuthLoading.value = true
  authError.value = ''

  const result = await auth.register(registerName.value, registerEmail.value, registerPassword.value)
  isAuthLoading.value = false

  if (result.success) {
    void loadFromServer()
    try {
      await fetchUserBooks()
    } catch (e) {
      // Silencioso
    }
  } else {
    authError.value = result.error || 'Falha ao registrar usuário.'
  }
}

onMounted(async () => {
  if (auth.isLoggedIn.value) {
    try {
      await fetchUserBooks()
    } catch (e) {
      // Fallback gracioso caso backend esteja offline
    }
  }
})

// Livro mais recentemente acessado (baseado em last_accessed_at no backend)
const latestUserBook = computed(() => {
  return userBooks.value.length > 0 ? userBooks.value[0] : null
})

const activeBookTitle = computed(() => {
  return latestUserBook.value?.title || 'O Alienista'
})

const activeBookShortTitle = computed(() => {
  const title = activeBookTitle.value
  return title.length > 25 ? title.substring(0, 25) + '...' : title
})

const activeBookCoverUrl = computed(() => {
  if (latestUserBook.value?.coverPath) {
    return getCoverUrl(latestUserBook.value.coverPath, latestUserBook.value.bookId)
  }
  // Mock com imagem de capa disponível no backend
  return getCoverUrl('storage/covers/O-Alienista.png')
})

const activeBookCurrentPage = computed(() => {
  return latestUserBook.value?.currentPage || 42
})

const activeBookTotalPages = computed(() => {
  return 128
})

const activeBookProgress = computed(() => {
  return Math.min(100, Math.round((activeBookCurrentPage.value / activeBookTotalPages.value) * 100))
})

const activeBookReaderLink = computed(() => {
  if (latestUserBook.value?.bookId) {
    return `/reader?bookId=${latestUserBook.value.bookId}`
  }
  return '/reader'
})

// Anotações mockadas do último livro que está sendo lido
const activeBookNotes = computed(() => {
  return [
    {
      id: 'n1',
      chapter: 'Capítulo III',
      page: 42,
      date: 'Hoje',
      quote: 'A razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde.',
      insight: 'Simão Bacamarte estabelece uma fronteira arbitrária entre sanidade e desvio mental, ilustrando o perigo do cientificismo cego.'
    },
    {
      id: 'n2',
      chapter: 'Capítulo I',
      page: 18,
      date: 'Ontem',
      quote: 'A ciência é o meu único norte; não busco a glória dos homens, mas a verdade das coisas.',
      insight: 'O rigor metodológico de Bacamarte se transforma em uma obsessão dogmática ao longo da narrativa.'
    }
  ]
})

// Primeiro Flashcard do Dia
const dailyFlashcard = computed(() => {
  return {
    id: 'f1',
    bookTitle: activeBookShortTitle.value,
    chapter: 'Cap. III: A Casa Verde',
    question: 'Qual é o critério inicial usado por Simão Bacamarte para internar pacientes na Casa Verde?',
    answer: 'Qualquer desvio do equilíbrio moral ou manifestação excessiva de paixão, soberba ou virtude fora do comum.'
  }
})
</script>
