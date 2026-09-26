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

### 3.5. Modo de Leitura Scroll Contínuo Vertical (`ReaderScrollEngine.vue` e `useReaderScroll.ts`)
* **Padrão Strategy**: Alternância desacoplada entre virada de folhas (`PageCurlCanvas.vue`) e rolagem vertical contínua (`ReaderScrollEngine.vue`), controlada por `store.readingMode`.
* **Virtualização de PDFs com Dimensões Reais**: Slots proporcionais calculados previamente com base no aspect-ratio do PDF preservam a barra de rolagem precisa. Um `IntersectionObserver` carrega canvas e camada de texto apenas para páginas próximas à viewport (buffer de 600px) e descarta as demais da memória GPU/RAM.
* **Fluxo Reflowable para EPUBs**: Renderização contínua de seções (`renderSectionContinuous`) com tipografia fluida, sem colunas artificiais nem cortes de parágrafos.
* **Sincronização de Progresso Bidirecional**: Observador de baseline superior mantém `currentPage` e progresso percentual precisos durante o scroll livre e preserva a posição ao alternar modos.
* **Paridade Total**: Suporte a temas de fundo (amarelado, branco, preto), larguras (centralizado e largo), seleção de texto, criação e exibição de anotações e destaques coloridos.

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

Para auditar o tempo gasto em cada etapa, o utilitário `readerProfiler` (`apps/web/app/utils/readerProfiler.ts`) está ativo em ambiente de desenvolvimento.

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

---

## 7. Experiência Espacial 3D e Realismo Tátil do Livro (`PageCurlCanvas.vue`)

Para elevar o modelo mental de imersão de um livro físico real na tela (especialmente no modo 3D com página dupla e tema escuro), o motor incorpora detalhes de geometria e acabamento editorial:

### 7.1. Faixa de Vinco Central da Lombada (`.book-spine-crease`)
* **Problema Resolvido:** No tema escuro (`theme-black`), a sobreposição de duas páginas pretas (`#000000`) sobre o fundo preto causava perda visual da divisão física das páginas, já que sombras escuras tradicionais ficavam invisíveis.
* **Mecanismo:** Um elemento dedicado de canaleta (`.book-spine-crease`) de 28px de largura posicionado exatamente sobre a mediana central (`z-index: 15`).
* **Acabamento:** No Dark Mode, projeta uma costura central nítida (`rgba(255, 255, 255, 0.24)`) ladeada por vales de sombra e transição de curvatura luminosa do papel. Em documentos PDF (que possuem folhas brancas nativas), a classe `.book-spine-crease--pdf` aplica sombreamento escuro clássico com total fidelidade.

### 7.2. Pilhas Laterais de Páginas de Alto Contraste (`.book-page-stack`)
* **Volume Tridimensional:** A espessura máxima das folhas acumuladas nas bordas externas foi ampliada de 14px para **24px** no desktop, com escalonamento dinâmico baseado no total de páginas da obra.
* **Contraste Aumentado:** O padrão de folhas cortadas (`repeating-linear-gradient`) no tema escuro teve o contraste reforçado com borda externa e sombras de profundidade, proporcionando sensação espacial imediata do volume de páginas restantes e já concluídas.

### 7.3. Pilhas Inferiores Assimétricas e Transição Elíptica (`.book-page-stack-bottom-unified`)
* **Perspectiva do Corte Inferior ("Tail"):** Emulação das folhas na parte inferior do livro aberto na mesa.
* **Transição Elíptica Contínua na Lombada:** Para eliminar descontinuidades ou degraus retos verticais bruscos entre a espessura da página esquerda e direita, o bloco inferior é renderizado como um SVG unificado com curva de Bézier cúbica simétrica (arco elíptico suave de 36px) centrada na dobra central. A curvatura preserva derivadas horizontais (tangentes nulas) em ambas as extremidades, fundindo organicamente as duas espessuras.
* **Unificação dos Cantos Sem Divisão:** As pilhas laterais estendem sua altura contínua até o nível exato da base (`height + bottomHeight`), eliminando qualquer divisão ou corte horizontal nas quinas externas do livro e garantindo um bloco de folhas monolítico e natural.
* **Assimetria Dinâmica:**
  * **Folha Esquerda:** Altura proporcional às páginas lidas (`currentPage - 1`), partindo de 0px na capa até 8px no final da obra.
  * **Folha Direita:** Altura proporcional às páginas restantes (`totalPages - currentPage`), partindo de 8px na capa até 0px no final da obra.
* **Interatividade Integrada:** As pilhas inferiores e laterais atuam como atalhos clicáveis para avançar ou retroceder a página com suporte pleno a acessibilidade (`role="button"`).

### 7.4. Sistema Vetorial de Linhas de Folhas 1-para-1 com Encontro Reto na Quina (`.book-stack-line`)
* **Orientação Física Realista (Horizontal na Base vs Vertical nas Laterais):** Em livros físicos, as bordas laterais expõem o corte vertical das páginas, enquanto a base inferior expõe o corte horizontal das folhas. Para harmonizar esses dois planos tridimensionais sem quebras, o motor vetorial adota correspondência 1-para-1 direta entre cada folha lateral e sua respectiva linha na base.
* **Encontro Reto Perpendicular nas Quinas (90° Orthogonal Corner):** Cada folha $k \in \{1 \dots N\}$ desce em traço vertical estrito pela lateral e encontra a sua respectiva linha horizontal na base em um ângulo reto perfeito de 90° (`L xLeft (pageH + dy_L) L xSpineStart (pageH + dy_L)`), eliminando curvaturas e proporcionando acabamento geométrico nítido e sólido conforme a perspectiva editorial clássica.
* **Junção Miter sem Rebarbas:** As linhas utilizam `stroke-linejoin: miter` e `stroke-linecap: square`, assegurando quinas limpas, nítidas e sem distorções visuais.
* **Transição Suave na Lombada:** Todas as linhas continuam cruzando a mediana central por meio de curvas suaves em S (`C`), mantendo a ilusão contínua de blocos físicos de papel que convergem para a encadernação central.
* **Fidelidade de Tema:** Suporte a traços luminosos de alto contraste em OLED Black (`rgba(255, 255, 255, 0.2)` e `0.35`), tons quentes em Sépia e grafite suave em White.



