# Requisitos: Containerização Completa do Aresta (Docker & Docker Compose)

## 1. Objetivo Geral
Prover uma infraestrutura moderna, reproduzível e isolada em containers Docker para toda a stack do Aresta: Frontend (Nuxt 4), Backend (Node.js Express), Banco de Dados Relacional Central (PostgreSQL) e Microsserviço de IA (Go gRPC OCR), garantindo comunicação de rede integrada, persistência de dados e execução simplificada em qualquer ambiente (desenvolvimento, staging ou produção na nuvem).

---

## 2. Escopo
- **Incluído**:
  - `Dockerfile` otimizado para o Frontend (`front/`).
  - `Dockerfile` com Prisma e compilação TypeScript para o Backend (`aresta-back-node/`).
  - `Dockerfile` multi-stage build para o microsserviço Go (`aresta-ocr/`).
  - `docker-compose.yml` na raiz orquestrando os 4 serviços (`db`, `ocr-service`, `backend`, `frontend`) com rede interna dedicada e volumes persistentes.
  - Compatibilidade do Prisma ORM com PostgreSQL (ou suporte configurável de database provider).
  - Variáveis de ambiente padronizadas (`.env.docker.example` / `.env`).
  - Healthchecks para todos os containers com dependências orquestradas (`depends_on.condition: service_healthy`).
- **Não Incluído**:
  - Implementação completa do motor de sincronização offline no cliente (definido como etapa posterior na spec de Local-First Sync).
  - Deploy automatizado em cluster Kubernetes.

---

## 3. Requisitos Funcionais

### R1. Container do Banco de Dados (`db`)
- **Descrição**: Executar uma instância de PostgreSQL 16 Alpine com volume nomeado para persistência de dados, portas expostas para desenvolvimento e healthcheck via `pg_isready`.
- **Atores**: Sistema / Backend Node.js
- **Validação**: O container deve iniciar com credenciais seguras e responder com sucesso ao healthcheck antes da inicialização do backend.

### R2. Container do Microsserviço Go (`ocr-service`)
- **Descrição**: Compilar e rodar o binário Go do `aresta-ocr` em imagem mínima (Alpine/Distroless), expondo a porta gRPC `50051`.
- **Atores**: Backend Node.js
- **Validação**: O servidor gRPC deve subir, escutar conexões e responder às chamadas de extração/OCR via rede interna Docker.

### R3. Container do Backend Node.js (`backend`)
- **Descrição**: Rodar a API Express com Node.js 20, aplicar migrações do Prisma (`prisma migrate deploy` ou `prisma db push`) na inicialização e conectar-se ao PostgreSQL (`db:5432`) e ao serviço OCR (`ocr-service:50051`).
- **Atores**: Usuário / Frontend / App Mobile
- **Validação**: As rotas `/api/health`, `/api-docs` e os endpoints CRUD devem responder na porta `7070`.

### R4. Container do Frontend (`frontend`)
- **Descrição**: Servir a aplicação Nuxt 4 configurada para rotear chamadas de API para o backend (`backend:7070` internamente no SSR ou `http://localhost:7070` no navegador).
- **Atores**: Usuário Web
- **Validação**: A aplicação web deve ser acessível em `http://localhost:3000`.

---

## 4. Requisitos Não Funcionais
- **Performance**: Builds em multi-stage para manter imagens compactas (< 150MB para Go/Backend).
- **Resiliência**: Políticas de restart (`restart: unless-stopped`) e healthchecks em cadeia para evitar race conditions na inicialização.
- **Segurança**: Containers sem privilégios root quando viável; variáveis sensíveis injetadas via `.env`.

---

## 5. Critérios de Aceite
- [ ] `docker compose build` compila com sucesso todos os 3 serviços (`front`, `back`, `ocr`).
- [ ] `docker compose up` inicia todos os 4 containers (`db`, `ocr-service`, `backend`, `frontend`) sem erros.
- [ ] O endpoint `http://localhost:7070/api/health` retorna status `healthy` e conexão ativa com o banco.
- [ ] O Frontend `http://localhost:3000` carrega perfeitamente e consome as APIs do Backend.
- [ ] A chamada gRPC entre `backend` e `ocr-service` funciona através da rede do Docker Compose.
