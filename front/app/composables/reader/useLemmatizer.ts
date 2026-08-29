/**
 * useLemmatizer.ts
 * Motor de Lematização Offline para Português, Inglês e Espanhol.
 * Resolve palavras flexionadas (verbos conjugados, plurais, formas femininas, particípios)
 * para a forma canônica (lema) do dicionário.
 */

// Mapeamento direto de formas irregulares frequentes
const IRREGULAR_FORMS: Record<string, Record<string, string>> = {
  en: {
    // Verbos irregulares em inglês
    was: 'be',
    were: 'be',
    been: 'be',
    being: 'be',
    am: 'be',
    is: 'be',
    are: 'be',
    went: 'go',
    gone: 'go',
    goes: 'go',
    going: 'go',
    had: 'have',
    has: 'have',
    having: 'have',
    did: 'do',
    done: 'do',
    does: 'do',
    doing: 'do',
    said: 'say',
    says: 'say',
    saying: 'say',
    made: 'make',
    makes: 'make',
    making: 'make',
    took: 'take',
    taken: 'take',
    takes: 'take',
    taking: 'take',
    came: 'come',
    comes: 'come',
    coming: 'come',
    saw: 'see',
    seen: 'see',
    sees: 'see',
    seeing: 'see',
    knew: 'know',
    known: 'know',
    knows: 'know',
    knowing: 'know',
    thought: 'think',
    thinks: 'think',
    thinking: 'think',
    felt: 'feel',
    feels: 'feel',
    feeling: 'feel',
    found: 'find',
    finds: 'find',
    finding: 'find',
    gave: 'give',
    given: 'give',
    gives: 'give',
    giving: 'give',
    told: 'tell',
    tells: 'tell',
    telling: 'tell',
    wrote: 'write',
    written: 'write',
    writes: 'write',
    writing: 'write',
    revealed: 'reveal',
    revealing: 'reveal',
    reveals: 'reveal',
    read: 'read',
    reading: 'read',
    reads: 'read',
    pondered: 'ponder',
    pondering: 'ponder',
    ponders: 'ponder',
    wandered: 'wander',
    wandering: 'wander',
    wanders: 'wander',
    whispered: 'whisper',
    whispering: 'whisper',
    whispers: 'whisper',
    transcended: 'transcend',
    transcending: 'transcend',
    transcends: 'transcend',

    // Plurais irregulares em inglês
    men: 'man',
    women: 'woman',
    children: 'child',
    feet: 'foot',
    teeth: 'tooth',
    mice: 'mouse',
    people: 'person',
    manuscripts: 'manuscript',
    books: 'book',
    cities: 'city',
    sanctuaries: 'sanctuary',
    labyrinths: 'labyrinth',
    journeys: 'journey',
  },

  pt: {
    // Verbos e flexões em português
    fui: 'ser',
    foi: 'ser',
    fomos: 'ser',
    foram: 'ser',
    era: 'ser',
    eram: 'ser',
    sou: 'ser',
    somos: 'ser',
    são: 'ser',
    tinha: 'ter',
    tinham: 'ter',
    tive: 'ter',
    teve: 'ter',
    tivemos: 'ter',
    tiveram: 'ter',
    tenho: 'ter',
    temos: 'ter',
    têm: 'ter',
    disse: 'dizer',
    disseram: 'dizer',
    diz: 'dizer',
    dizem: 'dizer',
    dizia: 'dizer',
    diziam: 'dizer',
    leu: 'ler',
    li: 'ler',
    lemos: 'ler',
    leram: 'ler',
    lendo: 'ler',
    lia: 'ler',
    liam: 'ler',
    revelou: 'revelar',
    revelaram: 'revelar',
    revelava: 'revelar',
    revelavam: 'revelar',
    revelado: 'revelar',
    revelada: 'revelar',
    revelados: 'revelar',
    reveladas: 'revelar',
    revelando: 'revelar',
    revela: 'revelar',
    revelam: 'revelar',
    escreveu: 'escrever',
    escreveram: 'escrever',
    escrevia: 'escrever',
    escreviam: 'escrever',
    escrito: 'escrever',
    escrita: 'escrever',
    escritos: 'escrever',
    escritas: 'escrever',
    escrevendo: 'escrever',
    escreve: 'escrever',
    escrevem: 'escrever',

    // Plurais e femininos em português
    manuscritos: 'manuscrito',
    livros: 'livro',
    sabedorias: 'sabedoria',
    conhecimentos: 'conhecimento',
    saudades: 'saudade',
    cidades: 'cidade',
    eloquentes: 'eloquente',
    efêmeros: 'efêmero',
    efêmera: 'efêmero',
    efêmeras: 'efêmero',
  },

  es: {
    // Verbos e flexões em espanhol
    fui: 'ser',
    fue: 'ser',
    fuimos: 'ser',
    fueron: 'ser',
    era: 'ser',
    eran: 'ser',
    soy: 'ser',
    somos: 'ser',
    son: 'ser',
    tenía: 'tener',
    tenían: 'tener',
    tuve: 'tener',
    tuvo: 'tener',
    tuvieron: 'tener',
    tengo: 'tener',
    tenemos: 'tener',
    tienen: 'tener',
    dijo: 'decir',
    dijeron: 'decir',
    dice: 'decir',
    dicen: 'decir',
    decía: 'decir',
    decían: 'decir',
    leyó: 'leer',
    leyeron: 'leer',
    leía: 'leer',
    leían: 'leer',
    leyendo: 'leer',
    escribió: 'escribir',
    escribieron: 'escribir',
    escribía: 'escribir',
    escribían: 'escribir',
    escrito: 'escribir',
    escrita: 'escribir',
    escribiendo: 'escribir',
    reveló: 'revelar',
    revelaron: 'revelar',
    revelaba: 'revelar',
    revelaban: 'revelar',
    revelado: 'revelar',
    revelada: 'revelar',
    revelando: 'revelar',

    // Plurais em espanhol
    manuscritos: 'manuscrito',
    ciudades: 'ciudad',
    sombras: 'sombra',
    libros: 'libro',
    soledades: 'soledad',
    laberintos: 'laberinto',
    antiguos: 'antiguo',
    antigua: 'antiguo',
    antiguas: 'antiguo',
  },
}

