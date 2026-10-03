<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden bg-transparent text-textPrimary">

    <!-- VISUALIZAÇÃO 1: GRAFO INTERATIVO -->
    <div v-if="!selectedNode" class="w-full h-full flex flex-col relative overflow-hidden">
      <!-- State de Carregamento -->
      <div v-if="loading && (!graphData.nodes || graphData.nodes.length === 0)" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bgApp/90">
        <div class="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
        <p class="text-[10px] font-technical text-textSecondary uppercase tracking-widest">Carregando Conexões...</p>
      </div>

      <!-- Canvas D3 no modo configurado (compacto ou tela cheia) -->
      <GraphCanvas
        :nodes="graphData.nodes || []"
        :edges="graphData.edges || []"
        :is-compact="isCompact"
        :search-query="searchQuery"
        :show-controls="showControls"
        @select-node="handleSelectNode"
        @open-create-node="isCreateModalOpen = true"
        @open-connect-modal="isConnectModalOpen = true"
        @connect-nodes="handleConnectNodesPayload"
        @delete-edge="handleDeleteEdge"
      />
    </div>

    <!-- VISUALIZAÇÃO 2: LISTA DE LIVROS DO MAPA MENTAL CLICADO -->
    <div v-else class="w-full h-full flex flex-col bg-bgPanel/95 backdrop-blur-xl z-20 relative animate-fadeIn">

      <!-- Cabeçalho com Seta de Voltar para o Grafo e Ações de Tag -->
      <div class="p-5 border-b border-divider flex flex-col gap-4 bg-bgApp/40">
        <div class="flex items-center justify-between gap-3">
          <button
            @click="goBackToGraph"
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors w-fit group cursor-pointer"
            title="Voltar para o Grafo"
          >
            <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar para o Grafo</span>
          </button>

          <!-- Ações Rápidas da Tag (Editar / Excluir) -->
          <div v-if="canManageTag && !isEditingTag && !isDeletingTag" class="flex items-center gap-1.5 shrink-0">
            <button
              @click="startEditTag"
              data-testid="sidebar-edit-tag-btn"
              class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary border border-divider text-xs font-interface font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Editar tag"
            >
              <Edit2Icon class="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              @click="startDeleteTag"
              data-testid="sidebar-delete-tag-btn"
              class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-interface font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Excluir tag"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        <!-- MODO EDIÇÃO DA TAG -->
        <div v-if="isEditingTag" class="p-3.5 rounded-2xl bg-white/[0.03] border border-accent/40 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-technical uppercase font-bold tracking-wider text-accent">
              Editar Tag
            </span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                @click="editTagColor = color"
                class="w-4 h-4 rounded-full border transition-all"
                :class="editTagColor === color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <input
              v-model="editTagName"
              ref="editTagNameInputRef"
              type="text"
              placeholder="Nome da tag..."
              maxlength="30"
              class="bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
              @keyup.enter="handleSaveEditTag"
              @keyup.esc="cancelEditTag"
            />
            <input
              v-model="editTagDescription"
              type="text"
              placeholder="Descrição (opcional)..."
              class="bg-bgApp border border-divider rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent"
              @keyup.enter="handleSaveEditTag"
              @keyup.esc="cancelEditTag"
            />
          </div>

          <span v-if="editTagError" class="text-[11px] text-rose-400 font-interface">
            {{ editTagError }}
          </span>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              @click="cancelEditTag"
              class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              @click="handleSaveEditTag"
              :disabled="!editTagName.trim() || isSavingTag"
              data-testid="save-sidebar-edit-tag-btn"
              class="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckIcon class="w-3.5 h-3.5" />
              <span>{{ isSavingTag ? 'Salvando...' : 'Salvar' }}</span>
            </button>
          </div>
        </div>

        <!-- MODO CONFIRMAÇÃO DE EXCLUSÃO DA TAG -->
        <div v-else-if="isDeletingTag" class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2.5 text-xs">
          <div class="flex items-center gap-2 text-rose-300 font-medium">
            <AlertTriangleIcon class="w-4 h-4 shrink-0 text-rose-400" />
            <span>Excluir tag «{{ selectedNode.name }}»?</span>
          </div>
          <p class="text-textSecondary text-[11px] leading-relaxed">
            <template v-if="displayedBooks.length > 0">
              Esta tag está vinculada a <strong class="text-rose-300">{{ displayedBooks.length }}</strong> {{ displayedBooks.length === 1 ? 'livro' : 'livros' }}.
              Ela será desvinculada dos livros, notas e do grafo.
            </template>
            <template v-else>
              A tag será removida permanentemente do acervo e do grafo de conhecimento.
            </template>
          </p>
          <span v-if="deleteTagError" class="text-[11px] text-rose-400 font-interface">
            {{ deleteTagError }}
          </span>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              @click="cancelDeleteTag"
              class="px-3 py-1.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              @click="handleConfirmDeleteTag"
              :disabled="isDeletingTagLoading"
              data-testid="confirm-sidebar-delete-tag-btn"
              class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>{{ isDeletingTagLoading ? 'Excluindo...' : 'Confirmar Exclusão' }}</span>
            </button>
          </div>
        </div>

        <!-- MODO VISUALIZAÇÃO PADRÃO DO CABEÇALHO -->
        <div v-else class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 rounded-full shadow-md shrink-0"
              :style="{ backgroundColor: selectedNode.color || '#E57B55' }"
            ></div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base sm:text-lg font-bold font-interface text-textPrimary leading-tight truncate max-w-[280px]">
                {{ selectedNode.name }}
              </h2>
              <p class="text-xs text-textSecondary font-technical mt-0.5">
                {{ displayedBooks.length }} {{ displayedBooks.length === 1 ? 'livro conectado' : 'livros conectados' }}
              </p>
            </div>
          </div>

          <p v-if="selectedNode.description" class="text-xs sm:text-sm text-textSecondary font-light leading-relaxed line-clamp-2">
            {{ selectedNode.description }}
          </p>
        </div>
      </div>

      <!-- Corpo da Lista de Livros -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div v-if="displayedBooks.length > 0" class="space-y-2.5">
          <div
            v-for="book in displayedBooks"
            :key="book.userBookId"
            @click="handleSelectBook(book)"
            class="flex items-center justify-between bg-bgApp/80 border border-divider/70 hover:border-accent/40 p-3.5 rounded-2xl transition-all group cursor-pointer"
          >
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <!-- Capa do Livro -->
              <div class="w-11 h-16 rounded-lg bg-white/5 border border-divider shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                <img
                  v-if="book.coverPath"
                  :src="getCoverUrl(book.coverPath, book.bookId || (book as any).id)"
                  :alt="book.title"
                  class="w-full h-full object-cover"
                />
                <BookIcon v-else class="w-5 h-5 text-textSecondary" />
              </div>

              <!-- Detalhes do Livro -->
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-semibold text-textPrimary truncate group-hover:text-accent transition-colors">
                  {{ book.title }}
                </h4>

                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    class="text-[10px] sm:text-xs font-technical uppercase font-bold px-2 py-0.5 rounded-md"
                    :class="getStatusBadgeClass(book.status)"
                  >
                    {{ getStatusLabel(book.status) }}
                  </span>
                  <span v-if="book.status === 'LENDO' && book.currentPage" class="text-xs text-textSecondary font-technical">
                    Pág. {{ book.currentPage }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botão de Leitura / Ação: abre gaveta de anotações do livro com opção de leitura -->
            <button
              @click.stop="handleSelectBook(book)"
              class="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all shrink-0 ml-2 cursor-pointer"
              title="Ver anotações deste livro"
            >
              <BookOpenIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-else class="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-divider rounded-2xl text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <BookOpenIcon class="w-6 h-6 text-textSecondary opacity-50" />
          </div>
          <div>
            <p class="text-sm font-semibold text-textPrimary">Nenhum livro neste tema</p>
            <p class="text-xs text-textSecondary mt-1">Este mapa mental ainda não possui livros vinculados.</p>
          </div>
          <NuxtLink
            to="/canvas?tab=notes"
            class="text-xs sm:text-sm text-accent font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Gerenciar Conexões em Mapa Mental</span>
            <ExternalLinkIcon class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>

      <!-- Rodapé com Ação de Voltar -->
      <div class="p-4 border-t border-divider bg-bgApp/60 shrink-0">
        <button
          @click="goBackToGraph"
          class="w-full bg-white/5 border border-divider text-textPrimary hover:bg-white/10 font-semibold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Voltar para o Grafo</span>
        </button>
      </div>
    </div>

    <!-- Gaveta Lateral de Anotações do Livro com Opção de Leitura -->
    <BookAnnotationsDrawer
      :is-open="isBookDrawerOpen"
      :book="selectedBookNode"
      @close="isBookDrawerOpen = false; selectedBookNode = null"
    />

    <!-- Gaveta Lateral de Detalhes e Edição da Nota -->
    <NoteDetailDrawer
      :is-open="isNoteDrawerOpen"
      :node="selectedNoteNode"
      @close="isNoteDrawerOpen = false; selectedNoteNode = null"
      @deleted="handleNoteDeleted"
      @saved="handleNoteSaved"
    />

    <!-- Modais para Criação e Conexão de Nós diretamente no sidebar -->
    <CreateNodeModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateNode"
    />

    <ConnectNodesModal
      :is-open="isConnectModalOpen"
      :nodes="graphData.nodes || []"
      @close="isConnectModalOpen = false"
      @connect="handleConnectNodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  BookIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  Edit2Icon,
  Trash2Icon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-vue-next'
import type { GraphNode, UserBookItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { useUserBooks } from '~/composables/useUserBooks'
import { getCoverUrl } from '~/utils/cover'

import GraphCanvas from '~/components/GraphCanvas.vue'
import BookAnnotationsDrawer from '~/components/graph/BookAnnotationsDrawer.vue'
import NoteDetailDrawer from '~/components/graph/NoteDetailDrawer.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

const props = withDefaults(defineProps<{
  isCompact?: boolean
  searchQuery?: string
  showControls?: boolean
}>(), {
  isCompact: true,
  searchQuery: '',
  showControls: false,
})

const emit = defineEmits<{
  (e: 'selectNode', node: GraphNode): void
}>()

const presetColors = ['#E57B55', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']

const { graphData, loading, fetchGraph, createNode, updateNode, deleteNode, createConnection, linkBookToNode, unlinkEdge } = useGraph()
const { userBooks, fetchUserBooks } = useUserBooks()

const handleDeleteEdge = async (edge: any) => {
  try {
    await unlinkEdge(edge)
  } catch (err) {
    console.warn('[SidebarGraph] Falha ao desvincular aresta:', err)
  }
}

const selectedNode = ref<GraphNode | null>(null)
const selectedBookNode = ref<GraphNode | null>(null)
const selectedNoteNode = ref<GraphNode | null>(null)
const isBookDrawerOpen = ref(false)
const isNoteDrawerOpen = ref(false)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const canManageTag = computed(() => {
  if (!selectedNode.value) return false
  if (selectedNode.value.isRoot || selectedNode.value.id === -999) return false
  const isBook = selectedNode.value.type === 'book' || String(selectedNode.value.id).startsWith('book-')
  return !isBook
})

const isEditingTag = ref(false)
const editTagName = ref('')
const editTagColor = ref('#E57B55')
const editTagDescription = ref('')
const isSavingTag = ref(false)
const editTagError = ref<string | null>(null)
const editTagNameInputRef = ref<HTMLInputElement | null>(null)

const isDeletingTag = ref(false)
const isDeletingTagLoading = ref(false)
const deleteTagError = ref<string | null>(null)

const startEditTag = () => {
  if (!selectedNode.value) return
  isDeletingTag.value = false
  isEditingTag.value = true
  editTagName.value = selectedNode.value.name || ''
  editTagColor.value = selectedNode.value.color || '#E57B55'
  editTagDescription.value = selectedNode.value.description || ''
  editTagError.value = null
  nextTick(() => {
    editTagNameInputRef.value?.focus()
  })
}

const cancelEditTag = () => {
  isEditingTag.value = false
  editTagName.value = ''
  editTagDescription.value = ''
  editTagError.value = null
}

const handleSaveEditTag = async () => {
  if (!selectedNode.value) return
  const name = editTagName.value.trim()
  if (!name) {
    editTagError.value = 'O nome da tag não pode ser vazio'
    return
  }
  if (name.length > 30) {
    editTagError.value = 'O nome da tag deve ter no máximo 30 caracteres'
    return
  }
  isSavingTag.value = true
  editTagError.value = null
  try {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
    const targetId = !isNaN(rawId) ? rawId : selectedNode.value.id
    await updateNode(targetId, name, editTagColor.value, editTagDescription.value)
    selectedNode.value = {
      ...selectedNode.value,
      name,
      color: editTagColor.value,
      description: editTagDescription.value,
    }
    isEditingTag.value = false
  } catch (err: any) {
    console.error('Erro ao atualizar tag:', err)
    editTagError.value = err?.data?.error || err?.message || 'Falha ao atualizar tag'
  } finally {
    isSavingTag.value = false
  }
}

const startDeleteTag = () => {
  isEditingTag.value = false
  isDeletingTag.value = true
  deleteTagError.value = null
}

const cancelDeleteTag = () => {
  isDeletingTag.value = false
  deleteTagError.value = null
}

const handleConfirmDeleteTag = async () => {
  if (!selectedNode.value) return
  isDeletingTagLoading.value = true
  deleteTagError.value = null
  try {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
    const targetId = !isNaN(rawId) ? rawId : selectedNode.value.id
    await deleteNode(targetId)
    isDeletingTag.value = false
    selectedNode.value = null
  } catch (err: any) {
    console.error('Erro ao excluir tag:', err)
    deleteTagError.value = err?.data?.error || err?.message || 'Falha ao excluir tag'
  } finally {
    isDeletingTagLoading.value = false
  }
}

const handleSelectNode = (node: GraphNode) => {
  emit('selectNode', node)

  // 1. Livros: único que abre a gaveta de anotações antes
  const isBook = node.type === 'book' || String(node.id).startsWith('book-')
  if (isBook) {
    selectedBookNode.value = node
    isBookDrawerOpen.value = true
    return
  }

  // 2. Anotação dentro de livro: abre a gaveta de anotações daquele livro
  if (node.type === 'annotation') {
    const bookId = Number((node as any).bookId)
    if (bookId) {
      selectedBookNode.value = {
        id: `book-${bookId}`,
        rawId: bookId,
        type: 'book',
        name: (node as any).bookTitle || 'Livro',
        fullTitle: (node as any).bookTitle || 'Livro',
        coverPath: (node as any).bookCover || null,
      }
      isBookDrawerOpen.value = true
      return
    }
  }

  // 3. Notas de desenho: abrem direto na página de desenho
  const isDrawing = Boolean(node.isDrawing || (node as any).is_drawing || String(node.id).includes('drawing'))
  if (isDrawing) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    navigateTo(`/canvas/drawing/${rawId}`)
    return
  }

  // 4. Quadros: abrem direto no canvas
  if (node.type === 'canvas' || String(node.id).startsWith('canvas-')) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^canvas-/, '')
    navigateTo(`/canvas/${rawId}`)
    return
  }

  // 5. Notas: abrem direto no editor de notas
  const isNote = node.type === 'note' || String(node.id).startsWith('note-')
  if (isNote) {
    const rawId = node.rawId != null ? String(node.rawId) : String(node.id).replace(/^note-/, '')
    navigateTo(`/canvas?id=${encodeURIComponent(rawId)}&view=note-editor`)
    return
  }

  if (node.type === 'folder') {
    const folderName = node.rawId || node.name
    navigateTo(`/canvas?folder=${encodeURIComponent(String(folderName))}`)
    return
  }

  selectedNode.value = node
}

