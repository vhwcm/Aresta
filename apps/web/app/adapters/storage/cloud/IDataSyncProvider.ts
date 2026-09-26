import type { ICloudStorageProvider } from './ICloudStorageProvider'

/**
 * Resultado de uma operação de sync de dado estruturado.
 */
export interface DataSyncResult {
  /** Nome do arquivo sincronizado (ex: annotations.json) */
  fileName: string
  /** Número de itens no payload */
  itemCount: number
  /** Timestamp da operação */
  syncedAt: string
}

/**
 * Subpastas possíveis dentro de Aresta/data/ no Drive.
 */
export type DataSubFolder = 'canvas' | 'notes' | 'drawing_notes'

/**
 * Extensão de ICloudStorageProvider para operações de dados estruturados (JSON).
 *
 * Estrutura de pastas gerada no Drive:
 * ```
 * Aresta/
 * ├── data/
 * │   ├── profile.json
 * │   ├── annotations.json
 * │   ├── flashcards.json
 * │   ├── journal.json
 * │   ├── canvas/
 * │   │   └── {uuid}.json
 * │   ├── notes/
 * │   │   └── {uuid}.json
 * │   └── drawing_notes/
 * │       └── {uuid}.json
 * └── books/
 *     └── {Título}/
 *         ├── book.epub
 *         └── cover.webp
 * ```
 */
export interface IDataSyncProvider extends ICloudStorageProvider {
  /**
   * Garante que toda a estrutura de pastas Aresta/data/ existe no Drive.
   * Deve ser chamado uma vez na inicialização do sync.
   */
  ensureDataFolders(): Promise<void>

  /**
   * Serializa `data` como JSON e faz upload para `Aresta/data/{fileName}`.
   * Se o arquivo já existe, sobrescreve.
   *
   * @param fileName - ex: 'annotations.json', 'profile.json'
   * @param data - qualquer objeto serializável
   */
  uploadDataFile(fileName: string, data: unknown): Promise<DataSyncResult>

  /**
   * Serializa `data` como JSON e faz upload para `Aresta/data/{subFolder}/{fileName}`.
   *
   * @param subFolder - 'canvas' | 'notes' | 'drawing_notes'
   * @param fileName - ex: '{uuid}.json'
   * @param data - qualquer objeto serializável
   */
  uploadSubFolderDataFile(
    subFolder: DataSubFolder,
    fileName: string,
    data: unknown
  ): Promise<DataSyncResult>

  /**
   * Baixa e desserializa um arquivo JSON de `Aresta/data/{fileName}`.
   * Retorna `null` se o arquivo não existir.
   *
   * @param fileName - ex: 'annotations.json'
   */
  downloadDataFile<T>(fileName: string): Promise<T | null>

  /**
   * Baixa e desserializa um arquivo JSON de `Aresta/data/{subFolder}/{fileName}`.
   * Retorna `null` se o arquivo não existir.
   */
  downloadSubFolderDataFile<T>(subFolder: DataSubFolder, fileName: string): Promise<T | null>

  /**
   * Lista os nomes dos arquivos em `Aresta/data/{subFolder}/`.
   *
   * @param subFolder - 'canvas' | 'notes' | 'drawing_notes'
   */
  listSubFolderFiles(subFolder: DataSubFolder): Promise<string[]>

  /**
   * Remove um arquivo de `Aresta/data/{fileName}` (soft via substituição por JSON vazio com deleted_at).
   * Para remoção física, prefira substituir o conteúdo com o item marcado como `deleted_at`.
   *
   * @param fileName - ex: 'annotations.json'
   */
  deleteDataFile(fileName: string): Promise<void>

  /**
   * Remove um arquivo de `Aresta/data/{subFolder}/{fileName}`.
   */
  deleteSubFolderDataFile(subFolder: DataSubFolder, fileName: string): Promise<void>
}
