# Requisitos da Spec: Dicionário Offline Local para Leitura de Livros (EPUB)

## Objetivo Geral
Permitir a consulta instantânea e 100% offline de palavras selecionadas durante a leitura de livros no leitor (EPUB), com suporte aos idiomas Português (PT), Inglês (EN) e Espanhol (ES), exibindo tradução para a língua nativa do usuário, significados, classe gramatical, exemplos e fonética. As preferências de Língua Nativa e Língua de Tradução são configuradas e persistidas na página de Conta (`conta.vue`) e sincronizadas no banco via `UserSettings`.

---

## Requisitos Funcionais

### R1. Configuração e Preferências de Idioma na Conta
- **R1.1**: O modelo `UserSettings` (Prisma) e a API de configurações devem suportar `native_language` (padrão `'pt-BR'`) e `target_translation_language` (padrão `'en'`).
- **R1.2**: A página de Conta ([`conta.vue`](file:///c:/Users/vichw/Aresta/front/app/pages/conta.vue)) deve conter uma nova seção "Idiomas & Dicionário Offline" permitindo selecionar:
  - **Minha Língua Nativa**: Português, Inglês ou Espanhol.
  - **Língua Padrão de Tradução / Estudo**: Inglês, Espanhol ou Português.
  - Indicador de status de download dos pacotes de dicionário offline no dispositivo (IndexedDB).
- **R1.3**: A alteração dos idiomas deve sincronizar com a store de configurações no frontend e com o endpoint `PUT /api/user-settings` no backend.

### R2. Motor de Armazenamento e Consulta Offline (IndexedDB + Lematização)
- **R2.1**: Os dados dos dicionários para os pares de idiomas (PT-PT, EN-PT, ES-PT, EN-EN, ES-ES, PT-EN, etc.) devem ser organizados em arquivos compactados (`.json` otimizados com indexação por chave).
- **R2.2**: O composable/serviço `useOfflineDictionary` deve baixar automaticamente em background os pacotes necessários e gravá-los no `IndexedDB` do navegador (`aresta_dictionary_db`).
- **R2.3**: O motor deve implementar uma rotina de lematização e resolução de sufixos/flexões para Português, Inglês e Espanhol (ex: verbos conjugados como "estudavam" -> "estudar", "running" -> "run", "ciudades" -> "ciudad").
- **R2.4**: A consulta deve retornar em < 10ms: termo consultado, lema raiz, fonética/IPA (quando disponível), classe gramatical (subst., verbo, adj...), tradução/equivalentes no idioma nativo, acepções/significados e exemplos de uso.

### R3. Integração com o Leitor e Tooltip de Seleção
- **R3.1**: Ao selecionar uma única palavra no texto do leitor (EPUB), o componente [`ReaderSelectionTooltip.vue`](file:///c:/Users/vichw/Aresta/front/app/components/reader/ReaderSelectionTooltip.vue) deve exibir o botão **"Dicionário"** (ícone de livro) com destaque.
- **R3.2**: Ao clicar em "Dicionário", abre-se um popover/card flutuante elegante ([`ReaderDictionaryCard.vue`](file:///c:/Users/vichw/Aresta/front/app/components/reader/ReaderDictionaryCard.vue)) posicionado adjacente à palavra selecionada.
- **R3.3**: O card do dicionário deve identificar automaticamente o idioma do livro pelo metadata do EPUB (`dc:language`), traduzindo para a Língua Nativa configurada, com um seletor rápido no topo (ex: `EN → PT ▾`) permitindo alternar de idioma em tempo real.
- **R3.4**: O card deve oferecer botão para copiar o significado ou fechar a janela, sem qualquer vínculo ou criação de flashcards.

---

## Critérios de Aceite
- [ ] O usuário consegue definir sua Língua Nativa e Língua de Tradução na página `conta.vue`.
- [ ] As preferências são salvas no banco de dados e persistidas entre recarregamentos e dispositivos.
- [ ] Ao abrir o leitor e selecionar uma palavra em um EPUB em inglês, espanhol ou português, o botão de Dicionário aparece e abre o card com a definição/tradução correta.
- [ ] Palavras conjugadas ou no plural encontram seus lemas e definições correspondentes via lematização offline.
- [ ] A consulta funciona com a conexão com a internet desativada (100% offline).
- [ ] Não há botões ou criação de flashcards a partir do dicionário.
- [ ] Testes unitários e de integração validam as rotas, lematização e consultas no IndexedDB.

