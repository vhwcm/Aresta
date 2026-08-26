package gemini_test

import (
	"testing"

	"aresta-ocr/internal/adapters/gemini"
)

func TestSanitizeExtractedText(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "clean string remains identical",
			input:    "Capítulo 1: Introdução ao Estudo",
			expected: "Capítulo 1: Introdução ao Estudo",
		},
		{
			name:     "trims whitespace and empty lines",
			input:    "   \n\n  Anotação manuscrita na margem   \n\n ",
			expected: "Anotação manuscrita na margem",
		},
		{
			name:     "removes markdown code block wrapper with text language",
			input:    "```text\nLinha 1 do texto\nLinha 2 do texto\n```",
			expected: "Linha 1 do texto\nLinha 2 do texto",
		},
		{
			name:     "removes raw markdown code block wrapper",
			input:    "```\nTexto sem tag de linguagem\n```",
			expected: "Texto sem tag de linguagem",
		},
		{
			name:     "removes common conversational preamble prefixes",
			input:    "Here is the text from the image:\nPalavra chave no caderno",
			expected: "Palavra chave no caderno",
		},
		{
			name:     "removes portuguese preamble prefix",
			input:    "Texto transcrito:\nResumo da aula 04",
			expected: "Resumo da aula 04",
		},
		{
			name:     "empty input returns empty string",
			input:    "   ",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := gemini.SanitizeExtractedText(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeExtractedText() = %q, want %q", result, tt.expected)
			}
		})
	}
}
