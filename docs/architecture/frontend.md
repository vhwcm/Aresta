# Arquitetura do Frontend (`apps/web/`)

O frontend do Aresta é desenvolvido em **Nuxt 3 / Vue 3** com **TypeScript**, **Tailwind CSS**, **Pinia**, **Three.js** e **D3.js**, empacotado tanto para Web quanto Desktop via **Tauri v2**.

---

## 1. Estrutura de Diretórios

```text
apps/web/
├── app/
│   ├── components/           # Componentes Vue (Leitor, Canvas, Grafo D3, Modais, Dock)
│   ├── composables/          # Lógica reativa (useGraph, useUserBooks, useAnnotations, useAuth)
│   ├── pages/                # Rotas do Nuxt (index.vue, reader/[id].vue, canvas/[id].vue, etc.)
│   └── stores/               # Stores globais do Pinia
├── public/                   # Assets públicos estáticos (fontes, favicons)
└── tests/                    # Testes unitários (Vitest) e de componentes
```

---

## 2. Subsistema de Leitura (Reader Engine)

O leitor de documentos utiliza o padrão Adapter para desacoplar bibliotecas de renderização de baixo nível (`foliate-js` e `pdfjs-dist`) e conta com um motor híbrido de virada de página 3D em Three.js / WebGL.

> Para detalhes completos e diagramas ASCII dos fluxos de leitura, consulte [docs/architecture/reader.md](file:///c:/Users/vichw/Aresta/docs/architecture/reader.md):
> - Padrão Reader Adapter (`IBookDocument`)
> - Motor 3D de Virada de Página Realista (WebGL / Three.js)
> - Pilha de Páginas Virtuais (Page Stack Edges)

---

## 3. Visualização do Grafo de Conhecimento (D3.js)

- O composable `useGraph.ts` monta o grafo local-first a partir de livros, anotações, notas, quadros e temas persistidos no dispositivo. O canvas D3 (`GraphCanvas.vue`) inicializa uma simulação física baseada em forças (`d3.forceSimulation`).
- **Nós**:
  - **Obras (Livros)**: Representam nós de entrada de leitura.
  - **Temas**: Conceitos unificadores que conectam múltiplas obras.
  - **Anotações**: Citações e pensamentos específicos vinculados a temas e livros.
- **Física Interativa**: Suporte a arraste de nós com fixação temporária, zoom semântico e filtragem dinâmica por temas ativos.

> Para os diagramas completos de fluxo de dados do grafo, prevenção de ciclos e notas compostas, consulte [docs/architecture/canvas.md](file:///c:/Users/vichw/Aresta/docs/architecture/canvas.md).

---

## 4. Autenticação e Persistência de Sessão Local-First (`useAuth`)

O Aresta opera sob uma arquitetura SPA client-side (`ssr: false`) distribuída na Web e em aplicativos nativos (Desktop e Android APK via Tauri v2):

- **Estado Reativo Singleton**:
  - `sharedToken` e `sharedUser` são instanciados como singletons no escopo de módulo em [useAuth.ts](file:///c:/Users/vichw/Aresta/apps/web/app/composables/useAuth.ts).
  - Qualquer mutação de sessão (`login`, `register`, `useOAuth` ou callback) propaga reatividade imediata a todos os componentes sem recriação de refs.

- **Resiliência Multi-Plataforma e Prioridade de Armazenamento**:
  1. **LocalStorage**: Prioridade primária para clientes SPA e WebViews móveis. Garante persistência duradoura mesmo com reinicializações do app ou descarte do processo pelo Android.
  2. **Cookies Adaptativos**: Utilizados para sincronização no navegador web padrão. A flag `secure` é calculada dinamicamente (`window.location.protocol === 'https:'`), impedindo que origens locais e WebViews (`http://tauri.localhost` ou `http://localhost`) rejeitem silenciosamente o cookie com base na RFC 6265bis.
  3. **Leitura Unificada (`getStoredAuthToken`)**: Todos os pontos de consumo (`readerStore`, `Viewer`, `useDidacticBooklet`, `useFlashcards`) utilizam resolução unificada resiliente.

- **Ciclo de Vida Nativo Android (`MainActivity.kt`)**:
  - `CookieManager.getInstance().setAcceptCookie(true)` habilitado na inicialização.
  - `CookieManager.getInstance().flush()` executado em `onPause()` e `onStop()`, descarregando a memória RAM para a base SQLite do WebView do sistema operacional.
