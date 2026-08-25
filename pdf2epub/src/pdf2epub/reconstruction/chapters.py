import re
from typing import List
from pdf2epub.domain.models import Document, Chapter, Region, Page
from pdf2epub.domain.types import RegionType

CHAPTER_PATTERN = re.compile(
    r'^(cap[íi]tulo\s+(?:[ivxlcdm0-9]+|\w+)|chapter\s+[0-9ivxlcdm]+|sinopse|sum[áa]rio|pref[áa]cio|introdu[çc][ãa]o|ep[íi]logo|conclus[ãa]o|posf[áa]cio)\b',
    re.IGNORECASE
)

CHAPTER_HEADING_CLEAN = re.compile(
    r'^(cap[íi]tulo\s+(?:[ivxlcdm0-9]+|\w+)(?:\s*[-–—:]\s*[^.\n!]+(?:[!?.])?)?|chapter\s+[0-9ivxlcdm]+(?:\s*[-–—:]\s*[^.\n!]+(?:[!?.])?)?|sinopse|sum[áa]rio|pref[áa]cio|introdu[çc][ãa]o|ep[íi]logo|conclus[ãa]o|posf[áa]cio)',
    re.IGNORECASE
)

class ChapterResolver:
    """
    Agrupa páginas e regiões em capítulos estruturados
    com base em títulos (TITLE), cabeçalhos principais (HEADING) e padrões textuais (CAPÍTULO...).
    Garante que parágrafos narrativos não sejam mesclados ou classificados como títulos.
    """
    def resolve_chapters(self, pages: List[Page], doc_title: str) -> List[Chapter]:
        chapters: List[Chapter] = []
        current_chapter: Chapter | None = None

        for page in pages:
            for region in page.regions:
                if region.type in (RegionType.HEADER, RegionType.FOOTER, RegionType.PAGE_NUMBER):
                    continue

                raw_text = region.text.strip()
                if not raw_text:
                    continue

                # Detecta início de um novo capítulo
                is_chapter_title = (
                    region.type == RegionType.TITLE or
                    (region.type == RegionType.HEADING and region.level == 1) or
                    bool(CHAPTER_PATTERN.match(raw_text))
                )

                if is_chapter_title and len(raw_text) > 2:
                    if current_chapter and current_chapter.regions:
                        current_chapter.page_end = page.number
                        chapters.append(current_chapter)

                    # Separa o título do capítulo do corpo do parágrafo caso estejam na mesma região
                    m = CHAPTER_HEADING_CLEAN.match(raw_text)
                    if m:
                        title_clean = m.group(1).strip()
                        remaining_text = raw_text[m.end():].strip()
                        # Remove eventuais pontuações iniciais do texto restante (ex: ": ", ". ")
                        remaining_text = re.sub(r'^[.:\s-]+', '', remaining_text).strip()
                    elif '\n' in raw_text:
                        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
                        title_clean = lines[0]
                        remaining_text = "\n".join(lines[1:]).strip()
                    elif len(raw_text) > 80:
                        first_sentence = re.split(r'(?<=[.!?])\s+', raw_text, maxsplit=1)
                        title_clean = first_sentence[0].strip()
                        remaining_text = first_sentence[1].strip() if len(first_sentence) > 1 else ""
                    else:
                        title_clean = raw_text
                        remaining_text = ""

                    # Remove pontuações de sumário (ex: ..... 5)
                    title_clean = re.sub(r'[\.\s_]{3,}\s*\d*$', '', title_clean).strip()

                    title_region = Region(
                        type=RegionType.TITLE,
                        bbox=region.bbox,
                        confidence=region.confidence,
                        spans=region.spans,
                        text=title_clean,
                        level=1
                    )

                    chapter_regions = [title_region]
                    if remaining_text:
                        chapter_regions.append(Region(
                            type=RegionType.PARAGRAPH,
                            bbox=region.bbox,
                            confidence=region.confidence,
                            text=remaining_text,
                            level=1
                        ))

                    current_chapter = Chapter(
                        title=title_clean,
                        level=1,
                        page_start=page.number,
                        page_end=page.number,
                        regions=chapter_regions
                    )
                else:
                    # Se for uma região normal que foi erroneamente marcada como TITLE mas é parágrafo longo
                    if region.type == RegionType.TITLE and len(raw_text) > 100:
                        region.type = RegionType.PARAGRAPH
                        region.level = 1

                    if current_chapter is None:
                        current_chapter = Chapter(
                            title=doc_title or "Início",
                            level=1,
                            page_start=page.number,
                            page_end=page.number,
                            regions=[]
                        )
                    current_chapter.regions.append(region)
                    current_chapter.page_end = page.number

        if current_chapter and current_chapter.regions:
            chapters.append(current_chapter)

        if not chapters:
            all_regions = []
            for p in pages:
                for r in p.regions:
                    if r.type not in (RegionType.HEADER, RegionType.FOOTER, RegionType.PAGE_NUMBER):
                        all_regions.append(r)
            chapters.append(Chapter(
                title=doc_title or "Conteúdo",
                level=1,
                page_start=1,
                page_end=len(pages),
                regions=all_regions
            ))

        return chapters
