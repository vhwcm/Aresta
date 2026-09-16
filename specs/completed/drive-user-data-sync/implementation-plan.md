# Plano de implementação — Aresta Cloud Drive

## 1. Resultado e limites

Entregar sincronização local-first de todos os dados pessoais entre o banco local do dispositivo e **um** Drive conectado. A base atual de dados pessoais pode ser descartada; não haverá exportação ou importação de usuários existentes.

Esta entrega não autoriza apagar tabelas nem desativar rotas em produção. Esses passos têm gates próprios descritos na seção 9.

### Decisões fechadas

| Tema | Decisão |
|---|---|
| Canvas, notas e desenhos | Um JSON por UUID. |
| Anotações, flashcards e dados de biblioteca | Um arquivo JSON por coleção. |
| Conflito | LWW por entidade, com `updated_at` e `device_id` como desempate; ETag/revision detecta concorrência. |
| Exclusão | Tombstone sincronizado; retenção mínima de 180 dias, sem purga automática na primeira versão. |
| Versionamento | Envelope `schema_version: 1`; o histórico nativo do provider é o rollback inicial. |
| iCloud | Adapter de pasta local selecionada no Tauri (`icloud-folder`), indisponível na web; não é CloudKit. |
| Embeddings | Nenhum embedding de dados pessoais persistido na AWS. |

## 2. Pré-requisitos bloqueantes

1. Separar **login** de **conectar Drive**. O callback de conexão deve exigir JWT, validar `state`/PKCE e vincular a conta ao `userId` já autenticado; ele não pode criar/trocar usuário.
2. Corrigir exposição de segredos: `OAuthService.handleCallback()` não pode devolver `accessToken` nem `refreshToken`; `getAccount()` não pode selecionar `access_token`. Tokens no banco devem ser cifrados em repouso com chave de ambiente rotacionável.
3. Criar endpoint autenticado `POST /api/auth/cloud/:provider/access-token`, que entrega apenas access token curto e nunca refresh token. A interface web mantém esse token somente em memória e solicita renovação quando necessário.
4. Atualizar o provider Microsoft de `Files.ReadWrite.AppFolder` para `Files.ReadWrite` delegado. O Google já solicita `drive.file`; a tela de conexão deve verificar os scopes concedidos e solicitar reconsentimento quando faltar um deles.
5. Inventariar os consumers atuais que chamam `/api/notes`, `/api/canvas`, `/api/drawings`, `/api/annotations`, `/api/flashcards`, `/api/user-settings`, `/api/users/me/*` e `/api/sync`. A migração só começa depois de cada escrita passar pelo adapter local.

## 3. Contrato de arquivos

Raiz por conta conectada:

```text
Aresta/v1/
  manifest.json
  data/
    profile.json
    library.json
    themes.json
    annotations.json
    flashcards.json
    daily_deck.json
    didactic_booklets.json
    canvas/{uuid}.json
    notes/{uuid}.json
    drawing_notes/{uuid}.json
  books/{book-uuid}/book.{epub|pdf}
  books/{book-uuid}/cover.webp
```

Não usar título de livro como caminho: ele é mutável, pode colidir e pode conter caracteres incompatíveis. `manifest.json` contém `schema_version`, `owner_user_id` (somente para impedir conexão acidental), `device_id` de quem o criou e uma lista de arquivos com revision/ETag conhecidos.

Todo arquivo JSON usa envelope:

```ts
type SyncEnvelope<T> = {
  schema_version: 1
  entity_type: string
  updated_at: string
  updated_by: string // device_id
  payload: T
}
```

Entidades sincronizáveis têm ID estável UUID ou ID migrado, `created_at`, `updated_at`, `updated_by`, `deleted_at: string | null` e `sync_status` apenas local. `sync_status`, tentativas e ETags ficam em `SyncMetadata` local e jamais são enviados como dado do usuário.

`profile.json` contém configurações, streak e atividades diárias. `library.json` contém livros do usuário, progresso, status e referências aos binários. Temas, relações tema-livro, decks e livretos precisam ser incluídos: são dados pessoais hoje omitidos pelo esboço inicial.

## 4. Fase A — Contratos, providers e OAuth

1. Consolidar `IDataSyncProvider` existente, padronizando `ensureDataFolders`, operações de arquivo raiz/subpasta, listagem paginada, leitura com revision e escrita condicional. `DataSyncResult` deve devolver `revision` e `modifiedAt`.
2. Finalizar o Google provider já iniciado: corrigir paginação, validação de nome/caminho, duplicatas históricas e upload condicional. Nunca ocultar erros de download/delete; devolver erro tipado para o engine decidir retry.
3. Implementar a mesma interface no OneDrive. `ensureFolder` precisa primeiro localizar a pasta e somente criá-la se ausente; `conflictBehavior: replace` sozinho pode mascarar colisões. Usar Graph path encoding e ETag em `If-Match`.
4. Implementar `ICloudFolderAdapter` com diretório escolhido pelo usuário e salvo como permissão/capability Tauri. Criar watcher nativo somente após confirmar o mecanismo suportado pelo Tauri v2/Rust; enquanto não existir watcher, o polling de 5 minutos é o fallback. Web retorna capability indisponível de forma explícita.
5. Alterar `CloudStorageProviderFactory` para retornar `IDataSyncProvider`, suportar `google`, `onedrive` e `icloud-folder` e não permitir instância sem token/capability válida.
6. Criar testes de contrato compartilhados para os três providers com servidor fetch mockado, incluindo arquivo ausente, token expirado, ETag divergente, paginação e caminhos inválidos.

## 5. Fase B — Banco local e escrita local-first

