package grpc_test

import (
	"context"
	"testing"

	aiv1 "aresta-ocr/gen/ai/v1"
	"aresta-ocr/internal/adapters/mock"
	"aresta-ocr/internal/domain"
	grpchandler "aresta-ocr/internal/transport/grpc"
)

func TestAIHandler_AnalyzeBook(t *testing.T) {
	mockAnalyzer := mock.NewMockBookAnalyzer()
	handler := grpchandler.NewAIHandler(mockAnalyzer, nil)

	ctx := context.Background()

	t.Run("success with title and existing themes", func(t *testing.T) {
		req := &aiv1.AnalyzeBookRequest{
			Title:  "O Programador Pragmático",
			Author: "Andy Hunt & Dave Thomas",
			ExistingThemes: []*aiv1.ThemeItem{
				{Id: 7, Name: "Tecnologia & Programação", Embedding: []float32{0.1, 0.2}},
			},
		}

		resp, err := handler.AnalyzeBook(ctx, req)
		if err != nil {
			t.Fatalf("expected no error, got: %v", err)
		}

		if resp.Summary == "" {
			t.Errorf("expected summary to not be empty")
		}

		if len(resp.MatchedThemeIds) == 0 {
			t.Errorf("expected at least one matched theme id")
		}

		if len(resp.NewThemes) == 0 {
			t.Errorf("expected new subthemes for programming book")
		}
	})

	t.Run("error on empty title", func(t *testing.T) {
		req := &aiv1.AnalyzeBookRequest{
			Title: "",
		}

		_, err := handler.AnalyzeBook(ctx, req)
		if err == nil {
			t.Fatalf("expected error for empty title, got nil")
		}
	})
}

func TestCosineSimilarity(t *testing.T) {
	t.Run("identical vectors have similarity 1", func(t *testing.T) {
		v1 := []float32{1.0, 2.0, 3.0}
		v2 := []float32{1.0, 2.0, 3.0}
		sim := domain.CosineSimilarity(v1, v2)
		if sim < 0.999 {
			t.Errorf("expected similarity ~1.0, got %f", sim)
		}
	})

	t.Run("orthogonal vectors have similarity 0", func(t *testing.T) {
		v1 := []float32{1.0, 0.0}
		v2 := []float32{0.0, 1.0}
		sim := domain.CosineSimilarity(v1, v2)
		if sim != 0 {
			t.Errorf("expected similarity 0.0, got %f", sim)
		}
	})
}
