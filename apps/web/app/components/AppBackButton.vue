<template>
  <button
    type="button"
    :class="buttonClasses"
    :title="title || 'Voltar para a página anterior'"
    :aria-label="title || 'Voltar para a página anterior'"
    :data-testid="testId || 'app-back-button'"
    @click="handleClick"
  >
    <ArrowLeftIcon :class="iconClasses" />
    <span v-if="text || $slots.default" :class="textClasses">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    fallback?: string
    text?: string
    title?: string
    variant?: 'editorial' | 'button' | 'ghost' | 'chip' | 'icon'
    iconClass?: string
    testId?: string
    customClick?: () => void
  }>(),
  {
    fallback: '/',
    text: 'Voltar',
    title: 'Voltar para a página anterior',
    variant: 'editorial',
    iconClass: '',
    testId: 'app-back-button'
  }
)

const emit = defineEmits<{
  (e: 'click'): void
}>()

const getRouter = () => {
  try {
    if (typeof useRouter === 'function') {
      return useRouter()
    }
  } catch {
    // fallback if router not injected in unit test environment
  }
  return null
}

const buttonClasses = computed(() => {
  if (props.variant === 'button' || props.variant === 'icon') {
    return 'p-2 rounded-xl bg-bgElevated/80 hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 group'
  }
  if (props.variant === 'chip') {
    return 'px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textSecondary hover:text-accent text-xs font-interface transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 group'
  }
  if (props.variant === 'ghost') {
    return 'p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 group'
  }
  // Editorial (default)
  return 'inline-flex items-center gap-1.5 font-technical text-xs text-textSecondary hover:text-textPrimary transition-colors group cursor-pointer'
})

const iconClasses = computed(() => {
  if (props.iconClass) return props.iconClass
  if (props.variant === 'button' || props.variant === 'icon') {
    return 'w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-accent'
  }
  return 'w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5'
})

const textClasses = computed(() => {
  if (props.variant === 'icon') return 'sr-only'
  return ''
})

const handleClick = () => {
  emit('click')
  if (props.customClick) {
    props.customClick()
    return
  }
  const router = getRouter()
  if (router?.back && typeof window !== 'undefined' && window.history.state?.back) {
    router.back()
  } else if (router?.back && typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else if (router?.push) {
    void router.push(props.fallback || '/')
  } else if (typeof window !== 'undefined') {
    window.location.href = props.fallback || '/'
  }
}
</script>
