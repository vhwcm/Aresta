package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	aiv1 "aresta-ocr/gen/ai/v1"
	ocrv1 "aresta-ocr/gen/ocr/v1"
	"aresta-ocr/internal/adapters/gemini"
	"aresta-ocr/internal/adapters/mock"
	"aresta-ocr/internal/config"
	"aresta-ocr/internal/domain"
	grpchandler "aresta-ocr/internal/transport/grpc"

	"google.golang.org/genai"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	cfg := config.LoadConfig()

	logger.Info("starting aresta-ai/ocr service",
		"grpc_port", cfg.GRPCPort,
		"model", cfg.GeminiModel,
		"mock_mode", cfg.UseMock,
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var extractor domain.TextExtractor
	var analyzer domain.BookAnalyzer

	if cfg.UseMock {
		logger.Info("using MockExtractor & MockBookAnalyzer (no external API calls)")
		extractor = mock.NewMockExtractor()
		analyzer = mock.NewMockBookAnalyzer()
	} else {
		if cfg.GeminiAPIKey == "" {
			logger.Error("GEMINI_API_KEY environment variable is not set. Set GEMINI_API_KEY or run with USE_MOCK=true")
			os.Exit(1)
		}

		genaiClient, err := genai.NewClient(ctx, &genai.ClientConfig{
			APIKey: cfg.GeminiAPIKey,
		})
		if err != nil {
			logger.Error("failed to initialize genai client", "error", err)
			os.Exit(1)
		}

		extractor = gemini.NewGeminiExtractorWithClient(genaiClient, cfg.GeminiModel)
		analyzer = gemini.NewGeminiBookAnalyzer(genaiClient, cfg.GeminiModel, logger)
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		logger.Error("failed to listen on tcp port", "port", cfg.GRPCPort, "error", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()

	// Registrar OCR Service
	ocrHandler := grpchandler.NewOcrHandler(extractor, logger)
	ocrv1.RegisterOcrServiceServer(grpcServer, ocrHandler)

	// Registrar AI Service (AnalyzeBook, Grounding, Embeddings)
	aiHandler := grpchandler.NewAIHandler(analyzer, logger)
	aiv1.RegisterAIServiceServer(grpcServer, aiHandler)

	reflection.Register(grpcServer)

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Info("received shutdown signal, stopping gRPC server gracefully", "signal", sig.String())
		grpcServer.GracefulStop()
	}()

	logger.Info("gRPC server listening", "address", lis.Addr().String())
	if err := grpcServer.Serve(lis); err != nil {
		logger.Error("gRPC server encountered an error", "error", err)
		os.Exit(1)
	}

	logger.Info("aresta-ai service stopped")
}
