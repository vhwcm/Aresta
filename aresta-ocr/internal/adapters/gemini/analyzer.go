package gemini

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"strings"

	"aresta-ocr/internal/domain"
	"google.golang.org/genai"
)

const (
	// EmbeddingModel é o modelo padrão para embeddings semânticos.
	EmbeddingModel = "text-embedding-004"
	// SimilarityThreshold é o limite mínimo de similaridade para considerar um tema já existente.
	SimilarityThreshold float32 = 0.78
)

var defaultThemeColors = []string{
	"#E57B55", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6", "#10B981", "#06B6D4", "#6366F1", "#14B8A6",
}

type bookAnalysisJSONResponse struct {
	Summary    string `json:"summary"`
	CoreTopics []struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	} `json:"core_topics"`
	Subtopics []struct {
		Name        string `json:"name"`
		Parent      string `json:"parent"`
		Description string `json:"description"`
	} `json:"subtopics"`
}

// GeminiBookAnalyzer implementa domain.BookAnalyzer.
type GeminiBookAnalyzer struct {
	client *genai.Client
	model  string
	logger *slog.Logger
}

var _ domain.BookAnalyzer = (*GeminiBookAnalyzer)(nil)

func NewGeminiBookAnalyzer(client *genai.Client, model string, logger *slog.Logger) *GeminiBookAnalyzer {
	if strings.TrimSpace(model) == "" {
		model = DefaultModel
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &GeminiBookAnalyzer{
		client: client,
		model:  model,
		logger: logger,
	}
}

func (a *GeminiBookAnalyzer) AnalyzeBook(ctx context.Context, req domain.AnalyzeBookRequest) (*domain.AnalyzeBookResult, error) {
	prompt := fmt.Sprintf(`Pesquise na internet informações sobre o seguinte livro:
Título: "%s"
Autor: "%s"

Forneça:
1. Um resumo em português conciso, claro e informativo (2 a 3 parágrafos) sobre os conceitos e objetivos centrais do livro.
2. Tópicos principais (core_topics) aos quais o livro pertence (ex: "Programação", "Literatura Brasileira", "Economia", etc.).
3. Subtópicos específicos (subtopics) abordados no livro vinculados ao seu respectivo tópico pai (ex: "Mentalidade de programação" com pai "Programação", "Ferramentas" com pai "Programação").

Responda OBRIGATORIAMENTE em formato JSON válido conforme a estrutura:
{
  "summary": "Resumo aqui...",
  "core_topics": [
    { "name": "Nome do Tópico", "description": "Breve descrição" }
  ],
  "subtopics": [
    { "name": "Nome do Subtópico", "parent": "Nome do Tópico Pai", "description": "Breve descrição" }
  ]
}`, req.Title, req.Author)

	content := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText(prompt)},
		Role:  "user",
	}

	systemInstruction := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText("Você é um curador e catalogador bibliográfico especialista. Pesquise e responda estritamente no formato JSON requisitado.")},
		Role:  "user",
	}

	genConfig := &genai.GenerateContentConfig{
		SystemInstruction: systemInstruction,
		ResponseMIMEType:  "application/json",
		Tools: []*genai.Tool{
			{
				GoogleSearch: &genai.GoogleSearch{},
			},
		},
	}

	resp, err := a.client.Models.GenerateContent(ctx, a.model, []*genai.Content{content}, genConfig)
	if err != nil {
		a.logger.Warn("failed to query gemini with google search grounding, falling back without grounding", "error", err)
		// Fallback sem ferramenta externa
		genConfig.Tools = nil
		resp, err = a.client.Models.GenerateContent(ctx, a.model, []*genai.Content{content}, genConfig)
		if err != nil {
			return nil, fmt.Errorf("gemini analysis failed: %w", err)
		}
	}

	rawJSON := resp.Text()
	// Limpar possíveis delimitadores markdown de bloco json
	cleanedJSON := strings.TrimSpace(rawJSON)
	cleanedJSON = strings.TrimPrefix(cleanedJSON, "```json")
	cleanedJSON = strings.TrimPrefix(cleanedJSON, "```")
	cleanedJSON = strings.TrimSuffix(cleanedJSON, "```")
	cleanedJSON = strings.TrimSpace(cleanedJSON)

	var parsed bookAnalysisJSONResponse
	if err := json.Unmarshal([]byte(cleanedJSON), &parsed); err != nil {
		a.logger.Error("failed to parse gemini json output", "raw", rawJSON, "error", err)
		// Fallback gracioso com resumo mínimo
		parsed.Summary = fmt.Sprintf("Livro '%s' de %s.", req.Title, req.Author)
		parsed.CoreTopics = []struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}{
			{Name: "Geral", Description: "Tema geral da obra"},
		}
	}

	result := &domain.AnalyzeBookResult{
		Summary:         parsed.Summary,
		MatchedThemeIDs: make([]int32, 0),
		NewThemes:       make([]domain.NewTheme, 0),
	}

	matchedMap := make(map[int32]bool)

	// Processar tópicos principais
	for _, ct := range parsed.CoreTopics {
		name := strings.TrimSpace(ct.Name)
		if name == "" {
			continue
		}

		emb := a.getEmbeddingSafe(ctx, name)
		matchedID := a.findMatchingExistingTheme(name, emb, req.ExistingThemes)

		if matchedID > 0 {
			if !matchedMap[matchedID] {
				matchedMap[matchedID] = true
				result.MatchedThemeIDs = append(result.MatchedThemeIDs, matchedID)
			}
		} else {
			color := defaultThemeColors[rand.Intn(len(defaultThemeColors))]
			result.NewThemes = append(result.NewThemes, domain.NewTheme{
				Name:        name,
				Description: ct.Description,
				Color:       color,
				Embedding:   emb,
			})
		}
	}

	// Processar subtópicos
	for _, st := range parsed.Subtopics {
		name := strings.TrimSpace(st.Name)
		parentName := strings.TrimSpace(st.Parent)
		if name == "" {
			continue
		}

		emb := a.getEmbeddingSafe(ctx, name)
		matchedID := a.findMatchingExistingTheme(name, emb, req.ExistingThemes)

		if matchedID > 0 {
			if !matchedMap[matchedID] {
				matchedMap[matchedID] = true
				result.MatchedThemeIDs = append(result.MatchedThemeIDs, matchedID)
			}
		} else {
			color := defaultThemeColors[rand.Intn(len(defaultThemeColors))]
			result.NewThemes = append(result.NewThemes, domain.NewTheme{
				Name:            name,
				Description:     st.Description,
				Color:           color,
				Embedding:       emb,
				ParentThemeName: parentName,
			})
		}
	}

	return result, nil
}

