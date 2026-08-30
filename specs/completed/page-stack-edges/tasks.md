# Tarefas de Implementação: Pilha de Páginas Laterais & Efeitos de Livro Físico

## Checklist de Execução

- [x] **1. Schemas & Validação no Backend**
  - [x] 1.1 Atualizar `aresta-back-node/src/schemas/userSettings.schema.ts` com refinamento Zod (rejeitar `pageAnimationEnabled: false` com `pageCreaseEnabled: true`)
  - [x] 1.2 Atualizar `aresta-back-node/src/services/userSettings.service.ts` para normalizar `page_crease_enabled = false` caso `pageAnimationEnabled === false`
  - [x] 1.3 Adicionar testes de integração em `aresta-back-node/tests/userSettings.test.ts` cobrindo cenários válidos e rejeições 400

- [x] **2. Composables e Estado no Frontend**
  - [x] 2.1 Atualizar `front/app/composables/useSettings.ts` com a regra de dependência (desligar e desabilitar efeitos quando animação 3D for desativada)
  - [x] 2.2 Atualizar `front/tests/unit/composables/useSettings.test.ts` com testes da lógica de dependência e persistência

- [x] **3. Interface de Configurações (UI)**
  - [x] 3.1 Atualizar `front/app/pages/conta.vue` (renomear item, desabilitar switch quando animação estiver desligada e adicionar aviso contextual)
  - [x] 3.2 Atualizar `front/app/components/SettingsModal.vue` com a mesma validação e desabilitação condicional
  - [x] 3.3 Atualizar testes unitários de página/componentes (`front/tests/unit/pages/conta.test.ts`)

- [x] **4. Renderizador 3D do Leitor (PageCurlCanvas.vue)**
  - [x] 4.1 Implementar computed `pageStackDepth` com cálculo proporcional e teto adaptativo
  - [x] 4.2 Renderizar elementos de pilha lateral (esquerda e direita) com suporte a cliques de navegação (`previous()` / `next()`)
  - [x] 4.3 Implementar estilos CSS de camadas escalonadas e sombras para os temas Sépia, Branco e Preto
  - [x] 4.4 Garantir responsividade (ocultar em telas < 768px mantendo o leitor mobile limpo)

- [x] **5. Testes & Quality Gates**
  - [x] 5.1 Executar Quality Gates do backend (`npm run build` e `npm test` em `aresta-back-node/`)
  - [x] 5.2 Executar Quality Gates do frontend (`npm run lint`, `npm run typecheck`, `npm test` em `front/`)

- [x] **6. Documentação & Conclusão**
  - [x] 6.1 Atualizar documentação em `docs/architecture/` e `docs/domain/`
  - [x] 6.2 Executar `review-consistency` e mover spec para `specs/completed/`

