import re
from typing import List
from PIL import Image
from pdf2epub.domain.models import Region, BBox, Word, TextSpan
from pdf2epub.domain.types import RegionType

CHAPTER_START_RE = re.compile(
    r'^(cap[íi]tulo\s+([ivxlcdm0-9]+|\w+)|chapter\s+[0-9ivxlcdm]+|sinopse|sum[áa]rio|pref[áa]cio|introdu[çc][ãa]o|ep[íi]logo|conclus[ãa]o|posf[áa]cio)\b',
    re.IGNORECASE
)

class HeuristicLayoutDetector:
    """
    Detector determinístico de layout baseado na distribuição geométrica
    e tipográfica de palavras e spans extraídos pelo PyMuPDF.
    Ideal para fallback resiliente e execução ultrarrápida.
    """
    def detect_from_page_data(
        self,
        page_width: float,
        page_height: float,
        spans: List[TextSpan],
        words: List[Word]
    ) -> List[Region]:
        if not spans and not words:
            return []

        # 1. Identifica headers (topo da página) e footers (base da página)
        regions: List[Region] = []
        body_spans: List[TextSpan] = []

        header_threshold = page_height * 0.10
        footer_threshold = page_height * 0.90

        for s in spans:
            clean_s = s.text.strip()
            is_page_num = clean_s.isdigit() or re.match(r'^[ivxlcdm]+$', clean_s, re.IGNORECASE)

            if s.bbox.y1 <= header_threshold:
                regions.append(Region(
                    type=RegionType.PAGE_NUMBER if is_page_num else RegionType.HEADER,
                    bbox=s.bbox,
                    confidence=0.9,
                    spans=[s],
                    text=s.text
                ))
            elif s.bbox.y0 >= footer_threshold:
                regions.append(Region(
                    type=RegionType.PAGE_NUMBER if is_page_num else RegionType.FOOTER,
                    bbox=s.bbox,
                    confidence=0.9,
                    spans=[s],
                    text=s.text
                ))
            elif is_page_num and (s.bbox.y1 <= page_height * 0.15 or s.bbox.y0 >= page_height * 0.85):
                regions.append(Region(
                    type=RegionType.PAGE_NUMBER,
                    bbox=s.bbox,
                    confidence=0.9,
                    spans=[s],
                    text=s.text
                ))
            else:
                body_spans.append(s)

        if not body_spans:
            return regions

        # 2. Agrupamento em blocos com base em distância vertical e font_size
        font_sizes = [s.font_size for s in body_spans]
        avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 12.0

        # Ordena spans verticalmente e horizontalmente
        sorted_spans = sorted(body_spans, key=lambda s: (s.bbox.y0, s.bbox.x0))

        current_block: List[TextSpan] = []
        last_span: TextSpan | None = None

        def create_region_from_spans(span_list: List[TextSpan]) -> Region:
            x0 = min(s.bbox.x0 for s in span_list)
            y0 = min(s.bbox.y0 for s in span_list)
            x1 = max(s.bbox.x1 for s in span_list)
            y1 = max(s.bbox.y1 for s in span_list)
            full_text = " ".join(s.text for s in span_list)

            # Classifica tipo pela tipografia e por padrões de texto
            max_size = max(s.font_size for s in span_list)
            is_bold = any(s.is_bold for s in span_list)
            is_chapter_title = bool(CHAPTER_START_RE.match(full_text.strip()))

            if is_chapter_title:
                reg_type = RegionType.TITLE
                level = 1
            elif max_size >= avg_font_size * 1.4:
                reg_type = RegionType.TITLE if max_size >= avg_font_size * 1.8 else RegionType.HEADING
                level = 1 if max_size >= avg_font_size * 1.8 else (2 if max_size >= avg_font_size * 1.5 else 3)
            elif is_bold and len(full_text) < 120 and max_size >= avg_font_size * 1.05:
                reg_type = RegionType.HEADING
                level = 3
            else:
                reg_type = RegionType.PARAGRAPH
                level = 1

            return Region(
                type=reg_type,
                bbox=BBox(x0, y0, x1, y1),
                confidence=0.85,
                spans=span_list,
                text=full_text,
                level=level
            )

        for s in sorted_spans:
            if not current_block:
                current_block.append(s)
                last_span = s
                continue

            # Se o novo span for o início de um capítulo, fecha o bloco anterior imediatamente
            if CHAPTER_START_RE.match(s.text.strip()):
                regions.append(create_region_from_spans(current_block))
                current_block = [s]
                last_span = s
                continue

            v_gap = s.bbox.y0 - last_span.bbox.y1
            line_height = max(s.font_size, last_span.font_size)

            font_diff = abs(s.font_size - last_span.font_size) > 2.0
            if v_gap > (line_height * 1.8) or (font_diff and (s.font_size > avg_font_size * 1.2 or last_span.font_size > avg_font_size * 1.2)):
                regions.append(create_region_from_spans(current_block))
                current_block = [s]
            else:
                current_block.append(s)
            last_span = s

        if current_block:
            regions.append(create_region_from_spans(current_block))

        return regions

    def detect(self, page_image: Image.Image, page_width: float, page_height: float) -> List[Region]:
        return []
