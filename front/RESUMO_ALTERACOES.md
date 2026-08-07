# Resumo das Alterações - Flag de Modo Produção (IS_PRODUCTION)

## Descrição do Requisito
Adicionar a flag `IS_PRODUCTION` nos arquivos `.env`, `.env.example` e `.env.exemple` para habilitar ou desabilitar o modo de produção:
- **Modo Produção (`IS_PRODUCTION=true`)**: Suprime o registro de logs de erro (`console.error`, `console.warn`) e oculta detalhes sensíveis dos erros ao usuário final.
- **Modo Desenvolvimento (`IS_PRODUCTION=false`)**: Mantém o comportamento atual, logando erros no console e exibindo detalhes completos dos erros.

---

## Arquivos Modificados e Criados

### 1. Configurações de Ambiente
- [`.env`](file:///home/exati/projetos/Aresta/.env): Adicionada a variável `IS_PRODUCTION=false`.
- [`.env.example`](file:///home/exati/projetos/Aresta/.env.example): Adicionada a variável `IS_PRODUCTION=false`.
- [`.env.exemple`](file:///home/exati/projetos/Aresta/.env.exemple): Adicionada a variável `IS_PRODUCTION=false`.
- [`nuxt.config.ts`](file:///home/exati/projetos/Aresta/nuxt.config.ts): Adicionada a propriedade `isProduction` no `runtimeConfig` e `runtimeConfig.public`.

### 2. Utilitário e Plugin de Tracing/Erros
- [`app/utils/logger.ts`](file:///home/exati/projetos/Aresta/app/utils/logger.ts): Módulo centralizador com as funções `isProductionMode()`, `logError()`, `logWarn()` e `formatErrorMessage()`.
- [`app/plugins/errorHandler.ts`](file:///home/exati/projetos/Aresta/app/plugins/errorHandler.ts): Plugin Nuxt global que captura erros não tratados do Vue/Nuxt e suprime os logs no console quando em produção.

### 3. Ajustes de Tratamento de Erro nas Páginas e APIs
- [`server/api/ai.post.ts`](file:///home/exati/projetos/Aresta/server/api/ai.post.ts): Atualizado para não logar erros com `console.error` e retornar mensagem genérica sem stack/detalhes raw em produção.
- [`app/pages/ai.vue`](file:///home/exati/projetos/Aresta/app/pages/ai.vue): Atualizado para usar `logError` e sanitizar o conteúdo de erro na interface em produção.
- [`app/components/reader/Uploader.vue`](file:///home/exati/projetos/Aresta/app/components/reader/Uploader.vue): Atualizado para usar `logError` e mensagem simplificada em produção.
- [`app/adapters/EpubDocumentAdapter.ts`](file:///home/exati/projetos/Aresta/app/adapters/EpubDocumentAdapter.ts): Substituído `console.warn` por `logWarn`.
- [`app/composables/reader/useBookPageTurn.ts`](file:///home/exati/projetos/Aresta/app/composables/reader/useBookPageTurn.ts): Substituído `console.warn` por `logWarn`.

### 4. Cobertura de Testes Unitários
- [`tests/unit/utils/logger.test.ts`](file:///home/exati/projetos/Aresta/tests/unit/utils/logger.test.ts): Criados 8 testes unitários validando a detecção do modo produção, supressão de logs e formatação de mensagens de erro.
