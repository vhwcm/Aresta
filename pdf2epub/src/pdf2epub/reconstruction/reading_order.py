from typing import List, Tuple
from pdf2epub.domain.models import Region, Page, BBox
from pdf2epub.domain.types import RegionType, ColumnLayout

class ReadingOrderResolver:
    """
    Determina a ordem natural de leitura respeitando layouts de múltiplas colunas,
    notas de rodapé, cabeçalhos e elementos flutuantes.
    """
    def detect_column_layout(self, regions: List[Region], page_width: float) -> ColumnLayout:
        body_regions = [
            r for r in regions
            if r.type not in (RegionType.HEADER, RegionType.FOOTER, RegionType.PAGE_NUMBER)
        ]
        if len(body_regions) < 3:
            return ColumnLayout.SINGLE

        mid_x = page_width / 2.0
        left_count = 0
        right_count = 0
        spanning_count = 0

        for r in body_regions:
            # Se a região cruza significativamente o centro, é spanning (largura total)
            if r.bbox.x0 < (mid_x - 30) and r.bbox.x1 > (mid_x + 30):
                spanning_count += 1
            elif r.bbox.x1 <= mid_x + 20:
                left_count += 1
            elif r.bbox.x0 >= mid_x - 20:
                right_count += 1

        if left_count >= 2 and right_count >= 2 and spanning_count <= 2:
            return ColumnLayout.DOUBLE

        return ColumnLayout.SINGLE

    def resolve_page_reading_order(self, page: Page) -> List[Region]:
        if not page.regions:
            return []

        # 1. Separa header, footer, page_number do corpo
        headers: List[Region] = []
        footers: List[Region] = []
        body: List[Region] = []

        for r in page.regions:
            if r.type == RegionType.HEADER:
                headers.append(r)
            elif r.type in (RegionType.FOOTER, RegionType.PAGE_NUMBER):
                footers.append(r)
            else:
                body.append(r)

        layout = self.detect_column_layout(body, page.width)
        page.column_layout = layout

        ordered_body: List[Region] = []

        if layout == ColumnLayout.DOUBLE:
            mid_x = page.width / 2.0
            left_col: List[Region] = []
            right_col: List[Region] = []
            spanning_top: List[Region] = []
            spanning_bottom: List[Region] = []

            for r in body:
                if r.bbox.x0 < (mid_x - 30) and r.bbox.x1 > (mid_x + 30):
                    # Spanning element (e.g. Title across 2 columns)
                    if r.bbox.y0 < page.height * 0.4:
                        spanning_top.append(r)
                    else:
                        spanning_bottom.append(r)
                elif r.bbox.center[0] < mid_x:
                    left_col.append(r)
                else:
                    right_col.append(r)

            spanning_top.sort(key=lambda r: r.bbox.y0)
            left_col.sort(key=lambda r: (r.bbox.y0, r.bbox.x0))
            right_col.sort(key=lambda r: (r.bbox.y0, r.bbox.x0))
            spanning_bottom.sort(key=lambda r: r.bbox.y0)

            # Sequence: Top Spanning -> Left Column -> Right Column -> Bottom Spanning
            ordered_body = spanning_top + left_col + right_col + spanning_bottom
        else:
            # Single column standard top-to-bottom
            ordered_body = sorted(body, key=lambda r: (r.bbox.y0, r.bbox.x0))

        # Assign reading order index
        full_list = headers + ordered_body + footers
        for idx, r in enumerate(full_list):
            r.reading_order = idx + 1

        page.regions = full_list
        return full_list
