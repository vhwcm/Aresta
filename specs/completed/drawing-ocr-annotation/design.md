# Design Técnico: Anotações com Painel Expandido de Escrita Manual e OCR

## 1. Visão Geral da Arquitetura

O fluxo integra a interface do leitor Nuxt/Vue, o backend Node.js (Express + Prisma) e o microsserviço de OCR em Go (`aresta-ocr` via gRPC).

```
 ┌──────────────────────┐         HTTP POST (JSON)          ┌─────────────────────┐
 │  Nuxt / Vue 3 App    │ ─────────────────────────────────> │  aresta-back-node   │
 │                      │  /api/annotations/with-ocr        │   (Express + Zod)   │
 │ • Expanded Drawer    │                                    └──────────┬──────────┘
 │ • HTML5 Canvas / Pen │ <─────────────────────────────────            │
 │ • Touch & Stylus     │         201 Created (JSON)                    │ gRPC
 └──────────────────────┘                                               │ ExtractText
                                                                        ↓
 ┌──────────────────────┐        Prisma / SQL               ┌─────────────────────┐
 │ PostgreSQL / SQLite  │ <──────────────────────────────── │     aresta-ocr      │
 │  (Annotations Table) │                                   │    (Go + Gemini)    │
 └──────────────────────┘                                   └─────────────────────┘
```

---

## 2. Componentes Afetados

### 2.1 Backend (`aresta-back-node`)
- **`src/services/ocr.client.ts`**: Cliente gRPC em Node.js usando `@grpc/grpc-js` e `@grpc/proto-loader` para comunicar com `aresta-ocr` no endpoint configurado (default: `localhost:50051`).
- **`src/schemas/annotation.schema.ts`**: Zod schema `createAnnotationWithOcrSchema` validando `bookId`, `cfi`, `imageBase64`, `mimeType`, `themeIds`, etc.
- **`src/controllers/annotation.controller.ts`**: Método `createAnnotationWithOcr` que invoca `ocrClient.extractText(...)` e repassa para `annotationService.createAnnotation(...)`.
- **`src/routes/annotation.routes.ts`**: Rota `POST /api/annotations/with-ocr`.
- **`src/routes/ocr.routes.ts`** & **`src/controllers/ocr.controller.ts`**: Rota `POST /api/ocr/transcribe` para transcrição avulsa.

### 2.2 Frontend (`front`)
- **`app/components/reader/HandwritingCanvas.vue`**: Componente de Canvas HTML5 com:
  - Suporte a pointer events (mouse, touch e stylus).
  - Caneta (espessura fina/média/grossa).
  - Borracha (destination-out ou remoção de traços).
  - Histórico de traços para Undo.
  - Botão Limpar Tudo.
  - Exportação de imagem otimizada em Base64 PNG.
- **`app/components/reader/ReaderAnnotationDrawer.vue`**: Painel lateral (50% desktop/tablet, 100% mobile) com:
  - Header com botão de fechar e título do capítulo/página.
  - Citação do trecho selecionado.
  - Seletor de modo: Digitação vs. Desenho.
  - Tags de temas do Grafo de Conhecimento com criação rápida.
  - Botão Salvar com feedback de carregamento "Transcrevendo e salvando...".
  - Mensagens de erro com preservação do estado do canvas.
- **`app/components/reader/ReaderAnnotationModal.vue`**: Adicionado botão de ação rápida "Expandir / Modo Caneta" que comuta para o Drawer expandido.
- **`app/composables/useAnnotations.ts`**: Método `createAnnotationWithOcr({ bookId, cfi, imageBase64, themeIds, ... })`.

---

## 3. Contratos de API e Schemas Zod

### 3.1 Schema Zod (`aresta-back-node/src/schemas/annotation.schema.ts`)

```typescript
export const createAnnotationWithOcrSchema = z.object({
  bookId: z.number().int().positive('bookId deve ser um inteiro positivo'),
  cfi: z.string().min(1, 'cfi é obrigatório'),
  selectedText: z.string().optional().nullable(),
  chapterTitle: z.string().optional().nullable(),
  progress: z.number().min(0).max(1).optional().nullable(),
  themeIds: z.array(z.number().int()).optional(),
  imageBase64: z.string().min(10, 'imageBase64 é obrigatório'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/png'),
  promptHint: z.string().optional(),
});

export type CreateAnnotationWithOcrInput = z.infer<typeof createAnnotationWithOcrSchema>;
```

### 3.2 Endpoint `POST /api/annotations/with-ocr`
- **Request Body**:
  ```json
  {
    "bookId": 1,
    "cfi": "page:12",
    "selectedText": "Trecho selecionado do livro...",
    "chapterTitle": "Capítulo 2",
    "themeIds": [3, 5],
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "mimeType": "image/png"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": 42,
    "bookId": 1,
    "userId": 1,
    "cfi": "page:12",
    "selectedText": "Trecho selecionado do livro...",
    "note": "Texto transcrito com sucesso pelo OCR",
    "chapterTitle": "Capítulo 2",
    "progress": null,
    "createdAt": "2026-08-26T15:30:00.000Z",
    "updatedAt": "2026-08-26T15:30:00.000Z",
    "themes": [
      { "id": 3, "name": "Filosofia", "color": "#E57B55" }
    ]
  }
  ```

---

## 4. Integração gRPC com `aresta-ocr`

### 4.1 Carregamento do Protobuf no Node.js
O cliente Node.js carrega o arquivo `aresta-ocr/proto/ocr/v1/ocr.proto` usando `@grpc/proto-loader`.
Variáveis de ambiente:
- `OCR_GRPC_HOST` (default: `localhost`)
- `OCR_GRPC_PORT` (default: `50051`)

```typescript
// Exemplo de chamada no OcrClient
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition) as any;
const client = new proto.ocr.v1.OcrService(
  `${env.OCR_GRPC_HOST}:${env.OCR_GRPC_PORT}`,
  grpc.credentials.createInsecure()
);
```

---

## 5. Estratégia de Fallback e Resiliência

1. **OCR Indisponível / Timeout**:
   - Backend retorna HTTP 502 / 503 com `{ "error": "Serviço de OCR indisponível no momento." }`.
   - Frontend exibe toast de aviso sem fechar o painel e sem limpar o canvas.
2. **Desenho Vazio / Ilegível**:
   - Se o OCR retornar texto vazio ou não detectar palavras, o backend retorna `{ "error": "Nenhum texto reconhecido no desenho." }` ou salva com nota editável.
   - Frontend alerta o usuário e permite tentar novamente ou alternar para digitação.

---

## 6. Diagrama ASCII

Consulte [diagrams/drawing_ocr_flow.txt](file:///home/bcc/vhwcm24/Aresta/specs/active/drawing-ocr-annotation/diagrams/drawing_ocr_flow.txt) para o fluxo completo.
