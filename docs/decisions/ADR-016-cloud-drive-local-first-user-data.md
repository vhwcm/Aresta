# ADR-016: Dados pessoais local-first sincronizados no Drive do usuário

## Status

Proposto — requer aprovação de produto e segurança antes da implementação.

## Data

2026-09-16

## Contexto

O Aresta mantém no PostgreSQL dados pessoais que precisam funcionar offline e em múltiplos dispositivos: progresso de leitura, anotações, flashcards, canvases, notas, desenhos, preferências e estruturas de conhecimento. A estratégia atual já possui armazenamento local e providers de binários para Google Drive e OneDrive, mas não possui contrato, formato, resolução de conflito ou fluxo seguro para dados estruturados.

O objetivo é que o dispositivo seja a fonte de leitura e escrita imediata e que o Drive escolhido pelo usuário seja a única cópia remota dos seus dados pessoais. A AWS continua responsável por identidade, tokens OAuth cifrados, IA sem retenção de conteúdo pessoal, catálogo público e feedback.

## Decisão

1. O domínio pessoal será persistido localmente primeiro (SQLite no Tauri e IndexedDB na web), com sincronização assíncrona para um único provider conectado por perfil.
2. O Drive usará `Aresta/v1/` e envelopes JSON versionados. Coleções pequenas e médias serão arquivos únicos; artefatos grandes e editados isoladamente serão arquivos por UUID.
3. A sincronização usará tombstones, `updated_at` UTC, um `device_id` persistente como desempate determinístico e ETags/revisions do provider para detectar escrita concorrente. O merge é por entidade, nunca "campo a campo" genérico.
4. Refresh tokens nunca chegam ao browser. O backend guarda tokens cifrados e expõe somente access tokens de curta duração por endpoint autenticado. A vinculação de uma nuvem é um fluxo OAuth autenticado, separado do login.
5. Google Drive será suportado com `drive.file`; OneDrive requer `Files.ReadWrite` delegado, substituindo `Files.ReadWrite.AppFolder`. iCloud não é um provider web: será um adapter nativo de pasta selecionada pelo usuário (`icloud-folder`), disponível somente onde a pasta estiver acessível pelo Tauri.
6. Dados pessoais e embeddings derivados deles não permanecerão na AWS após a migração. Busca semântica será gerada sob demanda, com conteúdo e embedding descartados ao fim da requisição, até existir uma decisão explícita de retenção.
7. Rotas e tabelas legadas permanecem em modo de compatibilidade até o rollout cumprir os critérios de saída. Nenhuma tabela é removida na primeira entrega.

## Consequências

### Positivas

- O usuário controla a cópia remota de seus dados e continua trabalhando sem rede.
- Falhas de rede e indisponibilidade da AWS não bloqueiam leitura, edição ou revisão.
- O contrato permite providers adicionais sem mudar stores e UI.

### Custos e riscos

- OAuth precisa ser reconsentido para OneDrive e a conta de Drive deve ser vinculada com segurança a uma identidade Aresta já autenticada.
- LWW pode descartar uma alteração concorrente; a UI deve registrar o evento e permitir exportação de diagnóstico.
- Um dispositivo offline por muito tempo não pode ter tombstones removidos automaticamente sem risco de ressuscitar dados apagados.
- A pasta iCloud não pode ser descoberta de modo portátil; o usuário deverá selecioná-la e conceder acesso no desktop nativo.

## Alternativas rejeitadas

- **Backend como fonte de verdade:** contradiz privacidade, aumenta custo e mantém o ponto único de falha.
- **Um arquivo por anotação/flashcard:** aumenta muito as chamadas e torna a sincronização lenta.
- **Um único arquivo para todos os canvases/notas:** aumenta conflitos e reenvios de artefatos grandes.
- **CloudKit/iCloud Drive via API web:** não há API pública equivalente e portável para este caso.

## Condições para aceitar

- Aprovar migração one-shot para a base existente.
- Aprovar `Files.ReadWrite` delegado e a nova tela de consentimento Microsoft.
- Confirmar que iCloud será tratado como pasta local nativa, não como integração CloudKit.
- Aprovar que dados pessoais não terão embeddings persistentes na AWS.
