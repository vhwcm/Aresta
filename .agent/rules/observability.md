# Regra: Observabilidade e Logging para Diagnóstico

## Princípio Fundamental

A observabilidade não é apenas para monitoramento em produção; é a **fonte primária de evidência de execução** para o agente e para os desenvolvedores. Ao investigar um problema, nunca confie exclusivamente em suposições teóricas do código-fonte: utilize evidências de runtime (logs, stack traces, respostas HTTP reais).

## Padrões de Logging

1. **Níveis Apropriados**:
   - `DEBUG`: Detalhes de fluxo fino, payloads intermediários (em desenvolvimento).
   - `INFO`: Inicialização de serviços, início/fim de operações de negócio bem-sucedidas, conexões estabelecidas.
   - `WARN`: Falhas não-bloqueantes, fallbacks acionados, parâmetros anômalos.
   - `ERROR`: Falhas de banco, erros inesperados, exceções não tratadas com stack trace completo.

2. **Contexto Relevante**:
   - Sempre inclua: identificador da operação, entidade afetada (`userId`, `bookId`, etc.), timestamp e mensagem descritiva.
   - Responda às perguntas: *O que aconteceu? Onde? Quando? Com qual entidade? Qual era o estado anterior?*

3. **Segurança e Privacidade**:
   - **NUNCA** logar senhas em texto puro, tokens JWT completos, hashes de senha ou chaves de API secretas.

4. **Metodologia de Troubleshooting para o Agente**:
   - Passo 1: Reproduzir o erro por meio de teste automatizado ou script de chamada.
   - Passo 2: Analisar os logs e stack traces emitidos.
   - Passo 3: Correlacionar a linha do log com o código-fonte correspondente.
   - Passo 4: Formular a hipótese da causa raiz e aplicar a correção mínima necessária.
   - Passo 5: Re-executar o teste para verificar a eliminação da falha.
   - Passo 6: Documentar procedimentos de troubleshooting recorrentes em `docs/guides/troubleshooting.md`.