1. Estender `types.ts` e `IDatabaseAdapter` com `LocalNote`, `LocalDrawingNote`, `LocalUserSettings`, `LocalTheme`, `LocalUserBook`, `LocalDailyDeckCard`, `LocalDidacticBooklet` e `SyncMetadata`.
2. Implementar as entidades e migrations locais em Dexie, SQLite Tauri e InMemoryAdapter. Versionar Dexie e executar migration SQLite transacional. Dados pessoais locais legados podem ser limpos no primeiro boot da versão local-first.
3. Expandir `LocalMutation.entity_type` para todos os tipos e garantir que cada `save*`/`delete*` atualize a entidade e enfileire a mutação na mesma transação.
4. Refatorar composables/stores atuais — começando por `useNotes`, que hoje grava localStorage e chama a API — para depender exclusivamente do `IDatabaseAdapter`. A API legada não participa do fluxo normal.
5. Todo delete cria tombstone local. A UI filtra tombstones; o sync os replica antes de remover binários associados.

## 6. Fase C — DriveSyncService

1. Implementar mutex por conta + `AbortController`; uma execução manual deve reutilizar a sync em curso, não iniciar outra.
2. Ordem do `fullSync`: obter token/capability → assegurar pastas → ler manifest/revisions → pull e merge de coleções → pull de arquivos por UUID → aplicar fila local em ordem → upload condicional → persistir metadata e último sucesso.
3. Em colisão de revision, baixar novamente, aplicar LWW por entidade e reenviar. Comparar `updated_at`; se igual, vence `updated_by` lexicalmente. Não fazer merge de campos arbitrário, pois pode criar estado semântico inválido (por exemplo, uma pergunta de flashcard com resposta de outra edição).
4. `initialPull` somente substitui uma base local realmente vazia. Se já houver dados locais, executar merge normal e informar a UI. Timeout não descarta operação: registra estado `degraded` e tenta no próximo gatilho.
5. Retry em erro transitório: 3 tentativas com jitter exponencial; erros 401 acionam um refresh único; erros 403/consentimento e JSON inválido são bloqueantes e visíveis.
6. `useDriveSync` registra listeners apenas uma vez no cliente, limpa intervalo/listeners no unmount e aplica debounce a eventos. Gatilhos: boot autenticado, online, retorno de visibilidade, escrita enfileirada e intervalo de cinco minutos.

## 7. Fase D — UX, observabilidade e cutover

1. Criar `DriveSettingsPanel.vue` na área já existente em `SettingsModal.vue`: conectar/trocar, sincronizar agora, desconectar, status, último sucesso, pendências e erro recuperável. Desconectar remove somente token/capability local, nunca apaga dados do Drive.
2. Exibir um primeiro sync com progresso por coleção e uma mensagem clara de que o Drive passa a guardar os dados pessoais.
3. No cutover, limpar os dados pessoais legados e remover os endpoints que os manipulam. A rotina deve ter allowlist explícita: `User`, `Account`, `AppConfig`, catálogo público e `Feedback` são preservados.
4. Medir somente telemetria operacional sem conteúdo: duração, provider, códigos de erro, quantidade de arquivos e resultado. Nunca enviar payloads ou títulos de notas à AWS.

## 8. TDD e critérios de aceite

Antes de cada implementação, criar testes unitários correspondentes.

- Providers: estrutura de pastas, overwrite, leitura ausente, listagem, erro de auth e ETag.
- Engine: pull vazio, merge local/remoto, empate por device, tombstone, retry, token expirado e exclusão concorrente.
- Adapters: migrations Dexie/SQLite, transação save+mutation e persistência de todos os novos tipos.
- Composables/UI: único registro de listeners, cleanup, estados offline/degraded/synced e ações do painel.
- API: conexão OAuth sem vazamento de token, endpoint de access token curto, e respostas `410 Gone` das rotas pessoais desativadas.

Quality gates por fase:

```bash
npm run test --workspace=apps/web
npm run test --workspace=apps/api
npm run build --workspace=apps/web
npm run build --workspace=apps/api
npm run test
```

Validação manual obrigatória: Google, OneDrive, novo dispositivo, edição offline concorrente, reautorização de scopes, binário de livro com ID estável e pasta iCloud selecionada em macOS/Tauri.

## 9. Rollout e remoção segura do backend

1. Liberar Fases A–C para usuários internos e validar sync contra Drives de teste. Nenhuma limpeza ocorre nessa etapa.
2. Quando os quality gates e validação manual estiverem verdes, publicar a versão local-first e, no primeiro boot, iniciar com banco pessoal local vazio. Não há importação da API.
3. Na release seguinte, retornar `410 Gone` nas rotas pessoais e executar migration Prisma exclusiva para apagar relações e tabelas pessoais legadas. Atualizar primeiro todos os serviços/queries, depois `schema.prisma`, gerar e versionar SQL e aplicar em staging antes de produção. Nunca executar `DROP TABLE` na mesma release que muda o cliente.
4. A migration de descarte deve ter allowlist e preservar `User`, `Account`, `AppConfig`, catálogo público e `Feedback`. `Book`/`UserBook` só permanecem se forem de fato catálogo público; qualquer referência a binário, progresso ou associação pessoal deve estar no Drive/local.

## 10. Questões que exigem aprovação

1. Confirmar o consentimento Microsoft `Files.ReadWrite` e a reautorização dos usuários existentes.
2. Confirmar iCloud como pasta local Tauri, não CloudKit, e que a interface web exibirá indisponível.
3. Confirmar a política de não retenção de embeddings pessoais na AWS. Caso a resposta seja não, é necessária uma ADR de privacidade separada antes do desenvolvimento.
