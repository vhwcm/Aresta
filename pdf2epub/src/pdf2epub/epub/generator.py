from pathlib import Path
from typing import List, Dict, Optional
import ebooklib
from ebooklib import epub

from pdf2epub.domain.models import Document, Chapter, Region, ImageAsset
from pdf2epub.domain.types import RegionType
from pdf2epub.epub.template import DEFAULT_CSS, escape_text

class EpubGenerator:
    """
    Gera publicação EPUB 3 reflowable a partir do Document Model intermediário.
    Garante conformidade estrita com a especificação EPUB 3 e máxima compatibilidade
    com leitores móveis e desktop (Calibre, Apple Books, Thorium, Foliate, epub.js).
    """
    def generate(self, document: Document, output_path: str | Path) -> Path:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        book = epub.EpubBook()
        book.set_identifier(document.metadata.identifier)
        book.set_title(document.metadata.title)
        book.set_language(document.metadata.language or "pt-BR")
        book.add_author(document.metadata.author or "Desconhecido")

        if document.metadata.description:
            book.add_metadata('DC', 'description', document.metadata.description)
        if document.metadata.publisher:
            book.add_metadata('DC', 'publisher', document.metadata.publisher)

        # 1. Adiciona estilo CSS global na raiz do pacote
        style = epub.EpubItem(
            uid="style_nav",
            file_name="style.css",
            media_type="text/css",
            content=DEFAULT_CSS.encode("utf-8")
        )
        book.add_item(style)

        # 2. Adiciona imagens/assets
        image_items: Dict[str, epub.EpubItem] = {}
        for asset_id, asset in document.assets.items():
            if asset.data:
                img_item = epub.EpubItem(
                    uid=asset.id,
                    file_name=f"images/{asset.name}",
                    media_type=asset.mime_type,
                    content=asset.data
                )
                book.add_item(img_item)
                image_items[asset.id] = img_item

        # 3. Adiciona capítulos em arquivos XHTML
        epub_chapters: List[epub.EpubHtml] = []
        toc_entries = []

        for idx, chap in enumerate(document.chapters):
            chap_file = f"chap_{idx+1:03d}.xhtml"
            chap_item = epub.EpubHtml(
                title=chap.title,
                file_name=chap_file,
                lang=document.metadata.language or "pt-BR"
            )
            chap_item.add_item(style)

            body_html = self._render_chapter_html(chap)
            chap_item.set_content(body_html.encode("utf-8"))

            book.add_item(chap_item)
            epub_chapters.append(chap_item)
            toc_entries.append(chap_item)

        # 4. Define TOC, Navegação e Spine
        book.toc = tuple(toc_entries)
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())

        # Spine com navegação e capítulos
        book.spine = ['nav'] + epub_chapters

        # 5. Salva arquivo EPUB
        epub.write_epub(str(out), book, {})
        return out

    def _render_chapter_html(self, chapter: Chapter) -> str:
        html_parts = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<!DOCTYPE html>',
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">',
            '<head>',
            f'<title>{escape_text(chapter.title)}</title>',
            '<link rel="stylesheet" href="style.css" type="text/css" />',
            '</head>',
            '<body>',
            '<section epub:type="chapter">'
        ]

        is_first_p_after_heading = False

        for r in chapter.regions:
            clean_text = escape_text(r.text)
            if not clean_text and r.type != RegionType.IMAGE:
                continue

            if r.type == RegionType.TITLE:
                html_parts.append(f'<h1>{clean_text}</h1>')
                is_first_p_after_heading = True
            elif r.type == RegionType.HEADING:
                level = min(max(r.level, 2), 6)
                html_parts.append(f'<h{level}>{clean_text}</h{level}>')
                is_first_p_after_heading = True
            elif r.type == RegionType.PARAGRAPH:
                cls_attr = ' class="first-after-heading"' if is_first_p_after_heading else ''
                html_parts.append(f'<p{cls_attr}>{clean_text}</p>')
                is_first_p_after_heading = False
            elif r.type == RegionType.QUOTE:
                html_parts.append(f'<blockquote><p>{clean_text}</p></blockquote>')
                is_first_p_after_heading = False
            elif r.type == RegionType.FOOTNOTE:
                html_parts.append(f'<aside class="footnote" epub:type="footnote"><p>{clean_text}</p></aside>')
            elif r.type == RegionType.IMAGE and r.image:
                html_parts.append(
                    f'<figure><img src="images/{r.image.name}" alt="{escape_text(chapter.title)}" /></figure>'
                )
            elif r.type == RegionType.CAPTION:
                html_parts.append(f'<figcaption>{clean_text}</figcaption>')

        html_parts.append('</section>')
        html_parts.append('</body>')
        html_parts.append('</html>')

        return "\n".join(html_parts)
