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

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/userBook.controller.ts`
  - `src/services/userBook.service.ts`
  - `src/schemas/userBook.schema.ts`
- **Frontend**:
  - `front/app/composables/useUserBooks.ts`
  - `front/app/pages/reader/[id].vue`