func (a *GeminiBookAnalyzer) GenerateEmbedding(ctx context.Context, text string) ([]float32, error) {
	emb := a.getEmbeddingSafe(ctx, text)
	if emb == nil {
		return nil, fmt.Errorf("falha ao gerar embedding para o texto fornecido")
	}
	return emb, nil
}

type flashcardJSONResponse struct {
	Question       string `json:"question"`
	Answer         string `json:"answer"`
	CardType       string `json:"card_type"`
	ContextSummary string `json:"context_summary"`
}

func (a *GeminiBookAnalyzer) GenerateFlashcard(ctx context.Context, req domain.GenerateFlashcardRequest) (*domain.GenerateFlashcardResult, error) {
	var contextNotesText string
	if len(req.ContextNotes) > 0 {
		var b strings.Builder
		b.WriteString("\nAnotações vizinhas recuperadas via RAG:\n")
		for i, cn := range req.ContextNotes {
			b.WriteString(fmt.Sprintf("%d. Capítulo: %s | Citação: \"%s\" | Nota: \"%s\"\n", i+1, cn.Chapter, cn.Quote, cn.Note))
		}
		contextNotesText = b.String()
	}

	themesText := strings.Join(req.Themes, ", ")
	if themesText == "" {
		themesText = "Geral"
	}

	prompt := fmt.Sprintf(`Você é um tutor pedagógico de elite especializado em memorização e active recall.
Gere exatamente 1 flashcard inteligente de alta qualidade baseado no trecho lido e na anotação do leitor.

DADOS DA LEITURA:
- Livro: "%s"
- Capítulo: "%s"
- Temas: %s
- Citação Marcada: "%s"
- Nota do Leitor: "%s"
%s

ARQUÉTIPOS PEDAGÓGICOS (Selecione o mais adequado):
1. REAL_SITUATION: Aplicação prática do conceito em um cenário verossímil.
2. CONCEPT_RECALL: Pergunta socrática e reflexiva sobre o mecanismo ou princípio fundamental.
3. CONCEPT_UNION: Conexão profunda entre a anotação alvo e as anotações vizinhas de contexto.

Responda OBRIGATORIAMENTE em formato JSON válido:
{
  "question": "Pergunta concisa e instigante...",
  "answer": "Resposta explicada e didática...",
  "card_type": "REAL_SITUATION" | "CONCEPT_RECALL" | "CONCEPT_UNION",
  "context_summary": "Resumo conciso do contexto..."
}`, req.BookTitle, req.ChapterTitle, themesText, req.TargetQuote, req.TargetNote, contextNotesText)

	content := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText(prompt)},
		Role:  "user",
	}

	systemInstruction := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText("Você é um especialista em neurociência da aprendizagem e repetição espaçada. Responda estritamente em JSON com pergunta, resposta, tipo de card e resumo contextual.")},
		Role:  "user",
	}

	genConfig := &genai.GenerateContentConfig{
		SystemInstruction: systemInstruction,
		ResponseMIMEType:  "application/json",
	}

	resp, err := a.client.Models.GenerateContent(ctx, a.model, []*genai.Content{content}, genConfig)
	if err != nil {
		return nil, fmt.Errorf("gemini flashcard generation failed: %w", err)
	}

	rawJSON := resp.Text()
	cleanedJSON := strings.TrimSpace(rawJSON)
	cleanedJSON = strings.TrimPrefix(cleanedJSON, "```json")
	cleanedJSON = strings.TrimPrefix(cleanedJSON, "```")
	cleanedJSON = strings.TrimSuffix(cleanedJSON, "```")
	cleanedJSON = strings.TrimSpace(cleanedJSON)

	var parsed flashcardJSONResponse
	if err := json.Unmarshal([]byte(cleanedJSON), &parsed); err != nil {
		a.logger.Error("failed to parse flashcard json output", "raw", rawJSON, "error", err)
		quote := req.TargetQuote
		if quote == "" {
			quote = req.TargetNote
		}
		parsed.Question = fmt.Sprintf("Qual o conceito essencial destacado em '%s'?", quote)
		parsed.Answer = fmt.Sprintf("O trecho aborda ideias centrais em '%s'. Anotação: %s", req.BookTitle, req.TargetNote)
		parsed.CardType = "CONCEPT_RECALL"
		parsed.ContextSummary = fmt.Sprintf("Leitura de %s", req.BookTitle)
	}

	validType := "CONCEPT_RECALL"
	switch strings.ToUpper(parsed.CardType) {
	case "REAL_SITUATION":
		validType = "REAL_SITUATION"
	case "CONCEPT_UNION":
		validType = "CONCEPT_UNION"
	default:
		validType = "CONCEPT_RECALL"
	}

	return &domain.GenerateFlashcardResult{
		Question:       parsed.Question,
		Answer:         parsed.Answer,
		CardType:       validType,
		ContextSummary: parsed.ContextSummary,
	}, nil
}

