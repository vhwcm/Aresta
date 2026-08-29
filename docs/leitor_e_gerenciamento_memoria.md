# Arquitetura do Leitor, Otimizações & Gerenciamento de Memória

Esta documentação detalha o funcionamento interno do leitor digital do **Aresta**, explicando como arquivos nos formatos **PDF** e **EPUB** são carregados, processados e gerenciados em memória RAM e GPU durante a leitura, além de detalhar as **estratégias de otimização de abertura rápida e cache local**.

---

## 1. Resumo Executivo: O livro é carregado todo na memória?

* **Arquivo bruto (Binário/Buffer)**: **Sim**. O arquivo do livro (PDF ou EPUB) é baixado por completo e mantido em memória como um `ArrayBuffer` no cliente para viabilizar navegação instantânea, consultas de metadados e suporte a leitura fluida.
* **Cache Local Instantâneo**: Implementado via **IndexedDB** (`bookCache.ts`). Na primeira vez, o livro é baixado da rede e salvo no cache do navegador; nas próximas vezes, a abertura é imediata (<50ms) sem consumir rede.
* **Renderização visual**: **Não**. As páginas **não** são todas rasterizadas ou desenhadas na memória de uma vez. O leitor utiliza **Lazy Loading com Janela Deslizante de Cache**, mantendo em memória visual apenas as páginas atualmente visíveis e suas vizinhas imediatas (máximo de 8 páginas).

---

## 2. Ciclo de Vida do Carregamento Otimizado

```mermaid
flowchart TD
    A[Usuário abre livro na interface] --> B{Existe no Cache IndexedDB?}
    B -->|Sim (Cache Hit)| C[ArrayBuffer recuperado instantaneamente em <50ms]
    B -->|Não (Cache Miss)| D[Download e Metadados em Paralelo via Promise.all]
    D --> E[Salva no IndexedDB em background]
    D --> C
    
    C --> F{Tipo de Documento?}
    F -->|PDF| G[PdfDocumentAdapter + pdfjs-dist]
    F -->|EPUB| H[EpubDocumentAdapter + fflate / foliate-js]
    
    G --> I[Documento instanciado no ReaderStore]
    H --> I
    
    I --> J[Engine de Transição 2D Rápida]
    J --> K[1º Frame Renderizado Imediatamente]
    K --> L[Prefetch de páginas vizinhas adiado via requestIdleCallback]
```

---

## 3. Estratégias de Otimização Aplicadas

### 3.1. Cache Local com IndexedDB (`bookCache.ts`)
* Utiliza um Object Store estruturado (`aresta_book_cache`) para armazenar o binário `ArrayBuffer` junto com o título e o tipo do livro.
* Elimina a re-transferência de arquivos de 5MB a 20MB em leituras diárias.

### 3.2. Paralelização de Requisições de Rede (`ReaderShell.vue`)
* Em vez de fazer uma requisição para metadados e esperar seu fim para só então baixar o livro, ambas as requisições (`/api/books/:id` e `/api/books/:id/file`) são disparadas simultaneamente via `Promise.all`:

```typescript
const [fetchedMeta, response] = await Promise.all([
  $fetch(`/api/books/${bookId}`),
  fetch(fileUrl)
])
```

### 3.3. Motor de Renderização 2D Nativo e Transição de Páginas (200ms)
* **Renderização 2D Direta em Alta Resolução (High-DPI)**: Eliminação completa de Three.js/WebGL do leitor, desenhando as páginas diretamente em Canvas 2D escalado com `window.devicePixelRatio`. Isso garante nitidez cristalina (100% pixel-perfect) do texto em qualquer densidade de tela.
* **Transição 2D Suave (Slide Horizontal)**: Deslizamento lateral em ~200ms com curva de aceleração cúbica (`easeOutCubic`), suporte a gestos de arrasto e transição instantânea quando animações estão desativadas.
* **Modo Adaptativo de Páginas**: Suporte a 1 página (mobile e com grafo aberto) e 2 páginas lado a lado (desktop) com alternância dinâmica pela barra inferior.
* **Desacoplamento do *Prefetch***: A rasterização das páginas seguintes é processada em segundo plano via `requestIdleCallback`, garantindo resposta imediata ao folhear.

### 3.4. Modo Zen / Modo Foco (`isZenMode`)
* **Imersão Visual 100%**: Recolhe automaticamente a barra de ferramentas inferior (`ReaderBottomBar`), painéis laterais e o grafo de conhecimento, dedicando toda a viewport do dispositivo ao livro.
* **Saída Instantânea no Desktop**: Pressionar a tecla **`Escape` (`Esc`)** ou a tecla **`Z`** encerra o Modo Zen e restaura as ferramentas contextuais.
* **Saída Fluida no Mobile (`popstate`)**: Ao ativar o Modo Zen, o estado é registrado no histórico (`history.pushState`). O acionamento do **botão Voltar** (físico, barra de navegação virtual ou gesto lateral do Android/iOS) intercepta o evento `popstate` para sair do Modo Zen sem fechar a obra ou desviar da rota.
* **Controles Suaves**: Inclui toast visual transitório (*fade-out* em 2.8s) e botão flutuante discreto com efeito *glassmorphism* no canto superior da tela.

