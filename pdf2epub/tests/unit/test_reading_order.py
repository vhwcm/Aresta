from pdf2epub.domain.models import Region, Page, BBox
from pdf2epub.domain.types import RegionType, ColumnLayout
from pdf2epub.reconstruction.reading_order import ReadingOrderResolver

def test_double_column_reading_order():
    page_w, page_h = 600, 800
    mid_x = 300

    # Top title (spanning)
    title = Region(id="t", type=RegionType.TITLE, bbox=BBox(50, 50, 550, 90), text="Title")
    # Left column: top & bottom
    left1 = Region(id="l1", type=RegionType.PARAGRAPH, bbox=BBox(50, 110, 280, 200), text="L1")
    left2 = Region(id="l2", type=RegionType.PARAGRAPH, bbox=BBox(50, 220, 280, 300), text="L2")
    # Right column: top & bottom
    right1 = Region(id="r1", type=RegionType.PARAGRAPH, bbox=BBox(320, 110, 550, 200), text="R1")
    right2 = Region(id="r2", type=RegionType.PARAGRAPH, bbox=BBox(320, 220, 550, 300), text="R2")

    page = Page(
        number=1,
        width=page_w,
        height=page_h,
        regions=[right2, left1, title, right1, left2] # shuffled
    )

    resolver = ReadingOrderResolver()
    ordered = resolver.resolve_page_reading_order(page)

    assert page.column_layout == ColumnLayout.DOUBLE
    order_ids = [r.id for r in ordered]
    assert order_ids == ["t", "l1", "l2", "r1", "r2"]
