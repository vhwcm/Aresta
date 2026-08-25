# Checklist de Implementação: Preferências e Configurações na Página de Conta

- [x] 1. **Backend: Atualizar Prisma Schema e Migrações**
  - [x] 1.1 Adicionar `desktop_home_graph_open`, `desktop_reader_graph_open`, `theme_mode`, `epub_font_family` no modelo `UserSettings` em `aresta-back-node/prisma/schema.prisma`.
  - [x] 1.2 Executar `npx prisma db push` e `npx prisma generate`.

- [x] 2. **Backend: Schemas, Services e Controllers**
  - [x] 2.1 Atualizar `userSettings.schema.ts` com validações Zod.
  - [x] 2.2 Atualizar `userSettings.service.ts` para persistir e retornar todos os novos campos.
  - [x] 2.3 Criar teste de integração `aresta-back-node/tests/userSettings.test.ts`.
  - [x] 2.4 Executar e validar testes do backend (`npm test`).

- [x] 3. **Frontend: Sistema de Temas e Estilos CSS**
  - [x] 3.1 Configurar variáveis CSS e suporte a tema Claro/Escuro em `front/app/assets/css/main.css` e `front/tailwind.config.cjs`.

- [x] 4. **Frontend: Composable `useSettings`**
  - [x] 4.1 Expandir `SettingsState` e `UserSettingsResponse` com os novos campos.
  - [x] 4.2 Implementar aplicação imediata de tema (`applyTheme`) e persistência local/remota.
  - [x] 4.3 Inicializar tema no `front/app/app.vue`.

- [x] 5. **Frontend: Interface da Página de Conta (`/conta`)**
  - [x] 5.1 Criar a seção visual "Preferências & Configurações da Aplicação".
  - [x] 5.2 Adicionar toggle booleano para Grafo na Tela Inicial (Desktop).
  - [x] 5.3 Adicionar seletor visual para Modo Claro / Modo Escuro.
  - [x] 5.4 Adicionar toggle booleano para Grafo no Leitor Desktop.
  - [x] 5.5 Adicionar botões de ajuste de Tamanho da Fonte (EPUB).
  - [x] 5.6 Adicionar seletor de Família de Fonte Padrão (EPUB).

- [x] 6. **Frontend: Integração dos Componentes**
  - [x] 6.1 Integrar `desktopHomeGraphOpen` em `front/app/pages/index.vue`.
  - [x] 6.2 Integrar `desktopReaderGraphOpen`, `epubFontSize` e `epubFontFamily` em `front/app/stores/readerStore.ts` e `front/app/components/reader/Viewer.vue`.
  - [x] 6.3 Atualizar `front/app/components/SettingsModal.vue`.

- [x] 7. **Testes, Validação e Documentação**
  - [x] 7.1 Atualizar `front/tests/unit/pages/conta.test.ts` e `front/tests/unit/composables/useSettings.test.ts`.
  - [x] 7.2 Executar suíte de testes do frontend (`npm test`).
  - [x] 7.3 Mover spec para `specs/completed/` e atualizar `docs/`.
  - [x] 7.4 Realizar commits Git estruturados.
