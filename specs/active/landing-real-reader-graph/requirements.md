# Requisitos: Integração do Leitor e Grafo Reais na Landing Page

## 1. Objetivo Geral
Substituir as demonstrações estáticas e simuladas da página inicial não autenticada (`HomeBookReaderDemo` e `HomeKnowledgeGraphDemo`) pela integração dos motores e componentes reais de produção do Aresta (`GraphCanvas`, `Viewer` / motores de leitura), mantendo isolamento estrito de autenticação (modo sandbox/leitura somente leitura) e impedindo criação anônima ou chamadas de escrita na API sem login.

## 2. Escopo
- **Incluído**:
  - Exibição do componente real `GraphCanvas.vue` na Home pública (deslogado) alimentado com um dataset curado de nós e arestas (livros clássicos, autores, conceitos e temas conectados).
  - Modo interativo completo do Grafo na Home (física D3 radial, arrasto de nós, zoom/pan, filtros de camada, hover tooltip) sem persistir alterações remotas.
  - Exibição de um leitor funcional na Home com motor de leitura e visual de livro real utilizando conteúdo didático público / embutido.
  - Bloqueio de ações destrutivas ou de escrita anônimas (adicionar nós remotos, upload, salvar anotações no backend), com disparo suave de modal/prompt de login ("Crie sua conta para salvar suas anotações e conexões").
  - Preservação da experiência da Home autenticada (`auth.isLoggedIn`) sem qualquer regressão.
- **Não Incluído**:
  - Alterações no schema do Prisma ou criação de endpoints públicos de escrita na API.
  - Modificação no fluxo de autenticação OAuth existente.

## 3. Requisitos Funcionais

### R1. Grafo de Conhecimento Real na Landing Page
- **Descrição**: Renderizar o componente `GraphCanvas.vue` real na seção de demonstração do grafo da página inicial para usuários não logados.
- **Atores**: Visitante / Usuário Não Autenticado.
- **Regra de Validação**: O grafo deve receber um conjunto rico de dados (`sampleGraphData`: temas, livros, conceitos filosóficos e conexões) sem disparar requisições para `/api/graph` autenticado.

### R2. Leitor Real / Motor Editorial na Landing Page
- **Descrição**: Integrar a visualização real do leitor com tipografia editorial Aresta, alternância de temas (noite, claro, sépia), modo página dupla/simples e suporte a virada de página na Home.
- **Atores**: Visitante / Usuário Não Autenticado.
- **Regra de Validação**: O leitor de amostra carrega conteúdo didático formatado em memória/assets sem requisitar token Bearer nem persistir progresso na API.

### R3. Gate de Autenticação para Ações Interativas (Guest Sandbox)
- **Descrição**: Quando o visitante interagir com botões como "Criar Novo Tema", "Conectar", "Criar Flashcard" ou tentar destacar texto, a aplicação deve abrir o modal de login ou redirecionar contextualmente com mensagem convidativa.
- **Atores**: Visitante / Usuário Não Autenticado.
- **Regra de Validação**: Nenhuma requisição `POST`, `PUT`, `DELETE` ou `PATCH` deve ser emitida para a API sem token JWT válido.

### R4. Performance e Responsividade
- **Descrição**: O carregamento da landing page deve permanecer veloz (< 1s TTI) com montagem assíncrona/lazy dos componentes pesados (D3 / motor de leitura).
- **Atores**: Visitante.
- **Regra de Validação**: Não travar a rolagem vertical no mobile e manter consumo de CPU e memória reduzidos.

## 4. Requisitos Não Funcionais
- **Performance**: Execução fluida a 60 FPS nas transições D3 e animações de virada.
- **Segurança**: Bloqueio total de escrita na API para rotas não autenticadas; ausência de vazamento de dados de outros usuários.
- **Compatibilidade**: Desktop, tablet e mobile (touch / gestos).

## 5. Critérios de Aceite
- [ ] O componente `GraphCanvas` é renderizado na landing page com física D3, nós de livros/temas e arestas magnéticas reais.
- [ ] O leitor na landing page utiliza os estilos, tipografia e engine real de renderização do Aresta.
- [ ] Tentativas de criação/edição no grafo ou leitor por visitantes não autenticados disparam modal de autenticação com Google sem erros de rede no console.
- [ ] Usuários autenticados continuam acessando sua Home personalizada com seus próprios livros e grafos intactos.
- [ ] Todos os testes unitários (`npm test`) passam 100% verdes.
