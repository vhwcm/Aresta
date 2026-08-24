from pdf2epub.domain.types import RegionType

DOCLAYOUT_YOLO_CLASS_MAP = {
    "title": RegionType.TITLE,
    "heading": RegionType.HEADING,
    "plain text": RegionType.PARAGRAPH,
    "text": RegionType.PARAGRAPH,
    "paragraph": RegionType.PARAGRAPH,
    "figure": RegionType.IMAGE,
    "image": RegionType.IMAGE,
    "figure_caption": RegionType.CAPTION,
    "caption": RegionType.CAPTION,
    "table": RegionType.TABLE,
    "table_caption": RegionType.CAPTION,
    "table_footnote": RegionType.FOOTNOTE,
    "isolate_formula": RegionType.FORMULA,
    "formula": RegionType.FORMULA,
    "formula_caption": RegionType.CAPTION,
    "header": RegionType.HEADER,
    "footer": RegionType.FOOTER,
    "page_number": RegionType.PAGE_NUMBER,
    "footnote": RegionType.FOOTNOTE,
    "reference": RegionType.FOOTNOTE,
    "list": RegionType.LIST,
    "list_item": RegionType.LIST_ITEM,
    "quote": RegionType.QUOTE,
    "abandon": RegionType.UNKNOWN,
}

class LayoutClassMapper:
    @staticmethod
    def map_class_name(class_name: str) -> RegionType:
        norm = class_name.lower().strip()
        return DOCLAYOUT_YOLO_CLASS_MAP.get(norm, RegionType.UNKNOWN)

    @staticmethod
    def map_class_id(class_id: int) -> RegionType:
        # Standard DocLayout-YOLO 11-class mapping
        id_map = {
            0: RegionType.TITLE,
            1: RegionType.PARAGRAPH,
            2: RegionType.UNKNOWN,    # abandon
            3: RegionType.IMAGE,      # figure
            4: RegionType.CAPTION,    # figure_caption
            5: RegionType.TABLE,      # table
            6: RegionType.CAPTION,    # table_caption
            7: RegionType.FOOTNOTE,   # table_footnote
            8: RegionType.FORMULA,    # isolate_formula
            9: RegionType.CAPTION,    # formula_caption
            10: RegionType.HEADER,
            11: RegionType.FOOTER,
        }
        return id_map.get(class_id, RegionType.UNKNOWN)
