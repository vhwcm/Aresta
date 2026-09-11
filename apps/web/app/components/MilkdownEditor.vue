<template>
  <div class="milkdown-aresta-wrapper" :style="{ minHeight: minHeight || '100%' }">
    <div ref="editorRef" class="milkdown" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  defaultValueCtx,
  Editor,
  editorViewCtx,
  editorViewOptionsCtx,
  rootCtx,
  serializerCtx,
  parserCtx
} from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { listener, listenerCtx } from '@milkdown/plugin-listener'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    readonly?: boolean
    minHeight?: string
    autofocus?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: 'Escreva sua anotação...',
    readonly: false,
    minHeight: '100%',
    autofocus: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)
let milkdownEditor: Editor | null = null
let currentMarkdown = props.modelValue || ''
let isInternalUpdate = false

const createEditor = async () => {
  if (!editorRef.value) return

  try {
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, editorRef.value!)
        ctx.set(defaultValueCtx, props.modelValue || '')

        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => !props.readonly,
          attributes: {
            class: 'editor custom-scrollbar prose dark:prose-invert max-w-none focus:outline-none',
            'data-placeholder': props.placeholder
          }
        }))

        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown === prevMarkdown) return
          currentMarkdown = markdown
          isInternalUpdate = true
          emit('update:modelValue', markdown)
          emit('change', markdown)
          nextTick(() => {
            isInternalUpdate = false
          })
        })

        ctx.get(listenerCtx).focus(() => {
          emit('focus')
        })

        ctx.get(listenerCtx).blur(() => {
          emit('blur')
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .create()

    milkdownEditor = editor

    if (props.autofocus) {
      nextTick(() => {
        focus()
      })
    }
  } catch (err) {
    console.error('Erro ao inicializar Milkdown Live Preview Editor:', err)
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    const safeVal = newVal || ''
    if (isInternalUpdate || safeVal === currentMarkdown) return

    currentMarkdown = safeVal
    if (milkdownEditor) {
      milkdownEditor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const parser = ctx.get(parserCtx)
        const doc = parser(safeVal)
        if (doc) {
          const state = view.state
          const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content)
          view.dispatch(tr)
        }
      })
    }
  }
)

const focus = () => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      view.focus()
    })
  }
}

const getContent = (): string => {
  if (!milkdownEditor) return currentMarkdown
  let md = currentMarkdown
  milkdownEditor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const serializer = ctx.get(serializerCtx)
    md = serializer(view.state.doc)
  })
  return md
}

defineExpose({
  focus,
  getContent
})

onMounted(() => {
  createEditor()
})

onUnmounted(() => {
  if (milkdownEditor) {
    milkdownEditor.destroy()
    milkdownEditor = null
  }
})
</script>

<style>
@import '~/assets/css/milkdown-aresta-theme.css';
</style>
