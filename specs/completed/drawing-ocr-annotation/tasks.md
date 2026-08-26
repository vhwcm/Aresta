# Checklist de Tarefas: Anotações com Painel Expandido de Escrita Manual e OCR

## Fase 1: Backend (`aresta-back-node`) & Integração gRPC com `aresta-ocr`

- [x] **Task 1.1**: Adicionar dependências `@grpc/grpc-js` e `@grpc/proto-loader` no `aresta-back-node`.
- [x] **Task 1.2**: Implementar `src/services/ocr.client.ts` com conexão gRPC ao `aresta-ocr` e fallback/tratamento de timeout.
- [x] **Task 1.3**: Criar schemas Zod em `src/schemas/annotation.schema.ts` e `src/schemas/ocr.schema.ts`.
- [x] **Task 1.4**: Implementar método `createAnnotationWithOcr` em `AnnotationController` e rota `POST /api/annotations/with-ocr` em `src/routes/annotation.routes.ts`.
- [x] **Task 1.5**: Implementar rota `POST /api/ocr/transcribe` para transcrição direta.
- [x] **Task 1.6**: Escrever testes para o novo endpoint de anotações com OCR em `src/__tests__/annotation-ocr.test.ts`.

---

## Fase 2: Frontend (`front`) - Canvas & Painel Lateral Expandido

- [x] **Task 2.1**: Criar componente `app/components/reader/HandwritingCanvas.vue` com suporte a touch, caneta (3 espessuras), borracha, undo e limpeza.
- [x] **Task 2.2**: Criar painel lateral deslizante `app/components/reader/ReaderAnnotationDrawer.vue` (50% desktop/tablet, 100% mobile) com temas do Grafo e alternador Digitar/Desenhar.
- [x] **Task 2.3**: Atualizar composable `app/composables/useAnnotations.ts` com a função `createAnnotationWithOcr`.
- [x] **Task 2.4**: Integrar botão de expansão na modal `ReaderAnnotationModal.vue` e sincronizar com o novo `ReaderAnnotationDrawer.vue`.

---

## Fase 3: Validação, Consistência e Documentação

- [x] **Task 3.1**: Executar testes automatizados do backend (`npm test` no `aresta-back-node`) e linter.
- [x] **Task 3.2**: Auditar consistência cruzada entre Código ↔ Specs ↔ Docs.
- [x] **Task 3.3**: Mover spec para `specs/completed/drawing-ocr-annotation/` e atualizar `docs/architecture/` e `docs/domain/`.
- [x] **Task 3.4**: Realizar commits atômicos e descritivos.
