---
name: smart-commit-push
description: >-
  Analisa todos os arquivos no stage (e opcionalmente os nao staged), agrupa-os
  logicamente em commits atomicos com mensagens Conventional Commits descritivas
  e faz git push. Ignora artefatos de build/geracao automatica (.nuxt/, dist/,
  package-lock.json gerado por CI, etc.).
---

# Smart Commit & Push

Skill para transformar o estado atual do repositorio em uma sequencia de commits
atomicos bem nomeados e fazer push de forma automatizada e segura.

---

## Objetivo

1. **Inspecionar** o que esta no stage (e unstaged) sem cometer nada as cegas.
2. **Filtrar** arquivos que NAO devem ser commitados (build artifacts, gerados automaticamente).
3. **Agrupar** os arquivos restantes em commits logicos separados.
4. **Commitar** cada grupo com mensagem Conventional Commits descritiva.
5. **Fazer push** para o remote ao final.

---

## Fluxo Sequencial

```
 +----------------------------------+
 | 1. git status --short            | --> Enxergar staged, unstaged e untracked
 +-------------+--------------------+
               |
 +-------------v--------------------+
 | 2. Filtrar artefatos descartaveis| --> .nuxt/, dist/, *.d.ts gerado, lockfiles
 +-------------+--------------------+
               |
 +-------------v--------------------+
 | 3. Agrupar por escopo logico     | --> api, web, docs, config, tests, chore
 +-------------+--------------------+
               |
 +-------------v--------------------+
 | 4. Para cada grupo:              |
 |    git add <arquivos do grupo>   |
 |    git commit -m "<msg>"         |
 +-------------+--------------------+
               |
 +-------------v--------------------+
 | 5. git push origin <branch>      |
 +----------------------------------+
```

---

## Etapa 1 - Inspecao do Estado do Repositorio

Execute os comandos abaixo e analise cada linha da saida:

```bash
git status --short
git diff --cached --name-only
git diff --name-only
```

- Linhas com `M `, `A `, `D ` (com espaco a direita do status) --> **staged**.
- Linhas com ` M`, ` D`, `??` --> **unstaged / untracked** -- pergunte ao usuario se devem entrar.
- Se nao houver nada em staged e o usuario nao quiser adicionar nada mais --> informe e encerre.

---

## Etapa 2 - Filtro: Arquivos que NAO devem ser commitados

Remova da lista de candidatos qualquer arquivo que corresponda a estes padroes.
Use `git restore --staged <arquivo>` para remover do stage se necessario:

| Padrao                          | Motivo                                      |
|---------------------------------|---------------------------------------------|
| `apps/web/.nuxt/**`             | Build cache do Nuxt -- gerado automaticamente |
| `apps/web/.output/**`           | Output do Nuxt build                        |
| `apps/web/dist/**`              | Distribuicao compilada                      |
| `apps/api/dist/**`              | Build do backend                            |
| `**/node_modules/**`            | Dependencias -- jamais commitar             |
| `**/*.d.ts` em `.nuxt/`         | Type declarations geradas                   |
| `package-lock.json` (raiz/apps) | Apenas se nao houve alteracao intencional   |
| `*.log`, `*.tmp`                | Logs e temporarios                          |

> **Regra de ouro**: se o arquivo e gerado por um processo de build ou por uma ferramenta
> automaticamente (ex: Prisma, Nuxt, TypeScript compiler), ele **nao deve** ser commitado,
> a menos que seja resultado de uma acao explicita do agente (ex: `prisma generate`
> apos alterar o schema).

---

## Etapa 3 - Agrupamento Logico em Commits Atomicos

Apos filtrar, classifique os arquivos restantes em grupos. Cada grupo vira um commit.

### Regras de Agrupamento

| Grupo (escopo)     | Caminho/padrao dos arquivos                        | Tipo sugerido   |
|--------------------|----------------------------------------------------|-----------------|
| `api`              | `apps/api/src/**`                                  | feat/fix/refactor |
| `api/schema`       | `apps/api/prisma/**`                               | feat/fix/chore  |
| `web`              | `apps/web/src/**`, `apps/web/pages/**`, `apps/web/components/**` | feat/fix/style |
| `web/config`       | `apps/web/nuxt.config.*`, `apps/web/tailwind.*`    | chore/feat      |
| `config`           | `*.json`, `*.yaml`, `*.toml` na raiz ou apps/      | chore           |
| `docs`             | `**/*.md`, `docs/**`, `specs/**`                   | docs            |
| `tests`            | `**/*.test.*`, `**/*.spec.*`, `**/tests/**`        | test            |
| `chore`            | `.gitignore`, `Dockerfile`, `*.env.example`, CI    | chore           |
| `checklist`        | `checklist.md`, `TASKS.md`                         | chore           |

