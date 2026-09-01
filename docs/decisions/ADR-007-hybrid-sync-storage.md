# ADR-007: Estratégia de Sincronização Híbrida ("Dados no Aresta, Binários no Usuário")

## Status
**Aceito** (2026-09-01)

---

## Contexto
O ecossistema **Aresta** lida com duas categorias fundamentalmente distintas de dados:
1. **Dados Relacionais e Metadados Comportamentais**: Posições exatas de leitura (CFI), anotações, grifos, notas com OCR/IA, flashcards com agendamento de repetição espaçada (SRS), ofensivas diárias (streaks) e nós/arestas do Grafo de Conhecimento. Esses dados são altamente estruturados, pequenos (< 1 MB por usuário), exigem sincronização atômica, controle de concorrência Last-Write-Wins (LWW) e alimentam recursos de inteligência e síntese.
2. **Arquivos Binários Pesados**: Arquivos de livros (`.epub`, `.pdf`) e imagens de capas de alta resolução, que variam de 5 MB a mais de 100 MB por obra. Armazenar todos os binários em *object storage* centralizado (S3/R2/GCS) impõe custos recorrentes de largura de banda e armazenamento que escalam exponencialmente com a base de usuários, além de criar o dilema de "quanto espaço gratuito oferecer por conta".

---

## Decisão

Adotamos a **Arquitetura de Sincronização Híbrida**:

> **"Dados no Aresta, Binários no Usuário"**

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

### 1. Distribuição de Responsabilidade

| Dado | Destino | Motivo |
| :--- | :--- | :--- |
| **EPUBs / PDFs** | Google Drive (`AppDataFolder`) | Grandes volumes, sem lógica relacional; usuário já possui cota de armazenamento. |
| **Capas de Livros** | Google Drive (`AppDataFolder`) | Binários estáticos associados ao livro. |
| **Anotações / Highlights** | Backend Aresta (`/api/sync`) | Requer resolução LWW por campo e índice CFI exato. |
| **Flashcards / SRS** | Backend Aresta (`/api/sync`) | Algoritmo de repetição espaçada exige precisão cronológica. |
| **Streaks / Ofensivas** | Backend Aresta (`/api/sync`) | Lógica de fuso-horário e sequência ininterrupta de dias. |
| **Nós e Arestas do Grafo** | Backend Aresta (`/api/sync`) | Relacionamentos entre entidades e visualização 2D/3D. |
| **Progresso de Leitura** | Backend Aresta (`/api/sync`) | Range CFI, percentual e timestamp de leitura. |

### 2. Armazenamento de Binários via Google Drive AppDataFolder
- O cliente Aresta solicita o escopo restrito `https://www.googleapis.com/auth/drive.appdata` (*Application Data Folder*).
- Os arquivos ficam ocultos no Drive do usuário, impedindo exclusões acidentais, mas consumindo o espaço de nuvem do próprio usuário.
- O dispositivo mantém cache local no **OPFS** (Web/Desktop) ou no **Filesystem nativo** (Tauri/Capacitor).

### 3. Sincronização Relacional no Backend Aresta
- O endpoint `POST /api/sync` recebe apenas deltas JSON em lote contendo mutações de metadados.
- Resolução determinística via **Last-Write-Wins (LWW)** com suporte a *soft deletes* (`deleted_at`).
- O banco PostgreSQL central não armazena BLOBs nem arquivos binários pesados, mantendo-se ultraleve (< 1 MB por usuário ativo).

---

## Consequências

### Positivas
- **Corte de ~70-80% do Custo de Nuvem**: Elimina a necessidade de *object storage* corporativo massivo para hospedar arquivos pesados de terceiros.
- **Armazenamento Escalável**: Cada usuário usufrui de seu próprio espaço de armazenamento (15 GB+ padrão Google).
- **Backend Ultrarrápido e Leve**: O banco central manipula apenas JSONs relacionais, otimizando cache, memória RAM e replicação.
- **Integridade da Inteligência**: O algoritmo de SRS, os nós do Grafo e os serviços de IA (OCR e Gemini) permanecem centralizados com total segurança de credenciais.
- **Privacidade do Usuário**: Os livros pessoais do usuário residem apenas em seus dispositivos e em seu próprio Google Drive privado.

### Trade-offs Aceitos
- **Autenticação Dupla**: O usuário utiliza a autenticação Aresta (JWT) para sua conta/metadados e autoriza o Google Drive (OAuth) caso deseje sincronizar os arquivos binários de livros entre múltiplos dispositivos.
