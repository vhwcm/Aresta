package grpc_test

import (
	"context"
	"errors"
	"net"
	"testing"

	ocrv1 "aresta-ocr/gen/ocr/v1"
	"aresta-ocr/internal/adapters/mock"
	"aresta-ocr/internal/domain"
	grpchandler "aresta-ocr/internal/transport/grpc"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

func setupTestGRPCServer(t *testing.T, extractor domain.TextExtractor) (ocrv1.OcrServiceClient, func()) {
	lis := bufconn.Listen(bufSize)
	s := grpc.NewServer()
	handler := grpchandler.NewOcrHandler(extractor, nil)
	ocrv1.RegisterOcrServiceServer(s, handler)

	go func() {
		if err := s.Serve(lis); err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			t.Logf("Server exited with error: %v", err)
		}
	}()

	conn, err := grpc.NewClient(
		"passthrough://bufnet",
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
			return lis.Dial()
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		t.Fatalf("Failed to dial bufnet: %v", err)
	}

	client := ocrv1.NewOcrServiceClient(conn)

	cleanup := func() {
		conn.Close()
		s.GracefulStop()
		lis.Close()
	}

	return client, cleanup
}

func TestExtractText_Success(t *testing.T) {
	mockExtractor := &mock.MockExtractor{
		ExtractTextFunc: func(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error) {
			return &domain.ExtractResult{
				Text:      "Texto manuscrito extraído com perfeição",
				ModelUsed: "gemini-flash-latest",
			}, nil
		},
	}

	client, cleanup := setupTestGRPCServer(t, mockExtractor)
	defer cleanup()

	resp, err := client.ExtractText(context.Background(), &ocrv1.ExtractTextRequest{
		ImageData:  []byte("fake-image-binary-data"),
		MimeType:   "image/png",
		PromptHint: "anotação em português",
	})

	if err != nil {
		t.Fatalf("ExtractText failed unexpectedly: %v", err)
	}

	if resp.GetText() != "Texto manuscrito extraído com perfeição" {
		t.Errorf("expected text %q, got %q", "Texto manuscrito extraído com perfeição", resp.GetText())
	}
	if resp.GetModelUsed() != "gemini-flash-latest" {
		t.Errorf("expected model %q, got %q", "gemini-flash-latest", resp.GetModelUsed())
	}
}

func TestExtractText_EmptyImage_ReturnsInvalidArgument(t *testing.T) {
	mockExtractor := mock.NewMockExtractor()
	client, cleanup := setupTestGRPCServer(t, mockExtractor)
	defer cleanup()

	_, err := client.ExtractText(context.Background(), &ocrv1.ExtractTextRequest{
		ImageData: nil,
		MimeType:  "image/jpeg",
	})

	if err == nil {
		t.Fatalf("expected error for empty image data, got nil")
	}

	st, ok := status.FromError(err)
	if !ok {
		t.Fatalf("expected gRPC status error, got %v", err)
	}
	if st.Code() != codes.InvalidArgument {
		t.Errorf("expected status code %v, got %v", codes.InvalidArgument, st.Code())
	}
}

func TestExtractText_DomainError_ReturnsInternal(t *testing.T) {
	mockExtractor := &mock.MockExtractor{
		ExtractTextFunc: func(ctx context.Context, req domain.ExtractRequest) (*domain.ExtractResult, error) {
			return nil, errors.New("upstream API timeout")
		},
	}

	client, cleanup := setupTestGRPCServer(t, mockExtractor)
	defer cleanup()

	_, err := client.ExtractText(context.Background(), &ocrv1.ExtractTextRequest{
		ImageData: []byte("sample-data"),
		MimeType:  "image/jpeg",
	})

	if err == nil {
		t.Fatalf("expected error from upstream failure, got nil")
	}

	st, ok := status.FromError(err)
	if !ok {
		t.Fatalf("expected gRPC status error, got %v", err)
	}
	if st.Code() != codes.Internal {
		t.Errorf("expected status code %v, got %v", codes.Internal, st.Code())
	}
}
