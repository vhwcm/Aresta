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

## 3. Proposta Híbrida de Sincronização: "Dados no Aresta, Binários no Usuário"

Para otimizar os custos de infraestrutura e garantir escalabilidade ilimitada de armazenamento de acervo para os usuários, o Aresta adota uma abordagem de segregação estrita entre **Dados Relacionais / Metadados** e **Arquivos Binários**:

```
┌──────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO CLIENTE                       │
│                                                                  │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐    │
│  │  SQLite/IDB  │   │  OPFS / FS     │   │   Sync Engine    │    │
│  │  (metadados) │   │  (binários)    │   │  (mutation_queue)│    │
│  └──────┬───────┘   └───────┬────────┘   └───────┬──────────┘    │
│         │                   │                    │               │
└─────────┼───────────────────┼────────────────────┼───────────────┘
          │                   │                    │
          │              ┌────▼────────────────┐   │
          │              │   Google Drive API  │   │
          │              │  (apenas EPUBs/PDFs)│   │
          │              │   - AppDataFolder   │   │
          │              └─────────────────────┘   │
          │                                        │
          └────────────────────────────────────────►
                    POST /api/sync (deltas JSON)
                    ┌────────────────────────────┐
                    │   Backend Node.js Express  │
                    │  - JWT Auth & RBAC         │
                    │  - Sync de metadados (LWW) │
                    │  - IA (OCR, Gemini)        │
                    └──────────┬─────────────────┘
                               │
                    ┌──────────▼─────────────────┐
                    │      PostgreSQL Central    │
                    │  (sem storage de binários) │
                    └────────────────────────────┘
```

### Como Funciona a Distribuição de Dados

| Dado | Onde vai | Motivo |
| :--- | :--- | :--- |
| **EPUBs / PDFs** | Google Drive (`AppDataFolder`) | Arquivos grandes (5MB a 100MB+), sem lógica relacional; o usuário utiliza seu próprio espaço. |
| **Capas de Livros** | Google Drive (`AppDataFolder`) | Imagens binárias estáticas associadas às obras. |
| **Anotações / Highlights** | Backend Aresta (`/api/sync`) | Requer resolução LWW por campo e índice de posição CFI exato. |
| **Flashcards / SRS** | Backend Aresta (`/api/sync`) | Algoritmo de repetição espaçada exige dados cronológicos precisos. |
| **Streaks / Ofensivas** | Backend Aresta (`/api/sync`) | Lógica de fuso-horário e cálculo de sequência diária ininterrupta. |
| **Graph nodes / edges** | Backend Aresta (`/api/sync`) | Relacionamentos e conexões entre nós conceituais do Grafo. |
| **Progresso de Leitura** | Backend Aresta (`/api/sync`) | Range CFI, percentual de conclusão e timestamps. |

### Ganhos da Abordagem Híbrida
- **Corte de ~70-80% do Custo de Object Storage**: EPUBs e PDFs são o maior vetor de custo em armazenamento e transferência; delegá-los ao Drive do usuário zera esse custo de servidor.
- **Armazenamento Escalável sem Limites Arbitrários**: Resolve o dilema de cotas gratuitas — cada usuário usufrui dos 15 GB+ do seu próprio Google Drive.
- **Backend Ultraleve**: O banco PostgreSQL armazena apenas dados relacionais (< 1 MB por usuário), reduzindo consumo de memória e acelerando queries.
- **Manutenção da Lógica de Sincronização Própria**: Algoritmos de Last-Write-Wins (LWW), detecção de conflitos, soft-delete e idempotência operam 100% no motor Aresta.
- **Segurança da Camada de IA**: Credenciais e chaves do Google Gemini / OCR permanecem protegidas no backend.
- **Trade-off Aceito**: O usuário conecta sua conta Google apenas para backup/sync de binários entre múltiplos dispositivos, mantendo a autenticação Aresta para a sua conta e metadados.

---

## 4. Orquestração em Containers Docker

O ambiente de servidor e desenvolvimento em nuvem é estruturado em 4 containers isolados:

| Serviço | Tecnologia | Porta | Descrição |
| :--- | :--- | :--- | :--- |
| **`db`** | PostgreSQL 16 Alpine | `5432` | Banco de dados relacional central com volume persistente. |
| **`ocr-service`** | Go 1.23 (Scratch/Alpine) | `50051` | Microsserviço gRPC de transcrição OCR e integração com IA Gemini. |
| **`backend`** | Node.js 20 Alpine | `7070` | API Express, Prisma ORM, motor de sincronização e healthchecks. |
| **`frontend`** | Node.js 20 (Nuxt 4) | `3000` | Interface Web para desktop/navegador. |

---

## 5. Evolução para Aplicativo Mobile (Capacitor / Nativo)

1. **Frontend Híbrido**: O código Vue/Nuxt em `front/` pode ser compilado com `@capacitor/core` e `@capacitor/android` / `@capacitor/ios`.
2. **Plugins Nativos**:
   - Persistência nativa de arquivos via `@capacitor/filesystem`.
   - Banco local nativo via `@capacitor-community/sqlite` ou IndexedDB persistente.
3. **Consumo de API**: O app mobile aponta para o domínio em nuvem do container `backend` (`https://api.aresta.app`), usufruindo da mesma stack sem necessidade de containers no dispositivo.

