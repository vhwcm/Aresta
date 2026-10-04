import { describe, it, expect } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { LazyZip } from '~/utils/reader/epub/lazyZip'

describe('LazyZip', () => {
  it('lê o diretório central sem inflar os arquivos imediatamente', () => {
    const zipData = zipSync({
      'mimetype': strToU8('application/epub+zip'),
      'META-INF/container.xml': strToU8('<rootfile full-path="OEBPS/content.opf"/>'),
      'OEBPS/content.opf': strToU8('<package><manifest></manifest></package>'),
      'OEBPS/chapter1.xhtml': strToU8('<p>Olá mundo do teste</p>')
    })

    const lazy = LazyZip.open(zipData)

    expect(lazy.hasFile('mimetype')).toBe(true)
    expect(lazy.hasFile('META-INF/container.xml')).toBe(true)
    expect(lazy.hasFile('oebps/chapter1.xhtml')).toBe(true) // case-insensitive
    expect(lazy.hasFile('inexistente.txt')).toBe(false)

    const fileInfo = lazy.getFileInfo('OEBPS/chapter1.xhtml')
    expect(fileInfo).not.toBeNull()
    const expectedBytes = strToU8('<p>Olá mundo do teste</p>').length
    expect(fileInfo?.originalSize).toBe(expectedBytes)

    // Inflate sob demanda
    const content = lazy.readEntryAsText('OEBPS/chapter1.xhtml')
    expect(content).toBe('<p>Olá mundo do teste</p>')
  })
})