export function cleanWord(rawText: string): string {
  if (!rawText) return ''
  // Remove pontuação de bordas, aspas, apóstrofos, colchetes, números
  return rawText
    .trim()
    .replace(/^[\s"'“‘«‹([{—–\-_.,:;!?]+/, '')
    .replace(/[\s"'”’»›)}—–\-_.,:;!?]+$/, '')
    .toLowerCase()
}

export function useLemmatizer() {
  /**
   * Gera uma lista ordenada de possíveis lemas para uma palavra e idioma.
   * Exemplo: 'revealed' (en) -> ['revealed', 'reveal']
   */
  function getCandidateLemmas(rawWord: string, lang: string = 'en'): string[] {
    const normalized = cleanWord(rawWord)
    if (!normalized) return []

    const candidates = new Set<string>()
    // 1. A própria palavra original
    candidates.add(normalized)

    // Normaliza código do idioma (ex: 'pt-BR' -> 'pt')
    const primaryLang = (lang.split('-')[0] ?? 'en').toLowerCase()

    // 2. Verifica mapeamento de formas irregulares conhecidas
    const langIrregulars = IRREGULAR_FORMS[primaryLang]
    if (langIrregulars) {
      const mapped = langIrregulars[normalized]
      if (mapped) {
        candidates.add(mapped)
      }
    }

    // 3. Regras morfológicas por idioma
    if (primaryLang === 'en') {
      applyEnglishRules(normalized, candidates)
    } else if (primaryLang === 'pt') {
      applyPortugueseRules(normalized, candidates)
    } else if (primaryLang === 'es') {
      applySpanishRules(normalized, candidates)
    }

    return Array.from(candidates)
  }

  function applyEnglishRules(word: string, set: Set<string>) {
    // Terminações verbais e adjetivais em inglês
    if (word.endsWith('ing') && word.length > 5) {
      set.add(word.slice(0, -3)) // asking -> ask
      set.add(word.slice(0, -3) + 'e') // writing -> write
      if (word.length > 6 && word[word.length - 4] === word[word.length - 5]) {
        set.add(word.slice(0, -4)) // running -> run
      }
    }
    if (word.endsWith('ed') && word.length > 4) {
      set.add(word.slice(0, -2)) // revealed -> reveal, walked -> walk
      set.add(word.slice(0, -1)) // loved -> love
      if (word.length > 5 && word[word.length - 3] === word[word.length - 4]) {
        set.add(word.slice(0, -3)) // stopped -> stop
      }
    }
    if (word.endsWith('ies') && word.length > 4) {
      set.add(word.slice(0, -3) + 'y') // cities -> city
    }
    if (word.endsWith('es') && word.length > 4) {
      set.add(word.slice(0, -2)) // watches -> watch
      set.add(word.slice(0, -1)) // uses -> use
    }
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
      set.add(word.slice(0, -1)) // books -> book
    }
    if (word.endsWith('ly') && word.length > 4) {
      set.add(word.slice(0, -2)) // calmly -> calm
    }
  }

  function applyPortugueseRules(word: string, set: Set<string>) {
    // Plurais em português
    if (word.endsWith('ões') && word.length > 4) {
      set.add(word.slice(0, -3) + 'ão')
    }
    if (word.endsWith('ães') && word.length > 4) {
      set.add(word.slice(0, -3) + 'ão')
    }
    if (word.endsWith('res') || word.endsWith('ses') || word.endsWith('zes')) {
      set.add(word.slice(0, -2)) // flores -> flor
    }
    if (word.endsWith('is') && word.length > 3) {
      set.add(word.slice(0, -2) + 'l') // animais -> animal
    }
    if (word.endsWith('s') && word.length > 3) {
      set.add(word.slice(0, -1)) // livros -> livro
    }

    // Femininos
    if (word.endsWith('a') && word.length > 4) {
      set.add(word.slice(0, -1) + 'o') // bela -> belo
    }

    // Desinências verbais
    const verbSuffixes = [
      { suffix: 'aram', rep: 'ar' },
      { suffix: 'avam', rep: 'ar' },
      { suffix: 'ando', rep: 'ar' },
      { suffix: 'ou', rep: 'ar' },
      { suffix: 'ado', rep: 'ar' },
      { suffix: 'ada', rep: 'ar' },
      { suffix: 'eram', rep: 'er' },
      { suffix: 'iam', rep: 'er' },
      { suffix: 'endo', rep: 'er' },
      { suffix: 'eu', rep: 'er' },
      { suffix: 'ido', rep: 'er' },
      { suffix: 'iram', rep: 'ir' },
      { suffix: 'indo', rep: 'ir' },
      { suffix: 'iu', rep: 'ir' },
    ]

    for (const { suffix, rep } of verbSuffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        set.add(word.slice(0, -suffix.length) + rep)
      }
    }
  }

  function applySpanishRules(word: string, set: Set<string>) {
    // Plurais em espanhol
    if (word.endsWith('es') && word.length > 4) {
      set.add(word.slice(0, -2)) // ciudades -> ciudad
    }
    if (word.endsWith('s') && word.length > 3) {
      set.add(word.slice(0, -1)) // libros -> libro
    }

    // Femininos
    if (word.endsWith('a') && word.length > 4) {
      set.add(word.slice(0, -1) + 'o') // antigua -> antiguo
    }

    // Desinências verbais
    const verbSuffixes = [
      { suffix: 'aron', rep: 'ar' },
      { suffix: 'aban', rep: 'ar' },
      { suffix: 'ando', rep: 'ar' },
      { suffix: 'ado', rep: 'ar' },
      { suffix: 'ó', rep: 'ar' },
      { suffix: 'ieron', rep: 'er' },
      { suffix: 'ieron', rep: 'ir' },
      { suffix: 'iendo', rep: 'er' },
      { suffix: 'iendo', rep: 'ir' },
      { suffix: 'ió', rep: 'er' },
      { suffix: 'ió', rep: 'ir' },
    ]

    for (const { suffix, rep } of verbSuffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        set.add(word.slice(0, -suffix.length) + rep)
      }
    }
  }

  return {
    cleanWord,
    getCandidateLemmas,
  }
}

