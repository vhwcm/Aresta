package domain

import (
	"context"
	"math"
)

// ThemeInfo representa um tema existente com seu embedding pré-calculado.
type ThemeInfo struct {
	ID        int32
	Name      string
	Embedding []float32
}

// NewTheme representa um novo tema ou subtema proposto pela IA.
type NewTheme struct {
	Name            string
	Description     string
	Color           string
	Embedding       []float32
	ParentThemeName string // Se preenchido, é um subtema do tema pai indicado
}

// AnalyzeBookRequest contém os dados de entrada para a análise com IA e pesquisa na Web.
type AnalyzeBookRequest struct {
	Title          string
	Author         string
	ExistingThemes []ThemeInfo
}

// AnalyzeBookResult contém o resumo oficial gerado, temas vinculados e novos temas com hierarquia.
type AnalyzeBookResult struct {
	Summary         string
	MatchedThemeIDs []int32
	NewThemes       []NewTheme
}

// ContextAnnotation representa uma anotação vizinha recuperada via RAG.
type ContextAnnotation struct {
	Note    string
	Quote   string
	Chapter string
}

// GenerateFlashcardRequest contém os dados para geração do flashcard via small-shot pedagógico.
type GenerateFlashcardRequest struct {
	BookTitle    string
	TargetQuote  string
	TargetNote   string
	ChapterTitle string
	Themes       []string
	ContextNotes []ContextAnnotation
}

// GenerateFlashcardResult contém a pergunta, resposta, arquétipo pedagógico e resumo contextual.
type GenerateFlashcardResult struct {
	Question       string
	Answer         string
	CardType       string // REAL_SITUATION | CONCEPT_RECALL | CONCEPT_UNION
	ContextSummary string
}

// BookAnalyzer define a interface de domínio para pesquisa de livros, embeddings e flashcards via IA.
type BookAnalyzer interface {
	AnalyzeBook(ctx context.Context, req AnalyzeBookRequest) (*AnalyzeBookResult, error)
	GenerateEmbedding(ctx context.Context, text string) ([]float32, error)
	GenerateFlashcard(ctx context.Context, req GenerateFlashcardRequest) (*GenerateFlashcardResult, error)
}

// CosineSimilarity calcula a similaridade de cosseno entre dois vetores de embeddings.
func CosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) || len(a) == 0 {
		return 0
	}
	var dotProduct, normA, normB float32
	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}
