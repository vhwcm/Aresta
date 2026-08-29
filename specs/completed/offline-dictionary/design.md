# Design da Spec: Dicionário Offline Local para Leitura de Livros (EPUB)

## Arquitetura Geral

O Dicionário Offline Local do Aresta é projetado para máxima velocidade, privacidade e autonomia offline. Todo o pipeline de busca, lematização e renderização de definições é executado no client-side via Web APIs (`IndexedDB`, `TextDecoder` e estruturas de índice Map/Trie), com sincronização de preferências pelo backend Node.js / Prisma.

---

## 1. Modelo de Dados & Backend

### Prisma Schema (`UserSettings`)
```prisma
model UserSettings {
  user_id                     Int      @id
  page_animation_enabled      Boolean  @default(true)
  language                    String   @default("pt-BR")
  native_language             String   @default("pt-BR") // pt-BR, en, es
  target_translation_language String   @default("en")    // en, es, pt-BR
  epub_font_size              Int      @default(18)
  epub_font_family            String   @default("newsreader")
  theme_mode                  String   @default("dark")
  desktop_home_graph_open     Boolean  @default(true)
  desktop_reader_graph_open   Boolean  @default(true)
  updated_at                  DateTime @default(now()) @updatedAt
  user                        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### Zod Schema & API
* **`updateUserSettingsSchema`**: Validação de `native_language` e `target_translation_language` (enum `'pt-BR' | 'pt' | 'en' | 'es'`).
* **Rotas**: `GET /api/user-settings` e `PUT /api/user-settings`.

---

## 2. Estrutura dos Dicionários Offline & IndexedDB

### Pacotes de Dicionário Estáticos (`public/dictionaries/`)
Arquivos JSON compactados estruturados por pares de idiomas:
- `dict-en-pt.json`: Inglês -> Português (traduções, definições em PT, classes gramaticais, pronúncia IPA, exemplos).
- `dict-es-pt.json`: Espanhol -> Português.
- `dict-pt-pt.json`: Português -> Português (definições monolíngues).
- `dict-en-en.json`: Inglês -> Inglês (definições monolíngues).
- `dict-es-es.json`: Espanhol -> Espanhol.
- `dict-pt-en.json`: Português -> Inglês.

### Estrutura de cada Entrada do Dicionário
```typescript
export interface DictionaryEntry {
  word: string
  lemma?: string
  phonetic?: string
  pos: string[] // 'substantivo', 'verbo', 'adjetivo', 'adverbio', etc.
  translations?: string[]
  definitions: {
    meaning: string
    example?: string
    synonyms?: string[]
  }[]
}
```

### IndexedDB Engine (`aresta_dictionary_db`)
- Store: `dictionary_entries` com chave composta `[pair, word]`.
- Store: `installed_dictionaries` para rastrear versão e status de download (`pair`, `version`, `entriesCount`, `downloadedAt`).

---

## 3. Lematizador Offline (`useLemmatizer.ts`)

Para garantir que palavras flexionadas (verbos conjugados, plurais, formas femininas, particípios) sejam encontradas:
1. **Dicionário Direto**: Testa a palavra exata em minúsculas (sem pontuação).
2. **Mapa de Formas Irregulares**: Consulta tabela rápida de verbos e plurais irregulares (ex: *went -> go*, *saw -> see*, *children -> child*, *fui -> ser/ir*).
3. **Regras de Sufixos & Desinências Verbais**:
   - **PT**: `-ando`, `-endo`, `-indo`, `-aram`, `-avam`, `-eriam`, `-rão`, `-ões`, `-ães`, `-mente`...
   - **ES**: `-ando`, `-iendo`, `-aron`, `-aban`, `-aron`, `-mente`, `-ces`...
   - **EN**: `-ing`, `-ed`, `-s`, `-es`, `-ies`, `-ly`, `-tion`...

---

## 4. Frontend & Componentes no Leitor

1. **[`ReaderSelectionTooltip.vue`](file:///c:/Users/vichw/Aresta/front/app/components/reader/ReaderSelectionTooltip.vue)**:
   - Identifica se a seleção é uma palavra única (`selectedText.trim().split(/\s+/).length === 1`).
   - Se for palavra única, renderiza botão com ícone de livro e texto **"Dicionário"**.

2. **[`ReaderDictionaryCard.vue`](file:///c:/Users/vichw/Aresta/front/app/components/reader/ReaderDictionaryCard.vue)** (Novo Componente):
   - Card flutuante com design editorial e animação suave.
   - Cabeçalho: Palavra pesquisada + pronúncia fonética + seletor rápido de par de línguas (`EN → PT ▾`).
   - Tags de classe gramatical (*substantivo*, *verbo*...).
   - Bloco de tradução principal destacado.
   - Lista numerada de significados com exemplos e sinônimos.
   - Botões: *Copiar Definição*, *Fechar*. (Zero relação com Flashcards).

3. **[`conta.vue`](file:///c:/Users/vichw/Aresta/front/app/pages/conta.vue)**:
   - Nova seção no bloco de configurações com cards visuais para:
     - Língua Nativa (Português, Inglês, Espanhol).
     - Língua Padrão de Tradução (Inglês, Espanhol, Português).
     - Indicador de status dos pacotes offline (Baixado / Disponível / Tamanho).

