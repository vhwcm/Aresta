import { ref } from 'vue'

export interface CatalogBook {
  id: number
  title: string
  filePath: string
  coverPath?: string
  createdAt?: string
}

const getApiBase = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.readerApiUrl) {
        return `${config.public.readerApiUrl}/api`
      }
      if (config?.public?.apiUrl) {
        return `${config.public.apiUrl}/api`
      }
    } catch {
      // fallback
    }
  }
  return 'http://localhost:3001/api'
}

export const useCatalog = () => {
  const books = ref<CatalogBook[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCatalog = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<CatalogBook[]>(`${getApiBase()}/books`)
      books.value = data
    } catch (e: any) {
      console.error('Erro ao carregar catálogo de livros:', e)
      error.value = 'Falha ao carregar o catálogo de livros.'
    } finally {
      loading.value = false
    }
  }

  return {
    books,
    loading,
    error,
    fetchCatalog
  }
}
