export type ReaderTheme = 'sepia' | 'white' | 'black'

export interface RasterizeOptions {
  fontSize?: number
  fontFamily?: string
  lineHeight?: number
}

/**
 * Aplica o filtro de tema diretamente nos pixels do canvas 2D nativo
 */
export function applyThemeToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ReaderTheme,
): void {
  if (theme === 'white') return

  if (theme === 'sepia') {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = '#f5eedc'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
    return
  }

  if (theme === 'black') {
    try {
      const imgData = ctx.getImageData(0, 0, width, height)
      const data = imgData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!
        const g = data[i + 1]!
        const b = data[i + 2]!

        // Inversão com tom escuro suave (#121214)
        data[i] = Math.round((255 - r) * 0.07 + 18)
        data[i + 1] = Math.round((255 - g) * 0.07 + 18)
        data[i + 2] = Math.round((255 - b) * 0.08 + 20)
      }
      ctx.putImageData(imgData, 0, 0)
    } catch {
      // Caso ocorra erro de contexto em ambiente restrito, preenche fundo
      ctx.fillStyle = '#121214'
      ctx.fillRect(0, 0, width, height)
    }
  }
}

/**
 * Renderiza texto puro formatado com máxima legibilidade e segurança contra taint.
 */
export function drawPlainTextToCanvas(
  targetCanvas: HTMLCanvasElement,
  text: string,
  width: number,
  height: number,
  theme: ReaderTheme = 'sepia',
  options?: RasterizeOptions,
): void {
  const dpr = typeof window !== 'undefined' ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3)) : 2
  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)

  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return

  const bgColor = theme === 'sepia' ? '#f5eedc' : theme === 'black' ? '#121214' : '#ffffff'
  const textColor = theme === 'sepia' ? '#2a2521' : theme === 'black' ? '#e4e4e7' : '#1a1a1a'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, renderW, renderH)

  if (!text || !text.trim()) return

  ctx.save()
  ctx.scale(dpr, dpr)

  const fontSize = options?.fontSize && options.fontSize > 0 ? options.fontSize : 18
  const fontFamily = options?.fontFamily || "'Newsreader', Georgia, serif"
  const baseLineHeight = options?.lineHeight && options.lineHeight > 0
    ? options.lineHeight
    : Math.round(fontSize * 1.65)

  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = textColor

  const paddingX = width > 700 ? 48 : (width > 500 ? 38 : 32)
  const paddingY = height > 700 ? 40 : (height > 500 ? 32 : 28)
  const maxWidth = width - (2 * paddingX)
  let y = paddingY + fontSize

  const paragraphs = text.includes('\n') ? text.split('\n') : [text]

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const rawPara = paragraphs[pIdx]!.trim()
    if (!rawPara) {
      y += Math.round(baseLineHeight * 0.5)
      continue
    }

    // Título ou cabeçalho de abertura (ex: "Capítulo Primeiro", "1", "I")
    const isHeading = (pIdx === 0 && rawPara.length < 60 && (/^(cap[íi]tulo|chapter|[0-9]+|[ivxlcdm]+)\b/i.test(rawPara) || rawPara === rawPara.toUpperCase()))
    if (isHeading) {
      const headingSize = Math.round(fontSize * 1.35)
      ctx.font = `bold ${headingSize}px ${fontFamily}`
      const headingMetrics = ctx.measureText(rawPara)
      const headingX = Math.max(paddingX, (width - headingMetrics.width) / 2)
      if (y <= height - paddingY) {
        ctx.fillText(rawPara, headingX, y)
      }
      y += Math.round(headingSize * 1.8)
      ctx.font = `${fontSize}px ${fontFamily}`
      continue
    }

    const words = rawPara.split(/\s+/)
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        if (y <= height - paddingY) {
          ctx.fillText(currentLine, paddingX, y)
        }
        currentLine = word
        y += baseLineHeight
      } else {
        currentLine = testLine
      }
    }

    if (currentLine && y <= height - paddingY) {
      ctx.fillText(currentLine, paddingX, y)
      y += baseLineHeight
    }

    y += Math.round(fontSize * 0.4)
  }

  ctx.restore()
}

function drawNodeWords(
  textNode: Node,
  fullText: string,
  range: Range,
  containerRect: { top: number; left: number; bottom: number; right: number },
  fontSize: number,
  ctx: CanvasRenderingContext2D,
): number {
  let count = 0
  const regex = /\S+/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(fullText)) !== null) {
    const start = match.index
    const end = start + match[0].length

    try {
      range.setStart(textNode, start)
      range.setEnd(textNode, end)
      const rects = range.getClientRects()

      for (let i = 0; i < rects.length; i++) {
        const wr = rects[i]!
        if (
          wr.bottom > containerRect.top - 2 &&
          wr.top < containerRect.bottom + 2 &&
          wr.right > containerRect.left - 2 &&
          wr.left < containerRect.right + 2
        ) {
          const x = wr.left - containerRect.left
          const y = wr.top - containerRect.top + fontSize * 0.82
          ctx.fillText(match[0], x, y)
          count++
        }
      }
    } catch {
      // continua para próxima palavra se Range falhar
    }
  }

  return count
}

