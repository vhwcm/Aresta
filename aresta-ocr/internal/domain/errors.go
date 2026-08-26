package domain

import "errors"

var (
	// ErrEmptyImage é retornado quando os bytes da imagem fornecida estão vazios.
	ErrEmptyImage = errors.New("image data cannot be empty")

	// ErrUnsupportedMime é retornado quando o tipo MIME fornecido não é suportado pelo extrator.
	ErrUnsupportedMime = errors.New("unsupported image mime type")

	// ErrExtractionFailed é retornado quando ocorre um erro na extração de texto.
	ErrExtractionFailed = errors.New("text extraction failed")
)
