# Guia: Diagnóstico & Resolução de Problemas (Troubleshooting)

Este guia reúne diagnósticos e soluções para problemas comuns de desenvolvimento, inicialização e runtime no ecossistema Aresta.

---

## 1. Problemas Frequentes & Soluções

### 1.1. Erro de Conexão com PostgreSQL / Prisma Client Desatualizado
- **Sintoma**: `PrismaClientInitializationError` ou `The table ... does not exist in the current database`.
- **Diagnóstico**: O schema Prisma foi alterado sem aplicar as migrations SQL ou regenerar o client, ou o container `aresta-db` está parado.
- **Solução**:
  ```bash
  # 1. Garantir que o container PostgreSQL 16 está rodando
  docker compose up -d aresta-db

  # 2. Aplicar migrations e regenerar Prisma Client
  cd apps/api
  npx prisma migrate deploy
  npm run prisma:generate
  ```

### 1.2. Erro de Porta em Uso (3000 ou 3001)
- **Sintoma**: `EADDRINUSE: address already in use :::3001` ou `:::3000`.
- **Diagnóstico**: Instância anterior do servidor Express (`apps/api` :3001) ou Nuxt (`apps/web` :3000) não foi finalizada.
- **Solução**:
  ```bash
  # No Linux / macOS:
  fuser -k 3001/tcp
  fuser -k 3000/tcp

  # No Windows (PowerShell):
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
  ```

### 1.3. Erro de Validação Zod (400 Bad Request)
- **Sintoma**: A API retorna status 400 com payload `{ error: "Validation error", issues: [...] }`.
- **Diagnóstico**: Parâmetro ausente, tipo incorreto (ex: string em vez de number) ou body fora do schema.
- **Solução**: Verifique os schemas de validação Zod no módulo correspondente em `apps/api/src/modules/*/schemas/`.

### 1.4. Erro de Permissões ACL no SQLite / Tauri (Android / Desktop)
- **Sintoma**: `Command plugin:sql|load not allowed by ACL`.
- **Diagnóstico**: Capabilities do Tauri v2 não autorizaram a execução do comando ou o driver nativo não está disponível.
- **Solução**: O `TauriSqliteAdapter` ativa automaticamente o fallback resiliente para Dexie (IndexedDB) no cliente sem quebrar a execução. No Tauri, verifique `apps/web/src-tauri/capabilities/default.json` e `tauri.conf.json`.

---

## 2. Metodologia de Investigação com Logs
1. Habilite `DEBUG=true` no `.env` do backend.
2. Inspecione a saída do terminal ou arquivos de log estruturados.
3. Se o problema persistir, reproduza com um teste unitário mínimo em `tests/` e aplique a Skill `troubleshoot`.
