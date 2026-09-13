import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')

// 1. Decode PNG helper
function decodePng(filePath) {
  const buf = fs.readFileSync(filePath)
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idatChunks = []

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.slice(pos + 4, pos + 8).toString('ascii')
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8)
      height = buf.readUInt32BE(pos + 12)
      colorType = buf[pos + 17]
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(pos + 8, pos + 8 + len))
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks))
  const stride = width * 4 + 1
  const uncompressed = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride]
    const srcOffset = y * stride + 1
    const dstOffset = y * width * 4
    for (let x = 0; x < width * 4; x++) {
      const val = decompressed[srcOffset + x]
      const a = x >= 4 ? uncompressed[dstOffset + x - 4] : 0
      const b = y > 0 ? uncompressed[dstOffset - width * 4 + x] : 0
      const c = x >= 4 && y > 0 ? uncompressed[dstOffset - width * 4 + x - 4] : 0
      let pr = 0
      if (filter === 1) pr = a
      else if (filter === 2) pr = b
      else if (filter === 3) pr = Math.floor((a + b) / 2)
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        if (pa <= pb && pa <= pc) pr = a
        else if (pb <= pc) pr = b
        else pr = c
      }
      uncompressed[dstOffset + x] = (val + pr) & 0xff
    }
  }

  return { width, height, rgba: uncompressed }
}

// 2. CRC32 helper
function crc32(buf) {
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crcTable[n] = c >>> 0
  }
  let crc = 0 ^ -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff]
  }
  return ((crc ^ -1) >>> 0)
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf), 0)
  return Buffer.concat([len, t, data, crc])
}

// 3. Encode PNG helper
function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colorType RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const filtered = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0 // Filter None
    rgbaBuffer.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const idat = zlib.deflateSync(filtered, { level: 9 })
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

// 4. Encode ICO helper (wraps PNGs)
function encodeIco(pngBuffers, sizes) {
  const count = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = Icon
  header.writeUInt16LE(count, 4) // Number of images

  const dirEntries = []
  let currentOffset = 6 + count * 16

  for (let i = 0; i < count; i++) {
    const size = sizes[i]
    const data = pngBuffers[i]
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry[2] = 0 // Color count
    entry[3] = 0 // Reserved
    entry.writeUInt16LE(1, 4) // Color planes
    entry.writeUInt16LE(32, 6) // Bits per pixel
    entry.writeUInt32LE(data.length, 8) // Size of image data
    entry.writeUInt32LE(currentOffset, 12) // Offset of image data
    dirEntries.push(entry)
    currentOffset += data.length
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers])
}

// 5. High-quality box-filtering downsampler
function resampleCrop(src, crop, dstSize) {
  const dst = Buffer.alloc(dstSize * dstSize * 4)
  const cropW = crop.maxX - crop.minX
  const cropH = crop.maxY - crop.minY

  for (let dy = 0; dy < dstSize; dy++) {
    for (let dx = 0; dx < dstSize; dx++) {
      const srcX0 = crop.minX + (dx / dstSize) * cropW
      const srcX1 = crop.minX + ((dx + 1) / dstSize) * cropW
      const srcY0 = crop.minY + (dy / dstSize) * cropH
      const srcY1 = crop.minY + ((dy + 1) / dstSize) * cropH

      const startX = Math.floor(srcX0)
      const endX = Math.min(src.width - 1, Math.ceil(srcX1))
      const startY = Math.floor(srcY0)
      const endY = Math.min(src.height - 1, Math.ceil(srcY1))

      let rSum = 0
      let gSum = 0
      let bSum = 0
      let aSum = 0
      let weightSum = 0

      for (let sy = startY; sy <= endY; sy++) {
        const yWeight = Math.max(0, Math.min(sy + 1, srcY1) - Math.max(sy, srcY0))
        if (yWeight <= 0) continue

        for (let sx = startX; sx <= endX; sx++) {
          const xWeight = Math.max(0, Math.min(sx + 1, srcX1) - Math.max(sx, srcX0))
          if (xWeight <= 0) continue

          const w = xWeight * yWeight
          const idx = (sy * src.width + sx) * 4
          const a = src.rgba[idx + 3]

          // Premultiplied alpha weighting for smooth edges
          rSum += src.rgba[idx] * (a / 255) * w
          gSum += src.rgba[idx + 1] * (a / 255) * w
          bSum += src.rgba[idx + 2] * (a / 255) * w
          aSum += a * w
          weightSum += w
        }
      }

      const dstIdx = (dy * dstSize + dx) * 4
      if (weightSum > 0 && aSum > 0) {
        const finalA = Math.min(255, Math.round(aSum / weightSum))
        const unalpha = finalA > 0 ? 255 / finalA : 0
        dst[dstIdx] = Math.min(255, Math.max(0, Math.round((rSum / weightSum) * unalpha)))
        dst[dstIdx + 1] = Math.min(255, Math.max(0, Math.round((gSum / weightSum) * unalpha)))
        dst[dstIdx + 2] = Math.min(255, Math.max(0, Math.round((bSum / weightSum) * unalpha)))
        dst[dstIdx + 3] = finalA
      } else {
        dst[dstIdx] = 0
        dst[dstIdx + 1] = 0
        dst[dstIdx + 2] = 0
        dst[dstIdx + 3] = 0
      }
    }
  }

  return dst
}

function main() {
  console.log('--- Gerando Favicons Otimizados de Alta Definição do Aresta ---')

  const logoFile = path.join(publicDir, 'logo_aresta_sem_fundo.png')
  const src = decodePng(logoFile)
  console.log(`Imagem fonte carregada: ${src.width}x${src.height}`)

  // Encontrar Bounding Box exata dos pixels visíveis
  let minX = src.width
  let maxX = 0
  let minY = src.height
  let maxY = 0

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const a = src.rgba[(y * src.width + x) * 4 + 3]
      if (a > 15) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  console.log(`Bounding Box identificada: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`)
  const contentW = maxX - minX + 1
  const contentH = maxY - minY + 1
  console.log(`Dimensões do conteúdo: ${contentW}x${contentH}`)

  // Criar quadrado com margem mínima de 2% para respiração sem cortar antialiasing
  const maxDim = Math.max(contentW, contentH)
  const padding = maxDim * 0.02
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const halfSpan = (maxDim / 2) + padding

  const crop = {
    minX: centerX - halfSpan,
    maxX: centerX + halfSpan,
    minY: centerY - halfSpan,
    maxY: centerY + halfSpan,
  }

  console.log(`Crop quadrado com margem sutil (93% preenchimento):`, crop)

  // Gerar cada tamanho de PNG
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'favicon.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ]

  const pngBuffers = {}

  for (const item of sizes) {
    const rgba = resampleCrop(src, crop, item.size)
    const png = encodePng(item.size, item.size, rgba)
    fs.writeFileSync(path.join(publicDir, item.name), png)
    pngBuffers[item.size] = png
    console.log(`✓ Gerado: ${item.name} (${item.size}x${item.size}, ${png.length} bytes)`)
  }

  // Gerar ICO multi-resolução (16x16, 32x32, 48x48)
  const icoBuffers = [pngBuffers[16], pngBuffers[32], pngBuffers[48]]
  const icoSizes = [16, 32, 48]
  const ico = encodeIco(icoBuffers, icoSizes)
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico)
  fs.writeFileSync(path.join(publicDir, 'logo_aresta.ico'), ico)
  console.log(`✓ Gerado: favicon.ico e logo_aresta.ico multi-resolução (${ico.length} bytes)`)

  console.log('--- Todos os favicons PNG e ICO gerados com sucesso! ---')
}

main()
