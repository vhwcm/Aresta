from typing import Protocol, List
from PIL import Image
from pdf2epub.domain.models import Region

class LayoutDetector(Protocol):
    def detect(self, page_image: Image.Image, page_width: float, page_height: float) -> List[Region]:
        """
        Executa a detecção de layout sobre a imagem da página
        e retorna regiões com bboxes em coordenadas de página PDF.
        """
        ...
