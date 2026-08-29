import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../front/public/dictionaries');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Dicionário EN -> PT
const dictEnPt = {
  version: '1.0.0',
  sourceLang: 'en',
  targetLang: 'pt',
  entries: {
    manuscript: {
      word: 'manuscript',
      phonetic: '/ˈmæn.jə.skrɪpt/',
      pos: ['substantivo'],
      translations: ['manuscrito', 'texto original', 'obra autógrafa'],
      definitions: [
        {
          meaning: 'Livro, documento ou texto original escrito à mão ou digitado antes de ser impresso ou publicado.',
          example: 'The author delivered the completed manuscript to the publisher.',
          synonyms: ['document', 'text', 'draft', 'autograph']
        },
        {
          meaning: 'Documento histórico antigo escrito manualmente antes da invenção da imprensa.',
          example: 'Ancient manuscripts preserved in the monastic library.'
        }
      ]
    },
    reveal: {
      word: 'reveal',
      phonetic: '/rɪˈviːl/',
      pos: ['verbo'],
      translations: ['revelar', 'divulgar', 'desvendar', 'mostrar'],
      definitions: [
        {
          meaning: 'Tornar conhecido algo que era secreto, desconhecido ou oculto.',
          example: 'The investigation revealed new evidence regarding the incident.',
          synonyms: ['disclose', 'unveil', 'uncover', 'expose']
        },
        {
          meaning: 'Permitir que algo seja visto; exibir.',
          example: 'He pulled back the curtain to reveal a magnificent view.'
        }
      ]
    },
    ephemeral: {
      word: 'ephemeral',
      phonetic: '/ɪˈfem.ər.əl/',
      pos: ['adjetivo'],
      translations: ['efêmero', 'passageiro', 'transitório', 'fugaz'],
      definitions: [
        {
          meaning: 'Que dura muito pouco tempo; passageiro, transitório.',
          example: 'Fame in the digital age can be remarkably ephemeral.',
          synonyms: ['transient', 'fleeting', 'momentary', 'evanescent']
        }
      ]
    },
    serendipity: {
      word: 'serendipity',
      phonetic: '/ˌser.ənˈdɪp.ə.ti/',
      pos: ['substantivo'],
      translations: ['serendipidade', 'acaso afortunado', 'descoberta feliz'],
      definitions: [
        {
          meaning: 'Ocorrência ou capacidade de encontrar coisas boas ou valiosas por mero acaso ou sorte inesperada.',
          example: 'Finding this rare edition in a second-hand shop was pure serendipity.'
        }
      ]
    },
    solitude: {
      word: 'solitude',
      phonetic: '/ˈsɒl.ɪ.tʃuːd/',
      pos: ['substantivo'],
      translations: ['solidão', 'isolamento', 'recolhimento', 'quietude'],
      definitions: [
        {
          meaning: 'Estado ou situação de estar só, especialmente quando é uma escolha pacífica e agradável.',
          example: 'He cherished the solitude of his morning walks in the forest.',
          synonyms: ['seclusion', 'isolation', 'loneliness', 'privacy']
        }
      ]
    },
    resilience: {
      word: 'resilience',
      phonetic: '/rɪˈzɪl.jəns/',
      pos: ['substantivo'],
      translations: ['resiliência', 'capacidade de recuperação', 'resistência'],
      definitions: [
        {
          meaning: 'Capacidade de se recuperar rapidamente de dificuldades, traumas ou mudanças adversas.',
          example: 'The resilience of the human spirit in the face of adversity.'
        }
      ]
    },
    melancholy: {
      word: 'melancholy',
      phonetic: '/ˈmel.əŋ.kɒl.i/',
      pos: ['substantivo', 'adjetivo'],
      translations: ['melancolia', 'tristeza', 'melancólico'],
      definitions: [
        {
          meaning: 'Sentimento de tristeza profunda e reflexiva, muitas vezes sem uma causa aparente.',
          example: 'A mood of gentle melancholy settled over the autumn landscape.'
        }
      ]
    },
    eloquent: {
      word: 'eloquent',
      phonetic: '/ˈel.ə.kwənt/',
      pos: ['adjetivo'],
      translations: ['eloquente', 'expressivo', 'persuasivo'],
      definitions: [
        {
          meaning: 'Fluente ou persuasivo ao falar ou escrever; capaz de expressar ideias com clareza e emoção.',
          example: 'She gave an eloquent speech advocating for educational reform.'
        }
      ]
    },
    ponder: {
      word: 'ponder',
      phonetic: '/ˈpɒn.dər/',
      pos: ['verbo'],
      translations: ['ponderar', 'refletir', 'meditar', 'pensar profundamente'],
      definitions: [
        {
          meaning: 'Pensar sobre algo cuidadosa e profundamente, especialmente antes de tomar uma decisão.',
          example: 'He sat quietly by the window to ponder his next steps.'
        }
      ]
    },
    ineffable: {
      word: 'ineffable',
      phonetic: '/ɪnˈef.ə.bəl/',
      pos: ['adjetivo'],
      translations: ['inefável', 'indescritível', 'indizível'],
      definitions: [
        {
          meaning: 'Tão grandioso, belo ou intenso que não pode ser expresso em palavras.',
          example: 'An ineffable sense of peace washed over him as he gazed at the stars.'
        }
      ]
    },
    book: {
      word: 'book',
      phonetic: '/bʊk/',
      pos: ['substantivo', 'verbo'],
      translations: ['livro', 'obra', 'reservar', 'agendar'],
      definitions: [
        {
          meaning: 'Conjunto de folhas de papel escritas ou impressas encadernadas juntas.',
          example: 'She opened the leather-bound book and began to read.'
        },
        {
          meaning: 'Reservar acomodação, transporte ou serviço com antecedência.',
          example: 'We need to book the tickets early.'
        }
      ]
    },
    read: {
      word: 'read',
      phonetic: '/riːd/',
      pos: ['verbo'],
      translations: ['ler', 'interpretar', 'compreender'],
      definitions: [
        {
          meaning: 'Olhar e compreender o significado de palavras ou símbolos escritos ou impressos.',
          example: 'He loves to read classic novels in his spare time.'
        }
      ]
    },
    knowledge: {
      word: 'knowledge',
      phonetic: '/ˈnɒl.ɪdʒ/',
      pos: ['substantivo'],
      translations: ['conhecimento', 'saber', 'compreensão', 'ciência'],
      definitions: [
        {
          meaning: 'Fatos, informações e habilidades adquiridas através de experiência ou educação.',
          example: 'Books are the primary vessels of human knowledge.'
        }
      ]
    },
    lucid: {
      word: 'lucid',
      phonetic: '/ˈluː.sɪd/',
      pos: ['adjetivo'],
      translations: ['lúcido', 'claro', 'inteligível', 'transparente'],
      definitions: [
        {
          meaning: 'Expresso de forma clara e fácil de entender; dotado de discernimento.',
          example: 'His explanation of quantum physics was remarkably lucid.'
        }
      ]
    },
    profound: {
      word: 'profound',
      phonetic: '/prəˈfaʊnd/',
      pos: ['adjetivo'],
      translations: ['profundo', 'intenso', 'significativo'],
      definitions: [
        {
          meaning: 'Muito grande ou intenso; que possui profundo significado ou sabedoria.',
          example: 'The philosopher made a profound observation about human nature.'
        }
      ]
    },
    ubiquitous: {
      word: 'ubiquitous',
      phonetic: '/juːˈbɪk.wɪ.təs/',
      pos: ['adjetivo'],
      translations: ['onipresente', 'ubíquo', 'onímodo'],
      definitions: [
        {
          meaning: 'Presente, aparecendo ou encontrado em toda parte ao mesmo tempo.',
          example: 'Smartphones have become ubiquitous in modern society.'
        }
      ]
    },
    nostalgia: {
      word: 'nostalgia',
      phonetic: '/nɒsˈtæl.dʒə/',
      pos: ['substantivo'],
      translations: ['nostalgia', 'saudade', 'lembrança afetuosa'],
      definitions: [
        {
          meaning: 'Desejo sentimental ou afeto melancólico por um período no passado.',
          example: 'Photographs of his childhood evoked a deep sense of nostalgia.'
        }
      ]
    },
    sanctuary: {
      word: 'sanctuary',
      phonetic: '/ˈsæŋk.tʃu.ər.i/',
      pos: ['substantivo'],
      translations: ['santuário', 'refúgio', 'abrigo'],
      definitions: [
        {
          meaning: 'Lugar de refúgio, descanso ou segurança.',
          example: 'His study served as a sanctuary from the bustling city.'
        }
      ]
    },
    whisper: {
      word: 'whisper',
      phonetic: '/ˈwɪs.pər/',
      pos: ['verbo', 'substantivo'],
      translations: ['sussurrar', 'murmurar', 'sussurro', 'murmúrio'],
      definitions: [
        {
          meaning: 'Falar muito baixinho usando a respiração em vez da voz normal.',
          example: 'She leaned over to whisper a secret in his ear.'
        }
      ]
    },
    wander: {
      word: 'wander',
      phonetic: '/ˈwɒn.dər/',
      pos: ['verbo'],
      translations: ['vagar', 'deambular', 'perambular', 'divagar'],
      definitions: [
        {
          meaning: 'Caminhar ou mover-se de maneira calma ou sem rumo fixo.',
          example: 'They spent the afternoon wandering through the cobblestone streets.'
        }
      ]
    },
    journey: {
      word: 'journey',
      phonetic: '/ˈdʒɜː.ni/',
      pos: ['substantivo', 'verbo'],
      translations: ['jornada', 'viagem', 'trajeto', 'viajar'],
      definitions: [
        {
          meaning: 'Ato de viajar de um lugar para outro, especialmente por uma longa distância.',
          example: 'The journey through the mountains took three days.'
        }
      ]
    },
    labyrinth: {
      word: 'labyrinth',
      phonetic: '/ˈlæb.ə.rɪnθ/',
      pos: ['substantivo'],
      translations: ['labirinto', 'emaranhado', 'dédalo'],
      definitions: [
        {
          meaning: 'Rede complicada e irregular de caminhos ou passagens difíceis de percorrer.',
          example: 'The old library was a labyrinth of towering bookshelves and narrow corridors.'
        }
      ]
    },
    quixotic: {
      word: 'quixotic',
      phonetic: '/kwɪkˈsɒt.ɪk/',
      pos: ['adjetivo'],
      translations: ['quixotesco', 'idealista', 'ingênuo', 'utópico'],
      definitions: [
        {
          meaning: 'Extremamente idealista, irrealista e impraticável (alusão a Dom Quixote).',
          example: 'He embarked on a quixotic quest to catalog every forgotten book.'
        }
      ]
    },
    luminous: {
      word: 'luminous',
      phonetic: '/ˈluː.mɪ.nəs/',
      pos: ['adjetivo'],
      translations: ['luminoso', 'radiante', 'brilhante', 'esclarecedor'],
      definitions: [
        {
          meaning: 'Que emite luz; brilhante ou resplandecente no escuro.',
          example: 'The luminous moon guided their path through the night.'
        }
      ]
    },
    transcend: {
      word: 'transcend',
      phonetic: '/trænˈsend/',
      pos: ['verbo'],
      translations: ['transcender', 'ultrapassar', 'superar', 'exceder'],
      definitions: [
        {
          meaning: 'Ir além do alcance ou limites usuais de algo; superar.',
          example: 'Great works of literature transcend their own historical era.'
        }
      ]
    }
  }
};

