# Domínio: Anotações, Citações & CFI (`Annotation`)

## 1. Propósito
Permite ao leitor destacar trechos de livros, salvar citações, adicionar reflexões pessoais e associar essas marcações a temas do mapa mental.

---

## 2. Entidades e Modelo de Dados

### Modelos Prisma (`prisma/schema.prisma`)
```prisma
model Annotation {
  id               Int               @id @default(autoincrement())
  user_id          Int
  book_id          Int
  cfi              String            // Localizador CFI (EPUB) ou número de página (PDF)
  selected_text    String?           // Trecho original do livro destacado
  note             String?           // Comentário ou reflexão do usuário
  chapter_title    String?           // Título do capítulo extraído
  progress         Float?            @default(0.0)
  created_at       DateTime          @default(now())
  updated_at       DateTime          @default(now()) @updatedAt
  user             User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book             Book              @relation(fields: [book_id], references: [id], onDelete: Cascade)
  annotationThemes AnnotationTheme[]

  @@index([user_id, book_id])
  @@map("annotations")
}

model AnnotationTheme {
  id            Int        @id @default(autoincrement())
  annotation_id Int
  theme_id      Int
  created_at    DateTime   @default(now())
  annotation    Annotation @relation(fields: [annotation_id], references: [id], onDelete: Cascade)
  theme         Theme      @relation(fields: [theme_id], references: [id], onDelete: Cascade)

  @@unique([annotation_id, theme_id])
  @@map("annotation_themes")
}
```

---

## 3. Regras de Negócio

1. **Localização Exata com CFI (Canonical Fragment Identifier)**:
   - Em arquivos EPUB, a posição é ancorada por uma string padrão CFI (`epubcfi(...)`), garantindo que o highlight seja restaurado independentemente do tamanho da tela.
   - Em arquivos PDF, a posição armazena o número da página e coordenadas relativas.
2. **Vínculo com Mapa Mental**:
   - Uma anotação pode ser associada a múltiplos temas conceituais via `AnnotationTheme`.

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/annotation.controller.ts`, `src/services/annotation.service.ts`, `src/schemas/annotation.schema.ts`
- **Frontend**:
  - `front/app/composables/useAnnotations.ts`, `front/app/components/AnnotationModal.vue`
