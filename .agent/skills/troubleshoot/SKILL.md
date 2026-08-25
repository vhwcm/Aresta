---
name: troubleshoot
description: >-
  Orienta a investigação e correção de falhas, erros de runtime e comportamentos inesperados
  utilizando logs observáveis, testes reproduzíveis e correlação com o código-fonte.
---

# Skill: Troubleshoot (Diagnóstico Baseado em Evidências)

Esta skill define o procedimento padronizado para diagnóstico de incidentes, bugs e comportamentos anômalos no projeto Aresta.

## Fluxo de Investigação

```
              Problema Reportado ou Erro de Teste
                               │
                               ▼
               Consultar Documentação de Domínio
                               │
                               ▼
                 Reproduzir com Teste / Script
                               │
                               ▼
                  Inspecionar Logs de Runtime
                               │
                               ▼
                 Correlacionar com Código-Fonte
                               │
                               ▼
                 Formular Hipótese e Corrigir
                               │
                               ▼
                   Validar Testes Automatizados
                               │
                               ▼
             Documentar Aprendizado / Post-mortem
```

## Passo a Passo de Execução

1. **Reproduzir o Problema**:
   - Nunca assuma cegamente a causa. Crie ou execute um teste de integração (`npm test`) ou script isolado para reproduzir o comportamento anômalo de forma determinística.

2. **Inspecionar Evidências de Runtime**:
   - Analise mensagens de log, códigos de erro HTTP, falhas de validação do Zod ou erros do Prisma Client.
   - Identifique: *Qual requisição foi feita? Qual payload foi recebido? Onde a execução falhou? Qual o stack trace?*

3. **Isolar a Causa Raiz**:
   - Diferencie o sintoma visível (ex: *500 Internal Server Error*) da causa real (ex: *campo obrigatório não tratado no schema Zod* ou *relação ausente no Prisma query*).

4. **Aplicar a Correção Mínima Necessária**:
   - Altere apenas o código estritamente necessário para corrigir o defeito, preservando a integridade das camadas e regras de arquitetura.

5. **Regredir e Validar**:
   - Execute a suíte de testes do módulo para assegurar que a correção não gerou efeitos colaterais.

6. **Registrar o Conhecimento**:
   - Se o problema for recorrente ou envolver uma peculiaridade de ambiente/biblioteca, registre a solução em `docs/guides/troubleshooting.md`.