// 2. Dicionário ES -> PT
const dictEsPt = {
  version: '1.0.0',
  sourceLang: 'es',
  targetLang: 'pt',
  entries: {
    manuscrito: {
      word: 'manuscrito',
      phonetic: '/ma.nusˈkɾi.to/',
      pos: ['substantivo', 'adjetivo'],
      translations: ['manuscrito', 'escrito à mão'],
      definitions: [
        {
          meaning: 'Texto escrito à mão, especialmente livro ou documento de valor histórico antes da imprensa.',
          example: 'El manuscrito fue hallado en los archivos secretos de la abadía.'
        }
      ]
    },
    revelar: {
      word: 'revelar',
      phonetic: '/re.βeˈlaɾ/',
      pos: ['verbo'],
      translations: ['revelar', 'descobrir', 'manifestar', 'divulgar'],
      definitions: [
        {
          meaning: 'Descobrir ou fazer saber algo secreto ou oculto.',
          example: 'El informe reveló detalles desconocidos sobre el suceso.'
        }
      ]
    },
    ciudad: {
      word: 'ciudad',
      phonetic: '/θjuˈðað/',
      pos: ['substantivo'],
      translations: ['cidade', 'urbe', 'metrópole'],
      definitions: [
        {
          meaning: 'Conjunto de edifícios e ruas, habitado por uma população numerosa e densa.',
          example: 'Caminaba por las calles empedradas de la antigua ciudad.'
        }
      ]
    },
    olvido: {
      word: 'olvido',
      phonetic: '/olˈbi.ðo/',
      pos: ['substantivo'],
      translations: ['esquecimento', 'deslembrança', 'oblivio'],
      definitions: [
        {
          meaning: 'Perda de memória de algo outrora sabido ou sensação de ter deixado de lembrar.',
          example: 'El libro rescató del olvido la historia de aquellos poetas.'
        }
      ]
    },
    soledad: {
      word: 'soledad',
      phonetic: '/so.leˈðað/',
      pos: ['substantivo'],
      translations: ['solidão', 'isolamento', 'recolhimento'],
      definitions: [
        {
          meaning: 'Estado ou circunstância de estar só ou sem companhia.',
          example: 'En la soledad de su biblioteca encontró la paz necesaria para escribir.'
        }
      ]
    },
    sombra: {
      word: 'sombra',
      phonetic: '/ˈsom.bɾa/',
      pos: ['substantivo'],
      translations: ['sombra', 'penumbra', 'vulto'],
      definitions: [
        {
          meaning: 'Escuridão provocada pela interposição de um corpo diante da luz.',
          example: 'Las sombras de los cipreses se alargaban con el atardecer.'
        }
      ]
    },
    esperanza: {
      word: 'esperanza',
      phonetic: '/es.peˈɾan.θa/',
      pos: ['substantivo'],
      translations: ['esperança', 'confiança', 'expectativa'],
      definitions: [
        {
          meaning: 'Estado de ânimo no qual se espera que aconteça o que se deseja favoravelmente.',
          example: 'Mantenían la esperanza de encontrar el camino de regreso.'
        }
      ]
    },
    libro: {
      word: 'libro',
      phonetic: '/ˈli.βɾo/',
      pos: ['substantivo'],
      translations: ['livro', 'volume', 'obra'],
      definitions: [
        {
          meaning: 'Conjunto de muitas folhas unidas por um dos lados e protegidas por uma capa.',
          example: 'Abrió el libro con devoción y pasó las páginas con cuidado.'
        }
      ]
    },
    escribir: {
      word: 'escribir',
      phonetic: '/es.kɾiˈβiɾ/',
      pos: ['verbo'],
      translations: ['escrever', 'redigir', 'compor'],
      definitions: [
        {
          meaning: 'Representar ideias, palavras ou pensamentos por meio de letras e signos.',
          example: 'Pasó años escribiendo su gran obra maestra.'
        }
      ]
    },
    sabiduría: {
      word: 'sabiduría',
      phonetic: '/sa.βi.ðuˈɾi.a/',
      pos: ['substantivo'],
      translations: ['sabedoria', 'conhecimento', 'erudição'],
      definitions: [
        {
          meaning: 'Grau supremo de conhecimento humano adquirido por estudo e experiência de vida.',
          example: 'La sabiduría de los ancianos guiaba a toda la comunidad.'
        }
      ]
    },
    laberinto: {
      word: 'laberinto',
      phonetic: '/la.βeˈɾin.to/',
      pos: ['substantivo'],
      translations: ['labirinto', 'emaranhado'],
      definitions: [
        {
          meaning: 'Lugar formado por caminhos entrecruzados artificiais onde é muito difícil achar a saída.',
          example: 'El laberinto borgeano de espejos y encruzilhadas infinitas.'
        }
      ]
    },
    antiguo: {
      word: 'antiguo',
      phonetic: '/anˈti.ɣwo/',
      pos: ['adjetivo'],
      translations: ['antigo', 'arcaico', 'ancestral'],
      definitions: [
        {
          meaning: 'Que existe há muito tempo ou pertence a uma época remota.',
          example: 'Un antiguo pergamino hallado en las ruinas del templo.'
        }
      ]
    }
  }
};

