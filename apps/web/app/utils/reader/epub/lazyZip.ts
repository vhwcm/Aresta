import { unzipSync, strFromU8 } from 'fflate'

export interface ZipFileInfo {
  name: string
  originalSize: number
  compressedSize: number
}

export class LazyZip {
  private readonly data: Uint8Array
  private readonly fileMap: Map<string, ZipFileInfo> = new Map()

  private constructor(data: Uint8Array, fileMap: Map<string, ZipFileInfo>) {
    this.data = data
    this.fileMap = fileMap
  }

  /**
   * Abre o buffer ZIP lendo apenas os metadados do diretório central (sem descompactar arquivos).
   */
  static open(data: Uint8Array | ArrayBuffer): LazyZip {
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data)
    const fileMap = new Map<string, ZipFileInfo>()

    unzipSync(u8, {
      filter: (file) => {
        fileMap.set(file.name.toLowerCase(), {
          name: file.name,
          originalSize: file.originalSize,
          compressedSize: file.size
        })
        return false
      }
    })

    return new LazyZip(u8, fileMap)
  }

  getFilenames(): string[] {
    return Array.from(this.fileMap.values()).map(f => f.name)
  }

  getFileInfo(name: string): ZipFileInfo | null {
    return this.fileMap.get(name.toLowerCase()) ?? null
  }

  hasFile(name: string): boolean {
    return this.fileMap.has(name.toLowerCase())
  }

  readEntry(name: string): Uint8Array | null {
    const info = this.fileMap.get(name.toLowerCase())
    if (!info) return null

    const targetName = info.name
    const res = unzipSync(this.data, {
      filter: (file) => file.name === targetName
    })

    return res[targetName] ?? null
  }

  readEntryAsText(name: string): string | null {
    const entry = this.readEntry(name)
    if (!entry) return null
    return strFromU8(entry)
  }
}