func (a *GeminiBookAnalyzer) getEmbeddingSafe(ctx context.Context, text string) []float32 {
	content := &genai.Content{
		Parts: []*genai.Part{genai.NewPartFromText(text)},
	}
	resp, err := a.client.Models.EmbedContent(ctx, EmbeddingModel, []*genai.Content{content}, nil)
	if err != nil || resp == nil || len(resp.Embeddings) == 0 || len(resp.Embeddings[0].Values) == 0 {
		a.logger.Warn("could not compute embedding vector", "text", text, "error", err)
		return nil
	}
	return resp.Embeddings[0].Values
}

func (a *GeminiBookAnalyzer) findMatchingExistingTheme(candidateName string, candidateEmb []float32, existing []domain.ThemeInfo) int32 {
	// 1. Verificação por igualdade de nome case-insensitive
	candLower := strings.ToLower(candidateName)
	for _, ext := range existing {
		if strings.ToLower(ext.Name) == candLower {
			return ext.ID
		}
	}

	// 2. Verificação semântica por similaridade de cosseno do embedding
	if len(candidateEmb) > 0 {
		var bestScore float32 = 0
		var bestID int32 = 0

		for _, ext := range existing {
			if len(ext.Embedding) == len(candidateEmb) {
				sim := domain.CosineSimilarity(candidateEmb, ext.Embedding)
				if sim > bestScore && sim >= SimilarityThreshold {
					bestScore = sim
					bestID = ext.ID
				}
			}
		}

		if bestID > 0 {
			return bestID
		}
	}

	return 0
}
