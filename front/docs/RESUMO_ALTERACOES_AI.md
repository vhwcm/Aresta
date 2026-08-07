# Resumo das Alterações — Configuração e Renderização de IA

## 1. Configuração de Variáveis de Ambiente (.env e .env.exemple)
- Criados os arquivos `.env.exemple` e `.env.example` contendo a definição da variável `AI_KEY=`.
- Atualizado o arquivo `.env` com a chave configurada `AI_KEY=AQ.Ab8RN6KCz43cE76MxH4xfu2htCVlOnRpWllh0xiUf_wxyw_c7w`.
- Atualizado o `.gitignore` garantindo a exclusão do arquivo `.env` do versionamento e mantendo os arquivos `.env.exemple` e `.env.example` no git através de regras de exceção (`!.env.example` e `!.env.exemple`).

## 2. Seleção Dinâmica e Lista de Prioridade de Modelos Gemini
- Atualizada a função `getBestModel(apiKey)` para filtrar e priorizar modelos ativos oficiais mantidos pela API do Gemini (prioridade: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-flash-latest`).
- Descartados modelos descontinuados ou em versão de pré-visualização legado (como `gemini-2.5-flash` que retorna erro 404 de depreciação do Google).
- Adicionado tratamento específico com orientações visuais quando a API do Google retorna erro de limite de cota (`RESOURCE_EXHAUSTED` / status 429).

## 3. Componente de Renderização Markdown Sofisticado (AiMarkdown.vue)
- Criado o componente `app/components/AiMarkdown.vue` utilizando a biblioteca `marked`.
- Estilização com design system do Aresta (Newsreader para títulos, Inter para interface, JetBrains Mono para código, glassmorphism e paleta dark mode).
- Suporte a cabeçalhos (`#`, `##`, `###`), negrito (`**`), itálico (`*`), listas ordenadas e não ordenadas, cotações (`>`), tabelas formatadas, links e linhas horizontais.
- Blocos de código com barra superior indicando a linguagem e botão interativo de **Copiar Código**.

## 4. Suíte de Testes
- Todos os 108 testes unitários e de API executados com 100% de aprovação.
