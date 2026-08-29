from pdf2epub.domain.models import TextSpan, Word, Region, BBox, Chapter, Document, DocumentMetadata
from pdf2epub.domain.types import RegionType
from pdf2epub.layout.heuristic_detector import HeuristicLayoutDetector
from pdf2epub.reconstruction.association import SpatialAssociation
from pdf2epub.epub.generator import EpubGenerator, format_toc_item_html, split_multiple_toc_entries

def test_heuristic_detector_separates_two_columns():
    detector = HeuristicLayoutDetector()
    page_w, page_h = 600, 800

    # Spans da esquerda (Col 1: Racionalização, Produtos Notáveis)
    l1 = TextSpan(text="RACIONALIZAÇÃO ................. 65", bbox=BBox(50, 100, 250, 115), font_size=11.0)
    l2 = TextSpan(text="6 PRODUTOS NOTÁVEIS .......... 66", bbox=BBox(50, 130, 250, 145), font_size=11.0)
    l3 = TextSpan(text="8 COMPLETAR QUADRADOS ......... 69", bbox=BBox(50, 160, 250, 175), font_size=11.0)
    l4 = TextSpan(text="EXERCÍCIOS .................... 70", bbox=BBox(50, 190, 250, 205), font_size=11.0)

    # Spans da direita (Col 2: Trigonometria, Triângulo Retângulo) com Y sobrepostos
    r1 = TextSpan(text="9 TRIGONOMETRIA ............... 76", bbox=BBox(320, 100, 550, 115), font_size=11.0)
    r2 = TextSpan(text="9.1 O TRIÂNGULO RETÂNGULO ..... 76", bbox=BBox(320, 130, 550, 145), font_size=11.0)
    r3 = TextSpan(text="9.2 SENO, COSSENO E TANGENTE .. 76", bbox=BBox(320, 160, 550, 175), font_size=11.0)
    r4 = TextSpan(text="9.3 CÍRCULO TRIGONOMÉTRICO .... 78", bbox=BBox(320, 190, 550, 205), font_size=11.0)

    # Spans desordenados/intercalados
    spans = [l1, r1, l2, r2, l3, r3, l4, r4]
    regions = detector.detect_from_page_data(page_w, page_h, spans, [])

    # Deve gerar regiões separadas para cada coluna, sem misturar os spans da esquerda e direita no mesmo bloco
    assert len(regions) >= 2
    
    # Todas as regiões da coluna esquerda devem ter x1 < 300
    # E todas da direita x0 > 300
    for reg in regions:
        if "RACIONALIZAÇÃO" in reg.text:
            assert reg.bbox.x1 <= 300
            assert "TRIGONOMETRIA" not in reg.text
        if "TRIGONOMETRIA" in reg.text:
            assert reg.bbox.x0 >= 300
            assert "RACIONALIZAÇÃO" not in reg.text

def test_toc_formatting_and_splitting():
    raw_str = "EXERCÍCIOS......................................................................... 70   9 TRIGONOMETRIA........................................76"
    split_items = split_multiple_toc_entries(raw_str)
    assert len(split_items) == 2
    assert "EXERCÍCIOS" in split_items[0]
    assert "70" in split_items[0]
    assert "9 TRIGONOMETRIA" in split_items[1]
    assert "76" in split_items[1]

    formatted_1 = format_toc_item_html(split_items[0])
    assert formatted_1 is not None
    assert '<span class="toc-title">EXERCÍCIOS</span>' in formatted_1
    assert '<span class="toc-leader"></span>' in formatted_1
    assert '<span class="toc-page">70</span>' in formatted_1

def test_association_preserves_toc_lines():
    assoc = SpatialAssociation()
    reg = Region(id="reg-toc", type=RegionType.LIST_ITEM, bbox=BBox(50, 100, 250, 160))
    words = [
        Word(x0=50, y0=100, x1=150, y1=115, text="RACIONALIZAÇÃO................"),
        Word(x0=230, y0=100, x1=250, y1=115, text="65"),
        Word(x0=50, y0=130, x1=150, y1=145, text="PRODUTOS......................"),
        Word(x0=230, y0=130, x1=250, y1=145, text="66"),
    ]

    result = assoc.associate([reg], words, [], [])
    assert len(result) == 1
    # As linhas devem ser preservadas com \n em vez de tudo concatenado com espaço
    assert "\n" in result[0].text
    lines = result[0].text.split("\n")
    assert len(lines) == 2
    assert "65" in lines[0]
    assert "66" in lines[1]
