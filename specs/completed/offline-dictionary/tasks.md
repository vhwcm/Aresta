# Checklist de Implementação: Dicionário Offline Local

## Fase 1: Backend & Persistência de Preferências
- [x] **T1.1**: Atualizar `schema.prisma` adicionando `native_language` e `target_translation_language` em `UserSettings`.
- [x] **T1.2**: Gerar client do Prisma (`npx prisma generate` / migração).
- [x] **T1.3**: Atualizar schema Zod em `userSettings.schema.ts` e controller/service em `userSettings.service.ts` e `userSettings.controller.ts`.
- [x] **T1.4**: Criar testes unitários para a rota de `userSettings`.

## Fase 2: Bases de Dados dos Dicionários & Motor Offline (Client)
- [x] **T2.1**: Estruturar e gerar os arquivos compactados de dicionário em `front/public/dictionaries/` para os pares PT, EN e ES (ex: `dict-en-pt.json`, `dict-es-pt.json`, `dict-pt-pt.json`, etc.).
- [x] **T2.2**: Implementar `useLemmatizer.ts` para desinências e formas irregulares em PT, EN e ES.
- [x] **T2.3**: Implementar o composable `useOfflineDictionary.ts` com gerenciamento de `IndexedDB` (`aresta_dictionary_db`), auto-download em background e métodos de consulta rápida.
- [x] **T2.4**: Criar testes unitários para o lematizador e para as consultas do dicionário.

## Fase 3: Interface na Página de Conta (`conta.vue`)
- [x] **T3.1**: Adicionar seção "Idiomas & Dicionário Offline" na página de Conta.
- [x] **T3.2**: Implementar seletores de Língua Nativa e Língua de Tradução/Estudo.
- [x] **T3.3**: Adicionar badge/indicador de status offline dos dicionários salvos no navegador.
- [x] **T3.4**: Integrar com a `userSettingsStore` e sincronização no backend.

## Fase 4: Integração com o Leitor EPUB
- [x] **T4.1**: Atualizar `ReaderSelectionTooltip.vue` para exibir botão "Dicionário" quando uma única palavra for selecionada.
- [x] **T4.2**: Criar componente `ReaderDictionaryCard.vue` com exibição de palavra, fonética, classe gramatical, tradução, significados, exemplos e seletor rápido de idiomas.
- [x] **T4.3**: Integrar `ReaderDictionaryCard.vue` em `Viewer.vue`, posicionando-o na tela de leitura com cálculo de coordenadas.
- [x] **T4.4**: Garantir que o dicionário não tenha qualquer botão ou vínculo com o sistema de flashcards.

## Fase 5: Validação, Testes e Documentação
- [x] **T5.1**: Testar consultas offline em modo avião/sem conexão.
- [x] **T5.2**: Testar palavras conjugadas em inglês, português e espanhol.
- [x] **T5.3**: Executar linters e suíte de testes automatizados (`npm run test`).
- [x] **T5.4**: Mover spec para `specs/completed/offline-dictionary` e atualizar documentação em `docs/`.


