import { ref } from 'vue'
import { getApiBase } from '~/utils/apiBase'

export interface CatalogBook {
  id: number
  title: string
  filePath: string
  coverPath?: string
  createdAt?: string
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