// 3. Dicionário PT -> PT (Monolíngue)
const dictPtPt = {
  version: '1.0.0',
  sourceLang: 'pt',
  targetLang: 'pt',
  entries: {
    manuscrito: {
      word: 'manuscrito',
      phonetic: '/mɐ.nuʃˈkɾi.tu/',
      pos: ['substantivo', 'adjetivo'],
      definitions: [
        {
          meaning: 'Texto ou livro escrito à mão, em especial cópias e tratados anteriores à imprensa.',
          example: 'O manuscrito original foi doado à biblioteca nacional.',
          synonyms: ['autógrafo', 'original', 'texto']
        },
        {
          meaning: 'Original de um texto preparado por um autor antes de ser impresso ou publicado.'
        }
      ]
    },
    revelar: {
      word: 'revelar',
      phonetic: '/ʁe.veˈlaʁ/',
      pos: ['verbo'],
      definitions: [
        {
          meaning: 'Dar a conhecer o que era secreto, desconhecido ou confidencial; desvendar.',
          example: 'O documento revelou fatos esquecidos pela historiografia.',
          synonyms: ['desvendar', 'divulgar', 'manifestar', 'patentear']
        },
        {
          meaning: 'Fazer aparecer a imagem gravada em película fotográfica por processo químico.'
        }
      ]
    },
    efêmero: {
      word: 'efêmero',
      phonetic: '/eˈfe.me.ɾu/',
      pos: ['adjetivo'],
      definitions: [
        {
          meaning: 'Que tem curta duração; transitório, passageiro, fugaz.',
          example: 'A glória mundana muitas vezes se prova efêmera e passageira.',
          synonyms: ['fugaz', 'passageiro', 'transitório', 'perecível']
        }
      ]
    },
    saudade: {
      word: 'saudade',
      phonetic: '/sawˈda.dʒi/',
      pos: ['substantivo'],
      definitions: [
        {
          meaning: 'Sentimento melancólico e afetuoso causado pela distância ou perda de pessoas, lugares ou momentos queridos.',
          example: 'Sentia uma profunda saudade das tardes de leitura na casa dos avós.',
          synonyms: ['nostalgia', 'lembrança', 'pesar']
        }
      ]
    },
    resiliência: {
      word: 'resiliência',
      phonetic: '/ʁe.zi.liˈẽ.si.ɐ/',
      pos: ['substantivo'],
      definitions: [
        {
          meaning: 'Capacidade de superar adversidades, crises ou pressões, adaptando-se e recuperando o equilíbrio original.',
          example: 'A resiliência daquele povo permitiu a reconstrução da cidade após o terremoto.'
        }
      ]
    },
    ler: {
      word: 'ler',
      phonetic: '/ˈlɛʁ/',
      pos: ['verbo'],
      definitions: [
        {
          meaning: 'Percorrer com a vista caracteres impressos ou manuscritos, decifrando-os e compreendendo o seu sentido.',
          example: 'Gostava de ler à luz de velas durante as noites de inverno.'
        },
        {
          meaning: 'Interpretar o sentido de algo; decifrar olhares, gestos ou sinais.'
        }
      ]
    },
    livro: {
      word: 'livro',
      phonetic: '/ˈli.vɾu/',
      pos: ['substantivo'],
      definitions: [
        {
          meaning: 'Conjunto de folhas de papel impressas ou em branco, cosidas ou encadernadas formando um volume.',
          example: 'Um bom livro é uma conversa com as mentes mais brilhantes dos séculos passados.'
        }
      ]
    },
    sabedoria: {
      word: 'sabedoria',
      phonetic: '/sa.be.doˈɾi.ɐ/',
      pos: ['substantivo'],
      definitions: [
        {
          meaning: 'Conhecimento profundo e prudente da vida, fruto de estudo e reflexão constante.',
          example: 'A verdadeira sabedoria reside em reconhecer a própria ignorância.'
        }
      ]
    },
    conhecimento: {
      word: 'conhecimento',
      phonetic: '/ko.ɲe.siˈmẽ.tu/',
      pos: ['substantivo'],
      definitions: [
        {
          meaning: 'Ato ou efeito de conhecer; conjunto de saberes acumulados sobre determinado assunto ou ramo da ciência.',
          example: 'A busca pelo conhecimento é o motor primordial da civilização.'
        }
      ]
    },
    eloquente: {
      word: 'eloquente',
      phonetic: '/e.loˈkwẽ.tʃi/',
      pos: ['adjetivo'],
      definitions: [
        {
          meaning: 'Que se exprime com facilidade, elegância e poder de persuasão; expressivo.',
          example: 'O silêncio na sala foi mais eloquente do que qualquer discurso.'
        }
      ]
    }
  }
};

