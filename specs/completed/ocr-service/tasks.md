# Checklist de Tarefas: Módulo OCR de Imagem em Go com Gemini

## Fase 1: Inicialização do Módulo Go e Definições de Contrato
- [x] **1.1** Inicializar o módulo Go em `aresta-ocr/go.mod` e configurar dependências (gRPC, Protobuf, SDK Gemini).
- [x] **1.2** Criar contrato Protobuf `proto/ocr/v1/ocr.proto` e compilar os stubs Go gRPC.
- [x] **1.3** Implementar camada de domínio (`internal/domain/extractor.go` e `internal/domain/errors.go`) com a interface `TextExtractor`.

## Fase 2: Adaptadores e Lógica de Extração
- [x] **2.1** Implementar `MockExtractor` em `internal/adapters/mock/mock_extractor.go` para testes e injeção sem rede.
- [x] **2.2** Implementar prompt estrito e sanitizer em `internal/adapters/gemini/prompt.go` e `internal/adapters/gemini/sanitizer.go`.
- [x] **2.3** Implementar `GeminiExtractor` em `internal/adapters/gemini/gemini.go` com integração ao SDK Gemini (`gemini-flash-latest`).
- [x] **2.4** Criar testes unitários para o adaptador Gemini e Sanitizer (`sanitizer_test.go`).

## Fase 3: Camada de Transporte gRPC e Configuração
- [x] **3.1** Implementar configuração em `internal/config/config.go` (variáveis de ambiente, defaults).
- [x] **3.2** Implementar gRPC Server Handler em `internal/transport/grpc/handler.go`.
- [x] **3.3** Criar testes automatizados do gRPC handler com `bufconn` em `internal/transport/grpc/handler_test.go`.
- [x] **3.4** Implementar entrypoint `cmd/server/main.go` integrando config, adapters e servidor gRPC.

## Fase 4: Validação, Documentação e Finalização
- [x] **4.1** Executar todos os testes (`go test ./...`) e verificar compilação (`go build ./...`).
- [x] **4.2** Criar documentação e README do módulo em `aresta-ocr/README.md`.
- [x] **4.3** Realizar auditoria de consistência (`review-consistency`), mover spec para `specs/completed/` e atualizar `docs/`.
- [x] **4.4** Realizar commits atômicos estruturados.
