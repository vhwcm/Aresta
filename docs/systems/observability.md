# Observabilidade & Padrão de Logging

Este documento define a arquitetura de observabilidade, padronização de logs estruturados e diretrizes de diagnóstico do ecossistema Aresta.

---

## 1. Princípios de Observabilidade

A observabilidade do Aresta é desenhada tanto para operação humana quanto para **alimentar de contexto o agente de desenvolvimento de IA**:

```
                    ┌─────────────────────────┐
                    │   EXECUÇÃO DA APLICAÇÃO │
                    └────────────┬────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
            [ SUCESSO / INFO ]          [ FALHA / ERRO ]
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │      LOGS ESTRUTURADOS  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  DIAGNÓSTICO DO AGENTE  │
                    │   (Skill: troubleshoot) │
                    └─────────────────────────┘
```

---

## 2. Níveis de Log e Quando Usá-los

| Nível | Finalidade | Exemplos no Código |
| :--- | :--- | :--- |
| `DEBUG` | Detalhes de fluxo fino, dumps parciais de payload em desenvolvimento | `[DEBUG] Resolvendo cfi para página 42 no EPUB` |
| `INFO` | Inicialização, conclusão de operações de negócio, criação de registros | `[INFO] Usuário id=3 autenticado com sucesso` |
| `WARN` | Comportamento não ideal, fallbacks acionados, parâmetros limítrofes | `[WARN] Capa não encontrada para bookId=5, usando fallback padrão` |
| `ERROR` | Falhas de banco, exceções não tratadas, requisições 500 com stack trace | `[ERROR] Erro ao atualizar DailyActivity: UniqueConstraintFailed` |

---

## 3. Formato do Log Estruturado

Cada entrada de log deve conter contexto suficiente para responder:
- **O quê**: Ação ou evento disparado.
- **Onde**: Módulo, arquivo ou rota executada.
- **Quando**: Timestamp UTC / ISO 8601.
- **Quem**: Identificador de usuário (`userId`) ou sessão se autenticado.
- **Entidade**: `bookId`, `annotationId`, `themeId` quando aplicável.

### Exemplo Recomendado:
```typescript
console.log(JSON.stringify({
  level: 'INFO',
  timestamp: new Date().toISOString(),
  module: 'StreakService',
  action: 'trackReading',
  userId: user.id,
  readingSeconds: 300,
  isCompleted: true,
}));
```

---

## 4. Diretrizes de Segurança
- **Proibição Estrita de Segredos**: Nunca logar campos de senha em texto plano, tokens JWT completos ou hashes de segurança.
- **Sanitização de Dados**: Mascarar dados pessoais sensíveis quando não essenciais para a investigação técnica.
