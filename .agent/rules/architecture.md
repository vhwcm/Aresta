# Regra: Padrões e Diretrizes Arquiteturais

## Padrões Arquiteturais no Monorepositório Aresta

### 1. Estrutura atual do monólito

O projeto opera em um monólito modular com duas camadas principais:

- `apps/api/` — backend Express + TypeScript + Prisma + PostgreSQL 16 + pgvector
- `apps/web/` — frontend Nuxt 4 + Vue 3 + Pinia + Tailwind + Tauri v2
- `apps/api/prisma/schema.prisma` — fonte de verdade do schema de dados
- `package.json` na raiz — orquestração de dev, build, testes e banco

### 2. Backend Express (`apps/api/`)

O backend é um monólito modular por domínio, com cada módulo encapsulando rotas, controllers, serviços, schemas e configurações próprias.

#### 2.1. Composição raiz
- `src/server.ts`: ponto de composição da aplicação. Monta middlewares globais, healthcheck, roteadores e tratamento de erros.
- `src/config/env.ts`: carregamento e validação de variáveis de ambiente.
- `src/config/prisma.ts`: instância do Prisma Client.
- `src/middlewares/auth.middleware.ts`: autenticação por JWT e fallback de desenvolvimento/teste.

#### 2.2. Módulos de domínio
Os módulos principais estão em `src/modules/`:

- `auth/`: autenticação, usuários, OAuth, streak e configurações do usuário
- `reader/`: livros, biblioteca do usuário, sincronização e leitura
- `canvas/`: quadros, elementos visuais e notas do canvas
- `memory/`: anotações, flashcards, grafo de conhecimento e booklets didáticos
- `ai/`: integrações de IA e geração de conteúdo

Cada módulo segue o mesmo padrão de organização:
- `routes/`: define endpoints HTTP
- `controllers/`: recebe requisições, extrai dados e delega a execução
- `services/`: implementa regras de negócio e chama Prisma/infraestrutura
- `schemas/`: validação Zod para body, query e params
- `middlewares/`: autenticação, validação e filtros específicos do módulo
- `config/` e `providers/`: módulos de configuração e integrações externas

#### 2.3. Convenções do backend
- O roteador deve apenas registrar endpoints e delegar para o controller.
- O controller não deve realizar queries Prisma diretamente.
- O service é o ponto de decisão de negócio, transações e regras de domínio.
- Schemas Zod devem validar todas as entradas externas antes de entrarem na lógica de negócio.
- Bom uso de `bcrypt` para senhas e `jsonwebtoken` para autenticação de sessão/API.
- O `server.ts` é o único lugar que monta a aplicação; a organização funcional deve permanecer dentro dos módulos.

### 3. Frontend Nuxt (`apps/web/`)

O frontend é uma aplicação Nuxt 4 com foco em UX de leitura, revisão, canvas, conhecimento e desktop via Tauri.

#### 3.1. Estrutura principal
- `app/pages/`: rotas e telas da aplicação
- `app/components/`: componentes visuais reutilizáveis
- `app/composables/`: lógica reutilizável via `useXxx()`
- `app/stores/`: estado global com Pinia
- `app/services/`: serviços de integração e fila de mutações
- `app/plugins/`: inicialização de plugins e integrações do runtime
- `app/assets/`: estilos, recursos e imagens de interface
- `src-tauri/`: aplicação desktop empacotada com Tauri v2

#### 3.2. Padrões do frontend
- Componentes devem ser focados em apresentação e composição; lógica de negócio fica em composables/services.
- Pinia é a fonte de estado global e reativo das features principais.
- Composables são o padrão preferencial para lógica reutilizável de leitura, sincronização, IA, streak, settings e gráficos.
- A camada de UI nunca deve acoplar diretamente regras de banco ou persistência local; isso fica na API e/ou no cliente de dados.
- O código de leitor e renderização de ebook deve permanecer encapsulado em adapters/composables específicos e não espalhado pelos templates.

### 4. Persistência e modelo de dados

O banco é o PostgreSQL 16 com extensão `pgvector`, acessado via Prisma.

Principais domínios no schema:
- `User`, `Account`, `UserSettings`, `DailyActivity`
- `Book`, `UserBook`, `BookPublicInfo`
- `Theme`, `ThemeHierarchy`, `BookTheme`
- `Annotation`, `Flashcard`, `DidacticBooklet`
- `Canvas`, `Note`, `Graph` e dados de memória/associação

O schema no `prisma/schema.prisma` é a referência canônica para entidades, relações e índices. Alterações de modelo devem seguir a convenção do Prisma e ser refletidas em migrações.

### 5. Regras de arquitetura e limites

- Controllers e rotas não devem conter regras de negócio complexas; eles apenas orquestram chamadas.
- Services são obrigatórios para qualquer regra de negócio, cálculo, validação de domínio e acesso ao Prisma.
- Schemas Zod devem validar body, query e params antes que dados externos alcancem o domínio.
- Senhas devem ser tratadas exclusivamente com hashing seguro (`bcrypt`) e nunca em texto puro.
- Comunicação entre frontend e backend deve acontecer via REST/HTTP e autenticação JWT.
- O backend deve permanecer como o único ponto de acesso ao banco de dados e integrações externas.
- O frontend deve ser responsável por experiência de usuário, composição de telas e sincronização de estado local, não por lógica sensível de dados.
- Módulos devem respeitar limites de domínio; não misturar responsabilidades de `auth`, `reader`, `canvas`, `memory` e `ai` em um único arquivo ou camada.
- A raiz do repositório deve permanecer orquestradora; o desenvolvimento e a validação do sistema devem continuar sendo executados por scripts no `package.json` raiz e por cada app.

### 6. Diretriz de evolução

Ao adicionar novas features:
1. Identificar o módulo de domínio correto em `apps/api/src/modules/`.
2. Definir contratos HTTP em `routes/` e validadores em `schemas/`.
3. Implementar regras de negócio em `services/`.
4. Conectar a funcionalidade ao frontend em `apps/web/app/` via composables/services/pages.
5. Atualizar o Prisma, listas e testes correspondentes.

Essa regra substitui o padrão legado e deve ser usada como referência para novas decisões de arquitetura no repositório.
