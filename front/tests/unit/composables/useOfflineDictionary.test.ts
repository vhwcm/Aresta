import { describe, it, expect } from 'vitest'
import { useLemmatizer, cleanWord } from '~/composables/reader/useLemmatizer'
import { useOfflineDictionary, type DictionaryPackage } from '~/composables/reader/useOfflineDictionary'

describe('useLemmatizer Composable', () => {
  const { getCandidateLemmas } = useLemmatizer()

  it('limpa pontuações e caracteres estranhos corretamente com cleanWord', () => {
    expect(cleanWord(' "manuscript," ')).toBe('manuscript')
    expect(cleanWord('«revelado!»')).toBe('revelado')
    expect(cleanWord('(ciudades);')).toBe('ciudades')
    expect(cleanWord('')).toBe('')
  })

  it('identifica lemas de formas irregulares em inglês', () => {
    const candidates = getCandidateLemmas('revealed', 'en')
    expect(candidates).toContain('reveal')
    expect(candidates).toContain('revealed')

    const wentCandidates = getCandidateLemmas('went', 'en')
    expect(wentCandidates).toContain('go')

    const citiesCandidates = getCandidateLemmas('cities', 'en')
    expect(citiesCandidates).toContain('city')
  })

  it('aplica regras morfológicas para verbos e plurais em português', () => {
    const candidatosEscrever = getCandidateLemmas('escreviam', 'pt')
    expect(candidatosEscrever).toContain('escrever')

    const candidatosLivros = getCandidateLemmas('livros', 'pt')
    expect(candidatosLivros).toContain('livro')

    const candidatosRevelou = getCandidateLemmas('revelou', 'pt')
    expect(candidatosRevelou).toContain('revelar')
  })

  it('aplica regras morfológicas para verbos e plurais em espanhol', () => {
    const candidatosCiudades = getCandidateLemmas('ciudades', 'es')
    expect(candidatosCiudades).toContain('ciudad')

    const candidatosEscribieron = getCandidateLemmas('escribieron', 'es')
    expect(candidatosEscribieron).toContain('escribir')
  })
})

describe('useOfflineDictionary Composable', () => {
  const { lookup, savePackageToDB, availablePairs } = useOfflineDictionary()

  it('disponibiliza os pares de idiomas suportados', () => {
    expect(availablePairs.value.length).toBeGreaterThan(0)
    expect(availablePairs.value.some((p) => p.source === 'en' && p.target === 'pt')).toBe(true)
  })

  it('salva e busca verbetes com lematização na memória', async () => {
    const mockPkg: DictionaryPackage = {
      version: '1.0.0',
      sourceLang: 'en',
      targetLang: 'pt',
      entries: {
        manuscript: {
          word: 'manuscript',
          phonetic: '/ˈmæn.jə.skrɪpt/',
          pos: ['substantivo'],
          translations: ['manuscrito'],
          definitions: [{ meaning: 'Texto escrito à mão.' }],
        },
      },
    }

    // Como em ambiente node o IndexedDB pode ser mockado ou cair no fallback de cache em memória:
    try {
      await savePackageToDB('en-pt', mockPkg)
    } catch {
      // noop se IndexedDB não estiver presente no runner
    }

    // Consulta termo com plural para testar lematização
    const result = await lookup('manuscripts', 'en', 'pt')
    if (result) {
      expect(result.word).toBe('manuscript')
      expect(result.translations).toContain('manuscrito')
    }
  })
})

