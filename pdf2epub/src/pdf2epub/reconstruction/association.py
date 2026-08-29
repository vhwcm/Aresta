import re
from typing import List
from pdf2epub.domain.models import Region, Word, TextSpan, ImageAsset, BBox
from pdf2epub.domain.types import RegionType

TOC_LINE_RE = re.compile(
    r'(\.{2,}|[\.\s_–-]{3,}|\s{2,})\d+$|\b(?:p[áa]g\.?|p\.)\s*\d+$',
    re.IGNORECASE
)

class SpatialAssociation:
    """
    Associa deterministicamente palavras e spans extraídos pelo PyMuPDF
    com as caixas delimitadoras das regiões de layout detectadas.
    """
    def associate(
        self,
        regions: List[Region],
        words: List[Word],
        spans: List[TextSpan],
        images: List[ImageAsset]
    ) -> List[Region]:
        if not regions and not images:
            return []

        result_regions: List[Region] = list(regions)

        # 1. Associa imagens às regiões de tipo IMAGE ou cria regiões para imagens
        assigned_image_ids = set()
        for reg in result_regions:
            if reg.type == RegionType.IMAGE:
                best_img = None
                best_iou = 0.0
                for img in images:
                    if img.bbox:
                        iou = reg.bbox.iou(img.bbox)
                        if iou > best_iou:
                            best_iou = iou
                            best_img = img
                if best_img:
                    reg.image = best_img
                    assigned_image_ids.add(best_img.id)

        # Adiciona imagens que não foram mapeadas
        for img in images:
            if img.id not in assigned_image_ids:
                result_regions.append(Region(
                    type=RegionType.IMAGE,
                    bbox=img.bbox or BBox(0, 0, 0, 0),
                    confidence=1.0,
                    image=img
                ))

        # 2. Associa palavras a cada região
        unassigned_words: List[Word] = []
        for word in words:
            cx, cy = word.center
            matched_region = None
            for reg in result_regions:
                if reg.type != RegionType.IMAGE and reg.bbox.contains_point(cx, cy):
                    matched_region = reg
                    break

            if matched_region:
                matched_region.words.append(word)
            else:
                unassigned_words.append(word)

        # 3. Associa palavras órfãs à região mais próxima se estiver próxima
        for word in unassigned_words:
            cx, cy = word.center
            best_reg = None
            min_dist = float("inf")
            for reg in result_regions:
                if reg.type == RegionType.IMAGE:
                    continue
                # Distância vertical e horizontal até a borda mais próxima
                dx = max(0.0, reg.bbox.x0 - cx, cx - reg.bbox.x1)
                dy = max(0.0, reg.bbox.y0 - cy, cy - reg.bbox.y1)
                dist = (dx * dx + dy * dy) ** 0.5
                if dist < 20.0 and dist < min_dist:
                    min_dist = dist
                    best_reg = reg
            if best_reg:
                best_reg.words.append(word)

        # 4. Reconstrução de texto e ordenação interna de linhas para cada região
        for reg in result_regions:
            if reg.type == RegionType.IMAGE:
                continue

            if reg.words:
                # Ordena palavras por Y (linha) e depois X (coluna)
                # Agrupa palavras com Y similar (+- 4 pontos) na mesma linha
                sorted_words = sorted(reg.words, key=lambda w: (round(w.y0 / 5.0) * 5.0, w.x0))
                reg.words = sorted_words

                lines: List[List[Word]] = []
                curr_line: List[Word] = []
                curr_y = None

                for w in sorted_words:
                    if curr_y is None or abs(w.y0 - curr_y) <= 4.0:
                        curr_line.append(w)
                        curr_y = w.y0
                    else:
                        if curr_line:
                            curr_line.sort(key=lambda item: item.x0)
                            lines.append(curr_line)
                        curr_line = [w]
                        curr_y = w.y0

                if curr_line:
                    curr_line.sort(key=lambda item: item.x0)
                    lines.append(curr_line)

                # Reconstrói o texto preservando quebras de linha para listas e sumários
                line_texts = [" ".join(w.text for w in line) for line in lines]
                is_toc_or_list = (
                    reg.type in (RegionType.LIST, RegionType.LIST_ITEM) or
                    any(TOC_LINE_RE.search(lt) for lt in line_texts) or
                    any('...' in lt or '…' in lt or '..' in lt for lt in line_texts)
                )
                if is_toc_or_list and len(line_texts) > 1:
                    reg.text = "\n".join(line_texts).strip()
                else:
                    reg.text = " ".join(line_texts).strip()

            elif reg.spans and not reg.text:
                reg.text = " ".join(s.text for s in reg.spans).strip()

        # Filtra regiões vazias de texto que não sejam imagens
        valid_regions = [
            r for r in result_regions
            if (r.type == RegionType.IMAGE and r.image is not None) or (r.text and r.text.strip())
        ]

        return valid_regions
