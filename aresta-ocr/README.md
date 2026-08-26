# Aresta OCR Service (Go + Google Gemini + SOLID DIP)

Microsserviço em Go de alta performance dedicado à extração exclusiva de escrita (manuscrita ou impressa) de imagens utilizando a API do Google Gemini (`gemini-flash-latest`), estruturado sob o **Princípio da Inversão de Dependência (D do SOLID)** e servido via **gRPC**.

---

## 🏛️ Arquitetura e Padrões de Projeto

O serviço adota **Clean Architecture** e o **Princípio da Inversão de Dependência (DIP)**:
- A camada de transporte (gRPC) e a aplicação dependem exclusivamente da interface abstrata `domain.TextExtractor`.
- A integração com o Google Gemini é um adaptador plugável (`adapters/gemini.GeminiExtractor`).
- Implementações alternativas (ex: `adapters/mock.MockExtractor`, Claude Vision, AWS Textract, Tesseract) podem ser injetadas sem alterar uma única linha do transporte gRPC.

```
                      ┌──────────────────────┐
                      │    gRPC Client       │
                      │ (aresta-back-node)   │
                      └──────────┬───────────┘
                                 │ gRPC / Protobuf
                                 ▼
                      ┌──────────────────────┐
                      │    OcrHandler        │
                      │  (transport/grpc)    │
                      └──────────┬───────────┘
                                 │ Invocação via interface
                                 ▼
                      ┌──────────────────────┐
                      │ <<TextExtractor>>    │  (Domain Interface / SOLID DIP)
                      └──────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
      ┌──────────────────────┐        ┌──────────────────────┐
      │   GeminiExtractor    │        │    MockExtractor     │
      │ (gemini-flash-latest)│        │   (Testes Unitários) │
      └──────────────────────┘        └──────────────────────┘
```

---

## 📋 Contrato Protobuf (`proto/ocr/v1/ocr.proto`)

```protobuf
syntax = "proto3";

package ocr.v1;

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

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `GRPC_PORT` | Porta TCP do servidor gRPC | `50051` |
| `GEMINI_API_KEY` | Chave de API do Google AI Studio / Gemini | *(obrigatório em prod)* |
| `GEMINI_MODEL` | Modelo Gemini utilizado para OCR | `gemini-flash-latest` |
| `USE_MOCK` | Habilita modo Mock sem chamadas externas (`true`/`false`) | `false` |

---

## 🚀 Como Executar

### 1. Execução com Mock (Desenvolvimento Local sem API Key)
```bash
USE_MOCK=true go run cmd/server/main.go
```

### 2. Execução com API do Gemini
```bash
GEMINI_API_KEY="sua-api-key-aqui" go run cmd/server/main.go
```

### 3. Compilação do Binário
```bash
go build -o bin/aresta-ocr cmd/server/main.go
```

### 4. Execução da Suíte de Testes
```bash
go test -v ./...
```
