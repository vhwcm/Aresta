from typing import List
from pdf2epub.domain.models import Document, Chapter, Region, Page
from pdf2epub.domain.types import RegionType

class ChapterResolver:
    """
    Agrupa páginas e regiões em capítulos estruturados
    com base em títulos (TITLE), cabeçalhos principais (HEADING) e quebras.
    """
    def resolve_chapters(self, pages: List[Page], doc_title: str) -> List[Chapter]:
        chapters: List[Chapter] = []
        current_chapter: Chapter | None = None

        for page in pages:
            for region in page.regions:
                # Ignora cabeçalhos e rodapés de página repetidos na estrutura do livro
                if region.type in (RegionType.HEADER, RegionType.FOOTER, RegionType.PAGE_NUMBER):
                    continue

                # Detecta início de um novo capítulo
                is_chapter_title = (
                    region.type == RegionType.TITLE or
                    (region.type == RegionType.HEADING and region.level == 1) or
                    (region.type == RegionType.HEADING and any(
                        word in region.text.lower() for word in ["capítulo", "capitulo", "chapter", "seção", "secao"]
                    ))
                )

                if is_chapter_title and len(region.text.strip()) > 2:
                    if current_chapter and current_chapter.regions:
                        current_chapter.page_end = page.number
                        chapters.append(current_chapter)

                    title_text = region.text.strip()
                    current_chapter = Chapter(
                        title=title_text,
                        level=1,
                        page_start=page.number,
                        page_end=page.number,
                        regions=[region]
                    )
                else:
                    if current_chapter is None:
                        # Primeiro capítulo padrão (Introdução / Início)
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

        # Se nenhum capítulo foi detectado, cria um capítulo único com todo o conteúdo
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
