# Multi-stage build para aresta-ocr com regeneração automatizada de Protobuf
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git protobuf

# Instalar geradores de protobuf para Go
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest \
    && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Regenerar stubs protobuf sincronizados
RUN protoc --go_out=. --go_opt=module=aresta-ocr \
           --go-grpc_out=. --go-grpc_opt=module=aresta-ocr \
           proto/ocr/v1/ocr.proto proto/ai/v1/ai.proto

# Compilar o binário estático
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/ocr-server ./cmd/server/main.go

# Imagem final de execução
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/ocr-server /app/ocr-server

EXPOSE 50051

ENTRYPOINT ["/app/ocr-server"]