---

## 4. Detalhamento por Camada

### 4.1. Adaptadores de Documento (`IBookDocument`)

#### A. PDF (`PdfDocumentAdapter.ts`)
* Utiliza a biblioteca `pdfjs-dist` com Web Worker dedicado (`pdf.worker.min.mjs`).
* O PDF.js analisa a árvore de objetos e fontes do documento sem decodificar todas as páginas para bitmap simultaneamente.
* A decodificação de cada página (`pdfPage.render()`) só é disparada sob demanda quando a página entra no raio de visualização do leitor.

#### B. EPUB (`EpubDocumentAdapter.ts`)
* Utiliza a biblioteca `fflate` (`unzipSync`) para descompactar o contêiner ZIP do EPUB na memória do navegador.
* O parser do `foliate-js` mapeia os capítulos e seções lineares (`spine`).
* **Resolução de Imagens e Recursos**: Todas as imagens (`<img src>`, `<image xlink:href>`, `<image href>`, `<source>`) são resolvidas em relação ao caminho da seção e convertidas para Data URIs Base64 em memória, permitindo renderização imediata tanto na camada de texto DOM quanto nas texturas WebGL/Canvas do efeito 3D sem bloqueio de segurança SVG.
* **Inlining de Estilos e Preservação de Cores**: As folhas de estilo externas (`<link rel="stylesheet">`) e regras CSS são inlinadas em tags `<style>` com resolução de `url(...)`, permitindo que cores de títulos, destaques, spans e classes originais do EPUB sejam fielmente exibidas e se adaptem harmoniosamente aos temas (sepia, white, dark) do leitor.
* **Ajuste Dinâmico de Tipografia e Repaginação (`setFontSize` / `setFontFamily`)**: Permite alterar o tamanho da fonte (12px a 36px) e tipografia durante a leitura com repaginação proporcional por coluna e preservação exata da posição de leitura na seção ativa.

---

## 5. Matriz de Consumo de Recursos

| Componente | Armazenamento | Ciclo de Vida | Impacto de Memória |
| :--- | :--- | :--- | :--- |
| **Cache Permanente** | IndexedDB do Navegador | Persistente entre sessões | Proporcional aos livros lidos |
| **Binário do Arquivo** | RAM (JavaScript Heap) | Durante a sessão de leitura ativa | Proporcional ao arquivo (ex: ~2MB a 30MB) |
| **Estrutura/DOM do Livro** | RAM (Heap) | Durante a sessão | Baixo (~1MB a 5MB) |
| **Texturas de Renderização** | GPU / Canvas | Máx. 8 páginas simultâneas | Otimizado (~10MB a 25MB) |
| **Páginas Não Visualizadas** | N/A (Descarregadas) | Não alocadas até serem acessadas | 0 MB adicionais |

---

## 6. Ferramenta de Profiling e Diagnóstico de Gargalos (`readerProfiler`)

Para auditar o tempo gasto em cada etapa, o utilitário `readerProfiler` ([`front/app/utils/readerProfiler.ts`](file:///home/bcc/vhwcm24/Aresta/front/app/utils/readerProfiler.ts)) está ativo em ambiente de desenvolvimento.

### 6.1. O que é medido automaticamente:
1. **1. Buscar no Cache Local (IndexedDB)** (`io`): Tempo de busca do livro localmente.
2. **2. Download do Arquivo & Metadados** (`network`): Tempo de transferência HTTP em paralelo.
3. **3. Conversão para ArrayBuffer** (`io`): Transferência para o heap do JavaScript.
4. **4. Parsing do Documento** (`parse`): Inicialização e extração de páginas do PDF/EPUB.
5. **5. Atualização da Store** (`store`): Reatividade e carregamento de marcadores do usuário.
6. **6. Renderização da 1ª Página** (`render` / `webgl`): Rasterização e exibição no canvas.

### 6.2. Inspecionando no Console:
Ao abrir um livro no navegador (com o DevTools aberto), você verá:
```text
⚡ [Aresta Reader Profiler] Abrir Livro (ID: 3) — Total: 85ms (Cache Hit)
Tempo Total até a 1ª Página: 85ms
┌─────────┬──────────────────────────────────────────┬───────────┬──────────────┬────────────┐
│ (index) │ Etapa / Função                           │ Categoria │ Duração (ms) │ % do Total │
├─────────┼──────────────────────────────────────────┼───────────┼──────────────┼────────────┤
│ 0       │ 1. Buscar no Cache Local (IndexedDB)     │ IO        │ 8.2ms        │ 9.6%       │
│ 1       │ 4. Parsing e Inicialização do Documento  │ PARSE     │ 42.1ms       │ 49.5%      │
│ 2       │ 6.1 Obter Dados da Página 1              │ RENDER    │ 20.0ms       │ 23.5%      │
│ 3       │ 6.3 Criar Texturas da Página 1           │ WEBGL     │ 14.7ms       │ 17.3%      │
└─────────┴──────────────────────────────────────────┴───────────┴──────────────┴────────────┘
```

Objeto global disponível no console:
```javascript
window.__ARESTA_READER_PROFILE__
```
