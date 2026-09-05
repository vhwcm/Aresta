<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
    <div class="bg-bgPanel border border-divider rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 text-textPrimary">
      <div class="flex items-center justify-between border-b border-divider pb-4">
        <h3 class="text-lg font-semibold font-interface">Criar Novo Nó de Tema</h3>
        <button @click="$emit('close')" class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-all">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-technical text-textSecondary mb-1">Nome do Tema *</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Ex: Filosofia Stoica, Algoritmos, IA"
            class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label class="block text-xs font-technical text-textSecondary mb-1">Cor do Nó</label>
          <div class="flex items-center gap-3">
            <input v-model="color" type="color" class="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer" />
            <div class="flex items-center gap-1.5">
              <button
                v-for="c in presetColors"
                :key="c"
                type="button"
                @click="color = c"
                class="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                :style="{ backgroundColor: c }"
              ></button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-technical text-textSecondary mb-1">Descrição Opcional</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Anotações ou resumos sobre o conceito..."
            class="w-full bg-bgApp border border-divider rounded-xl px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-divider">
          <button type="button" @click="$emit('close')" class="px-4 py-2 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-all">
            Cancelar
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-lg">
            Criar Tema
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XIcon } from 'lucide-vue-next'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { name: string, color: string, description: string }): void
}>()

const name = ref('')
const color = ref('#E57B55')
const description = ref('')

const presetColors = ['#E57B55', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#06B6D4']

const handleSubmit = () => {
  if (!name.value.trim()) return
  emit('create', { name: name.value.trim(), color: color.value, description: description.value.trim() })
  name.value = ''
  description.value = ''
  color.value = '#E57B55'
  emit('close')
}
</script>
