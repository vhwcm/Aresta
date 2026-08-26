package config

import (
	"os"
	"strings"
)

// Config armazena as configurações de execução do microsserviço aresta-ocr.
type Config struct {
	GRPCPort     string
	GeminiAPIKey string
	GeminiModel  string
	UseMock      bool
}

// LoadConfig carrega as configurações a partir das variáveis de ambiente com fallbacks seguros.
func LoadConfig() *Config {
	port := os.Getenv("GRPC_PORT")
	if strings.TrimSpace(port) == "" {
		port = os.Getenv("PORT")
	}
	if strings.TrimSpace(port) == "" {
		port = "50051"
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if strings.TrimSpace(apiKey) == "" {
		apiKey = os.Getenv("GOOGLE_API_KEY")
	}

	model := os.Getenv("GEMINI_MODEL")
	if strings.TrimSpace(model) == "" {
		model = "gemini-flash-latest"
	}

	useMock := strings.ToLower(os.Getenv("USE_MOCK")) == "true" || strings.ToLower(os.Getenv("USE_MOCK")) == "1"

	return &Config{
		GRPCPort:     port,
		GeminiAPIKey: apiKey,
		GeminiModel:  model,
		UseMock:      useMock,
	}
}
