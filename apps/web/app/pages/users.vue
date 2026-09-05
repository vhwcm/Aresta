<template>
  <div class="flex flex-col gap-10 pb-32">
    <!-- Header da Página -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2 mb-2">
          <UsersIcon class="w-3.5 h-3.5 text-accent" />
          Administração de Acessos
        </div>
        <h1 class="font-editorial text-4xl font-light text-textPrimary">
          Gestão de Usuários
        </h1>
        <p class="font-interface text-sm text-textSecondary mt-1">
          Cadastre, edite e gerencie o acesso de usuários no ecossistema Aresta.
        </p>
      </div>

      <button
        @click="openCreateModal"
        class="bg-textPrimary text-bgApp font-interface text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-lg self-start md:self-auto cursor-pointer"
      >
        <UserPlusIcon class="w-4 h-4" />
        Novo Usuário
      </button>
    </header>

    <!-- Barra de Filtros e Busca -->
    <section class="flex flex-col sm:flex-row items-center gap-4 bg-bgPanel/60 dark:bg-white/5 border border-divider p-4 rounded-2xl">
      <div class="relative flex-1 w-full">
        <SearchIcon class="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome ou email..."
          class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-11 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <select
          v-model="selectedRole"
          class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">Todos os Papéis</option>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>

        <select
          v-model="selectedStatus"
          class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>
    </section>

    <!-- Tabela de Usuários -->
    <div class="bg-bgPanel/60 dark:bg-white/5 border border-divider rounded-2xl overflow-hidden backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-divider font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary bg-black/[0.03] dark:bg-black/30">
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Usuário</th>
              <th class="px-6 py-4">Papel (Role)</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Cadastro</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-divider/50 font-interface text-sm text-textPrimary">
            <tr
              v-for="userItem in filteredUsers"
              :key="userItem.id"
              class="hover:bg-white/[0.03] transition-colors group"
            >
              <td class="px-6 py-4 font-technical text-xs text-textSecondary">
                #{{ userItem.id }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="font-medium text-textPrimary group-hover:text-accent transition-colors">{{ userItem.name }}</span>
                  <span class="text-xs text-textSecondary">{{ userItem.email }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="font-technical text-[10px] uppercase font-semibold px-2.5 py-1 rounded-md border"
                  :class="userItem.role === 'ADMIN' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-black/5 dark:bg-white/5 border-divider text-textSecondary'"
                >
                  {{ userItem.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 font-technical text-xs"
                  :class="userItem.isActive ? 'text-emerald-400' : 'text-rose-400'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="userItem.isActive ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                  {{ userItem.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-6 py-4 font-technical text-xs text-textSecondary">
                {{ formatDate(userItem.createdAt) }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(userItem)"
                    class="p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Editar Usuário"
                  >
                    <Edit3Icon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteUser(userItem.id)"
                    class="p-2 rounded-lg text-textSecondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir Usuário"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-textSecondary font-interface">
                <div class="flex flex-col items-center gap-3">
                  <UserXIcon class="w-8 h-8 opacity-40" />
                  <span>Nenhum usuário encontrado com os filtros aplicados.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro / Edição -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div class="w-full max-w-md bg-bgPanel border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        <div class="flex items-center justify-between border-b border-divider pb-4">
          <h3 class="font-editorial text-2xl font-light text-textPrimary">
            {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
          </h3>
          <button @click="closeModal" class="text-textSecondary hover:text-textPrimary transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveUser" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">Nome Completo</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ex: Ana Silva"
              class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="ana@empresa.com"
              class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              {{ isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha' }}
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!isEditing"
              placeholder="••••••••"
              class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">Papel (Role)</label>
              <select
                v-model="form.role"
                class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-3 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">Status</label>
              <select
                v-model="form.isActive"
                class="bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl px-3 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent"
              >
                <option :value="true">Ativo</option>
                <option :value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-divider">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 rounded-xl text-xs font-interface text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="bg-textPrimary text-bgApp font-interface text-xs font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              {{ isEditing ? 'Salvar Alterações' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UsersIcon, UserPlusIcon, SearchIcon, Edit3Icon, Trash2Icon, UserXIcon, XIcon } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  middleware: 'admin'
})

interface UserItem {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
}

const API_BASE = 'http://localhost:7070/api'
const auth = useAuth()

const users = ref<UserItem[]>([])
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'USER',
  isActive: true
})

const getHeaders = (): HeadersInit => {
  return (auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : {}) as HeadersInit
}

const fetchUsers = async () => {
  try {
    const data = await $fetch<UserItem[]>(`${API_BASE}/users`, {
      headers: getHeaders()
    })
    users.value = data
  } catch (e) {
    console.warn('Servidor offline ou token expirado, usando dados locais de demonstração.')
    users.value = [
      { id: 100, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true, createdAt: '2026-08-07T12:00:00Z' },
      { id: 1, name: 'Dev Aresta', email: 'dev@aresta.org', role: 'ADMIN', isActive: true, createdAt: '2026-08-07T12:00:00Z' }
    ]
  }
}

onMounted(() => {
  fetchUsers()
})

const filteredUsers = computed(() => {
  return (users.value || []).filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = !selectedRole.value || u.role === selectedRole.value
    const matchesStatus = !selectedStatus.value ||
                          (selectedStatus.value === 'active' && u.isActive) ||
                          (selectedStatus.value === 'inactive' && !u.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })
})

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', email: '', password: '', role: 'USER', isActive: true }
  showModal.value = true
}

const openEditModal = (userItem: UserItem) => {
  isEditing.value = true
  editingId.value = userItem.id
  form.value = {
    name: userItem.name,
    email: userItem.email,
    password: '',
    role: userItem.role,
    isActive: userItem.isActive
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUser = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`${API_BASE}/users/${editingId.value}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: form.value
      })
    } else {
      await $fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: form.value
      })
    }
  } catch (e) {
    console.error('Erro na API REST backend:', e)
  }
  await fetchUsers()
  closeModal()
}

const deleteUser = async (id: number) => {
  if (!confirm('Deseja realmente remover este usuário?')) return
  try {
    await $fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  } catch (e) {
    console.error('Erro ao deletar via API:', e)
  }
  await fetchUsers()
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recente'
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>
