# Requisitos do Produto: Refatoração Front-end & Nova Navegação (Aresta)

## 1. Visão Geral
Este documento estabelece os requisitos funcionais e não-funcionais para a refatoração do front-end do projeto **Aresta**, introduzindo um novo sistema de navegação inferior colapsável (Bottom Navbar), identidade visual com logotipo animado baseado em grafo, páginas de conversão de formatos (PDF para EPUB), hub de livros, módulo de revisão com flashcards e resumos, central de conta de usuário com planos premium, e registro de dependências mockadas para futura integração com o backend.

---

## 2. Requisitos de Usuário & Histórias de Usuário

### [REQ-01] Barra de Navegação Inferior (Bottom Navbar)
- **Como** leitor e usuário da plataforma Aresta,
- **Quero** uma barra de navegação moderna, minimalista e posicionada na parte inferior da tela,
- **Para** que eu tenha acesso rápido às principais áreas do app sem distrações visuais ("low dopamine").

#### Critérios de Aceitação:
- [x] A navbar deve ficar fixa na parte inferior da tela (`fixed bottom-X`).
- [x] O fundo da navbar deve ser semitransparente com efeito vidro (`backdrop-blur`) e tom cinza escuro sutilmente mais claro que o fundo `#0A0A0B` (ex: `#161719/85`).
- [x] Os ícones devem usar traços clean e elegantes, na paleta da aplicação (destaque Laranja Aresta `#E57B55` quando ativo / hover, cinza sutil quando inativo).
- [x] Mecanismo de colapso/expansão suave com transição horizontal (a altura permanece constante; a largura expande/retrai suavemente).
- [x] No desktop: inicia expandida/colapsada por padrão e permite alternar; exibe ícone + descrição (label) em telas amplas.
- [x] No mobile: inicia recolhida/compacta; exibe apenas os ícones para economia de espaço em telas pequenas.
- [x] Acessibilidade: suporte a navegação por teclado e estados `aria-expanded` / `aria-label`.

---

### [REQ-02] Logotipo "A" em Grafo Vivo & Ofensiva de Leitura
- **Como** leitor,
- **Quero** visualizar a marca Aresta com um logotipo vivo em forma de letra "A" conectada por nós e arestas em movimento lento, e acompanhar minha ofensiva de leitura no topo,
- **Para** reforçar a identidade intelectual do app e me motivar a manter o hábito diário de leitura.

#### Critérios de Aceitação:
- [x] O logotipo central na navbar deve renderizar uma letra **A** estilizada composta por nós (círculos) e arestas (linhas de conexão).
- [x] Os nós e arestas devem ter uma animação contínua e lenta (CSS / SVG keyframes ou canvas sutil), simulando uma estrutura orgânica viva.
- [x] O clique no logotipo deve navegar para a página inicial (`/`).
- [x] O tamanho deve ser balanceado e refinado, sem poluir a barra.
- [x] No canto superior direito da aplicação (Header / App bar), deve ser exibido o componente de **Ofensiva (Streak)** mostrando os dias consecutivos de leitura com ícone e tooltip de progresso diário.

---

### [REQ-03] Conversor de Formatos (PDF para EPUB)
- **Como** usuário que possui materiais em PDF,
- **Quero** converter meus arquivos PDF para EPUB de maneira visual e rápida,
- **Para** poder ler meus livros no leitor fluido (Foliate/EPUB) com tipografia ajustável e controle de paginação.

#### Critérios de Aceitação:
- [x] Rota `/conversor` com área de upload (drag & drop) suportando arquivos PDF.
- [x] Opções de conversão (preservação de imagens, extração de texto, formatação inteligente).
- [x] Barra de progresso visual de conversão com etapas explicativas (Análise -> Extração -> Montagem EPUB).
- [x] Botões para baixar o arquivo EPUB gerado ou salvá-lo diretamente na biblioteca do usuário.
- [x] Mock realista da conversão enquanto o endpoint do backend estiver em desenvolvimento.

