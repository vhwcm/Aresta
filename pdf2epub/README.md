# pdf2epub — Conversor PDF para EPUB 3 com Análise de Layout

Motor de conversão de documentos PDF (especialmente livros) para EPUB 3 reflowable de alta qualidade, seguindo a especificação [Conversor_spec.md](../artifacts/Conversor_spec.md).

## Princípio Fundamental
- **Extração Determinística**: O conteúdo textual e imagens são extraídos diretamente do arquivo PDF via PyMuPDF.
- **Análise Visual / Layout**: O modelo DocLayout-YOLO (com fallback heurístico) analisa exclusivamente a geometria/tipo de blocos e colunas.
- **Zero Alucinação**: Nenhuma LLM generativa é usada no caminho principal para reescrever ou gerar textos.

## Funcionalidades
- Inspeção e classificação automática de PDF (Digital vs Scanned vs Mixed)
- Renderização de páginas com DPI configurável
- Extração de palavras com bounding boxes espaciais, blocos, spans e estilos tipográficos
- Extração nativa de imagens embutidas preservando resolução e formatos
- Detecção e resolução de layout em múltiplas colunas (Single, Double, Spanning)
- Associação espacial determinística de palavras e caixas delimitadoras
- Resolução de ordem de leitura e agrupamento de parágrafos
- Detecção automática de títulos e estrutura de capítulos
- Geração de EPUB 3 reflowable semântico (XHTML, CSS limpo, TOC dinâmico)
- Validação estrutural do EPUB gerado + integração com EPUBCheck
- CLI independente (`pdf2epub`) e Microsserviço REST em FastAPI (porta 8000)

## Como Usar via CLI

```bash
# Executar conversão básica
python3 -m pdf2epub.cli.main livro.pdf -o livro.epub

# Conversão com opções avançadas
python3 -m pdf2epub.cli.main livro.pdf -o livro.epub --dpi 150 --title "Dom Casmurro" --author "Machado de Assis" --validate --dump-document
```

## Como Iniciar o Microsserviço FastAPI

```bash
uvicorn pdf2epub.api.server:app --host 0.0.0.0 --port 8000
```

### Endpoints da API
- `GET /health`: Verifica status do serviço
- `POST /convert`: Converte PDF informando caminho no sistema de arquivos
- `POST /convert/upload`: Recebe upload de PDF (`multipart/form-data`) e retorna metadados ou arquivo EPUB

## Testes Automatizados

```bash
PYTHONPATH=pdf2epub/src pytest pdf2epub/tests -v
```
