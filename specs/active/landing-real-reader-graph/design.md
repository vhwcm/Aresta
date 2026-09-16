# Design Técnico: Integração do Leitor e Grafo Reais na Landing Page

## 1. Visão Geral da Arquitetura
A Landing Page do Aresta (`apps/web/app/pages/index.vue`) possui dois estados principais:
1. **Autenticado (`auth.isLoggedIn === true`)**: Painel de leitura ativa, feed pessoal, estatísticas de ofensiva e grafo pessoal do usuário.
2. **Visitante / Público (`auth.isLoggedIn === false`)**: Vitrine metodológica e demonstrações interativas dos recursos centrais do app.

A arquitetura para unificar os componentes de demonstração com os componentes reais de produção consiste em isolar o estado de dados através de um modo **Sandbox / Demo Provider**:

```
+---------------------------------------------------------------------------------+
|                                 Landing Page (index.vue)                        |
|                                                                                 |
|   +------------------------------------+   +--------------------------------+   |
|   |         Reader Sandbox             |   |         Graph Sandbox          |   |
|   |  - Reader2DEngine / Viewer         |   |  - GraphCanvas.vue (Real D3)   |   |
|   |  - Static Public Booklet Content   |   |  - Curated Nodes & Edges       |   |
|   |  - In-Memory Highlighting/Cards    |   |  - Interactive Drag & Physics  |   |
|   +------------------------------------+   +--------------------------------+   |
|                     |                                       |                   |
|                     v                                       v                   |
|   +-------------------------------------------------------------------------+   |
|   |                      Auth Gate & Action Interceptor                     |   |
|   |   (Ao clicar em Conectar/Salvar/Upload -> Abre Modal de Login Google)   |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

## 2. Diagrama Visual de Fluxo
Consulte o diagrama em: `diagrams/flow.txt`

## 3. Contratos de Dados e Estruturas

### 3.1. Dataset Curado de Demonstração do Grafo (`sampleGraphData.ts`)
Estrutura rica de nós compatível com a tipagem `GraphNode[]` e `GraphEdge[]`:
- **Nós de Temas**: "Neurociência & Memória", "Filosofia da Mente", "Modelos Mentais", "Literatura Clássica".
- **Nós de Livros**: "O Alienista", "Rápido e Devagar", "A Arte da Memória", "Como Ler Livros".
- **Nós de Notas / Sínteses**: Conceitos-chave com tags e cores vibrantes.
- **Arestas**: Conexões hierárquicas e conceituais reais, ilustrando a inteligência relacional do Aresta.

### 3.2. Dataset Curado do Leitor Didático (`sampleBookletData.ts`)
- Objeto de livro/livreto com capítulos didáticos formatados em HTML semântico com suporte a fórmulas, callouts de reflexão e seletor de trechos para demonstração em tempo real.

## 4. Componentes Frontend & Interações

### 4.1. `GraphCanvas.vue` na Home
- **Props**:
  - `nodes`: `curatedLandingNodes`
  - `edges`: `curatedLandingEdges`
  - `isCompact`: `false`
  - `showControls`: `true`
  - `showSearch`: `true`
- **Eventos interceptados**:
  - `@openCreateNode` -> Dispara modal/toast convidativo de login ("Faça login com sua conta Google para criar novos temas").
  - `@openConnectModal` -> Dispara modal de login.
  - `@connectNodes` -> Salva temporariamente em `localCustomEdges` no cliente e exibe dica de que para persistir permanentemente basta entrar.

### 4.2. Motor de Leitura na Home
- Utilização direta dos componentes de renderização de páginas e layout editorial sem acoplar chamadas de rede autenticadas (`StorageManager` / `api.get('/books')`).

### 4.3. Modal de Autenticação Convidativo
- Reutilização do modal de login enxuto com Google (`GoogleAuthButton`) para transformar visitantes interessados em usuários ativos em 1 clique.

## 5. Tratamento de Erros & Fallbacks
- Se o WebGL ou SVG D3 encontrar restrições de renderização, o `GraphCanvas` faz fallback para posicionamento estável sem animação contínua.
- Isolamento total de cookies/tokens: nenhum token expirado ou inválido causa loop de redirecionamento na landing page.

## 6. Estratégia de Testes
- **Testes Unitários com Vitest**:
  - Validar renderização do `GraphCanvas` com o dataset de demonstração na landing page.
  - Testar que cliques em ações de criação e conexão disparam o gate de autenticação.
  - Testar que a Home autenticada permanece renderizando dados reais do usuário.