const handleSelectBook = (book: any) => {
  selectedBookNode.value = {
    id: `book-${book.bookId || book.id}`,
    rawId: book.bookId || book.id,
    type: 'book',
    name: book.title,
    fullTitle: book.title,
    author: book.author,
    summary: book.summary,
    coverPath: book.coverPath,
    filePath: book.filePath,
  }
  isBookDrawerOpen.value = true
}

const goBackToGraph = () => {
  isEditingTag.value = false
  isDeletingTag.value = false
  editTagError.value = null
  deleteTagError.value = null
  selectedNode.value = null
}

const handleNoteDeleted = () => {
  selectedNoteNode.value = null
  fetchGraph()
}

const handleNoteSaved = () => {
  fetchGraph()
}

const displayedBooks = computed<UserBookItem[]>(() => {
  if (!selectedNode.value) return []
  // Se for o Nó Central (Meu Conhecimento)
  if (selectedNode.value.isRoot || selectedNode.value.id === -999) {
    return userBooks.value
  }
  // Se porventura um nó de livro for selecionado como nó ativo
  if (selectedNode.value.type === 'book' || String(selectedNode.value.id).startsWith('book-')) {
    const rawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace('book-', ''))
    const found = userBooks.value.filter((ub) => ub.bookId === rawId)
    if (found.length > 0) return found
    return [{
      userBookId: rawId,
      bookId: rawId,
      title: selectedNode.value.name || selectedNode.value.title || '',
      author: selectedNode.value.author,
      summary: selectedNode.value.summary,
      coverPath: selectedNode.value.coverPath,
      status: 'LENDO',
      currentPage: 1,
    }]
  }
  // Caso contrário, livros vinculados a este tema específico
  const themeRawId = selectedNode.value.rawId || Number(String(selectedNode.value.id).replace(/^theme-/, ''))
  const themeName = (selectedNode.value.name || selectedNode.value.title || '').trim().toLowerCase()
  const themeNodeId = String(selectedNode.value.id)

  // 1. Livros vinculados nos metadados de userBooks (por id do tema ou nome da tag)
  const matchedBooks: UserBookItem[] = userBooks.value.filter((b) => {
    return (b.themes || []).some((t: any) => {
      const tNumId = Number(typeof t === 'object' ? (t.rawId ?? t.id) : t)
      if (themeRawId && !isNaN(tNumId) && tNumId === themeRawId) return true
      const tName = (typeof t === 'object' ? t.name : String(t) || '').trim().toLowerCase()
      if (themeName && tName && tName === themeName) return true
      return false
    })
  })

  // 2. Livros conectados via arestas do grafo
  const connectedBookIds = new Set<number>()
  for (const edge of graphData.value.edges || []) {
    const s = String(typeof edge.source === 'object' ? (edge.source as any).id : edge.source)
    const t = String(typeof edge.target === 'object' ? (edge.target as any).id : edge.target)
    if (s === themeNodeId && t.startsWith('book-')) {
      const bId = Number(t.replace('book-', ''))
      if (!isNaN(bId)) connectedBookIds.add(bId)
    } else if (t === themeNodeId && s.startsWith('book-')) {
      const bId = Number(s.replace('book-', ''))
      if (!isNaN(bId)) connectedBookIds.add(bId)
    }
  }

  for (const bId of connectedBookIds) {
    if (!matchedBooks.some((b) => b.bookId === bId || (b as any).id === bId)) {
      const found = userBooks.value.find((b) => b.bookId === bId || (b as any).id === bId)
      if (found) {
        matchedBooks.push(found)
      } else {
        const bookNode = (graphData.value.nodes || []).find((n) => n.id === `book-${bId}` || n.rawId === bId)
        if (bookNode) {
          matchedBooks.push({
            userBookId: bId,
            bookId: bId,
            title: bookNode.name || bookNode.title || 'Livro',
            author: bookNode.author,
            summary: bookNode.summary,
            coverPath: bookNode.coverPath,
            status: 'LENDO',
            currentPage: 1,
          })
        }
      }
    }
  }

  if (matchedBooks.length > 0) return matchedBooks

  // 3. Fallback para nós que já possuam books no payload
  return ((selectedNode.value as any).books || []) as any
})

const handleCreateNode = async (payload: { name: string, color: string, description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
  isCreateModalOpen.value = false
}

const handleConnectNodes = async (payload: { sourceId: number, targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
  isConnectModalOpen.value = false
}

const handleConnectNodesPayload = async (payload: any) => {
  try {
    const sourceId = payload.sourceId ?? payload.sourceRawId
    const targetId = payload.targetId ?? payload.targetRawId
    if (sourceId !== undefined && targetId !== undefined) {
      await createConnection(sourceId, targetId)
    }
  } catch (err) {
    console.warn('[SidebarGraph] Falha ao persistir conexão:', err)
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

onMounted(() => {
  fetchGraph()
  fetchUserBooks()
})
</script>
