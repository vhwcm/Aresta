from pdf2epub.domain.models import Region, BBox, Word, TextSpan
from pdf2epub.domain.types import RegionType
from pdf2epub.reconstruction.association import SpatialAssociation

def test_spatial_association():
    reg1 = Region(
        id="reg-1",
        type=RegionType.TITLE,
        bbox=BBox(50, 50, 400, 100)
    )
    reg2 = Region(
        id="reg-2",
        type=RegionType.PARAGRAPH,
        bbox=BBox(50, 120, 400, 200)
    )

    words = [
        Word(x0=52, y0=60, x1=100, y1=75, text="Título"),
        Word(x0=105, y0=60, x1=150, y1=75, text="Principal"),
        Word(x0=52, y0=130, x1=100, y1=145, text="Primeiro"),
        Word(x0=105, y0=130, x1=160, y1=145, text="parágrafo"),
    ]

    assoc = SpatialAssociation()
    result = assoc.associate([reg1, reg2], words, [], [])

    assert len(result) == 2
    assert result[0].text == "Título Principal"
    assert result[1].text == "Primeiro parágrafo"
