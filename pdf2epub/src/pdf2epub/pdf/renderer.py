from PIL import Image
import io
import fitz

class PageRenderer:
    def __init__(self, dpi: int = 150):
        self.dpi = dpi

    def render_page(self, page: fitz.Page) -> Image.Image:
        # 72 is PDF point base standard
        zoom = self.dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        return Image.open(io.BytesIO(img_bytes))

    def render_pdf_page(self, pdf_path: str, page_index: int) -> Image.Image:
        doc = fitz.open(pdf_path)
        try:
            page = doc[page_index]
            return self.render_page(page)
        finally:
            doc.close()
