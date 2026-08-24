from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Tuple
import uuid

from pdf2epub.domain.types import RegionType, DocumentClassification, ColumnLayout

@dataclass
class BBox:
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    @property
    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def center(self) -> Tuple[float, float]:
        return ((self.x0 + self.x1) / 2.0, (self.y0 + self.y1) / 2.0)

    def contains_point(self, x: float, y: float) -> bool:
        return self.x0 <= x <= self.x1 and self.y0 <= y <= self.y1

    def intersection(self, other: BBox) -> Optional[BBox]:
        ix0 = max(self.x0, other.x0)
        iy0 = max(self.y0, other.y0)
        ix1 = min(self.x1, other.x1)
        iy1 = min(self.y1, other.y1)
        if ix1 > ix0 and iy1 > iy0:
            return BBox(ix0, iy0, ix1, iy1)
        return None

    def intersection_area(self, other: BBox) -> float:
        inter = self.intersection(other)
        return inter.area if inter else 0.0

    def iou(self, other: BBox) -> float:
        inter = self.intersection_area(other)
        union = self.area + other.area - inter
        return inter / union if union > 0 else 0.0

    def to_tuple(self) -> Tuple[float, float, float, float]:
        return (self.x0, self.y0, self.x1, self.y1)

    def scale(self, sx: float, sy: float) -> BBox:
        return BBox(self.x0 * sx, self.y0 * sy, self.x1 * sx, self.y1 * sy)

@dataclass
class TextSpan:
    text: str
    bbox: BBox
    font_name: str = "default"
    font_size: float = 12.0
    flags: int = 0
    color: int = 0

    @property
    def is_bold(self) -> bool:
        return bool(self.flags & 2 or "bold" in self.font_name.lower())

    @property
    def is_italic(self) -> bool:
        return bool(self.flags & 1 or "italic" in self.font_name.lower() or "oblique" in self.font_name.lower())

@dataclass
class Word:
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    block_no: int = 0
    line_no: int = 0
    word_no: int = 0

    @property
    def bbox(self) -> BBox:
        return BBox(self.x0, self.y0, self.x1, self.y1)

    @property
    def center(self) -> Tuple[float, float]:
        return ((self.x0 + self.x1) / 2.0, (self.y0 + self.y1) / 2.0)

@dataclass
class ImageAsset:
    id: str = field(default_factory=lambda: f"img-{uuid.uuid4().hex[:8]}")
    name: str = "image.png"
    mime_type: str = "image/png"
    data: bytes = b""
    width: int = 0
    height: int = 0
    bbox: Optional[BBox] = None

@dataclass
class Region:
    id: str = field(default_factory=lambda: f"reg-{uuid.uuid4().hex[:8]}")
    type: RegionType = RegionType.PARAGRAPH
    bbox: BBox = field(default_factory=lambda: BBox(0, 0, 0, 0))
    confidence: float = 1.0
    reading_order: int = 0
    text: str = ""
    words: List[Word] = field(default_factory=list)
    spans: List[TextSpan] = field(default_factory=list)
    image: Optional[ImageAsset] = None
    level: int = 1  # For headings (h1, h2, h3)
    extra_metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Page:
    number: int
    width: float
    height: float
    regions: List[Region] = field(default_factory=list)
    source_page_index: int = 0
    rotation: int = 0
    raw_words: List[Word] = field(default_factory=list)
    raw_images: List[ImageAsset] = field(default_factory=list)
    column_layout: ColumnLayout = ColumnLayout.SINGLE

@dataclass
class Chapter:
    id: str = field(default_factory=lambda: f"chap-{uuid.uuid4().hex[:8]}")
    title: str = "Chapter"
    level: int = 1
    page_start: int = 1
    page_end: int = 1
    regions: List[Region] = field(default_factory=list)

@dataclass
class DocumentMetadata:
    title: str = "Untitled"
    author: str = "Unknown"
    language: str = "pt-BR"
    identifier: str = field(default_factory=lambda: f"urn:uuid:{uuid.uuid4()}")
    description: Optional[str] = None
    publisher: Optional[str] = None
    cover_image_id: Optional[str] = None

@dataclass
class Document:
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    pages: List[Page] = field(default_factory=list)
    chapters: List[Chapter] = field(default_factory=list)
    assets: Dict[str, ImageAsset] = field(default_factory=dict)
    classification: DocumentClassification = DocumentClassification.DIGITAL
