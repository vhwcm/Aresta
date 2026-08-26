# Design Técnico: Módulo OCR de Imagem em Go com Gemini

## 1. Visão Geral da Arquitetura

O módulo `aresta-ocr` é estruturado seguindo os princípios de **Clean Architecture** e **SOLID** (especificamente o *Dependency Inversion Principle*). A camada de transporte (gRPC) e as regras de aplicação dependem de contratos abstratos (`domain.TextExtractor`), permitindo a substituição transparente do provedor de IA (Gemini, Claude, AWS, Mock) sem qualquer alteração nas camadas superiores.

---

## 2. Estrutura de Diretórios do Módulo (`aresta-ocr/`)

```
aresta-ocr/
├── cmd/
│   └── server/
│       └── main.go              # Entrypoint da aplicação e injeção de dependências
├── internal/
│   ├── config/
│   │   └── config.go            # Carregamento de variáveis de ambiente
│   ├── domain/
│   │   ├── extractor.go         # Interface TextExtractor e structs de domínio
│   │   └── errors.go            # Erros de domínio padronizados
│   ├── adapters/
│   │   ├── gemini/
│   │   │   ├── gemini.go        # Implementação concreta do TextExtractor via Gemini SDK
│   │   │   ├── prompt.go        # System instructions rigorosos
│   │   │   └── sanitizer.go     # Limpeza do texto retornado
│   │   └── mock/
│   │       └── mock_extractor.go # Fake/Mock para testes unitários
│   └── transport/
│       └── grpc/
│           ├── handler.go       # Implementação do OcrServiceServer gRPC
│           └── handler_test.go  # Teste do handler com bufconn
├── proto/
│   └── ocr/
│       └── v1/
│           └── ocr.proto        # Definição do serviço e mensagens Protobuf
├── go.mod
├── go.sum
└── README.md
```

---

## 3. Contratos de Domínio (Go)

```go
package domain

import (
	"context"
	"errors"
)

var (
	ErrEmptyImage      = errors.New("image data cannot be empty")
	ErrUnsupportedMime = errors.New("unsupported image mime type")
	ErrExtractionFailed= errors.New("text extraction failed")
)

type ExtractRequest struct {
	ImageData   []byte
	MimeType    string
	PromptHint  string // Opcional: dica adicional de contexto
}

type ExtractResult struct {
	Text      string
	ModelUsed string
}

// TextExtractor define a porta de saída (DIP)
type TextExtractor interface {
	ExtractText(ctx context.Context, req ExtractRequest) (*ExtractResult, error)
}
```

---

## 4. Contrato Protobuf (`proto/ocr/v1/ocr.proto`)

```protobuf
syntax = "proto3";

package ocr.v1;

option go_package = "aresta-ocr/gen/ocr/v1;ocrv1";

service OcrService {
  rpc ExtractText(ExtractTextRequest) returns (ExtractTextResponse);
}

message ExtractTextRequest {
  bytes image_data = 1;
  string mime_type = 2; // ex: "image/jpeg", "image/png", "image/webp"
  string prompt_hint = 3;
}

message ExtractTextResponse {
  string text = 1;
  string model_used = 2;
}
```

---

## 5. Estratégia de Prompt e Sanitização

### System Instruction Rigoroso:
```text
You are a high-precision transcription engine. Your sole task is to transcribe exclusively all handwritten and printed text found in the provided image.
Rules:
1. Output ONLY the raw transcribed text.
2. Do NOT add any preamble, greeting, commentary, description, markdown code block wrappers (like ```text), notes, or explanations.
3. Preserve the original line breaks and layout flow of the text as written.
4. If there is no text in the image, output nothing (empty string).
```

### Pipeline de Sanitização:
- Remove espaços no início e fim (`strings.TrimSpace`).
- Remove acidentalmente blocos de código markdown (como ```` ```text ... ``` ````).

---

## 6. Diagrama de Arquitetura

Consulte [diagrams/ocr_flow.txt](file:///home/bcc/vhwcm24/Aresta/specs/active/ocr-service/diagrams/ocr_flow.txt) para o diagrama ASCII representativo.
