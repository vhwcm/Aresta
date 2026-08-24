from pathlib import Path
import tempfile
from pdf2epub.domain.models import Document, Chapter, Region, DocumentMetadata, BBox
from pdf2epub.domain.types import RegionType
from pdf2epub.epub.generator import EpubGenerator
from pdf2epub.validation.validator import EpubValidator

def test_generate_and_validate_epub():
    doc = Document(
        metadata=DocumentMetadata(title="Livro de Teste", author="Autor de Teste"),
        chapters=[
            Chapter(
                id="c1",
                title="Capítulo 1",
                regions=[
                    Region(type=RegionType.TITLE, text="Capítulo 1", bbox=BBox(0,0,0,0)),
                    Region(type=RegionType.PARAGRAPH, text="Era uma vez um leitor de EPUB.", bbox=BBox(0,0,0,0)),
                ]
            )
        ]
    )

    temp_epub = tempfile.NamedTemporaryFile(suffix=".epub", delete=False)
    temp_epub.close()

    try:
        generator = EpubGenerator()
        out_path = generator.generate(doc, temp_epub.name)

        assert Path(out_path).exists()
        assert Path(out_path).stat().st_size > 500

        validator = EpubValidator()
        report = validator.validate(out_path)

        assert report.is_valid is True
        assert len(report.errors) == 0
    finally:
        Path(temp_epub.name).unlink(missing_ok=True)
