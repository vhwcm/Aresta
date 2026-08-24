from pdf2epub.pdf.inspector import PDFInspector
from pdf2epub.domain.types import DocumentClassification

def test_inspect_single_column_pdf(sample_pdf_single_column):
    inspector = PDFInspector()
    profile = inspector.inspect(sample_pdf_single_column)

    assert profile.page_count == 2
    assert profile.is_encrypted is False
    assert profile.classification == DocumentClassification.DIGITAL
    assert profile.has_text is True
    assert profile.total_characters > 50
    assert len(profile.page_dimensions) == 2
