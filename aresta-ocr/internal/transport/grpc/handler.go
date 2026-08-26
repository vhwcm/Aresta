package grpc

import (
	"context"
	"errors"
	"log/slog"

	ocrv1 "aresta-ocr/gen/ocr/v1"
	"aresta-ocr/internal/domain"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// OcrHandler implementa o servidor gRPC definido no contrato Protobuf.
type OcrHandler struct {
	ocrv1.UnimplementedOcrServiceServer
	extractor domain.TextExtractor
	logger    *slog.Logger
}

// NewOcrHandler cria um novo handler gRPC injetando o domain.TextExtractor (SOLID - DIP).
func NewOcrHandler(extractor domain.TextExtractor, logger *slog.Logger) *OcrHandler {
	if logger == nil {
		logger = slog.Default()
	}
	return &OcrHandler{
		extractor: extractor,
		logger:    logger,
	}
}

// ExtractText processa a requisição gRPC de extração de texto de imagem.
func (h *OcrHandler) ExtractText(ctx context.Context, req *ocrv1.ExtractTextRequest) (*ocrv1.ExtractTextResponse, error) {
	if req == nil || len(req.GetImageData()) == 0 {
		h.logger.WarnContext(ctx, "received empty image data in ExtractText request")
		return nil, status.Error(codes.InvalidArgument, "image_data cannot be empty")
	}

	mimeType := req.GetMimeType()
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	domainReq := domain.ExtractRequest{
		ImageData:  req.GetImageData(),
		MimeType:   mimeType,
		PromptHint: req.GetPromptHint(),
	}

	result, err := h.extractor.ExtractText(ctx, domainReq)
	if err != nil {
		h.logger.ErrorContext(ctx, "failed to extract text from image", "error", err)

		if errors.Is(err, domain.ErrEmptyImage) {
			return nil, status.Error(codes.InvalidArgument, "image_data cannot be empty")
		}
		if errors.Is(err, domain.ErrUnsupportedMime) {
			return nil, status.Error(codes.InvalidArgument, "unsupported image mime type")
		}

		return nil, status.Errorf(codes.Internal, "extraction failed: %v", err)
	}

	h.logger.InfoContext(ctx, "successfully extracted text", "model", result.ModelUsed, "text_len", len(result.Text))

	return &ocrv1.ExtractTextResponse{
		Text:      result.Text,
		ModelUsed: result.ModelUsed,
	}, nil
}
