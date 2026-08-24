# Documento de Design Técnico: Aresta Front-end Refactor & Bottom Navigation

## 1. Visão Geral da Arquitetura

Este documento estabelece o design técnico da interface do usuário da plataforma **Aresta**, construída com **Nuxt 4 + Vue 3 + Tailwind CSS + Lucide Icons**. A aplicação adota o paradigma *Editorial Premium* e estética *Low-Dopamine*, com fundo escuro ultra-profundo (`#0A0A0B`), contraste tipográfico acentuado e navegação inferior ergonômica e animada.

```
+-----------------------------------------------------------------------+
|  Top Header / App Bar (Ofensiva Streak 🔥, Busca Cmd+K, Usuário)      |
+-----------------------------------------------------------------------+
|                                                                       |
|  Main Content Canvas (Borderless, Negative Space, Editorial Typo)     |
|                                                                       |
|  Rotas:                                                               |
|  • /             -> Home / Feed de Leitura Ativa e Sínteses           |
|  • /conversor    -> Conversor PDF para EPUB                           |
|  • /livros       -> Meus Livros (Estante & Progresso)                 |
|  • /grafo        -> Grafo de Conhecimento Interativo                  |
|  • /loja         -> Catálogo / Livraria & Descobertas                 |
|  • /revisao      -> Flashcards & Resumos IA                           |
|  • /conta        -> Perfil, Métricas e Upgrade Premium                |
|                                                                       |
+-----------------------------------------------------------------------+
|  Floating Bottom Navbar (Collapsible, Animated Graph Logo, Blur)      |
|  [ Conversor | Livros ▾ | (A) Grafo Vivo (Home) | Revisão | Conta ]   |
+-----------------------------------------------------------------------+
```

---

## 2. Componentes de Interface

### 2.1 `BottomNavbar.vue` (Navegação Inferior Inteligente)
- **Posicionamento**: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- **Design Visual**:
  - `bg-[#18191c]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl`
  - Transição de largura suave: `transition-all duration-300 ease-in-out`
  - Altura constante: `h-14 md:h-16`
- **Comportamento Colapso / Expansão**:
  - **Desktop**: Inicia expandida com rótulos de texto e botão de toggle sutil para contrair. Quando contraída, foca apenas nos ícones.
  - **Mobile**: Inicia compacta/recolhida (apenas ícones essenciais ou botão pill flutuante com expansão ao toque).
- **Abas**:
  1. **Conversor**: Ícone `FileCode2` ou `RefreshCw` + label "Conversor"
  2. **Livros**: Ícone `BookOpen` + label "Livros" com Popover vertical elegante:
     - Meus Livros (`/library` / `/livros`)
     - Grafo de Conhecimento (`/grafo`)
     - Loja / Catálogo (`/loja`)
  3. **Logo Central (Home)**: Componente `ArestaLogoGraph.vue`
  4. **Revisão**: Ícone `Layers` + label "Revisão"
  5. **Conta**: Ícone `User` + label "Conta"

### 2.2 `ArestaLogoGraph.vue` (Letra "A" em Grafo Vivo)
- Renderização SVG com nós (nodes) circulares nos vértices da letra **A** (topo, base esquerda, base direita, centro esquerdo, centro direito) e arestas (arestas/edges) ligando os nós.
- Movimento orgânico lento via animação CSS `@keyframes` ou física suave SVG com `transform: translate()` e variação de opacidade/brilho nos nós e arestas.
- Tamanho compacto (`w-9 h-9` ou `w-10 h-10`), cores em Laranja Aresta (`#E57B55`) e branco sutil.
- Ao clicar, transiciona o usuário para a Home (`/`).

### 2.3 `ReadingStreak.vue` (Ofensiva de Leitura)
- Localizado no canto superior direito do layout principal.
- Exibe o ícone de chama/faísca (`FlameIcon` ou `ZapIcon` em tom `#E57B55`), número de dias consecutivos (ex: `🔥 14 dias`) e popover com detalhes:
  - Meta diária (ex: 20 min lidos hoje).
  - Calendário semanal de ofensiva.

