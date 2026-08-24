import json
from dataclasses import asdict
from typing import Dict, Any
from pdf2epub.domain.models import Document, DocumentMetadata, Page, Chapter, Region, ImageAsset

class DocumentModelBuilder:
    """
    Constrói e serializa o modelo intermediário Document.
    """
    @staticmethod
    def to_dict(document: Document) -> Dict[str, Any]:
        return {
            "metadata": {
                "title": document.metadata.title,
                "author": document.metadata.author,
                "language": document.metadata.language,
                "identifier": document.metadata.identifier,
                "description": document.metadata.description,
                "publisher": document.metadata.publisher
            },
            "classification": document.classification.value,
            "pages": [
                {
                    "number": p.number,
                    "width": p.width,
                    "height": p.height,
                    "rotation": p.rotation,
                    "column_layout": p.column_layout.value,
                    "regions": [
                        {
                            "id": r.id,
                            "type": r.type.value,
                            "bbox": [r.bbox.x0, r.bbox.y0, r.bbox.x1, r.bbox.y1],
                            "confidence": r.confidence,
                            "reading_order": r.reading_order,
                            "text": r.text,
                            "level": r.level,
                            "has_image": r.image is not None
                        }
                        for r in p.regions
                    ]
                }
                for p in document.pages
            ],
            "chapters": [
                {
                    "id": c.id,
                    "title": c.title,
                    "level": c.level,
                    "page_start": c.page_start,
                    "page_end": c.page_end,
                    "region_count": len(c.regions)
                }
                for c in document.chapters
            ],
            "asset_count": len(document.assets)
        }

    @staticmethod
    def to_json(document: Document, indent: int = 2) -> str:
        return json.dumps(DocumentModelBuilder.to_dict(document), ensure_ascii=False, indent=indent)
