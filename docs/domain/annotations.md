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
3. **Escrita Manual e Transcrição via OCR**:
   - O leitor pode redigir notas digitando ou desenhando à mão em um painel expandido (50% desktop/tablet, 100% mobile).
   - Ao salvar uma nota desenhada no Canvas (`HandwritingCanvas.vue`), a imagem é transmitida ao backend Node.js, que se comunica via gRPC com o microsserviço `aresta-ocr` para transcrever os traços e persistir a anotação diretamente no banco de dados.

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/annotation.controller.ts`, `src/controllers/ocr.controller.ts`, `src/services/annotation.service.ts`, `src/services/ocr.client.ts`, `src/schemas/annotation.schema.ts`
- **Frontend**:
  - `front/app/composables/useAnnotations.ts`, `front/app/components/reader/ReaderAnnotationModal.vue`, `front/app/components/reader/ReaderAnnotationDrawer.vue`, `front/app/components/reader/HandwritingCanvas.vue`, `front/app/pages/index.vue`

---

## 5. Fundamentação Científica da Anotação & Retenção de Conhecimento
- **Processamento Semântico Profundo (*Levels of Processing*)**: Anotar e reformular com as próprias palavras força o cérebro a codificar significados semânticos profundos, superando a memorização superficial (Fergus Craik & Robert Lockhart, 1972 / Craik & Tulving, 1975).
- **Efeito de Geração & Síntese Ativa**: A síntese e reorganização conceitual autoral gera compreensão e retenção de longo prazo expressivamente superior à transcrição literal passiva (Pam Mueller & Daniel Oppenheimer, Princeton & UCLA, *Psychological Science*, 2014).
- **Recuperação Ativa (*Retrieval Practice* & *Testing Effect*)**: Converter anotações em perguntas e flashcards consolida sinapses e retém até 80% mais dados a longo prazo (Dr. Henry Roediger & Dr. Jeffrey Karpicke, Washington University, *Science*, 2006).
- **Teoria da Carga Cognitiva & Mente Estendida**: Conectar anotações em um grafo conceitual descarrega a memória de trabalho limitada (4-7 itens), liberando largura de banda neural para raciocínios superiores (John Sweller, *Cognitive Load Theory*; Andy Clark & David Chalmers, *The Extended Mind*, 1998).
- **Curva do Esquecimento & Repetição Espaçada**: A revisão ativa em intervalos distribuídos reseta o decaimento mnemônico (Hermann Ebbinghaus; Cepeda et al., *Psychological Bulletin*).


