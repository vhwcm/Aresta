# ADR-023: Roteamento Multi-Dispositivo de OAuth e Eliminação de Race Condition na Troca de Tokens

## Status
Aceito

## Data
2026-09-26

## Contexto
Ao autenticar via OAuth 2.0 (Google, Microsoft, Apple) a partir de dispositivos secundários (smartphones, tablets Android, navegadores em máquinas diferentes ou abas anônimas), ocorria um comportamento anômalo: usuários que já possuíam contas ativas e livros na plataforma eram inesperadamente redirecionados para a tela de Onboarding de primeiro acesso (`/onboarding`) ou para a página inicial pública (`/`) deslogados/vazios, em vez de acessar sua biblioteca e dados pré-existentes.

### Causas Raiz Identificadas (Diagnóstico de Debugger Sênior)
1. **Verificação Frágil de Onboarding Restrita ao LocalStorage**: O fluxo de login avaliava `(result.isNewUser || !auth.isOnboardingCompleted(result.user?.id))`. Como `isOnboardingCompleted` consultava unicamente `localStorage.getItem('aresta_onboarding_completed_' + id)`, em novos dispositivos essa chave inexiste (`null`). Para agravar, o método `purgeClientSession()` apagava o localStorage no início da sessão. Logo, `isOnboardingCompleted` retornava false para qualquer usuário existente em outro dispositivo, forçando-o a passar pelo `/onboarding` e, ao término, ser despejado na página inicial (`/`).
2. **Race Condition de Duplo Code Exchange no Google OAuth**: No fluxo via popup, `callback.vue` realizava a requisição `POST /api/auth/oauth/google/callback` e, ao mesmo tempo, disparava mensagem `ARESTA_OAUTH_CODE` para o `window.opener` (`useOAuth.ts`). O `useOAuth.ts` capturava o mesmo `code` e tentava trocá-lo uma segunda vez contra a API do Google. O Google OAuth 2.0 invalida o authorization code imediatamente após o primeiro resgate, retornando erro HTTP 400 (`invalid_grant: Code was already redeemed`). A falha concorrente causava rejeição na `Promise.race`, abortando a autenticação na janela principal e deixando o usuário deslogado na tela de login/página inicial.
3. **Redirecionamento Cego Hardcoded para `'/'`**: `callback.vue` executava `window.location.replace('/')` incondicionalmente em dispositivos sem `window.opener` (mobile/WebView), descartando a intenção de navegação do usuário e a rota pretendida (`redirect`), em vez de conduzir o leitor para a Estante (`/library`).

## Decisão de Arquitetura (Principal Engineer Solution)
1. **Fonte Única da Verdade para Onboarding (`isNewUser`)**:
   - A decisão de encaminhar para o Onboarding é baseada estritamente na flag `result.isNewUser` fornecida pelo backend (que verifica no banco PostgreSQL se o usuário já existia).
   - Se `!result.isNewUser`, o usuário possui conta existente e **JAMAIS** é enviado para o `/onboarding`.
   - Usuários existentes têm `auth.completeOnboarding(userId)` sincronizado localmente logo após a autenticação para garantir consistência em WebViews e componentes legados.
2. **Eliminação Estrita da Race Condition no Popup**:
   - O `callback.vue` efetua a troca do token uma única vez no backend.
   - Após o sucesso, emite `ARESTA_OAUTH_SUCCESS` contendo o payload pronto da sessão (`token`, `user`, `isNewUser`, `oauth`).
   - O `useOAuth.ts` reconhece a sessão concluída e reutiliza o token gerado, **sem jamais efetuar uma segunda chamada à API com o authorization code consumido**.
3. **Preservação de Rota de Redirecionamento e Destino para a Estante**:
   - O destino pretendido (`redirect`) é salvo em `sessionStorage` (`aresta_oauth_redirect`) antes da inicialização do fluxo OAuth.
   - Tanto `login.vue` quanto `callback.vue` avaliam o destino:
     - Usuários novos (`isNewUser === true`) são direcionados para `/onboarding`.
     - Usuários com conta existente (`isNewUser === false`) são direcionados para a rota pretendida ou para a Estante de Livros (`/library`), nunca para a tela inicial pública (`/`).
   - Ao concluir o onboarding em `onboarding.vue`, o destino final também é unificado para `/library`.

## Consequências
- Experiência impecável em múltiplos dispositivos: qualquer login via OAuth em novo smartphone, tablet ou computador reconhece o usuário e abre instantaneamente sua biblioteca de leitura.
- Eliminação total de erros 400 (`invalid_grant`) e falhas intermitentes de popup/polling.
- Preservação íntegra de links profundos (`?redirect=/reader?...`, `?redirect=/library`).
