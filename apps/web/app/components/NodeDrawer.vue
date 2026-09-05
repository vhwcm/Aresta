<template>
  <div
    v-if="node"
    class="fixed inset-y-0 right-0 w-96 bg-bgPanel/95 backdrop-blur-xl border-l border-divider shadow-2xl z-50 flex flex-col transition-transform duration-300 transform translate-x-0 text-textPrimary"
  >
    <!-- Header da Gaveta -->
    <div class="p-6 border-b border-divider flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded-full shadow-md shrink-0" :style="{ backgroundColor: node.color || '#E57B55' }"></div>
        <h2 class="text-lg font-semibold font-interface truncate max-w-[200px]">{{ node.name }}</h2>
      </div>
      <button @click="$emit('close')" class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-all">
        <XIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Conteúdo Scrollável -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- Seção: Detalhes do Tema / Edição -->
      <div class="space-y-4 bg-white/5 border border-divider p-4 rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-technical uppercase font-bold tracking-widest text-textSecondary">Informações do Tema</span>
          <button v-if="!node.isRoot" @click="isEditing = !isEditing" class="text-xs text-accent hover:underline font-semibold">
            {{ isEditing ? 'Cancelar' : 'Editar' }}
          </button>
        </div>

        <div v-if="!isEditing" class="space-y-2">
          <p class="text-sm font-light text-textSecondary leading-relaxed">
            {{ node.description || 'Nenhuma descrição informada para este nó de tema.' }}
          </p>
        </div>

        <form v-else @submit.prevent="saveNodeDetails" class="space-y-3">
          <div>
            <label class="block text-xs font-technical text-textSecondary mb-1">Nome do Tema</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label class="block text-xs font-technical text-textSecondary mb-1">Cor de Destaque</label>
            <div class="flex items-center gap-2">
              <input v-model="editForm.color" type="color" class="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer" />
              <input v-model="editForm.color" type="text" class="flex-1 bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-technical text-textSecondary mb-1">Descrição</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
            ></textarea>
          </div>

          <button type="submit" class="w-full bg-accent text-white font-semibold py-2 rounded-xl text-xs hover:bg-accent/90 transition-all">
            Salvar Alterações
          </button>
        </form>
      <!-- Seção: Livreto Didático com IA -->
      <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SparklesIcon class="w-4 h-4 text-purple-400" />
          <span class="text-xs font-interface font-medium text-purple-200">Gerar Livreto sobre {{ node.name }}</span>
        </div>
        <NuxtLink
          to="/library"
          class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-interface text-xs font-semibold transition-all shadow-sm"
        >
          Criar IA
        </NuxtLink>
      </div>

      <!-- Seção: Livros Vinculados a este Tema -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <BookOpenIcon class="w-4 h-4 text-accent" />
            <span class="text-xs font-technical uppercase font-bold tracking-widest text-textSecondary">
              Livros Conectados ({{ node.books?.length || 0 }})
            </span>
          </div>

          <button @click="showAddBookSelect = !showAddBookSelect" class="text-xs text-accent hover:underline font-semibold flex items-center gap-1">
            <PlusIcon class="w-3.5 h-3.5" />
            <span>Vincular Livro</span>
          </button>
        </div>

        <!-- Seletor de Livros para Vincular -->
        <div v-if="showAddBookSelect" class="bg-white/5 border border-accent/30 p-3 rounded-2xl space-y-2">
          <label class="block text-xs text-textSecondary">Selecione um livro da sua estante:</label>
          <select v-model="selectedUserBookId" class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-accent">
            <option :value="null" disabled>Escolha um livro...</option>
            <option v-for="b in availableUserBooks" :key="b.userBookId" :value="b.userBookId">
              {{ b.title }} ({{ getStatusLabel(b.status) }})
            </option>
          </select>
          <button
            @click="handleLinkBook"
            :disabled="!selectedUserBookId"
            class="w-full bg-accent text-white font-semibold py-1.5 rounded-xl text-xs hover:bg-accent/90 disabled:opacity-50 transition-all"
          >
            Confirmar Vínculo
          </button>
        </div>

        <!-- Lista de Livros -->
        <div v-if="node.books && node.books.length > 0" class="space-y-2">
          <div
            v-for="book in node.books"
            :key="book.userBookId"
            class="flex items-center justify-between bg-bgApp/70 border border-divider/60 p-3 rounded-xl hover:border-accent/40 transition-all"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-12 rounded bg-white/5 border border-divider shrink-0 overflow-hidden flex items-center justify-center">
                <img v-if="book.coverPath" :src="getCoverUrl(book.coverPath, book.bookId)" class="w-full h-full object-cover" />
                <BookIcon v-else class="w-4 h-4 text-textSecondary" />
              </div>

              <div>
                <h4 class="text-xs font-semibold text-textPrimary line-clamp-1">{{ book.title }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="text-[10px] font-technical uppercase font-bold px-2 py-0.5 rounded-md"
                    :class="getStatusBadgeClass(book.status)"
                  >
                    {{ getStatusLabel(book.status) }}
                  </span>
                  <span
                    class="text-[9px] font-technical uppercase font-bold px-1.5 py-0.5 rounded"
                    :class="getBookFormat(book.filePath) === 'EPUB' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'"
                  >
                    {{ getBookFormat(book.filePath) }}
                  </span>
                  <span v-if="book.status === 'LENDO'" class="text-[10px] text-textSecondary font-technical">
                    Pág. {{ book.currentPage }}
                  </span>
                </div>
              </div>
            </div>

            <button @click="handleUnlinkBook(book.userBookId)" class="p-1.5 rounded-lg text-textSecondary hover:text-rose-400 hover:bg-white/10 transition-all" title="Desvincular livro deste tema">
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div v-else class="text-center py-6 border border-dashed border-divider rounded-2xl text-xs text-textSecondary">
          Nenhum livro vinculado a este nó ainda.
        </div>
      </div>
    </div>

    <!-- Rodapé com ação de Excluir Nó -->
    <div class="p-4 border-t border-divider bg-bgApp/50">
      <div v-if="node.isRoot" class="flex items-center justify-center gap-2 text-center text-xs font-technical text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl font-semibold">
        <BrainIcon class="w-4 h-4 text-amber-400 shrink-0" />
        <span>Nó Central Agregador (Origem do Mapa Mental)</span>
      </div>
      <button
        v-else
        @click="handleDeleteNode"
        class="w-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
      >
        <Trash2Icon class="w-4 h-4" />
        <span>Excluir Nó de Tema</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { GraphNode, UserBookItem } from '~/interfaces/graph'
import { XIcon, BookOpenIcon, BookIcon, PlusIcon, TrashIcon, Trash2Icon, BrainIcon, SparklesIcon } from 'lucide-vue-next'
import { getCoverUrl, getBookFormat } from '~/utils/cover'

const props = defineProps<{
  node: GraphNode | null
  allUserBooks: UserBookItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updateNode', payload: { id: string | number, name: string, color: string, description: string }): void
  (e: 'deleteNode', id: string | number): void
  (e: 'linkBook', payload: { nodeId: string | number, userBookId: number }): void
  (e: 'unlinkBook', payload: { nodeId: string | number, userBookId: number }): void
}>()

const isEditing = ref(false)
const showAddBookSelect = ref(false)
const selectedUserBookId = ref<number | null>(null)

const editForm = ref({
  name: '',
  color: '#E57B55',
  description: ''
})

watch(() => props.node, (newNode) => {
  if (newNode) {
    editForm.value = {
      name: newNode.name,
      color: newNode.color || '#E57B55',
      description: newNode.description || ''
    }
    isEditing.value = false
    showAddBookSelect.value = false
    selectedUserBookId.value = null
  }
}, { immediate: true })

const availableUserBooks = computed(() => {
  if (!props.node) return props.allUserBooks
  const linkedBookIds = new Set((props.node.books || []).map((b: any) => b.userBookId || b.id))
  return props.allUserBooks.filter((b: UserBookItem) => !linkedBookIds.has(b.userBookId))
})

const saveNodeDetails = () => {
  if (!props.node) return
  emit('updateNode', {
    id: props.node.id,
    name: editForm.value.name,
    color: editForm.value.color,
    description: editForm.value.description
  })
  isEditing.value = false
}

const handleLinkBook = () => {
  if (!props.node || !selectedUserBookId.value) return
  emit('linkBook', { nodeId: props.node.id, userBookId: selectedUserBookId.value })
  selectedUserBookId.value = null
  showAddBookSelect.value = false
}

const handleUnlinkBook = (userBookId: number) => {
  if (!props.node) return
  emit('unlinkBook', { nodeId: props.node.id, userBookId })
}

const handleDeleteNode = () => {
  if (!props.node) return
  if (confirm(`Tem certeza que deseja excluir o nó "${props.node.name}"?`)) {
    emit('deleteNode', props.node.id)
    emit('close')
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
</script>
