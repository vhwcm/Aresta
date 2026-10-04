<template>
  <div
    class="milkdown-aresta-wrapper"
    :style="{ minHeight: minHeight || '100%' }"
    @dragover.prevent
    @drop="handleEditorDrop"
    @paste="handleEditorPaste"
  >
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
import { clipboard } from '@milkdown/plugin-clipboard'
import { toggleMark, setBlockType } from '@milkdown/prose/commands'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { $prose } from '@milkdown/utils'
import { optimizeImageFile } from '~/utils/imageOptimizer'

/**
 * Plugin que pré-processa HTML colado de páginas web (Wikipedia, etc.)
 * para preservar links, limpar referências e corrigir caracteres especiais.
 */
const webPasteCleanup = $prose(() => {
  return new Plugin({
    key: new PluginKey('ARESTA_WEB_PASTE_CLEANUP'),
    props: {
      transformPastedHTML(html: string): string {
        // Detectar se é conteúdo da Wikipedia (ou qualquer conteúdo web com links)
        const isWikipedia = html.includes('wikipedia.org') || html.includes('wiki/')

        // 1. Converter links relativos da Wikipedia para absolutos
        if (isWikipedia) {
          // Links relativos /wiki/... → https://en.wikipedia.org/wiki/...
          // Detectar o idioma da Wikipedia a partir do HTML
          const langMatch = html.match(/https?:\/\/([a-z]{2,3})\.wikipedia\.org/)
          const wikiLang = langMatch ? langMatch[1] : 'en'
          const wikiBase = `https://${wikiLang}.wikipedia.org`

          // Converter href="/wiki/..." para href absoluto
          html = html.replace(/href="\/wiki\/([^"#]*?)"/g, `href="${wikiBase}/wiki/$1"`)
          // Converter href="/w/..." para href absoluto
          html = html.replace(/href="\/w\/([^"]*?)"/g, `href="${wikiBase}/w/$1"`)
        }

        // 2. Remover referências de citação [1], [2], ..., [edit], [citation needed]
        // Remove <sup> tags com classes de referência da Wikipedia
        html = html.replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
        // Remove <sup> tags com links de referência [edit]
        html = html.replace(/<sup[^>]*class="[^"]*noprint[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
        // Remove span.mw-editsection (botões [edit])
        html = html.replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')

        // 3. Remover elementos ocultos e de navegação da Wikipedia
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        html = html.replace(/<span[^>]*class="[^"]*mw-headline[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1')

        // 4. Limpar spans com estilos inline desnecessários mas preservar o conteúdo
        html = html.replace(/<span[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')

        // 5. Preservar conteúdo fonético/IPA: remover wrappers desnecessários
        // mas manter o texto e links intactos
        html = html.replace(/<span[^>]*class="[^"]*IPA[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1')

        // 6. Limpar tags <img> da Wikipedia apenas (ícones, badges, etc.)
        if (isWikipedia) {
          html = html.replace(/<img[^>]*>/gi, '')
        }

        return html
      }
    }
  })
})

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
      .use(clipboard)
      .use(webPasteCleanup)
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

watch(
  () => props.readonly,
  (newVal) => {
    if (milkdownEditor) {
      milkdownEditor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        view.setProps({
          editable: () => !newVal
        })
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

const toggleBold = () => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const markType = view.state.schema.marks.strong
      if (markType) toggleMark(markType)(view.state, view.dispatch)
      view.focus()
    })
  }
}

const toggleItalic = () => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const markType = view.state.schema.marks.em
      if (markType) toggleMark(markType)(view.state, view.dispatch)
      view.focus()
    })
  }
}

const setHeading = (level: 1 | 2 | 3) => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const nodeType = view.state.schema.nodes.heading
      if (nodeType) setBlockType(nodeType, { level })(view.state, view.dispatch)
      view.focus()
    })
  }
}

const setParagraph = () => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const nodeType = view.state.schema.nodes.paragraph
      if (nodeType) setBlockType(nodeType)(view.state, view.dispatch)
      view.focus()
    })
  }
}

const insertText = (text: string) => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state, dispatch } = view
      const tr = state.tr.insertText(text)
      dispatch(tr)
      view.focus()
    })
  }
}

const insertImage = (url: string, alt = 'Imagem', title = '') => {
  if (milkdownEditor) {
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state, dispatch } = view
      const imageType = state.schema.nodes.image
      if (imageType) {
        const node = imageType.create({ src: url, alt, title })
        const tr = state.tr.replaceSelectionWith(node)
        dispatch(tr)
      } else {
        const tr = state.tr.insertText(`![${alt}](${url})\n`)
        dispatch(tr)
      }
      view.focus()
    })
  }
}

const handleEditorDrop = async (e: DragEvent) => {
  const files = e.dataTransfer?.files
  const imageFiles = files ? Array.from(files).filter((f) => f.type.startsWith('image/')) : []

  if (imageFiles.length > 0) {
    e.preventDefault()
    e.stopPropagation()
    for (const file of imageFiles) {
      try {
        const { dataUrl } = await optimizeImageFile(file)
        if (dataUrl) {
          insertImage(dataUrl, file.name)
        }
      } catch (err) {
        console.error('Erro ao otimizar imagem no drop:', err)
      }
    }
    return
  }

  // Suporte a arrastar imagem diretamente de outra página web
  const uri = e.dataTransfer?.getData('text/uri-list') || ''
  const html = e.dataTransfer?.getData('text/html') || ''
  const text = e.dataTransfer?.getData('text/plain') || ''
  const htmlMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  const candidateUrl = ((htmlMatch && htmlMatch[1]) ? htmlMatch[1] : (uri || text)).trim()

  if (candidateUrl && (candidateUrl.startsWith('data:image/') || candidateUrl.startsWith('http://') || candidateUrl.startsWith('https://'))) {
    const isImage = htmlMatch || /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(candidateUrl) || candidateUrl.startsWith('data:image/')
    if (isImage) {
      e.preventDefault()
      e.stopPropagation()
      insertImage(candidateUrl, 'Imagem')
    }
  }
}

const handleEditorPaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item && item.type.startsWith('image/')) {
      e.preventDefault()
      e.stopPropagation()
      const file = item.getAsFile()
      if (!file) continue

      try {
        const { dataUrl } = await optimizeImageFile(file)
        if (dataUrl) {
          insertImage(dataUrl, 'Imagem')
        }
      } catch (err) {
        console.error('Erro ao otimizar imagem no paste:', err)
      }
      break
    }
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
  getContent,
  toggleBold,
  toggleItalic,
  setHeading,
  setParagraph,
  insertText,
  insertImage,
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
