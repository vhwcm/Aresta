# Aresta — Leitor de PDF & EPUB com Page Curl Engine

> Leitor web de alta fidelidade com efeito de virada de página físico (page curl) suportando PDF e EPUB. Construído com Nuxt 4, Vue 3, Canvas 2D.

## Stack

- **Nuxt 4.5** + **Vue 3.5** (SSR + Client Hydration)
- **pdfjs-dist 6.x** — renderização de PDF via Canvas
- **foliate-js** (git submodule) — parser de EPUB
- **Canvas 2D** — engine de page curl com matemática cilíndrica
- **Vitest 4** + **Playwright 1.62** — testes unitários e E2E
- **Pinia 3** — gerenciamento de estado

## Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Inicializar o submodule do foliate-js
git submodule update --init --recursive

# 3. Copiar o worker do PDF.js
node -e "require('fs').copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'public/workers/pdf.worker.min.mjs')"

# 4. Rodar em desenvolvimento
npm run dev

# 5. Rodar testes unitários
npm test

# 6. Rodar testes E2E
npm run test:e2e
```

## Arquitetura

```
File Upload
  └── useFileValidator (byte-signature + MIME)
        └── BookDocumentFactory (Strategy Pattern)
              ├── PdfDocumentAdapter  (pdfjs-dist)
              └── EpubDocumentAdapter (foliate-js)
                    └── IBookDocument (interface unificada)
                          └── useReaderCanvas
                                └── usePageCurlEngine
                                      └── pageCurlMath.ts (cilindro + Bezier)
```

## Estrutura de Pastas

```
app/
├── adapters/         # PdfDocumentAdapter, EpubDocumentAdapter, BookDocumentFactory
├── components/reader/ # ReaderShell, DropZone, PageCurlCanvas
├── composables/reader/ # useFileValidator, usePageCurlEngine, useReaderCanvas
├── interfaces/reader/ # IBookDocument, IPageCurlState, IValidationResult
├── pages/             # index.vue, reader/index.vue
├── stores/            # readerStore.ts (Pinia)
└── utils/             # fileValidator.ts, pageCurlMath.ts
tests/
├── unit/              # useFileValidator.test.ts, useReaderState.test.ts
└── e2e/               # upload-flow.spec.ts
```

## Matemática do Page Curl

O engine implementa deformação cilíndrica com variação cônica:

- O raio do cilindro é calculado como `radius = (width * k) / dragDistance`
- O fold point migra ao longo da borda da página com o drag vertical
- A curva de Bezier cúbica define o contorno da dobra com pontos de controle perpendiculares ao eixo de drag
- A sombra usa gradiente linear com opacidade inversamente proporcional ao raio (dobra mais apertada = sombra mais escura)
- O verso da página é renderizado com gradiente de reflexo de luz
