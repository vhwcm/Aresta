<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
    <div class="bg-bgPanel border border-divider rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 text-textPrimary">
      <div class="flex items-center justify-between border-b border-divider pb-4">
        <h3 class="text-lg font-semibold font-interface">Conectar Temas no Grafo</h3>
        <button @click="$emit('close')" class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-all">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-technical text-textSecondary mb-1">Tema de Origem</label>
          <select v-model="sourceId" required class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent">
            <option :value="null" disabled>Escolha o primeiro tema...</option>
            <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-technical text-textSecondary mb-1">Tema de Destino</label>
          <select v-model="targetId" required class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent">
            <option :value="null" disabled>Escolha o segundo tema...</option>
            <option v-for="node in availableTargets" :key="node.id" :value="node.id">{{ node.name }}</option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-divider">
          <button type="button" @click="$emit('close')" class="px-4 py-2 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-all">
            Cancelar
          </button>
          <button type="submit" :disabled="!sourceId || !targetId" class="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-all shadow-lg">
            Criar Conexão
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GraphNode } from '~/interfaces/graph'
import { XIcon } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  nodes: GraphNode[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'connect', payload: { sourceId: number, targetId: number }): void
}>()

const sourceId = ref<number | null>(null)
const targetId = ref<number | null>(null)

const availableTargets = computed(() => {
  if (!sourceId.value) return props.nodes
  return props.nodes.filter(n => n.id !== sourceId.value)
})

const handleSubmit = () => {
  if (!sourceId.value || !targetId.value) return
  emit('connect', { sourceId: sourceId.value, targetId: targetId.value })
  sourceId.value = null
  targetId.value = null
  emit('close')
}
</script>
