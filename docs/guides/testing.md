# Guia: Suíte de Testes & Qualidade

Este guia apresenta a estratégia de testes do Aresta, comandos de execução e critérios de cobertura.

---

## 1. Visão Geral das Camadas de Teste

| Módulo | Tipo de Teste | Ferramenta | Localização |
| :--- | :--- | :--- | :--- |
| **Backend** | Integração & API | Vitest + Supertest | `aresta-back-node/tests/` |
| **Frontend** | Unitário & Componentes | Vitest + @vue/test-utils | `front/tests/` |
| **Frontend** | End-to-End (E2E) | Playwright | `front/tests/` |
| **Conversor** | Unitário | Pytest | `pdf2epub/tests/` |

---

## 2. Executando os Testes

### Testes do Backend:
```bash
cd aresta-back-node

# Executar todos os testes de integração
npm test

# Executar em modo watch (reexecuta ao salvar arquivos)
npm run test:watch
```

### Testes do Frontend:
```bash
cd front

# Executar testes unitários
npm test

# Checagem estática de tipos TypeScript
npm run typecheck

# Executar linter ESLint
npm run lint

# Executar testes E2E
npm run test:e2e
```

### Testes do Conversor Python:
```bash
cd pdf2epub
pytest
```

---

## 3. Diretrizes para Novos Testes
1. **Novos Endpoints**: Devem ter cobertura de cenários felizes (200/201) e cenários de erro (400 Zod validation, 401 Unauthorized, 404 Not Found).
2. **Novos Composables/Adapters**: Devem possuir testes validando retornos e tratamento de exceções.
