import argparse
import json
import sys
from pathlib import Path
from pdf2epub.pipeline.converter import PDFToEpubConverter

def main():
    parser = argparse.ArgumentParser(
        description="pdf2epub - Conversor de PDF para EPUB 3 com Análise de Layout"
    )
    parser.add_argument("input_pdf", help="Caminho do arquivo PDF de entrada")
    parser.add_argument("-o", "--output", help="Caminho do arquivo EPUB de saída", default=None)
    parser.add_argument("--title", help="Título do livro", default=None)
    parser.add_argument("--author", help="Autor do livro", default=None)
    parser.add_argument("--dpi", type=int, default=150, help="DPI de renderização (padrão: 150)")
    parser.add_argument("--confidence", type=float, default=0.35, help="Threshold de confiança YOLO (padrão: 0.35)")
    parser.add_argument("--device", default="cpu", help="Dispositivo (cpu ou cuda, padrão: cpu)")
    parser.add_argument("--validate", action="store_true", default=True, help="Executa validação do EPUB")
    parser.add_argument("--dump-document", action="store_true", help="Salva o Document Model intermediário em JSON")
    parser.add_argument("--debug", action="store_true", help="Ativa modo debug e logs detalhados")

    args = parser.parse_args()

    input_path = Path(args.input_pdf)
    if not input_path.exists():
        print(f"Erro: Arquivo {input_path} não encontrado.", file=sys.stderr)
        sys.exit(1)

    converter = PDFToEpubConverter(
        dpi=args.dpi,
        confidence_threshold=args.confidence,
        device=args.device
    )

    try:
        result = converter.convert(
            pdf_path=input_path,
            output_path=args.output,
            title=args.title,
            author=args.author,
            validate=args.validate
        )

        print(f"\n Conversão concluída com sucesso em {result['processing_time_seconds']}s!")
        print(f" EPUB gerado: {result['epub_path']}")
        print(f" Páginas processadas: {result['pages_count']}")
        print(f" Capítulos detectados: {result['chapters_count']}")
        print(f" Imagens extraídas: {result['assets_count']}")

        if result.get("validation"):
            v = result["validation"]
            if v["is_valid"]:
                print(" Validação estrutural do EPUB: APROVADO")
            else:
                print(" Validação estrutural do EPUB: AVISO/ERRO")
                for err in v.get("errors", []):
                    print(f"   - {err}")

        if args.dump_document:
            json_path = Path(result["epub_path"]).with_suffix(".json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(result["document_json"], f, ensure_ascii=False, indent=2)
            print(f" Document Model salvo em: {json_path}")

    except Exception as e:
        print(f"Erro durante a conversão: {e}", file=sys.stderr)
        if args.debug:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
