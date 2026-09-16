import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { renderInlineMarkdown, renderMarkdown } from '../app/utils/markdownFormat'

const g = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global) as any

if (typeof document !== 'undefined') {
  try {
    Object.defineProperty(document, 'compatMode', {
      value: 'CSS1Compat',
      configurable: true,
      writable: true,
    })
  } catch {}
}

if (g) {
  g.definePageMeta = vi.fn()
  g.defineNuxtRouteMiddleware = (fn: any) => fn
  g.navigateTo = vi.fn().mockResolvedValue(undefined)
  g.useRoute = () => ({
    path: '/',
    params: {},
    query: {},
    hash: '',
    fullPath: '/'
  })
  g.useRouter = () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })
  g.$fetch = vi.fn()
  g.renderInlineMarkdown = renderInlineMarkdown
  g.renderMarkdown = renderMarkdown
}

config.global.mocks = {
  ...config.global.mocks,
  renderInlineMarkdown,
  renderMarkdown,
}

;(config.global as any).config = (config.global as any).config || {}
;(config.global.config as any).globalProperties = {
  ...(config.global.config as any).globalProperties,
  renderInlineMarkdown,
  renderMarkdown,
}

