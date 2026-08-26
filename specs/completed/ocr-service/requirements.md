# Especificação de Requisitos: Módulo OCR de Imagem em Go com Gemini

## Objetivo Geral

Implementar um microsserviço/módulo Go independente (`aresta-ocr`) para extrair exclusivamente a escrita (manuscrita ou impressa) de imagens utilizando o modelo `gemini-flash-latest` da API Gemini da Google, estruturado com o Princípio da Inversão de Dependência (D do SOLID) e servido via gRPC.

---

## Requisitos Funcionais

- **R1 - Abstração de Domínio (SOLID / DIP)**: O sistema deve definir uma interface `TextExtractor` que desacopla completamente o uso do Gemini da lógica do serviço e da camada de transporte gRPC.
- **R2 - Adapter Google Gemini**: Implementar um adaptador concreto `GeminiExtractor` utilizando o SDK oficial da Google, configurado para o modelo `gemini-flash-latest` (ou variável de ambiente `GEMINI_MODEL`).
- **R3 - Extração Estrita de Escrita**: O prompt e a instrução de sistema no adaptador Gemini devem garantir que apenas o texto escrito contido na imagem seja transcrito, sem introduções ("Aqui está o texto:"), sem explicações, sem notas e sem formatações desnecessárias.
- **R4 - Sanitização e Limpeza de Output**: O adaptador deve aplicar pipeline de sanitização pós-inferência para remover quebras excessivas, crases/code blocks acidentais e espaços vazios.
- **R5 - Servidor gRPC e Contrato Protobuf**: Expor serviço gRPC (`OcrService`) com método RPC `ExtractText(ExtractTextRequest) returns (ExtractTextResponse)` que aceita bytes da imagem e mime-type.
- **R6 - Configuração por Ambiente**: O serviço deve carregar configurações de porta gRPC, chave de API Gemini (`GEMINI_API_KEY`) e modelo via variáveis de ambiente com defaults seguros.
- **R7 - Testes Unitários e Integração**:
  - Testes unitários com mock/fake de `TextExtractor` e teste de servidor gRPC em memória via `bufconn`.
  - Testes de integração reais com a API Gemini ativados quando `GEMINI_API_KEY` estiver configurada.

---

## Critérios de Aceite

- [x] Interface `TextExtractor` definida no pacote de domínio sem dependência de bibliotecas de terceiros (apenas stdlib).
- [x] Implementação de `GeminiExtractor` utilizando `gemini-flash-latest` com System Instructions rigorosos e pipeline de limpeza.
- [x] Protobuf definido (`ocr.proto`) e código Go gRPC compilado.
- [x] Servidor gRPC funcional que inicializa e atende requisições de extração.
- [x] Cobertura de testes unitários com Mock de TextExtractor passando 100%.
- [x] Testes do gRPC handler via `bufconn` passando 100%.
- [x] Teste de integração com imagem real validado.
