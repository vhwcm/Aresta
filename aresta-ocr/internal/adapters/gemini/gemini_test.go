package gemini_test

import (
	"context"
	"errors"
	"testing"

	"aresta-ocr/internal/adapters/gemini"
	"aresta-ocr/internal/domain"
)

func TestGeminiExtractor_EmptyImage(t *testing.T) {
	extractor := gemini.NewGeminiExtractorWithClient(nil, "gemini-flash-latest")

	_, err := extractor.ExtractText(context.Background(), domain.ExtractRequest{
		ImageData: nil,
		MimeType:  "image/jpeg",
	})

	if !errors.Is(err, domain.ErrEmptyImage) {
		t.Fatalf("expected ErrEmptyImage, got %v", err)
	}
}