---

### [REQ-04] Hub de Livros (Menu / Subabas)
- **Como** usuário,
- **Quero** acessar meus livros, meu grafo de conhecimento e a loja/catálogo através de uma entrada unificada na navbar,
- **Para** navegar entre minha estante pessoal e novas descobertas.

#### Critérios de Aceitação:
- [x] A aba "Livros" deve apresentar acesso claro para:
  1. **Meus Livros** (`/library` ou `/livros`) - estante pessoal e progresso de leitura.
  2. **Grafo de Conhecimento** (`/grafo`) - mapa mental de conexões entre livros e ideias.
  3. **Loja / Catálogo** (`/loja`) - catálogo para explorar novos títulos e recomendações editoriais.
- [x] Suporte a menu suspenso (dropdown/popover) ao clicar ou passar o cursor, e páginas dedicadas para cada subseção.

---

### [REQ-05] Módulo de Revisão (Flashcards & Resumo de Anotações)
- **Como** estudante ou leitor reflexivo,
- **Quero** revisar conceitos dos livros através de flashcards interativos e resumos de anotações inteligentes geradas por IA,
- **Para** fixar o conhecimento e revisitar citações marcantes.

#### Critérios de Aceitação:
- [x] Rota `/revisao` com navegação interna entre as abas **Flashcards** e **Resumos & Anotações**.
- [x] **Flashcards**:
  - Cartões com visualização da pergunta/frente e revelação da resposta/verso (animação de flip 3D/suave).
  - Ações de avaliação de retenção (Ex: *Difícil*, *Bom*, *Fácil*) simulando algoritmo de repetição espaçada.
  - Filtro por livro ou tema.
- [x] **Resumos & Anotações**:
  - Agrupamento de notas e destaques por obra.
  - Síntese estruturada por tópicos principais gerada por IA.
  - Opção de exportação ou geração de novo flashcard a partir de anotação.

---

### [REQ-06] Central da Conta (Status, Upgrade Premium e Métricas)
- **Como** usuário da plataforma,
- **Quero** visualizar o status da minha conta, opções de upgrade e estatísticas de uso,
- **Para** gerenciar minha assinatura e acompanhar minha evolução intelectual.

#### Critérios de Aceitação:
- [x] Rota `/conta` com resumo do perfil do usuário.
- [x] Indicador do plano atual (Gratuito vs Premium/Pro).
- [x] Seção de Upgrade Premium destacando benefícios (armazenamento ilimitado, IA ilimitada, conversão OCR de PDFs de alta densidade, sincronização total).
- [x] Métricas e estatísticas: total de livros, páginas lidas, nós do grafo criados, taxa de retenção de flashcards.

---

### [REQ-07] Registro e Lista de Mocks para Backend Futuro
- **Como** equipe de engenharia e produto,
- **Quero** um registro formal de todas as APIs, contratos e dados mockados nesta versão front-end,
- **Para** que o time de backend possa implementar os endpoints sem divergências de arquitetura.

#### Critérios de Aceitação:
- [x] Criação de `artifacts/MOCKS.md` com todos os endpoints, esquemas JSON e fluxos pendentes de backend.
- [x] Modularização dos mocks em serviços/composables claros e desacoplados no front-end.

---

## 3. Requisitos Não-Funcionais

- **Design System & Estética**: Seguir rigorosamente o ARESTA Design System (Ultra Dark `#0A0A0B`, `#121315`, acento `#E57B55`, Newsreader, Inter, JetBrains Mono, estética "low dopamine", borderless com linhas divisórias de 1px).
- **Responsividade**: Layout impecável em telas mobile (< 768px), tablets (768px - 1024px) e desktops (> 1024px).
- **Performance**: Animações SVG em 60fps usando CSS transforms leves (GPU accelerated).
- **Testabilidade**: Testes unitários com Vitest cobrindo componentes e rotas principais.
