import fitz
from pdf2epub.pdf.extractor import DeterministicExtractor

def test_extract_words(sample_pdf_single_column):
    doc = fitz.open(sample_pdf_single_column)
    extractor = DeterministicExtractor()
    words = extractor.extract_words(doc[0])
    doc.close()

    assert len(words) > 5
    texts = [w.text for w in words]
    assert "Capítulo" in texts
    assert "Introdução" in texts
    assert words[0].bbox.width > 0
    assert words[0].bbox.height > 0

def test_extract_spans(sample_pdf_single_column):
    doc = fitz.open(sample_pdf_single_column)
    extractor = DeterministicExtractor()
    spans = extractor.extract_spans(doc[0])
    doc.close()

    assert len(spans) >= 1
    assert any("Capítulo" in s.text for s in spans)
