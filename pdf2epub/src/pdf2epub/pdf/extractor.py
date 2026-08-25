from typing import List, Tuple
import fitz
from pdf2epub.domain.models import Word, TextSpan, BBox, ImageAsset

class DeterministicExtractor:
    def extract_words(self, page: fitz.Page) -> List[Word]:
        """
        Extrai palavras determinísticas com coordenadas do PyMuPDF:
        (x0, y0, x1, y1, word_text, block_no, line_no, word_no)
        """
        raw_words = page.get_text("words")
        words: List[Word] = []
        for w in raw_words:
            if len(w) >= 8:
                x0, y0, x1, y1, text, block_no, line_no, word_no = w[:8]
            elif len(w) >= 5:
                x0, y0, x1, y1, text = w[:5]
                block_no, line_no, word_no = 0, 0, 0
            else:
                continue

            cleaned = str(text).strip()
            if cleaned:
                words.append(Word(
                    x0=float(x0),
                    y0=float(y0),
                    x1=float(x1),
                    y1=float(y1),
                    text=cleaned,
                    block_no=int(block_no),
                    line_no=int(line_no),
                    word_no=int(word_no)
                ))
        return words

    def extract_spans(self, page: fitz.Page) -> List[TextSpan]:
        """
        Extrai spans tipográficos (fonte, tamanho, estilo, bbox)
        """
        data = page.get_text("dict", flags=fitz.TEXT_DEHYPHENATE)
        spans: List[TextSpan] = []
        for block in data.get("blocks", []):
            if block.get("type") == 0:  # Text block
                for line in block.get("lines", []):
                    for s in line.get("spans", []):
                        text = s.get("text", "").strip()
                        if not text:
                            continue
                        bbox = BBox(*s.get("bbox", (0, 0, 0, 0)))
                        spans.append(TextSpan(
                            text=text,
                            bbox=bbox,
                            font_name=s.get("font", "default"),
                            font_size=float(s.get("size", 12.0)),
                            flags=int(s.get("flags", 0)),
                            color=int(s.get("color", 0))
                        ))
        return spans

    def extract_images(self, doc: fitz.Document, page: fitz.Page) -> List[ImageAsset]:
        """
        Extrai imagens nativas preservando resolução original e posição na página
        """
        images: List[ImageAsset] = []
        image_info_list = page.get_image_info(xrefs=True)

        for info in image_info_list:
            xref = info.get("xref", 0)
            if xref == 0:
                continue
            bbox_coords = info.get("bbox", (0, 0, 0, 0))
            bbox = BBox(*bbox_coords)

            # Skip microscopic decorative icons/lines (< 15px)
            if bbox.width < 15 and bbox.height < 15:
                continue

            try:
                base_img = doc.extract_image(xref)
                if not base_img:
                    continue
                img_bytes = base_img.get("image", b"")
                ext = base_img.get("ext", "png")
                w = base_img.get("width", int(bbox.width))
                h = base_img.get("height", int(bbox.height))
                mime_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"

                images.append(ImageAsset(
                    name=f"image_xref_{xref}.{ext}",
                    mime_type=mime_type,
                    data=img_bytes,
                    width=w,
                    height=h,
                    bbox=bbox
                ))
            except Exception:
                continue

        # Fallback para capa na página 1 se não houver imagens nativas extraídas
        if not images and page.number == 0 and len(page.get_text("text").strip()) < 80:
            try:
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("jpeg")
                images.append(ImageAsset(
                    id="cover-img",
                    name="cover.jpeg",
                    mime_type="image/jpeg",
                    data=img_bytes,
                    width=pix.width,
                    height=pix.height,
                    bbox=BBox(0.0, 0.0, float(page.rect.width), float(page.rect.height))
                ))
            except Exception:
                pass

        return images