---

## 3. Estrutura de Rotas e Páginas

### 3.1 `/conversor` (`pages/conversor.vue`)
- Painel de conversão de PDFs acadêmicos e técnicos para o formato EPUB refinado.
- Drag & Drop container com pré-visualização de nome de arquivo e tamanho.
- Controles de conversão: modo de layout (Reflowable / Fixo), OCR inteligente para PDFs escaneados, extração de notas de rodapé.
- Simulação de progresso multi-etapa com feedback visual em tempo real.
- Ação pós-conversão: *Download .epub* ou *Adicionar à Minha Biblioteca Aresta*.

### 3.2 `/livros` (`pages/livros/index.vue` ou `/library.vue`)
- Visualização em lista/grid editorial da estante do usuário.
- Abas de navegação rápida interna ou subrotas:
  - `/livros` (Estante pessoal)
  - `/grafo` (Visualizador 2D/3D com D3/Three.js do mapa de conceitos)
  - `/loja` (`pages/loja.vue`) - Vitrine de livros curados em domínio público e clássicos intelectuais com preview e adição com um clique.

### 3.3 `/revisao` (`pages/revisao.vue`)
- Sub-abas: **Flashcards** e **Resumos de Anotações**.
- **Flashcards View**:
  - Baralho ativo com contador (ex: `Card 3 de 15`).
  - Efeito de rotação 3D ao clicar no card para revelar a resposta e explicação conceitual.
  - Botões de classificação: *Errei (1d)*, *Bom (3d)*, *Fácil (7d)*.
- **Resumos & Anotações View**:
  - Seleção por livro lido.
  - Acordeão editorial com resumos gerados por IA agrupados por capítulos/tópicos.
  - Ação de criar flashcard a partir de citação.

### 3.4 `/conta` (`pages/conta.vue`)
- Card de identificação do usuário e avatar estilizado.
- Badge de status de plano: **Gratuito** ou **Aresta Pro / Premium**.
- Grade de Métricas:
  - Horas totais de leitura
  - Livros concluídos
  - Nós conceituais gerados no Grafo
  - Taxa de retenção em revisões
- Seção de Upgrade Pro:
  - Comparativo de planos (Free vs Pro).
  - Recursos Pro: IA Gemini ilimitada, Conversor PDF ilimitado com OCR de alta definição, sincronização em nuvem e exportação para Anki/Notion.
  - Modal interativo de assinatura mockada.

---

## 4. Gerenciamento de Estado & Mocks

- `useReadingStreak`: Composable para gerenciar a ofensiva, cálculo diário e histórico de leitura.
- `useBookConverter`: Composable para orquestrar o upload, simulação de conversão PDF->EPUB e download.
- `useReviewStore` / `useReviews`: Composable para gerenciar o deck de flashcards, fila de repetição espaçada e resumos por livro.
- `useAccountStore`: Composable com dados de perfil, plano atual e histórico de estatísticas.

---

## 5. Garantia de Responsividade (Mobile, Tablet, Desktop)

| Viewport | Bottom Navbar | Conteúdo Central | Sidebar Graph |
|---|---|---|---|
| **Mobile (<768px)** | Barra compacta apenas com ícones na base; menus abrem em bottom-sheet | Padding lateral reduzido (`px-4`), tipografia adaptativa | Oculta |
| **Tablet (768-1024px)** | Barra média com ícones e labels compactos | Padding balanceado (`px-8`), 2 colunas | Oculta ou Drawer retrátil |
| **Desktop (>1024px)** | Barra flutuante completa expansível/colapsável | Padding generoso (`px-12 py-16`), tipografia Newsreader monumental | Visível na lateral ou integrado |
