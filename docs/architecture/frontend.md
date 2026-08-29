# Arquitetura do Frontend (`front/`)

O frontend do Aresta é desenvolvido em **Nuxt 4 / Vue 3** com **TypeScript**, **Tailwind CSS**, **Pinia** e **D3.js**.

---

## 1. Estrutura de Diretórios

```
front/
├── app/
│   ├── adapters/             # Padrão Adapter (EpubDocumentAdapter, PdfDocumentAdapter, Factory)
│   ├── components/           # Componentes Vue (Leitor, Grafo D3, Modais, Dock de navegação)
│   ├── composables/          # Lógica reativa (useGraph, useUserBooks, useAnnotations, useAuth)
│   ├── interfaces/           # Definições de tipos TypeScript (IBookDocument, IPageData, etc.)
│   ├── pages/                # Rotas do Nuxt (index.vue, reader/[id].vue, graph.vue, etc.)
│   └── stores/               # Stores globais do Pinia
├── public/                   # Assets públicos estáticos (fontes, favicons)
└── tests/                    # Testes unitários (Vitest) e E2E (Playwright)
```

---

## 2. Padrão Adapter para Leitor de Documentos

O sistema de leitura desacopla as bibliotecas de renderização de baixo nível através de uma interface unificada `IBookDocument`:

```
                    ┌──────────────────────────────────────┐
                    │       Página do Leitor (Vue 3)       │
                    │      `front/app/pages/reader/[id]`   │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ 1. BookDocumentFactory.loadDocument(url, format)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         BookDocumentFactory          │
                    └──────────────────┬───────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │ format === 'epub'                           │ format === 'pdf'
                ▼                                             ▼
     ┌──────────────────────┐                      ┌──────────────────────┐
     │ EpubDocumentAdapter  │                      │  PdfDocumentAdapter  │
     │     (foliate-js)     │                      │     (pdfjs-dist)     │
     └──────────┬───────────┘                      └──────────┬───────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │ 2. Retorna instância unificada
                                       ▼
                    ┌──────────────────────────────────────┐
                    │      Interface `IBookDocument`       │
                    │   - totalPages, title, getPage()     │
                    │   - getTextContent(), renderText()   │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ 3. getPage(pageNumber)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     Canvas Engine & Text Layer       │
                    │  - Desenha imagem no <canvas>        │
                    │  - Sobrepõe texto DOM selecionável   │
                    │  - Cache local de páginas em memória │
                    └──────────────────────────────────────┘
```

---

## 3. Visualização do Grafo de Conhecimento (D3.js)

- O composable `useGraph.ts` consome `/api/graph` e inicializa uma simulação física baseada em forças (`d3.forceSimulation`).
- **Nós**:
  - **Obras (Livros)**: Representam nós de entrada de leitura.
  - **Temas**: Conceitos unificadores que conectam múltiplas obras.
  - **Anotações**: Citações e pensamentos específicos vinculados a temas e livros.
- **Física Interativa**: Suporte a arraste de nós com fixação temporária, zoom semântico e filtragem dinâmica por temas ativos.

---

## 4. Motor 3D de Virada de Página Realista (WebGL / Three.js)

O leitor adota uma engine híbrida de alto desempenho para virada de página física estilo Kindle/Apple Books:
- **Camada Estacionária (2D Nativo)**: Em repouso, exibe o Canvas 2D e TextLayer DOM nítidos com suporte a seleção de texto, menu de dicionário, grifos e anotações.
- **Camada 3D em Movimento (WebGL Contínuo)**: Durante gestos de arrasto ou animações de toque, um canvas WebGL gerenciado por `usePageCurl3D.ts` assume a deformação física contínua da malha (`PlaneGeometry` 64x64) via GLSL Vertex Shader cônico/cilíndrico e Fragment Shader PBR (sombras de contato, luz especular de papel e translucidez).
- **Física Gestual (`usePagePhysics.ts`)**: Suporte a manipulação direta 1:1 por ponto de contato (cantos e laterais), detecção de velocidade/flick e dinâmica de amortecimento por mola elástica (Hooke's Law).
- Diagrama arquitetural disponível em: `docs/architecture/diagrams/page-curl-3d-flow.txt`.

