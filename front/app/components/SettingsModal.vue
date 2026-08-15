<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modal.isOpen.value"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
        @click.self="modal.close()"
      >
        <div
          class="w-full max-w-lg bg-bgPanel/95 rounded-2xl shadow-2xl overflow-hidden border border-divider backdrop-blur-xl flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-divider flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <SettingsIcon class="w-5 h-5" />
              </div>
              <div>
                <h2 id="settings-modal-title" class="font-editorial text-xl text-textPrimary font-normal">
                  Painel de Configurações
                </h2>
                <p class="font-interface text-xs text-textSecondary">
                  Gerencie sua conta e preferências do leitor
                </p>
              </div>
            </div>

            <button
              @click="modal.close()"
              class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors focus:outline-none"
              aria-label="Fechar painel de configurações"
              title="Fechar"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 overflow-y-auto flex flex-col gap-6">

            <!-- Grupo: Conta e Autenticação -->
            <div class="flex flex-col gap-3">
              <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary opacity-60">
                Conta & Segurança
              </span>

              <div class="flex flex-col rounded-xl bg-white/[0.02] border border-divider divide-y divide-divider overflow-hidden">

                <!-- Item 1: Recuperar Senha (Desabilitado) -->
                <div class="p-4 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-white/5 text-textSecondary">
                      <KeyRoundIcon class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="font-interface text-sm text-textPrimary font-medium flex items-center gap-2">
                        Recuperar Senha
                      </div>
                      <div class="font-interface text-xs text-textSecondary">
                        Redefinir senha de acesso por e-mail
                      </div>
                    </div>
                  </div>

                  <span class="px-2 py-0.5 text-[10px] font-technical font-semibold bg-white/5 text-textSecondary border border-white/10 rounded">
                    Desabilitado
                  </span>
                </div>

                <!-- Item 2: Fazer Logout -->
                <div class="p-4 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <LogOutIcon class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-interface text-sm text-textPrimary font-medium">
                        Fazer Log Out
                      </div>
                      <div class="font-interface text-xs text-textSecondary truncate">
                        <template v-if="auth.isLoggedIn.value">
                          Conectado como <strong class="text-textPrimary font-normal">{{ auth.user.value?.name }}</strong> ({{ auth.user.value?.email }})
                        </template>
                        <template v-else>
                          Nenhum usuário conectado
                        </template>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      v-if="auth.isLoggedIn.value"
                      @click="handleLogout"
                      class="px-3 py-1.5 text-xs font-interface font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <LogOutIcon class="w-3.5 h-3.5" />
                      <span>Sair</span>
                    </button>
                    <NuxtLink
                      v-else
                      to="/login"
                      @click="modal.close()"
                      class="px-3 py-1.5 text-xs font-interface font-medium bg-white/10 text-textPrimary border border-white/10 rounded-lg hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <LogInIcon class="w-3.5 h-3.5" />
                      <span>Fazer Login</span>
                    </NuxtLink>
                  </div>
                </div>

                <!-- Item 3: Excluir Conta (Desabilitado) -->
                <div class="p-4 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-rose-500/5 text-rose-400/50">
                      <UserXIcon class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="font-interface text-sm text-textPrimary font-medium flex items-center gap-2">
                        Excluir Conta
                      </div>
                      <div class="font-interface text-xs text-textSecondary">
                        Remover permanentemente conta e histórico
                      </div>
                    </div>
                  </div>

                  <span class="px-2 py-0.5 text-[10px] font-technical font-semibold bg-rose-500/10 text-rose-400/50 border border-rose-500/20 rounded">
                    Desabilitado
                  </span>
                </div>

              </div>
            </div>

            <!-- Grupo: Preferências do Leitor e Interface -->
            <div class="flex flex-col gap-3">
              <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary opacity-60">
                Preferências de Leitura & Aparência
              </span>

              <div class="flex flex-col rounded-xl bg-white/[0.02] border border-divider divide-y divide-divider overflow-hidden">

                <!-- Item 4: Escolher Idioma (Desabilitado) -->
                <div class="p-4 flex items-center justify-between gap-4 opacity-60 cursor-not-allowed">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="p-2 rounded-lg bg-white/5 text-textSecondary">
                      <GlobeIcon class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-interface text-sm text-textPrimary font-medium">
                        Idioma do Sistema
                      </div>
                      <div class="font-interface text-xs text-textSecondary">
                        Português (Brasil)
                      </div>
                    </div>
                  </div>

                  <span class="px-2 py-0.5 text-[10px] font-technical font-semibold bg-white/5 text-textSecondary border border-white/10 rounded shrink-0">
                    Desabilitado
                  </span>
                </div>

                <!-- Item 5: Animação ao Virar as Páginas -->
                <div class="p-4 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="p-2 rounded-lg bg-accent/10 text-accent">
                      <SparklesIcon class="w-4 h-4" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-interface text-sm text-textPrimary font-medium">
                        Animação ao virar páginas
                      </div>
                      <div class="font-interface text-xs text-textSecondary">
                        Efeito 3D visual de folhear páginas no leitor
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="pageAnimationEnabled = !pageAnimationEnabled"
                    role="switch"
                    :aria-checked="pageAnimationEnabled"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/50"
                    :class="pageAnimationEnabled ? 'bg-accent' : 'bg-white/10'"
                    title="Alternar animação ao virar páginas"
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="pageAnimationEnabled ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </div>

              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-divider bg-white/[0.01] flex items-center justify-between shrink-0">
            <span class="font-technical text-[10px] text-textSecondary opacity-50">
              Aresta v1.0 • Configurações
            </span>
            <button
              @click="modal.close()"
              class="px-4 py-2 text-xs font-interface font-medium bg-white/5 hover:bg-white/10 text-textPrimary border border-divider rounded-xl transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import {
  SettingsIcon,
  XIcon,
  KeyRoundIcon,
  LogOutIcon,
  UserXIcon,
  GlobeIcon,
  SparklesIcon,
  LogInIcon,
} from 'lucide-vue-next'
import { useSettingsModal } from '~/composables/useSettingsModal'
import { useSettings } from '~/composables/useSettings'
import { useAuth } from '~/composables/useAuth'

const modal = useSettingsModal()
const { pageAnimationEnabled, loadFromServer } = useSettings()
const auth = useAuth()

watch(
  () => modal.isOpen.value,
  (open) => {
    if (open && auth.isLoggedIn.value) {
      void loadFromServer()
    }
  }
)

function handleLogout() {
  auth.logout()
  modal.close()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modal.isOpen.value) {
    modal.close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
