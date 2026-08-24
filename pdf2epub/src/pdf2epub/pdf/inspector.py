from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from pathlib import Path
import fitz  # PyMuPDF

from pdf2epub.domain.types import DocumentClassification
from pdf2epub.domain.models import DocumentMetadata

@dataclass
class PDFProfile:
    page_count: int
    is_encrypted: bool
    classification: DocumentClassification
    has_text: bool
    has_images: bool
    total_characters: int
    total_images: int
    page_dimensions: List[Dict[str, float]]
    metadata: DocumentMetadata

class PDFInspector:
    def inspect(self, pdf_path: str | Path) -> PDFProfile:
        path = Path(pdf_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {path}")

        doc = fitz.open(str(path))
        try:
            page_count = len(doc)
            is_encrypted = doc.is_encrypted

            total_chars = 0
            total_images = 0
            page_dims = []

            meta = doc.metadata or {}
            doc_meta = DocumentMetadata(
                title=meta.get("title") or path.stem.replace("_", " ").title(),
                author=meta.get("author") or "Desconhecido",
                language=meta.get("language") or "pt-BR",
                description=meta.get("subject") or None,
                publisher=meta.get("producer") or None
            )

            for i in range(page_count):
                page = doc[i]
                rect = page.rect
                page_dims.append({
                    "page": i + 1,
                    "width": rect.width,
                    "height": rect.height,
                    "rotation": page.rotation
                })
                text = page.get_text("text")
                total_chars += len(text.strip())
                image_list = page.get_images()
                total_images += len(image_list)

            # Classify document
            has_text = total_chars > (page_count * 50)
            has_images = total_images > 0

            if has_text and total_chars > (page_count * 150):
                classification = DocumentClassification.DIGITAL
            elif not has_text and has_images:
                classification = DocumentClassification.SCANNED
            elif has_text and has_images:
                classification = DocumentClassification.MIXED
            else:
                classification = DocumentClassification.DIGITAL

            return PDFProfile(
                page_count=page_count,
                is_encrypted=is_encrypted,
                classification=classification,
                has_text=has_text,
                has_images=has_images,
                total_characters=total_chars,
                total_images=total_images,
                page_dimensions=page_dims,
                metadata=doc_meta
            )
        finally:
            doc.close()