// 4. Dicionário EN -> EN (Monolíngue)
const dictEnEn = {
  version: '1.0.0',
  sourceLang: 'en',
  targetLang: 'en',
  entries: {
    manuscript: {
      word: 'manuscript',
      phonetic: '/ˈmæn.jə.skrɪpt/',
      pos: ['noun'],
      definitions: [
        {
          meaning: 'A book, document, or piece of music written by hand rather than typed or printed.',
          example: 'An ancient manuscript discovered in the desert caves.',
          synonyms: ['document', 'original', 'text', 'autograph']
        },
        {
          meaning: "An author's text that has not yet been published."
        }
      ]
    },
    reveal: {
      word: 'reveal',
      phonetic: '/rɪˈviːl/',
      pos: ['verb'],
      definitions: [
        {
          meaning: 'Make previously unknown or secret information known to others.',
          example: 'The investigation revealed several irregularities.',
          synonyms: ['disclose', 'unveil', 'uncover', 'divulge']
        }
      ]
    },
    ephemeral: {
      word: 'ephemeral',
      phonetic: '/ɪˈfem.ər.əl/',
      pos: ['adjective'],
      definitions: [
        {
          meaning: 'Lasting for a very short time.',
          example: 'Fashions are ephemeral, but classic style endures.',
          synonyms: ['transitory', 'transient', 'fleeting', 'short-lived']
        }
      ]
    },
    serendipity: {
      word: 'serendipity',
      phonetic: '/ˌser.ənˈdɪp.ə.ti/',
      pos: ['noun'],
      definitions: [
        {
          meaning: 'The occurrence and development of events by chance in a happy or beneficial way.',
          example: 'A fortunate stroke of serendipity brought the two researchers together.'
        }
      ]
    },
    solitude: {
      word: 'solitude',
      phonetic: '/ˈsɒl.ɪ.tʃuːd/',
      pos: ['noun'],
      definitions: [
        {
          meaning: 'The state or situation of being alone, especially in a peaceful, contemplative manner.',
          example: 'She savored the peace and solitude of the mountains.'
        }
      ]
    }
  }
};

