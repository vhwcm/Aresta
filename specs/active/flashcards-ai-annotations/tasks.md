# Checklist de Tarefas: Anotações, Notas do Canvas e Flashcards com Rastreamento de Fonte

- [ ] 1. Backend: Gestão de Flashcards e Exclusão em Cascata
  - [ ] 1.1 Atualizar `flashcard.routes.ts`, `flashcard.controller.ts` e `flashcard.service.ts` com suporte a `noteId` e exclusão por `noteId` / `annotationId`
  - [ ] 1.2 No `note.service.ts`, disparar exclusão em cascata dos flashcards ao deletar uma nota

- [ ] 2. Frontend: Repositórios e Modelos de Dados
  - [ ] 2.1 Adicionar campos de rastreamento de fonte (`sourceType`, `sourceUrl`, `sourceTitle`, `noteId`) no `FlashcardRepository.ts`
  - [ ] 2.2 Implementar `deleteByAnnotationId` e `deleteByNoteId` no `FlashcardRepository.ts`

- [ ] 3. Frontend: Composables de Flashcards e Anotações
  - [ ] 3.1 Em `useFlashcards.ts`: implementar `generateAiFlashcardForAnnotation` e `generateAiFlashcardForNote`
  - [ ] 3.2 Em `useFlashcards.ts`: implementar remoção em cascata e vínculo de fonte
  - [ ] 3.3 Em `useAnnotations.ts`: adicionar `generateFlashcard: boolean`, sincronização de status e exclusão em cascata de flashcard ao deletar anotação

- [ ] 4. Frontend: Bloco de Notas do Canvas e Editor
  - [ ] 4.1 Em `CanvasNodeNote.vue`: adicionar ação de gerar flashcard via IA e indicador de flashcard ativo no cabeçalho do bloco
  - [ ] 4.2 Em `NoteEditorPane.vue`: adicionar botão de flashcard e garantir cascata ao deletar nota

- [ ] 5. Frontend: Central de Revisão e Modal de Anotação
  - [ ] 5.1 Em `revisao.vue` (Flashcard 3D): adicionar botão destacado "Ver Fonte ↗" direcionando para `/reader` ou `/canvas`
  - [ ] 5.2 Em `revisao.vue` (Anotações): botão "+ Nova Anotação", agrupamento por temas e alternância de status
  - [ ] 5.3 Em `ReaderAnnotationModal.vue`: switch "Transformar em Flashcard com IA"

- [ ] 6. Testes Automatizados e Quality Gates
  - [ ] 6.1 Testes unitários para `CanvasNodeNote.vue` com ação de flashcard
  - [ ] 6.2 Testes unitários para `revisao.vue` validando "Ver Fonte", agrupamento por temas e cascata de exclusão
  - [ ] 6.3 Validar `npm run test:unit` e `npm run typecheck` 100% verdes