/**
 * Rasteriza com fidelidade geométrica pixel-perfect um contêiner DOM ou canvas PDF para um canvas alvo.
 * Utiliza medição de Range nos nós de texto reais para obter a exata posição x/y calculada pelo navegador,
 * preservando diagramação CSS multi-coluna, alinhamento justificado, recuo de parágrafo e pesos de fonte.
 * Mantém o canvas 100% origin-clean para textura Three.js WebGL.
 */
export function rasterizeElementToCanvas(
  containerEl: HTMLElement | null,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  theme: ReaderTheme = 'sepia',
  pdfCanvasEl?: HTMLCanvasElement | null,
  options?: RasterizeOptions,
): boolean {
  if (!targetCanvas) return false
  const dpr = typeof window !== 'undefined' ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3)) : 2
  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)

  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return false

  const bgColor = theme === 'sepia' ? '#f5eedc' : theme === 'black' ? '#121214' : '#ffffff'
  const textColor = theme === 'sepia' ? '#2a2521' : theme === 'black' ? '#e4e4e7' : '#1a1a1a'

  // 1. Fundo do tema
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, renderW, renderH)

  // 2. Se for documento PDF e o canvas nativo existir, desenha-o diretamente com aceleração GPU
  if (pdfCanvasEl && pdfCanvasEl.width > 0 && pdfCanvasEl.height > 0) {
    try {
      ctx.drawImage(pdfCanvasEl, 0, 0, renderW, renderH)
      if (theme === 'sepia' || theme === 'black') {
        applyThemeToCanvas(ctx, renderW, renderH, theme)
      }
      return true
    } catch {
      // continua para fallback de texto se drawImage falhar
    }
  }

  if (!containerEl) return false

  // 3. Renderização de conteúdo DOM com máxima fidelidade geométrica
  let drawnCount = 0
  const containerRect = containerEl.getBoundingClientRect ? containerEl.getBoundingClientRect() : {
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
  }

  const isJSDOM = containerRect.width === 0 && containerRect.height === 0

  ctx.save()
  ctx.scale(dpr, dpr)

  // 3.1 Imagens inseridas no texto (ilustrações, capas)
  if (!isJSDOM && typeof containerEl.querySelectorAll === 'function') {
    const imgs = containerEl.querySelectorAll('img')
    imgs.forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) return
      const r = img.getBoundingClientRect()
      if (
        r.bottom > containerRect.top &&
        r.top < containerRect.bottom &&
        r.right > containerRect.left &&
        r.left < containerRect.right
      ) {
        const x = r.left - containerRect.left
        const y = r.top - containerRect.top
        try {
          ctx.drawImage(img, x, y, r.width, r.height)
          drawnCount++
        } catch {
          // ignora erro de decodificação de imagem assíncrona
        }
      }
    })
  }

  // 3.2 Extração palavra por palavra via TreeWalker + Range (Posicionamento Pixel-Perfect NATIVO)
  if (!isJSDOM && typeof document !== 'undefined' && typeof document.createTreeWalker === 'function') {
    try {
      const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null)
      let textNode: Node | null
      const range = document.createRange()

      while ((textNode = walker.nextNode())) {
        const fullText = textNode.textContent
        if (!fullText || !fullText.trim()) continue

        const parent = textNode.parentElement
        if (!parent) continue

        const style = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
          ? window.getComputedStyle(parent)
          : null

        if (style && (style.visibility === 'hidden' || style.display === 'none')) {
          continue
        }

        const fontSize = style ? parseFloat(style.fontSize) || 16 : 16
        const fontWeight = style?.fontWeight || 'normal'
        const fontStyle = style?.fontStyle || 'normal'
        const fontFamily = style?.fontFamily || "'Newsreader', Georgia, serif"
        const color = (style?.color && style.color !== 'transparent' && style.color !== 'rgba(0, 0, 0, 0)')
          ? style.color
          : textColor

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.fillStyle = color

        drawnCount += drawNodeWords(textNode, fullText, range, containerRect, fontSize, ctx)
      }
    } catch {
      // continua para fallback se TreeWalker falhar
    }
  }

  ctx.restore()

  // 3.3 Fallback caso nenhum nó tenha sido renderizado (ex: JSDOM no ambiente de teste)
  if (drawnCount === 0) {
    const plainText = (containerEl.innerText || containerEl.textContent || '').trim()
    if (plainText) {
      drawPlainTextToCanvas(targetCanvas, plainText, width, height, theme, options)
      return true
    }
    return false
  }

  return true
}
