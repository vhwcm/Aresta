package domain

import "context"

// ExtractRequest encapsula os dados e metadados necessários para uma extração de texto.
type ExtractRequest struct {
	// ImageData contém os bytes brutos da imagem.
	ImageData []byte
	// MimeType especifica o tipo de mídia (ex: "image/jpeg", "image/png", "image/webp").
	MimeType string
	// PromptHint fornece contexto ou instruções adicionais opcionais para a extração.
	PromptHint string
}

// ExtractResult representa o resultado retornado por um TextExtractor.
type ExtractResult struct {
	// Text é o texto puro extraído da imagem.
	Text string
	// ModelUsed indica o nome do modelo/motor que realizou a extração.
	ModelUsed string
}

// TextExtractor é a interface de domínio fundamental (SOLID - Dependency Inversion Principle).
// Desacopla qualquer consumidor (ex: transporte gRPC) de implementações específicas (Gemini, Mock, etc.).
type TextExtractor interface {
	ExtractText(ctx context.Context, req ExtractRequest) (*ExtractResult, error)
}