> **Atencao**: Se um arquivo nao se encaixa em nenhum grupo acima, crie um grupo ad hoc
> com escopo descritivo (ex: `feat(memory): ...`).

### Regras de Prioridade de Agrupamento

1. **Nunca misture escopos** em um mesmo commit (ex: api + web juntos = errado).
2. **Nunca misture tipos** em um mesmo commit (ex: feat + fix juntos = errado).
3. Se houver duvida entre `fix` e `feat`, prefira `fix` para correcoes pontuais
   e `feat` para adicao de comportamento novo.
4. Alteracoes de `checklist.md` e `TASKS.md` podem ser agrupadas juntas em um unico
   `chore(checklist): ...` ao final.

---

## Etapa 4 - Commitar Cada Grupo

Para cada grupo definido na Etapa 3, execute:

```bash
# Adicionar apenas os arquivos do grupo ao stage
git add <arquivo1> <arquivo2> ...

# Commitar com mensagem descritiva
git commit -m "<tipo>(<escopo>): <descricao imperativa no presente>"
```

### Formato da Mensagem de Commit

```
<tipo>(<escopo>): <descricao curta em portugues ou ingles>

[corpo opcional -- se a mudanca for complexa, explique o porque]
```

- **Maximo 72 caracteres** na linha de assunto.
- **Imperativo presente**: "adiciona", "corrige", "remove", "refatora" (nao "adicionado", "adicionando").
- **Sem ponto final** na linha de assunto.
- **Escopo** deve ser o modulo/area mais especifico possivel.

### Exemplos de Mensagens Boas

```
feat(api/auth): adiciona endpoint de refresh token JWT
fix(web/reader): corrige renderizacao de epub em tela cheia
refactor(api/memory): extrai logica de embedding para servico dedicado
test(api/canvas): adiciona testes de integracao para CRUD de nodes
docs(specs): adiciona spec tecnica do modulo de AI
chore(config): atualiza variaveis de ambiente de exemplo
chore(checklist): atualiza status de tarefas concluidas
```

---

## Etapa 5 - Git Push

Apos todos os commits locais:

```bash
git push origin <branch-atual>
```

- Obtenha a branch atual com: `git rev-parse --abbrev-ref HEAD`
- Se o push for rejeitado (divergencia), **NAO force** sem aprovacao explicita do usuario.
- Em caso de conflito, reporte ao usuario e aguarde instrucao.

---

## Comportamento Esperado do Agente ao Usar Esta Skill

1. **Nunca pergunte** se deve ou nao fazer o agrupamento -- faca e mostre o plano antes de executar.
2. **Apresente o plano** de commits antes de executar qualquer `git commit`:
   - Liste cada grupo, os arquivos e a mensagem planejada.
   - Aguarde confirmacao do usuario **apenas se** houver arquivos ambiguos ou decisoes de alto impacto.
3. **Execute commit por commit**, verificando saida de cada um antes de prosseguir.
4. **Informe ao usuario** o resultado final com um resumo dos commits criados e o push.
5. **Atualize o `checklist.md`** apos concluir, marcando a tarefa de commit/push como `[Concluido]`.

---

## Regras de Seguranca (Inegociaveis)

- NUNCA faca `git push --force` sem aprovacao explicita do usuario.
- NUNCA commite arquivos de `.nuxt/`, `dist/`, `node_modules/`.
- NUNCA commite `.env` com segredos reais (verifique se `.env` esta no `.gitignore`).
- NUNCA faca `git add .` ou `git add -A` sem antes filtrar os artefatos descartaveis.
- SEMPRE use `git add <arquivos especificos>` -- nunca adicione tudo de uma vez.
- SEMPRE verifique `git diff --cached` antes de commitar para confirmar o conteudo.
