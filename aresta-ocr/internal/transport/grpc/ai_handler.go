package grpc

import (
	"context"
	"log/slog"

	aiv1 "aresta-ocr/gen/ai/v1"
	"aresta-ocr/internal/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AIHandler implementa aiv1.AIServiceServer.
type AIHandler struct {
	aiv1.UnimplementedAIServiceServer
	analyzer domain.BookAnalyzer
	logger   *slog.Logger
}

func NewAIHandler(analyzer domain.BookAnalyzer, logger *slog.Logger) *AIHandler {
	if logger == nil {
		logger = slog.Default()
	}
	return &AIHandler{
		analyzer: analyzer,
		logger:   logger,
	}
}

func (h *AIHandler) AnalyzeBook(ctx context.Context, req *aiv1.AnalyzeBookRequest) (*aiv1.AnalyzeBookResponse, error) {
	if req.Title == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}

	h.logger.Info("received AnalyzeBook request", "title", req.Title, "author", req.Author, "existing_themes_count", len(req.ExistingThemes))

	existing := make([]domain.ThemeInfo, len(req.ExistingThemes))
	for i, t := range req.ExistingThemes {
		existing[i] = domain.ThemeInfo{
			ID:        t.Id,
			Name:      t.Name,
			Embedding: t.Embedding,
		}
	}

	domainReq := domain.AnalyzeBookRequest{
		Title:          req.Title,
		Author:         req.Author,
		ExistingThemes: existing,
	}

	result, err := h.analyzer.AnalyzeBook(ctx, domainReq)
	if err != nil {
		h.logger.Error("failed to analyze book with AI", "title", req.Title, "error", err)
		return nil, status.Errorf(codes.Internal, "failed to analyze book: %v", err)
	}

	newThemes := make([]*aiv1.NewThemeSuggestion, len(result.NewThemes))
	for i, nt := range result.NewThemes {
		newThemes[i] = &aiv1.NewThemeSuggestion{
			Name:            nt.Name,
			Description:     nt.Description,
			Color:           nt.Color,
			Embedding:       nt.Embedding,
			ParentThemeName: nt.ParentThemeName,
		}
	}

	h.logger.Info("AnalyzeBook completed successfully", "matched_themes", len(result.MatchedThemeIDs), "new_themes", len(newThemes))

	return &aiv1.AnalyzeBookResponse{
		Summary:         result.Summary,
		MatchedThemeIds: result.MatchedThemeIDs,
		NewThemes:       newThemes,
	}, nil
}

func (h *AIHandler) GenerateEmbedding(ctx context.Context, req *aiv1.GenerateEmbeddingRequest) (*aiv1.GenerateEmbeddingResponse, error) {
	if req.Text == "" {
		return nil, status.Error(codes.InvalidArgument, "text is required")
	}

	emb, err := h.analyzer.GenerateEmbedding(ctx, req.Text)
	if err != nil {
		h.logger.Error("failed to generate embedding", "error", err)
		return nil, status.Errorf(codes.Internal, "failed to generate embedding: %v", err)
	}

	return &aiv1.GenerateEmbeddingResponse{
		Embedding: emb,
	}, nil
}

func (h *AIHandler) GenerateFlashcard(ctx context.Context, req *aiv1.GenerateFlashcardRequest) (*aiv1.GenerateFlashcardResponse, error) {
	if req.TargetNote == "" && req.TargetQuote == "" {
		return nil, status.Error(codes.InvalidArgument, "target note or quote is required")
	}

	ctxNotes := make([]domain.ContextAnnotation, len(req.ContextNotes))
	for i, cn := range req.ContextNotes {
		ctxNotes[i] = domain.ContextAnnotation{
			Note:    cn.Note,
			Quote:   cn.Quote,
			Chapter: cn.Chapter,
		}
	}

	domainReq := domain.GenerateFlashcardRequest{
		BookTitle:    req.BookTitle,
		TargetQuote:  req.TargetQuote,
		TargetNote:   req.TargetNote,
		ChapterTitle: req.ChapterTitle,
		Themes:       req.Themes,
		ContextNotes: ctxNotes,
	}

	res, err := h.analyzer.GenerateFlashcard(ctx, domainReq)
	if err != nil {
		h.logger.Error("failed to generate flashcard", "error", err)
		return nil, status.Errorf(codes.Internal, "failed to generate flashcard: %v", err)
	}

	return &aiv1.GenerateFlashcardResponse{
		Question:       res.Question,
		Answer:         res.Answer,
		CardType:       res.CardType,
		ContextSummary: res.ContextSummary,
	}, nil
}
