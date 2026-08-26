package gemini

import (
	"regexp"
	"strings"
)

var (
	codeBlockRegex = regexp.MustCompile(`(?s)^` + "```(?:[a-zA-Z0-9_-]+)?\\s*\n?(.*?)\n?```" + `$`)
)

// SanitizeExtractedText limpa o output retornado pela API do Gemini,
// garantindo que contenha apenas a escrita pura da imagem.
func SanitizeExtractedText(raw string) string {
	cleaned := strings.TrimSpace(raw)
	if cleaned == "" {
		return ""
	}

	// Remove blocos de código acidentais (ex: ```text ... ``` ou ``` ... ```)
	if matches := codeBlockRegex.FindStringSubmatch(cleaned); len(matches) > 1 {
		cleaned = strings.TrimSpace(matches[1])
	}

	// Remove eventuais prefixos redundantes caso o modelo tenha desobedecido o system prompt
	prefixesToRemove := []string{
		"Here is the text from the image:",
		"Here is the transcribed text:",
		"Transcribed text:",
		"Texto da imagem:",
		"Texto transcrito:",
		"Aqui está o texto transcrito:",
		"Aqui está o texto:",
	}

	for _, prefix := range prefixesToRemove {
		if strings.HasPrefix(strings.ToLower(cleaned), strings.ToLower(prefix)) {
			cleaned = strings.TrimSpace(cleaned[len(prefix):])
		}
	}

	return cleaned
}
