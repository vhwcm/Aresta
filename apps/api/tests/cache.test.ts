import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../src/shared/cache/cache.manager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = CacheManager.getInstance()
    cache.clear()
  })

  it('deve armazenar e recuperar dados corretamente', () => {
    cache.set('key1', { name: 'Aresta' })
    const result = cache.get<{ name: string }>('key1')
    expect(result).toEqual({ name: 'Aresta' })
  })

  it('deve retornar null para chaves não existentes', () => {
    expect(cache.get('non_existent')).toBeNull()
  })

  it('deve expirar itens após o TTL especificado', async () => {
    cache.set('expiring_key', 'test_value', 0.05) // 50ms TTL
    expect(cache.get('expiring_key')).toBe('test_value')

    await new Promise((resolve) => setTimeout(resolve, 70))
    expect(cache.get('expiring_key')).toBeNull()
  })

  it('deve invalidar chave específica', () => {
    cache.set('key_to_del', 123)
    expect(cache.get('key_to_del')).toBe(123)
    cache.invalidateKey('key_to_del')
    expect(cache.get('key_to_del')).toBeNull()
  })

  it('deve invalidar dados associados a tags', () => {
    cache.set('user_1_books', [{ id: 1 }], 600, ['user:1:books', 'books'])
    cache.set('user_1_graph', { nodes: [] }, 600, ['user:1:graph'])
    cache.set('user_2_books', [{ id: 2 }], 600, ['user:2:books', 'books'])

    expect(cache.get('user_1_books')).toBeDefined()
    expect(cache.get('user_1_graph')).toBeDefined()
    expect(cache.get('user_2_books')).toBeDefined()

    cache.invalidateTag('user:1:books')
    expect(cache.get('user_1_books')).toBeNull()
    expect(cache.get('user_1_graph')).toBeDefined()
    expect(cache.get('user_2_books')).toBeDefined()
  })

  it('deve invalidar todos os dados de um usuário via invalidateUser', () => {
    cache.set('user:5:books', [{ id: 10 }], 600, ['user:5:books'])
    cache.set('user:5:graph', { nodes: ['n1'] }, 600, ['user:5:graph'])
    cache.set('user:5:annotations', [{ id: 100 }], 600, ['user:5:annotations'])
    cache.set('user:6:books', [{ id: 20 }], 600, ['user:6:books'])

    cache.invalidateUser(5)

    expect(cache.get('user:5:books')).toBeNull()
    expect(cache.get('user:5:graph')).toBeNull()
    expect(cache.get('user:5:annotations')).toBeNull()
    expect(cache.get('user:6:books')).toBeDefined()
  })
})
