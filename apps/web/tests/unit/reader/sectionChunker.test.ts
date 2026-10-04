import { describe, it, expect } from 'vitest'
import { chunkSectionDocument, findChunkForOffset } from '../../../app/utils/reader/epub/sectionChunker'

describe('sectionChunker', () => {
  it('1. Deve agrupar documento pequeno em um único chunk', () => {
    const parser = new DOMParser()
    const doc = parser.parseFromString('<body><p>Primeiro parágrafo curto.</p><p>Segundo parágrafo.</p></body>', 'text/html')
    const chunks = chunkSectionDocument(doc, 1000)

    expect(chunks).toHaveLength(1)
    expect(chunks[0]!.chunkIndex).toBe(0)
    expect(chunks[0]!.startCharOffset).toBe(0)
    expect(chunks[0]!.charCount).toBeGreaterThan(0)
    expect(chunks[0]!.endCharOffset).toBe(chunks[0]!.charCount)
    expect(chunks[0]!.nodes).toHaveLength(2)
  })

  it('2. Deve dividir elementos quando o acumulado exceder o targetChunkSize', () => {
    const parser = new DOMParser()
    // Criamos 5 parágrafos de 50 caracteres cada
    const p1 = '<p>' + 'A'.repeat(50) + '</p>'
    const p2 = '<p>' + 'B'.repeat(50) + '</p>'
    const p3 = '<p>' + 'C'.repeat(50) + '</p>'
    const p4 = '<p>' + 'D'.repeat(50) + '</p>'
    const p5 = '<p>' + 'E'.repeat(50) + '</p>'
    const doc = parser.parseFromString(`<body>${p1}${p2}${p3}${p4}${p5}</body>`, 'text/html')

    // Com target de 80 chars, espera-se divisão entre elementos
    const chunks = chunkSectionDocument(doc, 80)
    expect(chunks.length).toBeGreaterThan(1)

    // O charCount total somado deve ser exatamente 250
    const totalChars = chunks.reduce((acc, c) => acc + c.charCount, 0)
    expect(totalChars).toBe(250)

    // Os offsets devem ser contíguos
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i]!.endCharOffset).toBe(chunks[i + 1]!.startCharOffset)
    }
  })

  it('3. Deve isolar elemento individual maior que targetChunkSize em chunk próprio', () => {
    const parser = new DOMParser()
    const shortP1 = '<p>Pequeno 1</p>'
    const bigP = '<p>' + 'X'.repeat(500) + '</p>'
    const shortP2 = '<p>Pequeno 2</p>'
    const doc = parser.parseFromString(`<body>${shortP1}${bigP}${shortP2}</body>`, 'text/html')

    const chunks = chunkSectionDocument(doc, 100)
    expect(chunks.length).toBe(3)
    expect(chunks[1]!.nodes).toHaveLength(1)
    expect(chunks[1]!.charCount).toBe(500)
  })

  it('4. findChunkForOffset deve localizar o chunk correto pelo charOffset', () => {
    const chunks = [
      { chunkIndex: 0, startCharOffset: 0, endCharOffset: 100, charCount: 100, nodes: [] },
      { chunkIndex: 1, startCharOffset: 100, endCharOffset: 250, charCount: 150, nodes: [] },
      { chunkIndex: 2, startCharOffset: 250, endCharOffset: 400, charCount: 150, nodes: [] }
    ]

    expect(findChunkForOffset(chunks, 0)?.chunkIndex).toBe(0)
    expect(findChunkForOffset(chunks, 50)?.chunkIndex).toBe(0)
    expect(findChunkForOffset(chunks, 100)?.chunkIndex).toBe(1)
    expect(findChunkForOffset(chunks, 200)?.chunkIndex).toBe(1)
    expect(findChunkForOffset(chunks, 250)?.chunkIndex).toBe(2)
    expect(findChunkForOffset(chunks, 500)?.chunkIndex).toBe(2) // Além do fim -> último chunk
  })
})
