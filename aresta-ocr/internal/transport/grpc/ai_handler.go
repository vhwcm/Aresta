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
