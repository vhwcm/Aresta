# Tarefas de Implementação: Leitor e Grafo Reais na Landing Page

## Checklist de Execução

- [ ] **1. Estruturação de Datasets Curados de Demonstração**
  - [ ] 1.1 Criar dataset de nós e arestas enriquecidas em `apps/web/app/data/sampleLandingGraph.ts` com livros reais, autores, temas e sínteses conectadas.
  - [ ] 1.2 Criar dataset de conteúdo didático com suporte a fórmulas e formatação editorial em `apps/web/app/data/sampleLandingBooklet.ts`.

- [ ] **2. Integração do Grafo Real (`GraphCanvas.vue`) na Landing Page**
  - [ ] 2.1 Substituir `HomeKnowledgeGraphDemo` pela invocação direta do componente `GraphCanvas.vue` com `props.nodes` e `props.edges` alimentados por `sampleLandingGraph`.
  - [ ] 2.2 Conectar interceptadores nos eventos `@openCreateNode` e `@openConnectModal` para abrir modal de login Google convidativo.
  - [ ] 2.3 Permitir conexão magnética temporária em tela com notificação sutil convidando ao salvamento permanente na conta.

- [ ] **3. Aprimoramento do Leitor na Landing Page**
  - [ ] 3.1 Integrar o layout editorial real e tipografia oficial do leitor Aresta na demonstração da Home.
  - [ ] 3.2 Conectar a criação de flashcards e anotações demonstrativas ao gate de login sem efetuar requisições não autenticadas à API.

- [ ] **4. Testes Automatizados e Validação dos Quality Gates**
  - [ ] 4.1 Atualizar testes unitários em `apps/web/tests/unit/pages/index.test.ts` e `apps/web/tests/unit/components/HomeDemos.test.ts`.
  - [ ] 4.2 Executar suíte completa de testes (`npm test`) garantindo 100% de sucesso.

- [ ] **5. Documentação e Rastreabilidade**
  - [ ] 5.1 Atualizar `checklist.md` refletindo o avanço e conclusão da tarefa.
  - [ ] 5.2 Documentar na base de conhecimento em `docs/` sobre a estratégia de sandbox público na landing page.
