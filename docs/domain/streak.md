# Domínio: Streaks & Atividade Diária (`DailyActivity`)

## 1. Propósito
Incentiva o hábito diário de leitura e estudo através de contadores de ofensiva (*streaks*), metas de leitura contínua e sistema de congelamento (*streak freeze*).

---

## 2. Entidades e Modelo de Dados

### Modelos Prisma (`prisma/schema.prisma`)
```prisma
model DailyActivity {
  id                  Int      @id @default(autoincrement())
  user_id             Int
  date                String   // Formato YYYY-MM-DD (UTC)
  reading_seconds     Int      @default(0)
  flashcards_reviewed Int      @default(0)
  is_completed        Boolean  @default(false)
  is_frozen           Boolean  @default(false)
  created_at          DateTime @default(now())
  updated_at          DateTime @default(now()) @updatedAt
  user                User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, date])
  @@map("daily_activities")
}
```

---

## 3. Algoritmo de Cálculo de Ofensiva

```
    ┌──────────────────────────────────────┐
    │  Ação do Usuário: Leitura/Flashcard  │
    └──────────────────┬───────────────────┘
                       │
                       │ POST /api/streak/track-reading ou track-flashcards
                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ Backend: Streak Service (`streak.service.ts`)                          │
    │                                                                        │
    │  1. Obtém data atual em UTC (formato `YYYY-MM-DD`)                     │
    │  2. Busca ou cria `DailyActivity` para (user_id, date)                 │
    │  3. Incrementa `reading_seconds` e/ou `flashcards_reviewed`            │
    │  4. Verifica se meta diária foi atingida -> seta `is_completed = true` │
    │  5. Se completou pela 1ª vez no dia:                                   │
    │     - Compara com `last_active_date`:                                  │
    │       * Se dia anterior consecutivo: `current_streak += 1`             │
    │       * Se pulou 1 dia e tem `streak_freeze_count > 0`:                │
    │         Consome 1 freeze, preserva streak e marca `is_frozen = true`   │
    │       * Se pulou sem freeze: reinicia `current_streak = 1`             │
    │     - Atualiza `longest_streak = max(longest_streak, current_streak)`  │
    │     - Atualiza `last_active_date = data_atual`                         │
    │  6. Persiste via transação Prisma no SQLite                            │
    └────────────────────────────────────────────────────────────────────────┘
```

1. **Meta Diária (Disjuntiva / OU)**: O usuário completa a meta diária ao acumular **10 minutos de leitura ativa** (600s) **OU** revisar **5 flashcards** no dia. Ao atingir qualquer uma das metas pela primeira vez no dia, a ofensiva (`current_streak`) incrementa em +1.
2. **Streak Freeze**: Protege a ofensiva em caso de ausência por até N dias conforme saldo em `streak_freeze_count`.

---

## 4. Código Relacionado
- **Backend**:
  - `apps/api/src/modules/auth/controllers/streak.controller.ts`, `apps/api/src/modules/auth/services/streak.service.ts`, `apps/api/src/modules/auth/routes/streak.routes.ts`
- **Frontend (Local-First)**:
  - `apps/web/app/composables/useReadingStreak.ts` (estado compartilhado reativo, cálculo de rollover de datas, meta de 10 min de leitura ou 5 flashcards, concessão de streak freeze a cada 7 dias).
  - `apps/web/app/composables/reader/useReadingTimer.ts` (timer ativo de leitura em segundo plano com flush por lote a cada 10s, descarte de inatividade, pausamento em abas ocultas e sincronização em `beforeunload`/`onUnmounted`).
  - `apps/web/app/components/reader/Viewer.vue` (ativação automática de contagem de leitura ao abrir qualquer obra).
  - `apps/web/app/components/ReadingStreak.vue`, `apps/web/app/components/StreakCelebrationModal.vue`, `apps/web/app/components/StreakShareModal.vue` (indicadores visuais de chama, progresso de leitura, histórico semanal, celebração e compartilhamento).

---

## 5. Diretrizes de Interface da Ofensiva (Minimalismo & Zero Blur)

Seguindo o design system do Aresta (`docs/DESIGN_SYSTEM.md`):
- **Superfície 100% Sólida e Opaca:** O popover e os modais de ofensiva utilizam exclusivamente fundos sólidos (`bg-bgPanel` ou `bg-black/70` para backdrop) sem desfoque (`backdrop-blur`). Isso garante que os nós do grafo de conhecimento ou listas subjacentes não vazem manchas luminosas nem borrem a visualização.
- **Enquadramento Ergonômico:** Na sidebar (`align="sidebar"`), o popover ancora com `md:left-0 md:right-auto`, projetando-se sempre para dentro da área visível da viewport no desktop (prevenindo corte no lado esquerdo). Possui teto de altura relativo (`max-h-[calc(100vh-5rem)]`) e rolagem interna (`overflow-y-auto`) para não ser cortado verticalmente em telas de menor altura.