// 5. Dicionário ES -> ES (Monolíngue)
const dictEsEs = {
  version: '1.0.0',
  sourceLang: 'es',
  targetLang: 'es',
  entries: {
    manuscrito: {
      word: 'manuscrito',
      phonetic: '/ma.nusˈkɾi.to/',
      pos: ['sustantivo'],
      definitions: [
        {
          meaning: 'Papel o libro escrito a mano, especialmente el que tiene algún valor o antigüedad.',
          example: 'El manuscrito medieval fue restaurado con sumo cuidado.'
        }
      ]
    },
    revelar: {
      word: 'revelar',
      phonetic: '/re.βeˈlaɾ/',
      pos: ['verbo'],
      definitions: [
        {
          meaning: 'Descubrir o hacer saber algo que estaba secreto u oculto.',
          example: 'La verdad se reveló con el paso de los años.'
        }
      ]
    },
    soledad: {
      word: 'soledad',
      phonetic: '/so.leˈðað/',
      pos: ['sustantivo'],
      definitions: [
        {
          meaning: 'Carencia voluntaria o involuntaria de compañía.',
          example: 'Escribía mejor en la tranquila soledad de la noche.'
        }
      ]
    }
  }
};

// 6. Dicionário PT -> EN
const dictPtEn = {
  version: '1.0.0',
  sourceLang: 'pt',
  targetLang: 'en',
  entries: {
    manuscrito: {
      word: 'manuscrito',
      phonetic: '/mɐ.nuʃˈkɾi.tu/',
      pos: ['noun'],
      translations: ['manuscript', 'handwritten text', 'draft'],
      definitions: [
        {
          meaning: 'A handwritten or original book or document before being printed.',
          example: 'The ancient manuscript was preserved in the museum vault.'
        }
      ]
    },
    revelar: {
      word: 'revelar',
      phonetic: '/ʁe.veˈlaʁ/',
      pos: ['verb'],
      translations: ['reveal', 'disclose', 'unveil', 'uncover'],
      definitions: [
        {
          meaning: 'To make known something that was previously secret or hidden.',
          example: 'The investigation revealed crucial evidence.'
        }
      ]
    },
    saudade: {
      word: 'saudade',
      phonetic: '/sawˈda.dʒi/',
      pos: ['noun'],
      translations: ['longing', 'yearning', 'nostalgia', 'homesickness'],
      definitions: [
        {
          meaning: 'A deep emotional state of nostalgic or melancholic longing for something or someone that is absent.',
          example: 'She felt a profound saudade for her childhood home.'
        }
      ]
    },
    livro: {
      word: 'livro',
      phonetic: '/ˈli.vɾu/',
      pos: ['noun'],
      translations: ['book', 'volume', 'tome'],
      definitions: [
        {
          meaning: 'A written or printed work consisting of pages glued or sewn together along one side and bound in covers.',
          example: 'He spent the rainy afternoon immersed in a good book.'
        }
      ]
    }
  }
};

// Salva todos os arquivos JSON
const dicts = [
  { name: 'dict-en-pt.json', data: dictEnPt },
  { name: 'dict-es-pt.json', data: dictEsPt },
  { name: 'dict-pt-pt.json', data: dictPtPt },
  { name: 'dict-en-en.json', data: dictEnEn },
  { name: 'dict-es-es.json', data: dictEsEs },
  { name: 'dict-pt-en.json', data: dictPtEn },
];

for (const d of dicts) {
  const filePath = path.join(targetDir, d.name);
  fs.writeFileSync(filePath, JSON.stringify(d.data, null, 2), 'utf-8');
  console.log(`Gerado dicionário: ${d.name} (${Object.keys(d.data.entries).length} verbetes)`);
}

console.log('Todos os dicionários foram gerados com sucesso em:', targetDir);

