package mock

import (
	"context"
	"fmt"
	"strings"

	"aresta-ocr/internal/domain"
)

// MockBookAnalyzer implementa domain.BookAnalyzer com respostas determinísticas.
type MockBookAnalyzer struct{}

var _ domain.BookAnalyzer = (*MockBookAnalyzer)(nil)

func NewMockBookAnalyzer() *MockBookAnalyzer {
	return &MockBookAnalyzer{}
}

func (m *MockBookAnalyzer) AnalyzeBook(ctx context.Context, req domain.AnalyzeBookRequest) (*domain.AnalyzeBookResult, error) {
	summary := fmt.Sprintf("Resumo da obra '%s' escrita por %s. Trata-se de uma referência fundamental na área, explorando princípios conceituais, práticas e impacto no conhecimento humano.", req.Title, req.Author)

	result := &domain.AnalyzeBookResult{
		Summary:         summary,
		MatchedThemeIDs: make([]int32, 0),
		NewThemes:       make([]domain.NewTheme, 0),
	}

	// Se houver tema existente de tecnologia/programação ou literatura, vincula
	matched := false
	for _, ext := range req.ExistingThemes {
		if strings.Contains(strings.ToLower(req.Title), "program") || strings.Contains(strings.ToLower(req.Title), "inform") {
			if strings.Contains(strings.ToLower(ext.Name), "program") || strings.Contains(strings.ToLower(ext.Name), "tecno") {
				result.MatchedThemeIDs = append(result.MatchedThemeIDs, ext.ID)
				matched = true
				break
			}
		} else if strings.Contains(strings.ToLower(req.Author), "machado") || strings.Contains(strings.ToLower(req.Title), "conto") {
			if strings.Contains(strings.ToLower(ext.Name), "literatura") || strings.Contains(strings.ToLower(ext.Name), "machado") {
				result.MatchedThemeIDs = append(result.MatchedThemeIDs, ext.ID)
				matched = true
				break
			}
		}
	}

	if !matched && len(req.ExistingThemes) > 0 {
		result.MatchedThemeIDs = append(result.MatchedThemeIDs, req.ExistingThemes[0].ID)
	}

	// Adicionar subtemas sugeridos
	if strings.Contains(strings.ToLower(req.Title), "program") {
		result.NewThemes = append(result.NewThemes, domain.NewTheme{
			Name:            "Mentalidade de programação",
			Description:     "Padrões de pensamento e boas práticas de desenvolvimento",
			Color:           "#10B981",
			Embedding:       []float32{0.1, 0.2, 0.3, 0.4},
			ParentThemeName: "Tecnologia & Programação",
		})
		result.NewThemes = append(result.NewThemes, domain.NewTheme{
			Name:            "Ferramentas de Desenvolvimento",
			Description:     "Utilização eficiente de editores, compiladores e versionamento",
			Color:           "#06B6D4",
			Embedding:       []float32{0.15, 0.25, 0.35, 0.45},
			ParentThemeName: "Tecnologia & Programação",
		})
	}

	return result, nil
}

func (m *MockBookAnalyzer) GenerateEmbedding(ctx context.Context, text string) ([]float32, error) {
	// Retorna um embedding determinístico simulado com 768 dimensões
	emb := make([]float32, 768)
	var sum float32
	for i, r := range text {
		idx := i % 768
		emb[idx] += float32(r) * 0.01
		sum += emb[idx]
	}
	if sum == 0 {
		sum = 1
	}
	for i := range emb {
		emb[i] = emb[i] / sum
	}
	return emb, nil
}

func (m *MockBookAnalyzer) GenerateFlashcard(ctx context.Context, req domain.GenerateFlashcardRequest) (*domain.GenerateFlashcardResult, error) {
	cardType := "CONCEPT_RECALL"
	if len(req.ContextNotes) > 0 {
		cardType = "CONCEPT_UNION"
	}

	quote := req.TargetQuote
	if quote == "" {
		quote = req.TargetNote
	}

	question := fmt.Sprintf("Qual o conceito central abordado no trecho: \"%s\"?", quote)
	answer := fmt.Sprintf("O trecho explora ideias fundamentais em '%s'. Anotação do leitor: %s.", req.BookTitle, req.TargetNote)

	return &domain.GenerateFlashcardResult{
		Question:       question,
		Answer:         answer,
		CardType:       cardType,
		ContextSummary: fmt.Sprintf("Gerado a partir da leitura de '%s'", req.BookTitle),
	}, nil
}
