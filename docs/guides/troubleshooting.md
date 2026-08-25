# Guia: Diagnóstico & Resolução de Problemas (Troubleshooting)

Este guia reúne diagnósticos e soluções para problemas comuns de desenvolvimento, inicialização e runtime no ecossistema Aresta.

---

## 1. Problemas Frequentes & Soluções

### 1.1. Erro de Conexão com SQLite ou Prisma Client Desatualizado
- **Sintoma**: `PrismaClientInitializationError` ou `The table ... does not exist in the current database`.
- **Diagnóstico**: O schema Prisma foi alterado sem regenerar o client ou sincronizar o banco.
- **Solução**:
  ```bash
  cd aresta-back-node
  npm run prisma:generate
  npm run prisma:push
  ```

### 1.2. Erro de Porta em Uso (3000 ou 7070)
- **Sintoma**: `EADDRINUSE: address already in use :::7070` ou `:::3000`.
- **Diagnóstico**: Instância anterior do servidor Express ou Nuxt não foi finalizada.
- **Solução**:
  ```bash
  # Localizar processo e encerrar:
  fuser -k 7070/tcp
  fuser -k 3000/tcp
  ```

### 1.3. Erro de Validação Zod (400 Bad Request)
- **Sintoma**: A API retorna status 400 com payload `{ error: "Validation error", issues: [...] }`.
- **Diagnóstico**: Parâmetro ausente, tipo incorreto (ex: string em vez de number) ou body fora do schema.
- **Solução**: Verifique o schema correspondente em `aresta-back-node/src/schemas/` e os tipos esperados no Swagger em `/api-docs`.

---

## 2. Metodologia de Investigação com Logs
1. Habilite `DEBUG=true` no `.env` do backend.
2. Inspecione a saída do terminal ou arquivos de log estruturados.
3. Se o problema persistir, reproduza com um teste unitário mínimo em `tests/` e aplique a Skill `troubleshoot`.
