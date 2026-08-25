# ADR-002: Adoção do SQLite e Prisma ORM

## Status
Aceito (Accepted)

## Data
2026-08-25

## Contexto
O Aresta é uma aplicação de leitura e retenção que deve ser simples de executar localmente por desenvolvedores e usuários sem a necessidade de configurar e rodar instâncias de contêineres de banco de dados pesados como PostgreSQL ou MySQL em desenvolvimento inicial, mantendo integridade relacional estrita.

## Decisão
Adotamos o **SQLite 3** como banco de dados relacional embarcado, operando com **Prisma ORM** como camada de abstração de dados, migrações e tipagem forte em TypeScript.

## Alternativas Consideradas
1. **PostgreSQL**: Excelente, mas exigiria Docker / daemon de banco em execução para qualquer desenvolvedor que queira clonar e rodar o projeto.
2. **TypeORM / Knex**: Descartados pela superioridade do Prisma na geração automática de tipos estáticos seguros e facilidade de migrations declarativas.
3. **LowDB / NeDB**: Descartados por falta de integridade referencial relacional e ausência de transações ACID robustas.

## Consequências
- **Positivas**:
  - Zero configuração de infraestrutura: o arquivo `dev.db` é criado automaticamente.
  - Segurança de tipos com auto-complete total no TypeScript via Prisma Client.
  - Facilidade de migração futura para PostgreSQL alterando apenas o `provider` no `schema.prisma`.
- **Negativas / Desafios**:
  - SQLite possui concorrência de escrita limitada a um escritor por vez (mitigado pelo modo WAL e pool do SQLite).
