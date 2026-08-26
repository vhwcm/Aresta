package gemini

import (
	"context"
	"fmt"
	"strings"

	"aresta-ocr/internal/domain"
	"google.golang.org/genai"
)

const (
	// DefaultModel é o modelo padrão recomendado para extração rápida e precisa de texto.
	DefaultModel = "gemini-flash-latest"
)

// Config armazena as configurações do adaptador Gemini.
type Config struct {
	APIKey string
	Model  string
}

// GeminiExtractor implementa a interface domain.TextExtractor usando o SDK oficial do Google GenAI.
type GeminiExtractor struct {
	client *genai.Client
	model  string
}

var _ domain.TextExtractor = (*GeminiExtractor)(nil)

// NewGeminiExtractor cria uma nova instância de GeminiExtractor inicializando o cliente GenAI.
func NewGeminiExtractor(ctx context.Context, cfg Config) (*GeminiExtractor, error) {
	model := cfg.Model
	if strings.TrimSpace(model) == "" {
		model = DefaultModel
	}

	clientCfg := &genai.ClientConfig{
		APIKey: cfg.APIKey,
	}

	client, err := genai.NewClient(ctx, clientCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create gemini client: %w", err)
	}

	return &GeminiExtractor{
		client: client,
		model:  model,
	}, nil
}

// NewGeminiExtractorWithClient permite injetar um cliente genai pré-configurado (útil para testes/mocks).
func NewGeminiExtractorWithClient(client *genai.Client, model string) *GeminiExtractor {
	if strings.TrimSpace(model) == "" {
		model = DefaultModel
	}
	return &GeminiExtractor{
		client: client,
		model:  model,
	}
}

// ExtractText executa a chamada ao Gemini com foco estrito na transcrição da escrita.
func (g *GeminiExtractor) ExtractText(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error) {
	if len(req.ImageData) == 0 {
		return nil, domain.ErrEmptyImage
	}

	mimeType := req.MimeType
	if strings.TrimSpace(mimeType) == "" {
		mimeType = "image/jpeg"
	}

	userPrompt := DefaultUserPrompt
	if strings.TrimSpace(req.PromptHint) != "" {
		userPrompt = fmt.Sprintf("%s\nContext/Hint: %s", DefaultUserPrompt, req.PromptHint)
	}

	// Monta as partes da requisição multimodal (imagem + instrução de usuário)
	imagePart := genai.NewPartFromBytes(req.ImageData, mimeType)
	textPart := genai.NewPartFromText(userPrompt)

	content := &genai.Content{
		Parts: []*genai.Part{imagePart, textPart},
		Role:  "user",
	}

	systemContent := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText(DefaultSystemInstruction)},
		Role:  "user",
	}

	genConfig := &genai.GenerateContentConfig{
		SystemInstruction: systemContent,
	}

	resp, err := g.client.Models.GenerateContent(ctx, g.model, []*genai.Content{content}, genConfig)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", domain.ErrExtractionFailed, err)
	}

	rawText := resp.Text()
	sanitized := SanitizeExtractedText(rawText)

	return &domain.ExtractResult{
		Text:      sanitized,
		ModelUsed: g.model,
	}, nil
}
