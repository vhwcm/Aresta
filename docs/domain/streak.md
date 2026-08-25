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

1. **Meta Diária**: O usuário completa a meta ao acumular tempo mínimo de leitura ou número de flashcards revisados no dia.
2. **Streak Freeze**: Protege a ofensiva em caso de ausência por até N dias conforme saldo em `streak_freeze_count`.

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/streak.controller.ts`, `src/services/streak.service.ts`, `src/schemas/streak.schema.ts`
- **Frontend**:
  - `front/app/composables/useStreak.ts`, `front/app/components/StreakBadge.vue`
