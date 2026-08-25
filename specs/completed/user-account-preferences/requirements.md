# Requisitos: Preferências e Configurações na Página de Conta

## 1. Objetivo Geral
Oferecer ao usuário do Aresta controles diretos, reativos e visualmente elegantes na página de conta (`/conta`) para configurar preferências de interface (Modo Claro / Escuro), comportamento do grafo no desktop (tela inicial e leitor de livros) e padronizações tipográficas do leitor de EPUB (tamanho e família da fonte), mantendo sincronização automática local e remota.

---

## 2. Requisitos Funcionais

- **R1 - Grafo na Tela Inicial (Desktop)**: O usuário deve poder alternar via switch booleano se a tela inicial no desktop inicia com a barra lateral de grafo de conhecimento aberta (`true`) ou retraída (`false`).
- **R2 - Modo de Exibição / Tema (Claro vs Escuro)**: O usuário deve poder alternar entre Modo Escuro (*Dark Mode* padrão editorial) e Modo Claro (*Light Mode* suave), com efeito imediato em toda a interface do sistema sem necessidade de recarregar a página.
- **R3 - Grafo no Leitor Desktop**: O usuário deve poder alternar via switch booleano se a abertura de livros no leitor desktop inicia em modo dividido com o grafo conceitual (`true`, 50% leitor / 50% grafo) ou em visualização limpa de leitura em tela cheia (`false`, 100% leitor).
- **R4 - Tamanho Padrão da Fonte no EPUB**: O usuário deve poder ajustar o tamanho padrão da fonte dos e-books (entre 12px e 36px, padrão 18px), com controles incrementais (`A-` / `A+`) e indicador do valor atual.
- **R5 - Família Tipográfica Padrão no EPUB**: O usuário deve poder selecionar a fonte padrão entre as 5 fontes disponíveis no projeto (*Newsreader*, *Literata*, *Lora*, *Merriweather*, *Inter*), visualizando o estilo de cada uma.
- **R6 - Persistência Híbrida (Local + Servidor)**: As configurações devem ser salvas instantaneamente em `localStorage` para resposta imediata da interface e sincronizadas assincronamente via API REST com o backend (`/api/user-settings`), persistindo no banco SQLite via Prisma.

---

## 3. Critérios de Aceite

- [ ] Na página `/conta`, a seção "Preferências & Configurações da Aplicação" é exibida com todos os controles interativos.
- [ ] Ao alternar o switch de Grafo na Tela Inicial, a preferência é salva e aplicada ao acessar a rota `/`.
- [ ] Ao alternar entre Modo Claro e Modo Escuro, as classes/atributos de tema no DOM são atualizados instantaneamente e persistidos.
- [ ] Ao alternar o switch de Grafo no Leitor Desktop, a abertura de livros em `/reader` reflete o estado inicial configurado.
- [ ] Ao modificar o tamanho ou família de fonte padrão, novos livros EPUB abertos no leitor utilizam automaticamente as preferências configuradas.
- [ ] O backend aceita e persiste todos os novos campos no modelo `UserSettings` com validação Zod.
- [ ] Testes unitários do frontend e backend cobrem todas as novas configurações com 100% de aprovação.
