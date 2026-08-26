package gemini_test

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"aresta-ocr/internal/adapters/gemini"
	"aresta-ocr/internal/domain"
)

func TestGeminiExtractor_Integration_LiveAPI(t *testing.T) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if strings.TrimSpace(apiKey) == "" {
		apiKey = os.Getenv("GOOGLE_API_KEY")
	}

	if strings.TrimSpace(apiKey) == "" {
		t.Skip("Skipping live Gemini API integration test: GEMINI_API_KEY not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	extractor, err := gemini.NewGeminiExtractor(ctx, gemini.Config{
		APIKey: apiKey,
		Model:  "gemini-flash-latest",
	})
	if err != nil {
		t.Fatalf("failed to initialize gemini extractor: %v", err)
	}

	// Imagem PNG minimalista de 1x1 pixel ou payload de teste
	// PNG base64 minimal 1x1: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
	pngBytes := []byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
		0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x64, 0xf8, 0xcf, 0x50,
		0x0f, 0x00, 0x03, 0x86, 0x01, 0x80, 0x5a, 0x34, 0x7d, 0x6b, 0x00, 0x00,
		0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
	}

	res, err := extractor.ExtractText(ctx, domain.ExtractRequest{
		ImageData: pngBytes,
		MimeType:  "image/png",
	})

	if err != nil {
		t.Fatalf("Live API ExtractText failed: %v", err)
	}

	t.Logf("Live API returned text: %q (model: %s)", res.Text, res.ModelUsed)
}
