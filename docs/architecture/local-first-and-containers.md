# Arquitetura Local-First, Mobile e Containerização de Serviços

Este documento registra a decisão e o modelo arquitetural do **Aresta** para suportar leitura offline, sincronização em nuvem, futura portabilidade para aplicativos móveis (Android/iOS) e orquestração de microsserviços via containers Docker.

---

## 1. Visão Geral do Modelo Arquitetural

O Aresta adota a filosofia **Local-First**, combinando a autonomia e agilidade da execução local com a robustez e inteligência dos serviços centralizados em nuvem.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISPOSITIVO CLIENTE (Web / Mobile)                   │
│                                                                         │
│  ┌──────────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│  │   Leitor de Livros   │   │ Armazenamento   │   │  Banco Local     │  │
│  │   (Offline First)    │◄──┤ Local (OPFS/FS) │   │  (IndexedDB/     │  │
│  │                      │   │ Livros e Capas  │   │   SQLite Local)  │  │
│  └──────────┬───────────┘   └─────────────────┘   └────────┬─────────┘  │
│             │                                              │            │
│             ▼                                              ▼            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │            Motor de Sincronização Local (Sync Engine)             │  │
│  │  - Fila de mutações locais com timestamp                          │  │
│  │  - Detecção de conectividade e envio de pendências                │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
                     HTTP / HTTPS     │  Sync REST API & Uploads
                                      │
┌─────────────────────────────────────▼───────────────────────────────────┐
│                     SERVIDOR / CLOUD (DOCKER STACK)                     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        Backend Node.js Express                    │  │
│  │     - Rotas de Sincronização Bidirecional (`/api/sync`)           │  │
│  │     - Autenticação JWT, Gestão de Usuários e Metadados            │  │
│  │     - Orquestrador de Chamadas gRPC para IA                       │  │
│  └──────────────┬──────────────────────────────────┬─────────────────┘  │
│                 │                                  │                    │
│                 │ Prisma ORM                       │ gRPC (TCP 50051)   │
│                 ▼                                  ▼                    │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐  │
│  │   Banco Central (PostgreSQL)  │  │  Microsserviço Go (aresta-ocr) │  │
│  │  - Fonte da verdade remota    │  │  - Transcrição OCR             │  │
│  │  - Catálogo global e backups  │  │  - Google Gemini AI            │  │
│  └───────────────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pilares da Arquitetura

### A. Leitura 100% Offline e Armazenamento Local
- **Livros e Capas**: O arquivo `.epub` e suas capas são mantidos localmente no dispositivo via **OPFS (Origin Private File System)** no navegador/desktop ou no sistema de arquivos nativo do aparelho móvel.
- **Banco de Dados no Cliente**: Todas as interações (posições de leitura, anotações, destaques, flashcards e ofensivas/streaks) são gravadas instantaneamente no banco local (IndexedDB no browser/Capacitor ou SQLite embarcado).
- **Independência de Rede**: O usuário pode ler livros e revisar flashcards sem qualquer conexão com a internet.

### B. Motor de Sincronização Bidirecional (Sync Engine)
- **Controle de Versão Local**: Cada registro persistido localmente recebe metadados de auditoria:
  - `updated_at`: Timestamp ISO da última alteração.
  - `deleted_at`: Suporte a *soft delete* para replicação de exclusões.
  - `sync_status`: Estado da mutação (`synced` | `pending`).
- **Resolução de Conflitos**: Estratégia baseada em *Last-Write-Wins (LWW)* por campo/entidade ou mesclagem incremental com timestamps confiáveis.
- **Endpoint Central**: `POST /api/sync` no Backend Node.js, que recebe as mutações pendentes do cliente e retorna as novidades remotas.

### C. Camada de IA e Microsserviços na Nuvem
- Serviços com alto consumo computacional ou que utilizam chaves secretas (como o `aresta-ocr` integrado ao Google Gemini) operam exclusivamente no servidor.
- Protege credenciais sensíveis (`GEMINI_API_KEY`) contra extração reversa em builds de aplicativos móveis.
- Comunicação de alta performance entre o Backend Node e o microsserviço Go via **gRPC**.

---

## 3. Orquestração em Containers Docker

O ambiente de servidor e desenvolvimento em nuvem é estruturado em 4 containers isolados:

| Serviço | Tecnologia | Porta | Descrição |
| :--- | :--- | :--- | :--- |
| **`db`** | PostgreSQL 16 Alpine | `5432` | Banco de dados relacional central com volume persistente. |
| **`ocr-service`** | Go 1.23 (Scratch/Alpine) | `50051` | Microsserviço gRPC de transcrição OCR e integração com IA Gemini. |
| **`backend`** | Node.js 20 Alpine | `7070` | API Express, Prisma ORM, motor de sincronização e healthchecks. |
| **`frontend`** | Node.js 20 (Nuxt 4) | `3000` | Interface Web para desktop/navegador. |

---

## 4. Evolução para Aplicativo Mobile (Capacitor / Nativo)

1. **Frontend Híbrido**: O código Vue/Nuxt em `front/` pode ser compilado com `@capacitor/core` e `@capacitor/android` / `@capacitor/ios`.
2. **Plugins Nativos**:
   - Persistência nativa de arquivos via `@capacitor/filesystem`.
   - Banco local nativo via `@capacitor-community/sqlite` ou IndexedDB persistente.
3. **Consumo de API**: O app mobile aponta para o domínio em nuvem do container `backend` (`https://api.aresta.app`), usufruindo da mesma stack sem necessidade de containers no dispositivo.
