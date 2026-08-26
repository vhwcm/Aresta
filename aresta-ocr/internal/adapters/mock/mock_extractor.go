package mock

import (
	"context"

	"aresta-ocr/internal/domain"
)

// MockExtractor é uma implementação de domain.TextExtractor para uso em testes unitários.
type MockExtractor struct {
	ExtractTextFunc func(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error)
}

var _ domain.TextExtractor = (*MockExtractor)(nil)

// NewMockExtractor cria um novo mock com comportamento padrão previsível.
func NewMockExtractor() *MockExtractor {
	return &MockExtractor{
		ExtractTextFunc: func(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error) {
			if len(req.ImageData) == 0 {
				return nil, domain.ErrEmptyImage
			}
			return &domain.ExtractResult{
				Text:      "Texto transcrito de teste simulado",
				ModelUsed: "mock-extractor",
			}, nil
		},
	}
}

// ExtractText executa a função configurada no mock.
func (m *MockExtractor) ExtractText(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error) {
	if m.ExtractTextFunc != nil {
		return m.ExtractTextFunc(ctx, req)
	}
	return &domain.ExtractResult{
		Text:      "",
		ModelUsed: "mock-extractor",
	}, nil
}
