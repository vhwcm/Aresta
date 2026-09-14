# Tarefas de Implementação: Notas de Desenho Paginadas com Rejeição de Palma e Síntese em HTML Semântico via IA

## Checklist de Execução

- [x] **1. Persistência & Schemas (Backend - apps/api)**
  - [x] 1.1 Adicionar model `DrawingNote` em `apps/api/prisma/schema.prisma` e gerar migration SQL versionada em `apps/api/prisma/migrations/`.
  - [x] 1.2 Criar schemas de validação Zod (`drawing.schema.ts`) em `apps/api/src/modules/canvas/schemas/` ou `apps/api/src/modules/drawings/schemas/`.

- [x] **2. Serviços & Regras de Negócio (Backend - apps/api)**
  - [x] 2.1 Implementar `DrawingService` (CRUD, paginação, autosave com debounce, e integração com `AiService` para síntese visual via Gemini Vision).
  - [x] 2.2 Implementar `DrawingController` com tratamento de erros amigável e validação de permissões `user_id`.
  - [x] 2.3 Registrar rotas REST em `drawing.routes.ts` e plugar no app Express principal (`apps/api/src/app.ts`).

- [x] **3. Testes do Backend (apps/api)**
  - [x] 3.1 Criar testes de integração/unitários (`drawing.service.test.ts` e `drawing.routes.test.ts`).
  - [x] 3.2 Executar testes e build do backend (`npm test` e `npm run build`).

- [x] **4. Engine de Desenho & Frontend (apps/web)**
  - [x] 4.1 Instalar/configurar `perfect-freehand` no `apps/web` para traços suaves com resposta a pressão e velocidade.
  - [x] 4.2 Criar composable `useDrawing` para gerenciar estado das páginas, traços, histórico (undo/redo), autosave local e sincronização com API.
  - [x] 4.3 Desenvolver o componente `DrawingPageCanvas.vue` com suporte a Pointer Events, rejeição de palma inteligente (`pointerType === 'pen'`, filtro de área da mão e gestos de 2 dedos).
  - [x] 4.4 Desenvolver barra de ferramentas `DrawingToolbar.vue` (caneta, tinteiro, lápis, marca-texto, borracha, espessuras, paleta de cores e alternador de rejeição de palma).
  - [x] 4.5 Desenvolver a página de edição `/canvas/drawing/[id].vue` com rolagem vertical contínua de páginas A4, botão '+ Nova Página' e fundo pautado/grid/branco.
  - [x] 4.6 Desenvolver modal `DrawingAiSynthesisModal.vue` com split view (desenho vs HTML sintetizado), ação de "Salvar como Nota" e toggle "Excluir desenho original".
  - [x] 4.7 Atualizar a listagem e abas em `/canvas/index.vue` (aba "Desenhos", cards de pré-visualização, contagem de páginas e botão de criação).

- [x] **5. Validação de Quality Gates & Testes**
  - [x] 5.1 Executar testes unitários do frontend (`npm test`).
  - [x] 5.2 Executar typecheck e linting (`npm run typecheck`, `npm run lint`).
  - [x] 5.3 Validar Quality Gates 100% verdes em todo o monólito.

- [x] **6. Documentação & Conclusão**
  - [x] 6.1 Criar ADR técnica e documentar a arquitetura em `docs/`.
  - [x] 6.2 Atualizar `checklist.md` movendo a tarefa para Concluído.
  - [x] 6.3 Realizar commit atômico e apresentar perguntas técnicas profundas de validação.
