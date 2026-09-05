import { ref, computed } from 'vue'

export interface TypographyFont {
  id: string
  name: string
  fontFamily: string
  category: string
  description: string
}

export const READER_FONTS: TypographyFont[] = [
  {
    id: 'newsreader',
    name: 'Newsreader',
    fontFamily: "'Newsreader', Georgia, serif",
    category: 'Serif Editorial',
    description: 'Estilo editorial refinado e clássico, ideal para literatura e livros longos.',
  },
  {
    id: 'literata',
    name: 'Literata',
    fontFamily: "'Literata', Georgia, serif",
    category: 'Serif Digital',
    description: 'Desenvolvida especificamente para conforto visual em telas digitais de e-books.',
  },
  {
    id: 'lora',
    name: 'Lora',
    fontFamily: "'Lora', Georgia, serif",
    category: 'Serif Suave',
    description: 'Curvas caligráficas suaves com excelente contraste e legibilidade contínua.',
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    fontFamily: "'Merriweather', Georgia, serif",
    category: 'Serif Encorpada',
    description: 'Desenho encorpado e formas amplas para leitura sem fadiga em qualquer resolução.',
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    category: 'Sans-Serif Moderna',
    description: 'Geometria neutra, limpa e moderna para quem prefere leitura sem serifa.',
  },
]

const STORAGE_KEY = 'aresta_reader_font'
const activeFontId = ref<string>('newsreader')
let isInitialized = false

function initTypography() {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true
  try {
    const settingsRaw = localStorage.getItem('aresta_settings')
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw)
      if (parsed.epubFontFamily && READER_FONTS.some((f) => f.id === parsed.epubFontFamily)) {
        activeFontId.value = parsed.epubFontFamily
        return
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && READER_FONTS.some((f) => f.id === saved)) {
      activeFontId.value = saved
    }
  } catch {
    // Ignorar erro de localStorage
  }
}

export function useReaderTypography() {
  initTypography()

  const currentFont = computed<TypographyFont>(() => {
    return READER_FONTS.find((f) => f.id === activeFontId.value) || READER_FONTS[0]!
  })

  const setFont = (fontId: string) => {
    const found = READER_FONTS.find((f) => f.id === fontId)
    if (!found) return
    activeFontId.value = fontId
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, fontId)
      } catch {
        // Ignorar quota error
      }
    }
  }

  return {
    fonts: READER_FONTS,
    currentFont,
    activeFontId: computed(() => activeFontId.value),
    setFont,
  }
}
