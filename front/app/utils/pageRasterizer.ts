/**
 * pageRasterizer.ts - Módulo de rasterização de alta performance para texturas 3D do leitor Aresta
 * 
 * Converte elementos DOM (EPUB, Livreto Didático) e canvases (PDF) em texturas Canvas 2D
 * 100% origin-clean para consumo direto pelo motor Three.js WebGL (ShaderMaterial).
 * 
 * Elimina problemas de telas pretas/brancas e canvases tainted durante a virada 3D da folha.
 */

export type ReaderTheme = 'sepia' | 'white' | 'black'

/**
 * Aplica filtro de cor de tema diretamente aos pixels do canvas (para PDFs em modo sépia/escuro)
 */
export function applyThemeToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ReaderTheme,
): void {
  if (theme === 'sepia') {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = '#f5eedc'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  } else if (theme === 'black') {
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data
    for (let i = 0; i < d.length; i += 4) {
      const invR = 255 - (d[i] ?? 0)
      const invG = 255 - (d[i + 1] ?? 0)
      const invB = 255 - (d[i + 2] ?? 0)
      d[i] = Math.round(18 + (invR / 255) * (228 - 18))
      d[i + 1] = Math.round(18 + (invG / 255) * (228 - 18))
      d[i + 2] = Math.round(20 + (invB / 255) * (231 - 20))
    }
    ctx.putImageData(imgData, 0, 0)
  }
}

/**
 * Renderiza texto puro estruturado em parágrafos diretamente no canvas
 */
export function drawPlainTextToCanvas(
  targetCanvas: HTMLCanvasElement,
  text: string,
  width: number,
  height: number,
  theme: ReaderTheme = 'sepia',
): void {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
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
  ctx.font = '16px Newsreader, Georgia, serif'
  ctx.fillStyle = textColor

  const paddingX = width > 500 ? 36 : 20
  const paddingY = height > 600 ? 44 : 24
  const maxWidth = width - 2 * paddingX
  const lineHeight = 26
  let y = paddingY + 16

  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) {
      y += lineHeight * 0.5
      continue
    }

    const words = trimmed.split(/\s+/)
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        if (y <= height - 20) {
          ctx.fillText(currentLine, paddingX, y)
        }
        currentLine = word
        y += lineHeight
      } else {
        currentLine = testLine
      }
    }

    if (currentLine && y <= height - 20) {
      ctx.fillText(currentLine, paddingX, y)
      y += lineHeight
    }
  }

  ctx.restore()
}

/**
 * Rasteriza com máxima fidelidade visual um contêiner DOM ou canvas PDF para um canvas alvo.
 * Mantém o canvas 100% origin-clean para permitir uso direto como textura Three.js WebGL.
 */
export function rasterizeElementToCanvas(
  containerEl: HTMLElement,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  theme: ReaderTheme = 'sepia',
  pdfCanvasEl?: HTMLCanvasElement | null,
): void {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
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
      return
    } catch {
      // continua para fallback de texto se drawImage falhar
    }
  }

  // 3. Renderização de conteúdo HTML / EPUB / Didactic
  if (!containerEl) return

  const containerRect = containerEl.getBoundingClientRect ? containerEl.getBoundingClientRect() : {
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
  }

  // Se estiver em ambiente JSDOM / HappyDOM sem dimensões reais
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
        } catch {
          // ignora se imagem não estiver decodificada
        }
      }
    })
  }

  // 3.2 Percorre blocos de texto formatados
  const selector = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, .didactic-heading, .didactic-paragraph, .chapter-title, .title, .subtitle, .callout-header, .callout-body'
  const textBlocks = typeof containerEl.querySelectorAll === 'function'
    ? Array.from(containerEl.querySelectorAll<HTMLElement>(selector))
    : []

  // Filtra blocos que contenham filhos que também sejam blocos selecionados (evita duplicar texto)
  const leafBlocks = textBlocks.filter((el) => {
    return el.querySelector(selector) === null
  })

  if (leafBlocks.length > 0 && !isJSDOM) {
    leafBlocks.forEach((el) => {
      const r = el.getBoundingClientRect()
      // Ignora se estiver fora da página visível atual
      if (
        r.bottom <= containerRect.top + 2 ||
        r.top >= containerRect.bottom - 2 ||
        r.right <= containerRect.left + 2 ||
        r.left >= containerRect.right - 2
      ) {
        return
      }

      const text = (el.innerText || el.textContent || '').trim()
      if (!text) return

      const style = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
        ? window.getComputedStyle(el)
        : null

      const fontSize = style ? parseFloat(style.fontSize) || 16 : 16
      const fontWeight = style?.fontWeight || 'normal'
      const fontStyle = style?.fontStyle || 'normal'
      const fontFamily = style?.fontFamily || 'Newsreader, Georgia, serif'
      const textAlign = style?.textAlign || 'left'

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = (style?.color && style.color !== 'transparent' && style.color !== 'rgba(0, 0, 0, 0)')
        ? style.color
        : textColor

      const rawLineHeight = style ? parseFloat(style.lineHeight) : NaN
      const lineHeight = !isNaN(rawLineHeight) && rawLineHeight > 0 ? rawLineHeight : fontSize * 1.6

      const x = Math.max(16, r.left - containerRect.left)
      const maxWidth = Math.min(width - 32, r.width > 0 ? r.width : width - 2 * x)
      let y = (r.top - containerRect.top) + fontSize * 0.9

      const words = text.split(/\s+/)
      let currentLine = ''

      for (let i = 0; i < words.length; i++) {
        const word = words[i]!
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && currentLine) {
          let lineX = x
          if (textAlign === 'center') {
            lineX = x + Math.max(0, (maxWidth - ctx.measureText(currentLine).width) / 2)
          } else if (textAlign === 'right') {
            lineX = x + Math.max(0, maxWidth - ctx.measureText(currentLine).width)
          }
          if (y >= 0 && y <= height + fontSize) {
            ctx.fillText(currentLine, lineX, y)
          }
          currentLine = word
          y += lineHeight
        } else {
          currentLine = testLine
        }
      }

      if (currentLine && y >= 0 && y <= height + fontSize) {
        let lineX = x
        if (textAlign === 'center') {
          lineX = x + Math.max(0, (maxWidth - ctx.measureText(currentLine).width) / 2)
        } else if (textAlign === 'right') {
          lineX = x + Math.max(0, maxWidth - ctx.measureText(currentLine).width)
        }
        ctx.fillText(currentLine, lineX, y)
      }
    })
  } else {
    // Fallback: se não houver blocos ou estiver em JSDOM, extrai o texto do contêiner
    const plainText = (containerEl.innerText || containerEl.textContent || '').trim()
    if (plainText) {
      ctx.restore()
      drawPlainTextToCanvas(targetCanvas, plainText, width, height, theme)
      return
    }
  }

  ctx.restore()
}
