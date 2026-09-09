# Serviço aresta-ocr (Go + Google Gemini + SOLID DIP)

O `aresta-ocr` é o microsserviço em Go responsável pela transcrição e conversão de escrita em imagens (sejam fotos de anotações manuscritas, páginas digitalizadas ou recortes de texto do canvas) em texto puro.

---

## 1. Princípios e Arquitetura

O serviço foi desenvolvido sob o **Princípio da Inversão de Dependência (D do SOLID)** e princípios de Clean Architecture:

- **Domínio Puro (`internal/domain/`)**: Contém os tipos e a interface `TextExtractor`, desacoplada de frameworks ou clientes HTTP/gRPC.
- **Adaptadores de IA (`internal/adapters/`)**:
  - `gemini`: Integração com a API Google Gemini (`google.golang.org/genai`), configurado com o modelo `gemini-flash-latest`, system instruction rigoroso e pipeline de sanitização para garantir extração exclusiva de escrita.
  - `mock`: Adaptador em memória para testes unitários com tempo de execução sub-milissegundo.
- **Camada de Transporte (`internal/transport/grpc/`)**: Servidor gRPC implementando o contrato `OcrService` (`proto/ocr/v1/ocr.proto`), permitindo integração com o backend Node.js (`apps/api`).

---

## 2. Diagrama de Arquitetura e Fluxo de Dados (OCR Flow)

```text
================================================================================
ARQUITETURA & FLUXO DE DADOS: ARESTA-OCR SERVICE (GO + GEMINI + SOLID DIP)
================================================================================

                           ┌───────────────────────────┐
                           │    apps/api (Backend) /   │
                           │     gRPC Client           │
                           └─────────────┬─────────────┘
                                         │
                                         │ 1. ExtractText(bytes, mimeType)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  aresta-ocr Service (gRPC Transport Layer)                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ internal/transport/grpc/handler.go                                     │  │
│  │                                                                        │  │
│  │ - Valida payload gRPC (ExtractTextRequest)                             │  │
│  │ - Mapeia para domain.ExtractRequest                                    │  │
│  │ - Chama extractor.ExtractText(ctx, req)                                │  │
│  └───────────────────────────────────┬────────────────────────────────────┘  │
│                                      │                                       │
│                                      │ 2. Depende apenas da Interface (DIP)  │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ internal/domain/extractor.go (SOLID Abstraction)                       │  │
│  │                                                                        │  │
│  │   type TextExtractor interface {                                       │  │
│  │       ExtractText(ctx, req) (*ExtractResult, error)                    │  │
│  │   }                                                                    │  │
│  └───────────────────────────────────┬────────────────────────────────────┘  │
│                                      │                                       │
│                     ┌────────────────┴────────────────┐                      │
│                     │                                 │                      │
│                     ▼                                 ▼                      │
│  ┌─────────────────────────────────────┐   ┌──────────────────────────────┐  │
│  │ internal/adapters/gemini            │   │ internal/adapters/mock       │  │
│  │                                     │   │                              │  │
│  │ • Strict System Instruction         │   │ • MockExtractor para testes  │  │
│  │ • Model: gemini-flash-latest        │   │   unitários ultra rápidos    │  │
│  │ • SDK: google.golang.org/genai      │   │ • Zero chamadas de rede      │  │
│  │ • Output Sanitizer (strip wrapper)  │   └──────────────────────────────┘  │
│  └──────────────────┬──────────────────┘                                     │
│                     │                                                        │
└─────────────────────┼────────────────────────────────────────────────────────┘
                      │
                      │ 3. HTTPS REST/gRPC API Call (Image Part + System Prompt)
                      ▼
       ┌──────────────────────────────┐
       │   Google Gemini Flash API    │
       │   (gemini-flash-latest)      │
       └──────────────┬───────────────┘
                      │
                      │ 4. Retorna transcrição estrita do texto
                      ▼
       ┌──────────────────────────────┐
       │     Sanitizer & Response     │
       │    (Apenas a escrita pura)   │
       └──────────────────────────────┘
================================================================================
```

---

## 3. Contrato Protobuf

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

## 4. Variáveis de Ambiente

- `GRPC_PORT`: Porta TCP do servidor gRPC (padrão: `50051`).
- `GEMINI_API_KEY`: Chave de autenticação do Google AI Studio.
- `GEMINI_MODEL`: Modelo utilizado (padrão: `gemini-flash-latest`).
- `USE_MOCK`: Execução em modo mock sem chamadas externas (`true`/`false`).
