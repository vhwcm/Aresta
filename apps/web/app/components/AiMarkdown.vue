<template>
  <div
    ref="containerRef"
    class="ai-markdown-content font-interface text-sm md:text-base leading-relaxed text-textPrimary/90 space-y-3"
    v-html="parsedHtml"
  ></div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUpdated, nextTick } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

const containerRef = ref<HTMLElement | null>(null)

marked.setOptions({
  gfm: true,
  breaks: true,
})

const parsedHtml = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content)
})

const enhanceCodeBlocks = () => {
  if (!containerRef.value) return

  const pres = containerRef.value.querySelectorAll('pre')
  pres.forEach((pre) => {
    if (pre.dataset.enhanced) return
    pre.dataset.enhanced = 'true'

    const code = pre.querySelector('code')
    const className = code?.className || ''
    const match = className.match(/language-(\w+)/)
    const lang = match ? match[1] : 'code'

    const wrapper = document.createElement('div')
    wrapper.className = 'my-4 rounded-xl border border-divider bg-bgPanel overflow-hidden shadow-lg group'

    const header = document.createElement('div')
    header.className = 'flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-divider font-technical text-[11px] uppercase tracking-wider text-textSecondary'

    const langLabel = document.createElement('span')
    langLabel.textContent = lang

    const copyBtn = document.createElement('button')
    copyBtn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 border border-divider hover:bg-black/10 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-colors text-[11px] cursor-pointer'
    copyBtn.innerHTML = `
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
      <span>Copiar</span>
    `

    copyBtn.addEventListener('click', () => {
      const textToCopy = code?.textContent || pre.textContent || ''
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.classList.add('text-accent', 'border-accent/40')
        copyBtn.querySelector('span')!.textContent = 'Copiado!'
        setTimeout(() => {
          copyBtn.classList.remove('text-accent', 'border-accent/40')
          copyBtn.querySelector('span')!.textContent = 'Copiar'
        }, 2000)
      })
    })

    header.appendChild(langLabel)
    header.appendChild(copyBtn)

    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(header)
    wrapper.appendChild(pre)
    pre.className = 'p-4 overflow-x-auto text-[13px] font-technical text-gray-200 leading-relaxed bg-transparent border-none'
  })
}

onMounted(() => {
  nextTick(enhanceCodeBlocks)
})

onUpdated(() => {
  nextTick(enhanceCodeBlocks)
})
</script>

<style scoped>
.ai-markdown-content :deep(h1) {
  font-family: 'Newsreader', serif;
  font-size: 1.65rem;
  font-weight: 400;
  color: #F2F2F2;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.ai-markdown-content :deep(h2) {
  font-family: 'Newsreader', serif;
  font-size: 1.35rem;
  font-weight: 400;
  color: #F2F2F2;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.35rem;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  line-height: 1.35;
}

.ai-markdown-content :deep(h3) {
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #F2F2F2;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.ai-markdown-content :deep(h4) {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #F2F2F2;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
}

.ai-markdown-content :deep(p) {
  margin-bottom: 0.85rem;
  color: rgba(242, 242, 242, 0.9);
  line-height: 1.65;
}

.ai-markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-markdown-content :deep(strong) {
  color: #FFFFFF;
  font-weight: 600;
}

.ai-markdown-content :deep(em) {
  font-style: italic;
  color: #A0A3A8;
}

.ai-markdown-content :deep(a) {
  color: #E57B55;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.2s ease;
}

.ai-markdown-content :deep(a:hover) {
  color: #F09473;
}

.ai-markdown-content :deep(code:not(pre code)) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  color: #E57B55;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.ai-markdown-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.4rem;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.ai-markdown-content :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.4rem;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.ai-markdown-content :deep(li) {
  margin-bottom: 0.35rem;
  color: rgba(242, 242, 242, 0.9);
  line-height: 1.6;
}

.ai-markdown-content :deep(blockquote) {
  border-left: 3px solid #E57B55;
  padding-left: 1rem;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  font-style: italic;
  color: #7A7D84;
}

.ai-markdown-content :deep(table) {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-collapse: collapse;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  overflow: hidden;
}

.ai-markdown-content :deep(th) {
  background-color: rgba(255, 255, 255, 0.04);
  padding: 0.65rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7A7D84;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.ai-markdown-content :deep(td) {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(242, 242, 242, 0.9);
}

.ai-markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

.ai-markdown-content :deep(hr) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}
</style>
