<template>
  <div
    ref="selectRef"
    class="relative inline-block text-left"
    :class="customClass"
    @keydown.esc.prevent="closeDropdown"
  >
    <!-- Trigger Button -->
    <button
      type="button"
      data-testid="app-select-trigger"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown.down.prevent="onKeyDown"
      @keydown.up.prevent="onKeyUp"
      @keydown.enter.prevent="onKeyEnter"
      class="group relative flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-interface select-none cursor-pointer shadow-sm outline-none w-full"
      :class="[
        isOpen
          ? 'border-accent/80 ring-1 ring-accent/30 bg-bgPanel text-textPrimary'
          : 'border-divider bg-bgPanel hover:bg-white/[0.04] hover:border-accent/40 text-textPrimary',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      ]"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <div class="flex items-center gap-2 truncate min-w-0">
        <component
          :is="icon"
          v-if="icon"
          class="w-3.5 h-3.5 text-textSecondary shrink-0 group-hover:text-accent transition-colors"
        />
        <span class="truncate text-left" :title="selectedLabel">
          {{ selectedLabel || placeholder }}
        </span>
        <span
          v-if="selectedCount !== undefined"
          class="font-technical text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-textSecondary font-normal shrink-0"
        >
          ({{ selectedCount }})
        </span>
      </div>

      <ChevronDownIcon
        class="w-3.5 h-3.5 text-textSecondary shrink-0 group-hover:text-textPrimary transition-transform duration-200"
        :class="{ 'rotate-180 text-accent': isOpen }"
      />
    </button>

    <!-- Dropdown Panel -->
    <div
      v-if="isOpen"
      data-testid="app-select-dropdown"
      class="absolute left-0 top-full mt-1.5 min-w-full w-max max-w-[280px] sm:max-w-sm z-50 bg-bgPanel/95 backdrop-blur-xl border border-divider shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 text-textPrimary animate-in fade-in zoom-in-95 duration-150"
      role="listbox"
    >
      <!-- Campo de Busca (se ativado ou mais de 6 itens) -->
      <div
        v-if="isSearchVisible"
        class="p-1 pb-1.5 border-b border-divider/60 flex items-center gap-2"
      >
        <SearchIcon class="w-3.5 h-3.5 text-textSecondary shrink-0 ml-1" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          data-testid="app-select-search-input"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full bg-transparent text-xs text-textPrimary placeholder:text-textSecondary/60 focus:outline-none font-interface"
          @keydown.stop
          @keydown.esc.prevent="closeDropdown"
          @keydown.down.prevent="onKeyDown"
          @keydown.up.prevent="onKeyUp"
          @keydown.enter.prevent="onKeyEnter"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="p-0.5 text-textSecondary hover:text-textPrimary rounded-md"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>

      <!-- Lista de Opções -->
      <div class="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 p-0.5">
        <button
          v-for="(opt, idx) in filteredNormalizedOptions"
          :key="String(opt.value)"
          :data-testid="`app-select-option-${opt.value}`"
          type="button"
          role="option"
          :aria-selected="isSelected(opt.value)"
          @click="selectOption(opt)"
          class="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all text-left w-full select-none cursor-pointer"
          :class="[
            isSelected(opt.value)
              ? 'bg-accent/15 text-accent font-medium border border-accent/25'
              : highlightedIndex === idx
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-textPrimary hover:bg-white/5 hover:text-white border border-transparent'
          ]"
        >
          <div class="flex items-center gap-2 truncate min-w-0">
            <component
              :is="opt.icon"
              v-if="opt.icon"
              class="w-3.5 h-3.5 text-textSecondary shrink-0"
              :class="{ 'text-accent': isSelected(opt.value) }"
            />
            <span class="truncate" :title="opt.label">
              {{ opt.label }}
            </span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              v-if="opt.count !== undefined"
              class="font-technical text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-textSecondary"
            >
              ({{ opt.count }})
            </span>
            <CheckIcon
              v-if="isSelected(opt.value)"
              class="w-3.5 h-3.5 text-accent shrink-0"
            />
          </div>
        </button>

        <!-- Estado Vazio da Busca -->
        <div
          v-if="filteredNormalizedOptions.length === 0"
          class="p-3 text-center text-xs text-textSecondary font-technical"
        >
          Nenhuma opção encontrada
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, type Component } from 'vue'
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-vue-next'

export interface SelectOption {
  value: string | number
  label: string
  count?: number | string
  icon?: Component
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options?: (SelectOption | string | number)[]
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
    searchable?: boolean
    icon?: Component
    customClass?: string
  }>(),
  {
    modelValue: '',
    options: () => [],
    placeholder: 'Selecione uma opção',
    searchPlaceholder: 'Buscar...',
    disabled: false,
    searchable: undefined,
    icon: undefined,
    customClass: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const selectRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const highlightedIndex = ref(-1)

// Normalizar opções para formato uniforme
const normalizedOptions = computed<SelectOption[]>(() => {
  return (props.options || []).map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt as SelectOption
    }
    return {
      value: opt,
      label: String(opt)
    }
  })
})

const isSearchVisible = computed(() => {
  if (props.searchable !== undefined) return props.searchable
  return normalizedOptions.value.length >= 7
})

const filteredNormalizedOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return normalizedOptions.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return normalizedOptions.value.filter((opt) =>
    opt.label.toLowerCase().includes(query)
  )
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find(
    (opt) => String(opt.value) === String(props.modelValue)
  )
})

const selectedLabel = computed(() => {
  return selectedOption.value?.label || ''
})

const selectedCount = computed(() => {
  return selectedOption.value?.count
})

const isSelected = (val: string | number) => {
  return String(props.modelValue) === String(val)
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    highlightedIndex.value = -1
    if (isSearchVisible.value) {
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

const selectOption = (opt: SelectOption) => {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  closeDropdown()
}

const onKeyDown = () => {
  if (!isOpen.value) {
    toggleDropdown()
    return
  }
  const count = filteredNormalizedOptions.value.length
  if (count === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % count
}

const onKeyUp = () => {
  if (!isOpen.value) {
    toggleDropdown()
    return
  }
  const count = filteredNormalizedOptions.value.length
  if (count === 0) return
  highlightedIndex.value = (highlightedIndex.value - 1 + count) % count
}

const onKeyEnter = () => {
  if (
    isOpen.value &&
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredNormalizedOptions.value.length
  ) {
    const opt = filteredNormalizedOptions.value[highlightedIndex.value]
    if (opt) {
      selectOption(opt)
    }
  } else if (!isOpen.value) {
    toggleDropdown()
  }
}

const handleClickOutside = (e: MouseEvent | TouchEvent) => {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
})
</script>
