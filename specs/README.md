# Sistema de Especificações Técnicas (Specs)

Este diretório gerencia o ciclo de vida das especificações formais de funcionalidades no **modelo mental do Kiro**.

## O Que é uma Spec?

Uma **Spec** é um contrato detalhado e versionado que documenta:
1. **O que deve ser construído** (`requirements.md`): Objetivos, escopo, requisitos funcionais e critérios de aceite.
2. **Como deve ser construído** (`design.md`): Arquitetura, componentes, schemas Zod, migrações Prisma, endpoints de API e tratamento de erros.
3. **Representação visual** (`diagrams/<fluxo>.txt`): Diagramas em ASCII/Text art ilustrando os fluxos de dados e interações.
4. **Plano de execução** (`tasks.md`): Checklist atômico de tarefas de implementação, testes e documentação.

---

## Ciclo de Vida da Spec

```
      Início da Feature
             │
             ▼
   specs/active/<feature>/
  [requirements + design + tasks + ASCII]
             │
             ▼
       Implementação
             │
             ▼
     Testes & Validação
             │
             ▼
    Auditoria de Consistência
             │
             ▼
  specs/completed/<feature>/
```

1. **`specs/templates/`**: Contém os moldes padrão para criação de novas specs.
2. **`specs/active/`**: Contém as specs atualmente em fase de desenvolvimento.
3. **`specs/completed/`**: Contém o histórico permanente de specs implementadas, servindo como registro de evolução do software.
