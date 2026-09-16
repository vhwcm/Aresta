# Tarefas de Implementação: Containerização Completa (Docker & Compose)

## Checklist de Execução

- [ ] **1. Microsserviço Go (aresta-ocr)**
  - [ ] 1.1 Criar `aresta-ocr/Dockerfile` com compilação multi-stage (Go 1.23 + Alpine).
  - [ ] 1.2 Criar `aresta-ocr/.dockerignore` excluindo arquivos temporários e binários locais.
  - [ ] 1.3 Validar build da imagem Docker do `aresta-ocr`.

- [ ] **2. Banco de Dados e Backend (aresta-back-node)**
  - [ ] 2.1 Atualizar `aresta-back-node/prisma/schema.prisma` e variáveis de ambiente para compatibilidade com PostgreSQL no container.
  - [ ] 2.2 Criar script de entrypoint (`entrypoint.sh` ou comando npm) para rodar migrações/push antes do start do servidor.
  - [ ] 2.3 Criar `aresta-back-node/Dockerfile` com Node 20 Alpine e multi-stage build.
  - [ ] 2.4 Criar `aresta-back-node/.dockerignore`.
  - [ ] 2.5 Validar build da imagem Docker do backend.

- [ ] **3. Frontend (front - Nuxt 4)**
  - [ ] 3.1 Criar `front/Dockerfile` com Node 20 Alpine e compilação Nitro/Nuxt.
  - [ ] 3.2 Criar `front/.dockerignore`.
  - [ ] 3.3 Validar build da imagem Docker do frontend.

- [ ] **4. Orquestração e Ambiente Raiz (docker-compose)**
  - [ ] 4.1 Criar `docker-compose.yml` na raiz integrando os 4 serviços (`db`, `ocr-service`, `backend`, `frontend`).
  - [ ] 4.2 Criar `.env.docker.example` com template de todas as variáveis necessárias.
  - [ ] 4.3 Testar subida dos serviços com `docker compose up -d` e validar healthchecks.
  - [ ] 4.4 Testar conectividade ponta-a-ponta (Web -> Backend -> Postgres e Backend -> Go OCR).

- [ ] **5. Documentação & Revisão (Modelo Kiro)**
  - [ ] 5.1 Atualizar `docs/architecture/infrastructure.md` e guias de instalação.
  - [ ] 5.2 Executar a skill `review-consistency`.
  - [ ] 5.3 Mover spec de `specs/active/containerization/` para `specs/completed/containerization/`.
  - [ ] 5.4 Realizar commits atômicos via `git-commit`.
