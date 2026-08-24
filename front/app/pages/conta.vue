<template>
  <div class="flex flex-col gap-12 pb-16">
    <!-- Cabeçalho Editorial da Conta -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
          <UserIcon class="w-3.5 h-3.5" />
          Identidade & Assinatura
        </div>
        <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
          Sua Conta
        </h1>
        <p class="font-interface text-textSecondary text-base max-w-2xl leading-relaxed">
          Gerencie seu perfil, acompanhe seu progresso de leitura e desbloqueie recursos avançados com o Aresta Pro.
        </p>
      </div>

      <!-- Badge de Status do Plano -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-divider">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="isPro ? 'bg-accent animate-pulse' : 'bg-textSecondary'"
          ></div>
          <span class="font-interface text-xs text-textSecondary">Plano Atual:</span>
          <span class="font-technical text-xs font-semibold" :class="isPro ? 'text-accent' : 'text-textPrimary'">
            {{ isPro ? 'Aresta Pro' : 'Gratuito' }}
          </span>
        </div>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Perfil do Usuário -->
    <section class="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-white/[0.02] border border-divider">
      <div class="flex items-center gap-5">
        <div class="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 text-accent font-technical text-xl font-bold flex items-center justify-center shadow-lg">
          {{ userInitials }}
        </div>
        <div class="flex flex-col gap-1">
          <h2 class="font-editorial text-2xl font-light text-textPrimary">{{ userName }}</h2>
          <span class="font-interface text-xs text-textSecondary">{{ userEmail }}</span>
          <span class="font-technical text-[10px] text-accent uppercase tracking-wider mt-1">Membro desde Agosto de 2026</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="!isPro"
          @click="showUpgradeModal = true"
          class="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-interface text-xs font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
        >
          <CrownIcon class="w-4 h-4" />
          Fazer Upgrade Pro
        </button>
        <button
          v-if="auth.isLoggedIn.value"
          @click="auth.logout()"
          class="px-4 py-2.5 rounded-xl border border-divider hover:bg-rose-500/10 hover:border-rose-500/30 text-textSecondary hover:text-rose-400 font-interface text-xs transition-colors flex items-center gap-1.5"
        >
          <LogOutIcon class="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </section>

    <!-- Métricas Intelectuais e Estatísticas -->
    <section class="flex flex-col gap-6">
      <h3 class="font-editorial text-2xl font-light text-textPrimary">Métricas de Leitura & Conhecimento</h3>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Métrica 1: Livros -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
          <div class="flex items-center justify-between text-textSecondary">
            <span class="font-technical text-[10px] uppercase tracking-wider">Livros no Acervo</span>
            <BookOpenIcon class="w-4 h-4 text-accent" />
          </div>
          <span class="font-editorial text-4xl font-light text-textPrimary">8</span>
          <span class="font-interface text-[11px] text-textSecondary">3 em leitura ativa</span>
        </div>

        <!-- Métrica 2: Horas de Leitura -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
          <div class="flex items-center justify-between text-textSecondary">
            <span class="font-technical text-[10px] uppercase tracking-wider">Tempo Total</span>
            <ClockIcon class="w-4 h-4 text-accent" />
          </div>
          <span class="font-editorial text-4xl font-light text-textPrimary">42.5<span class="text-lg font-interface">h</span></span>
          <span class="font-interface text-[11px] text-textSecondary">Média 35 min/dia</span>
        </div>

        <!-- Métrica 3: Nós do Grafo -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
          <div class="flex items-center justify-between text-textSecondary">
            <span class="font-technical text-[10px] uppercase tracking-wider">Nós Conectados</span>
            <NetworkIcon class="w-4 h-4 text-accent" />
          </div>
          <span class="font-editorial text-4xl font-light text-textPrimary">64</span>
          <span class="font-interface text-[11px] text-textSecondary">Em 4 mapas conceituais</span>
        </div>

        <!-- Métrica 4: Retenção -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
          <div class="flex items-center justify-between text-textSecondary">
            <span class="font-technical text-[10px] uppercase tracking-wider">Taxa de Retenção</span>
            <CheckCircle2Icon class="w-4 h-4 text-emerald-400" />
          </div>
          <span class="font-editorial text-4xl font-light text-emerald-400">91%</span>
          <span class="font-interface text-[11px] text-textSecondary">18 flashcards dominados</span>
        </div>
      </div>
    </section>

    <!-- Comparativo e Benefícios do Upgrade Pro -->
    <section class="flex flex-col gap-6 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#16171a] via-[#121315] to-[#0A0A0B] border border-accent/30 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex flex-col gap-2 max-w-xl">
          <div class="flex items-center gap-2">
            <CrownIcon class="w-5 h-5 text-accent" />
            <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold">Aresta Pro</span>
          </div>
          <h2 class="font-editorial text-3xl md:text-4xl font-light text-textPrimary">
            Eleve sua jornada intelectual ao próximo nível
          </h2>
          <p class="font-interface text-sm text-textSecondary leading-relaxed">
            Conversão ilimitada de livros, inteligência artificial profunda de síntese, OCR avançado e exportação de grafos para Obsidian e Notion.
          </p>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2 bg-white/5 p-5 rounded-2xl border border-divider">
          <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary">Assinatura Anual</span>
          <div class="flex items-baseline gap-1">
            <span class="font-editorial text-3xl font-light text-textPrimary">R$ 24</span>
            <span class="font-interface text-xs text-textSecondary">/ mês</span>
          </div>
          <span class="font-interface text-[10px] text-emerald-400">Economize 30% no plano anual</span>
          <button
            @click="showUpgradeModal = true"
            class="mt-2 w-full px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-interface text-xs font-medium transition-all shadow-lg shadow-accent/20"
          >
            {{ isPro ? 'Gerenciar Assinatura' : 'Assinar Aresta Pro' }}
          </button>
        </div>
      </div>

      <!-- Tabela de Benefícios -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-divider text-xs">
        <div class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
          <SparklesIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="text-textPrimary font-medium">IA Gemini Ilimitada</span>
            <span class="text-textSecondary text-[11px]">Resumos de livros completos e geração de mapas conceituais automáticos.</span>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
          <FileCode2Icon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="text-textPrimary font-medium">Conversor PDF OCR HD</span>
            <span class="text-textSecondary text-[11px]">Converta documentos escaneados e obras raras para EPUB sem limites de tamanho.</span>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
          <ShieldCheckIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="text-textPrimary font-medium">Sincronização & Backup Total</span>
            <span class="text-textSecondary text-[11px]">Todos os seus destaques, notas e posições de leitura sincronizados entre dispositivos.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Zona de Segurança & Perigo da Conta -->
    <section class="flex flex-col gap-6 p-8 rounded-3xl bg-rose-500/[0.03] border border-rose-500/20">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-rose-400">
          <ShieldAlertIcon class="w-4 h-4 text-rose-400" />
          Zona de Perigo & Segurança
        </div>
        <h3 class="font-editorial text-2xl font-light text-textPrimary">Gerenciamento de Acesso</h3>
        <p class="font-interface text-xs text-textSecondary leading-relaxed">
          Encerre sua sessão atual em segurança ou solicite a remoção permanente de todos os seus dados e histórico de leitura.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-rose-500/15">
        <div class="flex flex-col gap-0.5">
          <span class="font-interface text-sm font-medium text-textPrimary">Encerrar Sessão</span>
          <span class="font-interface text-xs text-textSecondary">Desconecta sua conta deste navegador.</span>
        </div>
        <button
          @click="auth.logout()"
          data-testid="logout-btn"
          class="px-5 py-2.5 rounded-xl border border-divider hover:bg-white/5 text-textPrimary font-interface text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOutIcon class="w-4 h-4 text-textSecondary" />
          Fazer Logout
        </button>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-rose-500/15">
        <div class="flex flex-col gap-0.5">
          <span class="font-interface text-sm font-medium text-rose-400">Excluir Conta</span>
          <span class="font-interface text-xs text-textSecondary">Remove permanentemente seu acervo, anotações e nós do grafo.</span>
        </div>
        <button
          @click="openDeleteModal"
          data-testid="open-delete-modal-btn"
          class="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-interface text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <Trash2Icon class="w-4 h-4" />
          Deletar Minha Conta
        </button>
      </div>
    </section>

    <!-- Modal de Upgrade Simulado -->
    <div
      v-if="showUpgradeModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      @click.self="showUpgradeModal = false"
    >
      <div class="max-w-md w-full p-8 rounded-3xl bg-[#141518] border border-accent/40 shadow-2xl flex flex-col gap-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <CrownIcon class="w-5 h-5 text-accent" />
            <h3 class="font-editorial text-2xl text-textPrimary">Plano Aresta Pro</h3>
          </div>
          <button @click="showUpgradeModal = false" class="p-1 rounded-lg text-textSecondary hover:text-white">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <p class="font-interface text-xs text-textSecondary leading-relaxed">
          Você terá acesso imediato a todas as ferramentas premium de conversão, síntese de IA e mapas conceituais ilimitados.
        </p>

        <div class="flex flex-col gap-3">
          <label
            @click="selectedBillingCycle = 'annual'"
            class="flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all"
            :class="selectedBillingCycle === 'annual' ? 'border-accent bg-accent/10' : 'border-divider bg-white/5'"
          >
            <div class="flex flex-col">
              <span class="font-interface text-xs font-semibold text-textPrimary">Anual (Recomendado)</span>
              <span class="font-interface text-[11px] text-textSecondary">R$ 288 / ano (R$ 24/mês)</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-technical text-[10px] font-semibold">30% OFF</span>
          </label>

          <label
            @click="selectedBillingCycle = 'monthly'"
            class="flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all"
            :class="selectedBillingCycle === 'monthly' ? 'border-accent bg-accent/10' : 'border-divider bg-white/5'"
          >
            <div class="flex flex-col">
              <span class="font-interface text-xs font-semibold text-textPrimary">Mensal</span>
              <span class="font-interface text-[11px] text-textSecondary">R$ 34 / mês</span>
            </div>
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button
            @click="showUpgradeModal = false"
            class="px-4 py-2 rounded-xl text-xs text-textSecondary hover:text-textPrimary"
          >
            Cancelar
          </button>
          <button
            @click="confirmUpgrade"
            class="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <SparklesIcon class="w-4 h-4" />
            Confirmar Assinatura
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação Severa de Exclusão de Conta (Estilo GitHub) -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      @click.self="closeDeleteModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div class="max-w-lg w-full p-8 rounded-3xl bg-[#151214] border border-rose-500/40 shadow-2xl flex flex-col gap-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangleIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 id="delete-account-title" class="font-editorial text-2xl text-textPrimary leading-tight">
                Excluir Conta Permanentemente
              </h3>
              <span class="font-technical text-[10px] uppercase tracking-wider text-rose-400">Ação Irreversível</span>
            </div>
          </div>
          <button
            @click="closeDeleteModal"
            class="p-1 rounded-lg text-textSecondary hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex flex-col gap-2 text-xs text-rose-200">
          <p class="font-interface leading-relaxed">
            <strong>Atenção:</strong> Ao confirmar a exclusão, todos os seus dados serão apagados definitivamente do Aresta:
          </p>
          <ul class="list-disc list-inside space-y-1 text-rose-300/90 text-[11px] font-interface">
            <li>Livros e documentos enviados</li>
            <li>Progresso de leitura e histórico</li>
            <li>Anotações, citações e flashcards</li>
            <li>Nós e conexões do seu Grafo de Conhecimento</li>
          </ul>
        </div>

        <div v-if="deleteError" class="bg-rose-500/20 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300">
          {{ deleteError }}
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-interface text-xs text-textSecondary">
            Para confirmar, digite exatamente a frase:
            <span class="font-technical font-semibold text-textPrimary select-all bg-white/10 px-2 py-0.5 rounded ml-1">
              {{ requiredConfirmationPhrase }}
            </span>
          </label>
          <input
            v-model="confirmationPhraseInput"
            type="text"
            data-testid="delete-confirmation-input"
            :placeholder="requiredConfirmationPhrase"
            class="w-full bg-black/50 border border-divider focus:border-rose-500/80 rounded-xl px-4 py-3 text-xs md:text-sm text-textPrimary placeholder:text-textSecondary/30 focus:outline-none transition-colors"
            @keyup.enter="isPhraseMatching && handleDeleteAccount()"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-divider">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2.5 rounded-xl text-xs text-textSecondary hover:text-textPrimary transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="handleDeleteAccount"
            :disabled="!isPhraseMatching || isDeleting"
            data-testid="confirm-delete-account-btn"
            class="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-interface text-xs font-medium transition-all shadow-lg shadow-rose-900/30 flex items-center gap-2"
          >
            <span v-if="!isDeleting" class="flex items-center gap-2">
              <Trash2Icon class="w-4 h-4" />
              Excluir Minha Conta Permanentemente
            </span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Excluindo...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UserIcon,
  CrownIcon,
  BookOpenIcon,
  ClockIcon,
  NetworkIcon,
  CheckCircle2Icon,
  SparklesIcon,
  FileCode2Icon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  LogOutIcon,
  Trash2Icon,
  XIcon
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const auth = useAuth()

const isPro = ref(false)
const showUpgradeModal = ref(false)
const selectedBillingCycle = ref<'annual' | 'monthly'>('annual')

// Estado de Deleção de Conta
const showDeleteModal = ref(false)
const confirmationPhraseInput = ref('')
const isDeleting = ref(false)
const deleteError = ref('')

const requiredConfirmationPhrase = 'deletar minha conta permanentemente'

const isPhraseMatching = computed(() => {
  return confirmationPhraseInput.value.trim() === requiredConfirmationPhrase
})

const openDeleteModal = () => {
  confirmationPhraseInput.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  confirmationPhraseInput.value = ''
  deleteError.value = ''
}

const handleDeleteAccount = async () => {
  if (!isPhraseMatching.value || isDeleting.value) return

  isDeleting.value = true
  deleteError.value = ''

  const result = await auth.deleteAccount()
  isDeleting.value = false

  if (!result.success) {
    deleteError.value = result.error || 'Não foi possível excluir sua conta. Tente novamente mais tarde.'
  } else {
    showDeleteModal.value = false
  }
}

const userName = computed(() => auth.user.value?.name || 'Leitor Aresta')
const userEmail = computed(() => auth.user.value?.email || 'leitor@aresta.app')
const userInitials = computed(() => {
  const name = userName.value
  return name.charAt(0).toUpperCase()
})

const confirmUpgrade = () => {
  isPro.value = true
  showUpgradeModal.value = false
}
</script>
