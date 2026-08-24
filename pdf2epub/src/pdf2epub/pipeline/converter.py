import time
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import fitz

from pdf2epub.domain.models import Document, Page, DocumentMetadata, ImageAsset
from pdf2epub.pdf.inspector import PDFInspector, PDFProfile
from pdf2epub.pdf.renderer import PageRenderer
from pdf2epub.pdf.extractor import DeterministicExtractor
from pdf2epub.layout.yolo_detector import DocLayoutYoloDetector
from pdf2epub.layout.heuristic_detector import HeuristicLayoutDetector
from pdf2epub.reconstruction.association import SpatialAssociation
from pdf2epub.reconstruction.reading_order import ReadingOrderResolver
from pdf2epub.reconstruction.chapters import ChapterResolver
from pdf2epub.document.builder import DocumentModelBuilder
from pdf2epub.epub.generator import EpubGenerator
from pdf2epub.validation.validator import EpubValidator, ValidationReport

logger = logging.getLogger(__name__)

class PDFToEpubConverter:
    def __init__(
        self,
        dpi: int = 150,
        confidence_threshold: float = 0.35,
        device: str = "cpu",
        use_cache: bool = True
    ):
        self.dpi = dpi
        self.confidence_threshold = confidence_threshold
        self.device = device
        self.use_cache = use_cache

        self.inspector = PDFInspector()
        self.renderer = PageRenderer(dpi=dpi)
        self.extractor = DeterministicExtractor()
        self.yolo_detector = DocLayoutYoloDetector(
            confidence_threshold=confidence_threshold,
            device=device
        )
        self.heuristic_detector = HeuristicLayoutDetector()
        self.association = SpatialAssociation()
        self.reading_order_resolver = ReadingOrderResolver()
        self.chapter_resolver = ChapterResolver()
        self.epub_generator = EpubGenerator()
        self.validator = EpubValidator()

    def convert(
        self,
        pdf_path: str | Path,
        output_path: Optional[str | Path] = None,
        title: Optional[str] = None,
        author: Optional[str] = None,
        validate: bool = True
    ) -> Dict[str, Any]:
        start_time = time.time()
        input_pdf = Path(pdf_path)

        if output_path is None:
            out_epub = input_pdf.with_suffix(".epub")
        else:
            out_epub = Path(output_path)

        logger.info(f"Starting conversion: {input_pdf} -> {out_epub}")

        # 1. Inspeção
        profile = self.inspector.inspect(input_pdf)
        if title:
            profile.metadata.title = title
        if author:
            profile.metadata.author = author

        doc = fitz.open(str(input_pdf))
        pages_processed: List[Page] = []
        all_assets: Dict[str, ImageAsset] = {}

        try:
            for i in range(len(doc)):
                fitz_page = doc[i]
                rect = fitz_page.rect
                page_w = rect.width
                page_h = rect.height

                # 2. Extração determinística de palavras, spans e imagens nativas
                words = self.extractor.extract_words(fitz_page)
                spans = self.extractor.extract_spans(fitz_page)
                images = self.extractor.extract_images(doc, fitz_page)

                for img in images:
                    all_assets[img.id] = img

                # 3. Detecção de Layout (YOLO com fallback para Heurística)
                rendered_img = self.renderer.render_page(fitz_page)
                detected_regions = self.yolo_detector.detect(rendered_img, page_w, page_h)

                if not detected_regions:
                    # Heuristic detector
                    detected_regions = self.heuristic_detector.detect_from_page_data(
                        page_w, page_h, spans, words
                    )

                # 4. Associação espacial
                associated_regions = self.association.associate(
                    detected_regions, words, spans, images
                )

                # Cria modelo da página
                page_model = Page(
                    number=i + 1,
                    width=page_w,
                    height=page_h,
                    regions=associated_regions,
                    source_page_index=i,
                    rotation=fitz_page.rotation,
                    raw_words=words,
                    raw_images=images
                )

                # 5. Resolução da ordem de leitura
                self.reading_order_resolver.resolve_page_reading_order(page_model)
                pages_processed.append(page_model)

        finally:
            doc.close()

        # 6. Detecção de capítulos e montagem do Document Model
        chapters = self.chapter_resolver.resolve_chapters(pages_processed, profile.metadata.title)

        document_model = Document(
            metadata=profile.metadata,
            pages=pages_processed,
            chapters=chapters,
            assets=all_assets,
            classification=profile.classification
        )

        # 7. Geração do EPUB
        generated_epub_path = self.epub_generator.generate(document_model, out_epub)

        # 8. Validação
        validation_report = None
        if validate:
            validation_report = self.validator.validate(generated_epub_path)

        elapsed = time.time() - start_time

        return {
            "status": "success",
            "epub_path": str(generated_epub_path),
            "pages_count": len(pages_processed),
            "chapters_count": len(chapters),
            "assets_count": len(all_assets),
            "processing_time_seconds": round(elapsed, 2),
            "classification": profile.classification.value,
            "document_json": DocumentModelBuilder.to_dict(document_model),
            "validation": {
                "is_valid": validation_report.is_valid if validation_report else True,
                "errors": validation_report.errors if validation_report else [],
                "warnings": validation_report.warnings if validation_report else [],
                "epubcheck_executed": validation_report.epubcheck_executed if validation_report else False
            } if validation_report else None
        }
