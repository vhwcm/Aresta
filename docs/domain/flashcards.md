# Domínio: Central de Revisão & Flashcards

## 1. Propósito
Oferece um sistema de retenção de conhecimento baseado em **Repetição Espaçada** (*Spaced Repetition*) e na **Curva do Esquecimento de Ebbinghaus**, transformando anotações e destaques de leitura em cartões de estudo ativos.

---

## 2. Metodologia da Curva do Esquecimento

```
    Retenção (%)
    100% ────┐
             │\  1ª Revisão (1 dia)
             │ \  ┌──┐
     75% ────┼──\─│  │\  2ª Revisão (3 dias)
             │   \│  │ \  ┌──┐
     50% ────┼────\──│──\─│  │\  3ª Revisão (7 dias)
             │    │  │   \│  │ \  ┌──┐
     25% ────┼────┴──┴────\──│──\─│  │──────► Retenção Estável de Longo Prazo
             └─────────────┴──┴───\──│──────►
               0  1   2   3   4   5   6   7  (Dias)
```

---

## 3. Regras de Negócio

1. **Geração a Partir de Anotações**:
   - Cada anotação (`Annotation`) pode dar origem a flashcards no formato Pergunta/Resposta ou Cloze (omissão de palavras).
2. **Intervalos de Repetição**:
   - Nível 1: Revisão após 24 horas.
   - Nível 2: Revisão após 3 dias.
   - Nível 3: Revisão após 7 dias.
   - Nível 4: Revisão após 14 dias.
   - Nível 5: Revisão após 30 dias.
3. **Integração com Streaks**:
   - A revisão de flashcards contabiliza no campo `flashcards_reviewed` da tabela `daily_activities`, contribuindo para a meta diária.

---

## 4. Código Relacionado
- **Frontend**:
  - `front/app/pages/review.vue`, `front/app/components/FlashcardModal.vue`
- **Backend**:
  - `src/controllers/annotation.controller.ts`, `src/services/streak.service.ts`
