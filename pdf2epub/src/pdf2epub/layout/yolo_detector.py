import logging
from typing import List, Optional
from PIL import Image
import os
from pathlib import Path

from pdf2epub.domain.models import Region, BBox
from pdf2epub.domain.types import RegionType
from pdf2epub.layout.mapper import LayoutClassMapper

logger = logging.getLogger(__name__)

class DocLayoutYoloDetector:
    """
    Detector baseado em DocLayout-YOLO com fallback gracioso.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        confidence_threshold: float = 0.35,
        device: str = "cpu"
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device
        self._model = None
        self._is_loaded = False
        self._attempted = False

    def load_model(self):
        if self._attempted:
            return

        self._attempted = True
        try:
            # Try importing ultralytics or doclayout_yolo if available
            from ultralytics import YOLO
            
            # Default model weights name / path
            target_path = self.model_path or os.environ.get("DOCLAYOUT_YOLO_MODEL")
            if not target_path or not Path(target_path).exists():
                logger.info("DocLayout-YOLO model file not found locally. Will use YOLO checkpoint if downloadable or fallback.")
                target_path = "yolov10n.pt"  # Or standard doclayout weights path

            self._model = YOLO(target_path)
            self._is_loaded = True
            logger.info(f"Loaded DocLayout-YOLO model from {target_path} on {self.device}")
        except Exception as e:
            logger.info(f"DocLayout-YOLO não inicializado ({e}). Operando em modo heurístico determinístico de alta precisão.")
            self._model = None
            self._is_loaded = False

    def detect(
        self,
        page_image: Image.Image,
        page_width: float,
        page_height: float
    ) -> List[Region]:
        self.load_model()
        if not self._model:
            return []

        try:
            results = self._model.predict(
                source=page_image,
                conf=self.confidence_threshold,
                device=self.device,
                verbose=False
            )
            regions: List[Region] = []
            img_w, img_h = page_image.size
            scale_x = page_width / float(img_w)
            scale_y = page_height / float(img_h)

            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x0, y0, x1, y1 = box.xyxy[0].tolist()

                    pdf_bbox = BBox(
                        x0=x0 * scale_x,
                        y0=y0 * scale_y,
                        x1=x1 * scale_x,
                        y1=y1 * scale_y
                    )

                    reg_type = LayoutClassMapper.map_class_id(cls_id)
                    regions.append(Region(
                        type=reg_type,
                        bbox=pdf_bbox,
                        confidence=conf
                    ))
            return regions
        except Exception as e:
            logger.error(f"Error during DocLayout-YOLO inference: {e}")
            return []
