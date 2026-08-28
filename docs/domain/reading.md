# Domínio: Estante do Usuário, Leitura & Progresso (`UserBook`)

## 1. Propósito
Gerencia a estante pessoal de cada usuário, o estado de leitura de cada livro, o progresso percentual, página atual e última data de acesso.

---

## 2. Entidades e Modelo de Dados

### Modelo Prisma (`prisma/schema.prisma`)
```prisma
model UserBook {
  id               Int         @id @default(autoincrement())
  user_id          Int
  book_id          Int
  status           String      @default("QUERO_LER") // QUERO_LER | LENDO | LIDO
  current_page     Int         @default(0)
  last_accessed_at DateTime?
  created_at       DateTime    @default(now())
  updated_at       DateTime    @default(now()) @updatedAt
  user             User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book             Book        @relation(fields: [book_id], references: [id], onDelete: Cascade)
  bookThemes       BookTheme[]

  @@unique([user_id, book_id])
  @@map("user_books")
}
```

---

## 3. Regras de Negócio e Ciclo de Vida

```
                      Adicionar à Estante
                              │
                              ▼
                        [ QUERO_LER ]
                              │
                              │ Abrir no Leitor (página > 0)
                              ▼
                          [ LENDO ]
                              │
                              │ Atingir última página (100%)
                              ▼
                          [ LIDO ]
```

1. **Transições Automáticas de Status**:
   - Ao iniciar a leitura de uma obra em `QUERO_LER`, o status transiciona automaticamente para `LENDO`.
   - Ao atingir a última página do documento, o status pode ser marcado como `LIDO`.
2. **Atualização de Progresso**:
   - O leitor dispara atualizações em debounce para `POST /api/user-books/:id/progress`, atualizando `current_page` e `last_accessed_at`.
3. **Tipografia & Repaginação Dinâmica (EPUB)**:
   - Durante a leitura de arquivos EPUB, o usuário pode alterar o tamanho da fonte (12px a 36px).
   - O adaptador recalcula as páginas mantendo a proporcionalidade de leitura do capítulo ativo e persistindo a preferência em `UserSettings`.
5. **Dicionário Offline Local & Lematização**:
   - Durante a leitura de EPUBs, a seleção de uma única palavra aciona a opção "Dicionário" no tooltip de seleção.
   - A consulta é 100% offline, operando sobre o `IndexedDB` (`aresta_dictionary_db`) com pacotes baixados em segundo plano.
   - Suporta pares de idiomas entre Português (`pt`), Inglês (`en`) e Espanhol (`es`), com lematização morfológica offline para formas flexionadas e verbos conjugados.
   - Permite alternância rápida de par de línguas e exibe fonética IPA, classe gramatical, traduções para a língua nativa, significados numerados e exemplos.
6. **Transição de Páginas 2D Fluida (GPU 60/120 FPS)**:
   - A virada e arraste de páginas são executados com aceleração de hardware via CSS Transforms (`translate3d`), preservando 100% da tipografia, proporção e nitidez dos glifos sem distorção ou redimensionamento de palavras durante a transição.



---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/userBook.controller.ts`
  - `src/services/userBook.service.ts`
  - `src/schemas/userBook.schema.ts`
- **Frontend**:
  - `front/app/composables/useUserBooks.ts`
  - `front/app/pages/reader/[id].vue`
  - `front/app/pages/index.vue`
  - `front/app/pages/por-que-ler.vue`

---

## 5. Fundamentação Científica & Neurociência da Leitura Profunda
- **Raciocínio Lógico & Pensamento Crítico**: A leitura profunda ativa conexões bidirecionais entre hemisférios cerebrais e o córtex pré-frontal dorsolateral (Drª Maryanne Wolf, Stanford & Tufts).
- **Neuroplasticidade & Conectividade Cerebral (fMRI)**: A imersão em obras densas eleva a conectividade de repouso no córtex temporal esquerdo e sulco motor por dias (Dr. Gregory Berns, Emory University, 2013).
- **Reserva Cognitiva & Proteção contra Declínio (-32%)**: Atividades de leitura contínua criam reserva sináptica protetora (Dr. Robert S. Wilson, Rush University Medical Center, *Neurology*).
- **Teoria da Mente & Empatia Cognitiva**: A leitura de narrativas complexas exercita a capacidade de inferir estados mentais e emoções de terceiros (Kidd & Castano, *Science*, 2013; Dr. Raymond Mar, Univ. de Toronto).
- **Desaceleração Fisiológica (-68% em 6 min)**: Redução expressiva de cortisol e frequência cardíaca em ambiente calmo (Dr. David Lewis, Univ. of Sussex).

