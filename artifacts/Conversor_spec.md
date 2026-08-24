Spec Master — Sistema de Conversão PDF → EPUB com Análise Neural de Layout1. ObjetivoConstruir uma aplicação de baixo custo capaz de converter documentos PDF, especialmente livros, para EPUB reflowable de alta qualidade.O princípio arquitetural fundamental do sistema é:A inteligência artificial é responsável somente pela compreensão visual/estrutural do documento. O conteúdo textual deve ser extraído deterministicamente do PDF sempre que possível.A IA NÃO deve ser utilizada para reescrever, resumir, corrigir ou gerar o texto do livro.O sistema deverá combinar:

PDF
 │
 ├─────────────────────────────┐
 │                             │
 ▼                             ▼
Análise visual             Extração determinística
DocLayout-YOLO             PyMuPDF
 │                             │
 ▼                             ▼
Layout / regiões            texto + posições
 │                             │
 └──────────────┬──────────────┘
                ▼
         Layout Resolver
                │
                ▼
       Document Intermediate
              Model
                │
                ▼
         EPUB Generator
                │
                ▼
          EPUB Validation
                │
                ▼
              EPUB
              
2. Objetivos do projeto2.1 Objetivos funcionaisO sistema deverá:aceitar PDFs digitais;identificar automaticamente a estrutura visual das páginas;detectar títulos;detectar cabeçalhos;detectar rodapés;detectar números de página;detectar parágrafos;detectar múltiplas colunas;detectar imagens;detectar legendas;detectar tabelas;detectar notas de rodapé;determinar ordem de leitura;extrair texto do PDF sem depender de LLM;preservar caracteres e conteúdo original;reconstruir a estrutura do documento;gerar EPUB 3;gerar EPUB reflowable;preservar imagens relevantes;gerar índice/TOC;validar o EPUB gerado;produzir logs e métricas de qualidade;permitir processamento totalmente local;funcionar sem API paga.2.2 Objetivos não funcionaisO sistema deverá priorizar:fidelidade textual;qualidade estrutural;baixo custo;execução local;determinismo;reprodutibilidade;observabilidade;modularidade;facilidade de treinamento/fine-tuning futuro;possibilidade de substituir componentes sem reescrever todo o sistema.3. Princípios arquiteturais3.1 A IA nunca deve ser a fonte de verdade do textoNão utilizar:PDF → LLM → texto → EPUB
como fluxo principal.Preferir:PDF → parser → texto original
PDF → modelo visual → layout
layout + texto → reconstrução determinística
3.2 Separação entre percepção e reconstruçãoA camada neural responde:Onde estão os elementos?O parser responde:Quais caracteres/palavras estão nessas regiões?O resolver responde:Qual é a estrutura lógica do documento?O gerador responde:Como representar essa estrutura em EPUB?3.3 IA deve produzir dados estruturadosA saída da rede neural deve ser convertida para um contrato interno semelhante a:{
  "page": 12,
  "width": 1200,
  "height": 1600,
  "regions": [
    {
      "id": "region-001",
      "type": "heading",
      "bbox": [100, 80, 900, 160],
      "confidence": 0.97
    }
  ]
}
Nunca utilizar a saída textual de uma IA como conteúdo autoritativo do EPUB.4. Stack tecnológica inicial4.1 LinguagemPython 3.10 ou superior.A versão inicial deverá utilizar Python 3.10 para maximizar compatibilidade com DocLayout-YOLO.5. Dependências principais5.1 PDFPyMuPDFResponsável por:abrir PDF;obter dimensões das páginas;extrair palavras;extrair blocos;extrair linhas;extrair spans;obter fonte;obter tamanho de fonte;obter bounding boxes;extrair imagens;renderizar páginas;obter caracteres quando necessário.PyMuPDF oferece words, blocks, dict e rawdict, incluindo coordenadas e informações tipográficas.Dependência:pymupdf
6. Análise neural de layout6.1 DocLayout-YOLOUtilizar inicialmente o modelo pré-treinado do DocLayout-YOLO.O projeto oficial fornece instalação via:conda create -n doclayout_yolo python=3.10
conda activate doclayout_yolo
pip install -e .
ou instalação para inferência via:pip install doclayout-yolo
A API oficial utiliza YOLOv10 e permite configurar tamanho de imagem, confiança e dispositivo (cuda ou cpu).Repositório:https://github.com/opendatalab/DocLayout-YOLOA aplicação deverá encapsular o DocLayout-YOLO atrás de uma interface própria.Exemplo:class LayoutDetector:
    def detect(self, page_image) -> PageLayout:
        ...
O restante da aplicação não deve depender diretamente da API do YOLO.Isso permitirá trocar posteriormente:DocLayout-YOLO
       ↓
Surya
       ↓
outro modelo
       ↓
modelo próprio
sem alterar o restante do sistema.7. Machine Learning RuntimeInicialmente utilizar:PyTorch;runtime CUDA quando GPU NVIDIA estiver disponível;CPU como fallback.Dependências deverão ser mantidas separadas das dependências do core.Estrutura conceitual:requirements/
    base.txt
    inference.txt
    training.txt
    development.txt
Não instalar dependências de treinamento em instalações destinadas apenas à conversão.8. EPUB8.1 GeradorUtilizar inicialmente:EbookLib
para facilitar:criação do EPUB;criação de XHTML;metadata;spine;TOC;imagens;recursos.O EbookLib fornece API para criação de EpubBook, metadata, conteúdo e estrutura de publicação.Porém, a arquitetura não deverá acoplar o domínio diretamente ao EbookLib.Criar:class EpubGenerator:
    def generate(self, document: Document) -> Path:
        ...
9. Validação EPUBUtilizar:EPUBCheck
como etapa obrigatória de validação.EPUBCheck é o verificador oficial de conformidade EPUB e atualmente possui suporte a EPUB 3.3.O sistema deverá executar:generate EPUB
      ↓
EPUBCheck
      ↓
errors/warnings
O EPUB não deve ser considerado concluído apenas porque o arquivo foi criado.10. Dependências opcionaisPossíveis dependências futuras:OpenCV
Pillow
NumPy
SciPy
scikit-learn
Hugging Face Hub
ONNX Runtime
CUDA
Tesseract
OCR engines
Não adicionar uma dependência sem necessidade concreta.11. Arquitetura de diretóriosA estrutura inicial deverá ser semelhante a:pdf2epub/
├── pyproject.toml
├── README.md
├── LICENSE
├── .gitignore
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── models/
│   └── datasets/
│
├── specs/
│
├── src/
│   └── pdf2epub/
│       ├── domain/
│       ├── pdf/
│       ├── layout/
│       ├── reconstruction/
│       ├── document/
│       ├── epub/
│       ├── validation/
│       ├── pipeline/
│       ├── evaluation/
│       └── cli/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── regression/
│   └── fixtures/
│
├── models/
├── datasets/
├── samples/
├── output/
└── scripts/
12. Modelo de domínioCriar um modelo intermediário independente do PDF e do EPUB.Exemplo conceitual:Document
 ├── Metadata
 ├── Pages
 │    └── Page
 │         ├── Regions
 │         │    ├── Heading
 │         │    ├── Paragraph
 │         │    ├── Image
 │         │    ├── Caption
 │         │    ├── Table
 │         │    ├── Footnote
 │         │    └── ...
 │         └── ReadingOrder
 │
 ├── Chapters
 └── Assets
Este modelo é o principal contrato interno do sistema.13. Modelo de páginaCada página deverá possuir:Page(
    number: int,
    width: float,
    height: float,
    regions: list[Region],
    source_page_index: int
)
14. RegiãoToda região deverá possuir:Region(
    id,
    type,
    bbox,
    confidence,
    reading_order,
    content
)
bbox deverá ser normalizado para um sistema de coordenadas interno.15. Tipos de regiãoA arquitetura deverá permitir extensibilidade.Classes iniciais:TITLE
HEADING
PARAGRAPH
IMAGE
CAPTION
TABLE
LIST
LIST_ITEM
QUOTE
FOOTNOTE
HEADER
FOOTER
PAGE_NUMBER
FORMULA
UNKNOWN
Não assumir que o modelo neural atual fornecerá exatamente essas classes.Criar um adaptador:RawModelClass
      ↓
LayoutClassMapper
      ↓
InternalRegionType
16. Extração determinísticaO pipeline deverá utilizar PyMuPDF para obter:words
blocks
lines
spans
characters
images
Quando possível.Exemplo de palavra:x0
y0
x1
y1
text
block_no
line_no
word_no
PyMuPDF fornece exatamente esse tipo de informação por meio de get_text("words").17. Regra fundamental de extraçãoNunca utilizar apenas:page.get_text("text")
para reconstrução de documentos complexos.A extração deverá utilizar posição espacial.Preferir:page.get_text("words")
ou:page.get_text("dict")
ou:page.get_text("rawdict")
dependendo do nível de precisão necessário.18. Algoritmo de associação texto → regiãoPara cada região detectada:obter seu bounding box;localizar palavras cujo centro esteja dentro da região;considerar interseção quando apropriado;ordenar palavras;agrupar palavras em linhas;agrupar linhas em parágrafos;reconstruir espaços;preservar caracteres;preservar ordem de leitura.Não simplesmente concatenar todas as palavras por coordenada Y/X.19. Sistema de coordenadasDefinir explicitamente:PDF coordinates
        ↓
normalized coordinates
        ↓
layout coordinates
Todos os módulos deverão utilizar o mesmo sistema interno.Criar testes para:PDF portrait;PDF landscape;páginas rotacionadas;diferentes DPI;diferentes tamanhos;crop boxes;media boxes.20. Pipeline completoA pipeline principal deverá ser:Input PDF
   ↓
PDF Inspector
   ↓
Document Profile
   ↓
Page Renderer
   ↓
Layout Detector
   ↓
Layout Normalizer
   ↓
Text Extractor
   ↓
Region/Text Association
   ↓
Reading Order Resolver
   ↓
Semantic Structure Resolver
   ↓
Document Model
   ↓
EPUB Builder
   ↓
EPUB Validator
   ↓
Quality Report
21. PDF InspectorAntes da IA, analisar o PDF.Detectar:número de páginas;tamanho;orientação;PDF digital ou possivelmente escaneado;quantidade de texto;quantidade de imagens;fontes;rotação;existência de texto selecionável.O sistema deverá classificar:DIGITAL
SCANNED
MIXED
UNKNOWN
22. Estratégia para PDFs digitaisPara PDF digital:PDF
 ├── texto → PyMuPDF
 ├── layout → DocLayout-YOLO
 └── imagens → PyMuPDF
Não executar OCR desnecessariamente.23. Estratégia para PDF escaneadoPara PDF escaneado:PDF
 ↓
renderização
 ↓
layout detection
 ↓
OCR
 ↓
reconstrução
OCR deverá ser tratado como módulo separado.Não misturar o OCR ao core de layout.24. RenderizaçãoCriar PageRenderer.Interface:class PageRenderer:
    def render(
        self,
        page,
        dpi: int
    ) -> Image:
        ...
O DPI deverá ser configurável.Valores iniciais a experimentar:120
150
200
300
O sistema deverá medir:tempo;memória;qualidade;tamanho da imagem.Não assumir que 300 DPI é sempre melhor.25. Layout DetectorInterface:class LayoutDetector(Protocol):

    def detect(
        self,
        image: Image
    ) -> PageLayout:
        ...
Implementação inicial:DocLayoutYoloDetector
Configurações:model_path
confidence_threshold
image_size
device
batch_size
O DocLayout-YOLO suporta inferência via CPU ou CUDA e permite configurar imgsz, conf e device.26. Cache de inferênciaA análise neural deverá possuir cache.Chave:SHA256(
    page_image
    +
model_version
    +
model_config
)
Resultado:layout-cache/
    <hash>.json
Isso evita executar novamente a rede para a mesma página.27. Batch inferenceQuando houver GPU:page 1
page 2
page 3
...
deverão poder ser processadas em batches.Isso é especialmente importante para conversão de livros grandes.O DocLayout-YOLO possui suporte a batch inference.28. Reading OrderCriar módulo separado:ReadingOrderResolver
Responsabilidades:detectar colunas;ordenar regiões;ordenar linhas;detectar continuidade entre páginas;evitar header/footer;lidar com sidebars;lidar com notas.Não confiar cegamente na ordenação padrão do PDF.PyMuPDF alerta que a ordem de texto extraída pode não corresponder à ordem natural de leitura; a opção sort=True ajuda em casos simples, mas o projeto deverá possuir seu próprio resolvedor para layouts complexos.29. Detecção de colunasCriar algoritmo específico para:single-column
double-column
triple-column
mixed-column
Exemplo:┌─────────────┬─────────────┐
│             │             │
│ column A    │ column B    │
│             │             │
└─────────────┴─────────────┘
Deverá resultar em:A1
A2
A3
B1
B2
B3
e não:A1
B1
A2
B2
A3
B3
30. Header/FooterHeaders e footers recorrentes deverão ser identificados.Heurísticas possíveis:repetição entre páginas;posição;altura;conteúdo;similaridade;classificação do modelo.O sistema deverá evitar inserir:CAPÍTULO X
ou:123
repetidos em todas as páginas como corpo do EPUB.31. Detecção de capítulosCriar módulo:ChapterResolver
Pode utilizar:heading detection;tamanho da fonte;posição;repetição;padrão textual;número de seção;página;estrutura do layout.Não utilizar LLM no caminho principal.32. Document ModelO resultado do processamento deverá ser serializável em JSON.Exemplo:{
  "metadata": {},
  "pages": [],
  "chapters": [],
  "assets": []
}
Esse JSON deverá permitir:PDF → Document Model
sem gerar EPUB.Isso permite depurar o sistema independentemente do gerador.33. EPUB BuilderO gerador deverá transformar:Document Model
em:EPUB 3
Estrutura esperada:book.epub
├── mimetype
├── META-INF/
│   └── container.xml
└── EPUB/
    ├── content.opf
    ├── nav.xhtml
    ├── css/
    ├── text/
    ├── images/
    └── fonts/
34. EPUB reflowableO resultado NÃO deve ser simplesmente uma coleção de screenshots.Não fazer:<img src="page001.png">
como estratégia principal.O objetivo é:<h1>Capítulo 1</h1>

<p>Texto...</p>

<p>Texto...</p>

<figure>
    <img src="figure.png">
</figure>
Assim o usuário poderá:alterar tamanho da fonte;mudar orientação;utilizar diferentes leitores;utilizar dispositivos diferentes.35. CSSCriar CSS semanticamente organizado:body
h1
h2
h3
p
blockquote
figure
figcaption
table
footnote
Evitar reproduzir coordenadas absolutas do PDF no EPUB.O objetivo é preservar:estrutura
hierarquia
relações
tipografia aproximada
e não:pixel-perfect positioning
36. Preservação tipográficaQuando possível, extrair:família da fonte;tamanho;peso;itálico;alinhamento;cor.Entretanto, o sistema não deverá depender da disponibilidade da mesma fonte no dispositivo do leitor.Criar fallback CSS.37. ImagensAs imagens deverão ser extraídas diretamente do PDF sempre que possível.Não fazer:PDF → screenshot → crop → imagem
quando o objeto original estiver disponível.Preservar:resolução;formato;proporção;posição semântica;legenda.38. TabelasTabelas deverão ser tratadas como módulo próprio.Primeira versão:table detection
      ↓
bbox
      ↓
table extraction
      ↓
HTML table
Não exigir suporte perfeito a tabelas na primeira versão.39. FórmulasFórmulas deverão ser tratadas como caso especial.Inicialmente:detect formula
↓
preserve as image
Posteriormente:formula detection
↓
LaTeX / MathML
Não introduzir OCR matemático no MVP sem necessidade.40. Qualidade textualO sistema deverá possuir métricas.Quando existir referência:texto original
vs
texto EPUB
calcular:character error rate;word error rate;caracteres perdidos;palavras perdidas;palavras duplicadas;ordem incorreta;páginas sem texto;regiões sem conteúdo.Para PDFs digitais, a meta deverá ser:zero alteração textual intencional.41. TestesCriar conjunto de PDFs de teste contendo:01-single-column.pdf
02-double-column.pdf
03-triple-column.pdf
04-images.pdf
05-captions.pdf
06-footnotes.pdf
07-header-footer.pdf
08-chapters.pdf
09-tables.pdf
10-mixed-layout.pdf
11-rotated.pdf
12-scanned.pdf
13-mixed.pdf
42. Golden testsPara cada PDF de teste manter:input.pdf
expected_document.json
expected_text.txt
expected_layout.json
O pipeline deverá comparar o resultado atual contra os arquivos esperados.43. Visual regressionCriar ferramenta que permita visualizar:PDF original
+
bounding boxes do modelo
+
texto associado
+
ordem de leitura
Exemplo:┌───────────────────────────┐
│ [1] TITLE                 │
│                           │
│ [2] BODY      [3] BODY    │
│                           │
│ [4] IMAGE                 │
└───────────────────────────┘
Essa ferramenta será essencial para depurar o modelo.44. Quality ReportCada conversão deverá produzir:{
  "pages": 350,
  "processing_time_seconds": 124,
  "layout_confidence": 0.94,
  "text_extraction_errors": 0,
  "regions_detected": 1240,
  "warnings": [],
  "epubcheck_errors": 0
}
45. LoggingUtilizar logs estruturados.Níveis:DEBUG
INFO
WARNING
ERROR
Registrar:PDF recebido;número de páginas;modelo utilizado;versão do modelo;dispositivo;tempo por página;tempo de inferência;tempo de extração;tempo de geração;erros;warnings;validação EPUB.Nunca registrar conteúdo completo de livros desnecessariamente.46. MétricasMedir separadamente:PDF parsing time
rendering time
YOLO inference time
text extraction time
layout resolution time
EPUB generation time
EPUB validation time
Também:pages/second
images/second
memory usage
GPU memory
47. CLICriar CLI:pdf2epub input.pdf -o output.epub
Opções:--model
--device
--confidence
--dpi
--batch-size
--cache
--debug
--dump-layout
--dump-document
--validate
Exemplo:pdf2epub livro.pdf \
    --device cuda \
    --dpi 150 \
    --validate \
    --dump-layout
48. Modo debugAdicionar:pdf2epub livro.pdf --debug
Deverá gerar:debug/
├── pages/
├── layouts/
├── text/
├── merged/
└── report.json
49. Estratégia de custoO sistema deverá ser projetado para custo operacional próximo de zero.Prioridades:execução local;modelos open source;sem API externa;cache;processamento batch;evitar OCR desnecessário;evitar LLM;evitar renderização excessiva;evitar inferência neural quando heurísticas forem suficientes.50. Estratégia híbrida de inferênciaNão executar DocLayout-YOLO obrigatoriamente em todas as páginas no futuro.Criar:PageComplexityAnalyzer
que classifica:SIMPLE
MODERATE
COMPLEX
Possível fluxo:PDF
 ↓
heurísticas
 ↓
página simples?
 ├── SIM → resolver deterministicamente
 │
 └── NÃO → DocLayout-YOLO
Essa otimização deverá ser implementada somente depois que a pipeline básica estiver correta.51. Treinamento próprioNão treinar modelo próprio no início.Primeiro:DocLayout-YOLO pré-treinado
Depois coletar:predição
+
erro
+
correção
Criar dataset próprio.O projeto oficial disponibiliza DocSynth300K e também usa datasets como D4LA e DocLayNet para treinamento/evaluation. O DocSynth300K possui cerca de 113 GB, portanto não deve ser baixado como parte da instalação normal do projeto.52. Fine-tuning futuroQuando existir dataset próprio suficiente:DocLayout-YOLO
       ↓
modelo base
       ↓
fine-tuning
       ↓
BookLayout-YOLO
O modelo deverá ser otimizado especificamente para:books
novels
technical books
academic books
magazines
Não assumir que um modelo genérico de documentos terá desempenho ideal em livros.53. Dataset próprioCriar estrutura:datasets/
└── book-layout/
    ├── images/
    ├── labels/
    ├── train.txt
    ├── val.txt
    └── test.txt
Classes deverão ser definidas em:classes.yaml
Nunca codificar classes diretamente em dezenas de módulos.54. Data Annotation ToolCriar ou integrar ferramenta para anotação manual.Deverá permitir:desenhar bounding boxes;selecionar classe;corrigir previsão;exportar YOLO format;revisar leitura;comparar previsão vs ground truth.55. Critérios para fine-tuningSó iniciar treinamento próprio quando:existir dataset representativo;existirem métricas baseline;erros recorrentes forem conhecidos;classes estiverem estáveis;pipeline de avaliação estiver funcionando.Não treinar uma rede simplesmente porque "é possível".56. Especificações por etapaO projeto principal deverá ser dividido nas seguintes specs:spec-01-project-foundation.md
spec-02-pdf-inspector.md
spec-03-pdf-renderer.md
spec-04-deterministic-text-extraction.md
spec-05-doclayout-yolo-integration.md
spec-06-layout-domain-model.md
spec-07-region-text-association.md
spec-08-reading-order.md
spec-09-document-structure.md
spec-10-epub-generator.md
spec-11-epub-validation.md
spec-12-quality-evaluation.md
spec-13-debug-visualizer.md
spec-14-cli.md
spec-15-performance-cache.md
spec-16-ocr-fallback.md
spec-17-dataset-annotation.md
spec-18-model-finetuning.md
spec-19-production-hardening.md
Cada spec deverá possuir:1. Contexto
2. Objetivo
3. Escopo
4. Fora do escopo
5. Dependências
6. Arquitetura
7. Interfaces
8. Modelos de dados
9. Algoritmos
10. Critérios de aceite
11. Testes
12. Métricas
13. Riscos
14. Decisões
15. Próximas etapas
57. Ordem obrigatória de implementaçãoFase 1 — FundaçãoImplementar:spec-01
spec-02
spec-03
Resultado:PDF
 ↓
inspeção
 ↓
renderização
Fase 2 — Verdade textualImplementar:spec-04
Resultado:PDF
 ↓
palavras + bbox + fontes + imagens
Fase 3 — IAImplementar:spec-05
spec-06
Resultado:PDF page
 ↓
DocLayout-YOLO
 ↓
PageLayout
Fase 4 — ReconstruçãoImplementar:spec-07
spec-08
spec-09
Resultado:layout
+
texto
 ↓
Document Model
Fase 5 — EPUBImplementar:spec-10
spec-11
Resultado:Document Model
 ↓
EPUB
 ↓
EPUBCheck
Fase 6 — QualidadeImplementar:spec-12
spec-13
Resultado:métricas
+
visualização
+
regression tests
Fase 7 — ProdutoImplementar:spec-14
spec-15
spec-16
Resultado:CLI
+
cache
+
OCR fallback
Fase 8 — IA própriaSomente após as fases anteriores:spec-17
spec-18
Resultado:dataset próprio
 ↓
fine-tuned BookLayout model
58. MVPO primeiro MVP deverá suportar somente:PDF digital
single column
double column
heading
paragraph
image
caption
header/footer
basic chapter detection
O MVP deverá:PDF
 ↓
PyMuPDF
 +
DocLayout-YOLO
 ↓
Document Model
 ↓
EPUB 3
 ↓
EPUBCheck
Não implementar inicialmente:OCR avançado;fórmulas;tabelas complexas;matemática;livros manuscritos;revistas extremamente complexas;fine-tuning;LLM;cloud inference.59. Critério de sucesso do MVPO MVP será considerado tecnicamente bem-sucedido quando conseguir converter corretamente um conjunto representativo de livros digitais, mantendo:Textonenhum texto inventado;nenhum resumo;nenhuma alteração semântica;baixa perda de caracteres;baixa duplicação;ordem correta.Layoutcolunas preservadas semanticamente;títulos reconhecidos;imagens preservadas;legendas associadas;headers/footers removidos quando apropriado;capítulos estruturados.EPUBEPUB válido;EPUB 3;reflowable;TOC funcional;imagens funcionando;leitura correta em leitores EPUB comuns.60. Regra de qualidade mais importanteA qualidade deverá ser avaliada nesta ordem:1. Texto correto
2. Ordem de leitura correta
3. Estrutura correta
4. Imagens corretas
5. Formatação correta
6. Aparência visual
Não sacrificar texto para obter aparência visual.61. Regra de fallbackQuando o sistema não tiver confiança suficiente:modelo confidence < threshold
não deverá inventar uma estrutura.Preferir:UNKNOWN
e registrar:WARNING
a gerar conteúdo incorreto.62. Proibição de LLM no coreLLMs generativas não deverão fazer parte do caminho principal:PDF → LLM → EPUB
Uma LLM poderá futuramente existir como módulo opcional para tarefas como:classificação semântica ambígua;recuperação de metadados;identificação de capítulos difíceis;correção assistida;análise de páginas que falharam.Mas nunca deverá substituir a extração determinística do texto sem uma justificativa explícita.63. Dependências externas e licençasAntes de distribuir a aplicação, criar documento:docs/dependencies-and-licenses.md
registrando:biblioteca;versão;licença;finalidade;origem;redistribuição permitida;pesos do modelo;licença dos datasets.Isso é especialmente importante para:DocLayout-YOLO
PyTorch
PyMuPDF
EbookLib
EPUBCheck
modelo/pesos
datasets
Não assumir que "open source" significa que todos os componentes possuem as mesmas condições de redistribuição.64. Documentação obrigatóriaO projeto deverá possuir:README.md
ARCHITECTURE.md
CONTRIBUTING.md
docs/
    pipeline.md
    layout-model.md
    text-extraction.md
    epub.md
    evaluation.md
    training.md
    dependencies-and-licenses.md
65. ADRsDecisões arquiteturais importantes deverão ser registradas como ADR.Exemplos:ADR-001 — Python como linguagem principal
ADR-002 — PyMuPDF como fonte textual
ADR-003 — DocLayout-YOLO como modelo inicial
ADR-004 — IA não gera texto
ADR-005 — Document Model intermediário
ADR-006 — EPUB 3 reflowable
ADR-007 — EPUBCheck como validação
ADR-008 — OCR somente como fallback
66. Regra para os agentes de desenvolvimentoAntes de implementar qualquer etapa, o agente deverá:ler esta spec;localizar a spec específica da etapa;verificar dependências;verificar decisões arquiteturais existentes;não duplicar funcionalidades já implementadas;executar testes existentes;implementar somente o escopo da etapa;adicionar testes;atualizar documentação;registrar decisões arquiteturais quando necessário.67. Regra contra overengineeringNão implementar antecipadamente:microserviços;APIs remotas;banco de dados;filas distribuídas;Kubernetes;cloud inference;LLM;treinamento próprio;sistemas distribuídos.O produto inicial deverá ser:CLI local
+
pipeline modular
+
modelos locais
+
arquivos
68. Resultado arquitetural esperadoAo final das primeiras fases, o sistema deverá ter esta arquitetura:                    ┌─────────────────┐
                    │      PDF        │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐        ┌────────────────┐
        │ Page Renderer │        │  PDF Extractor │
        └───────┬───────┘        └───────┬────────┘
                │                        │
                ▼                        ▼
        ┌───────────────┐        ┌────────────────┐
        │DocLayout-YOLO │        │ Text + BBoxes  │
        └───────┬───────┘        └───────┬────────┘
                │                        │
                ▼                        │
        ┌───────────────┐                │
        │ Layout Model  │                │
        └───────┬───────┘                │
                │                        │
                └──────────┬─────────────┘
                           ▼
                 ┌────────────────────┐
                 │ Region/Text        │
                 │ Association        │
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ Reading Order      │
                 │ Resolver           │
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ Document Model     │
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ EPUB Generator     │
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ EPUBCheck          │
                 └─────────┬──────────┘
                           ▼
                         EPUB
69. Definição de prontoUma etapa somente será considerada concluída quando:[ ] código implementado
[ ] testes unitários
[ ] testes de integração quando aplicável
[ ] logs
[ ] tratamento de erros
[ ] documentação
[ ] métricas relevantes
[ ] critérios de aceite atendidos
[ ] nenhuma dependência desnecessária adicionada
[ ] nenhuma violação da arquitetura
70. Próxima açãoA primeira implementação não deverá começar pelo treinamento de IA.A ordem recomendada é:1. Fundação do projeto
2. Inspector de PDF
3. Renderizador
4. Extração determinística
5. Testes de extração
6. Integração DocLayout-YOLO
7. Visualizador das detecções
8. Modelo intermediário
9. Associação layout ↔ texto
10. Reading order
11. Estrutura de capítulos
12. EPUB
13. EPUBCheck
14. Avaliação
15. Otimização
16. OCR fallback
17. Dataset
18. Fine-tuning
O primeiro objetivo técnico deve ser conseguir executar:pdf2epub input.pdf -o output.epub
com uma pipeline completamente local, sem LLM e sem serviços pagos.A qualidade deve ser melhorada iterativamente a partir de PDFs reais e métricas objetivas, e não através de complexidade arquitetural antecipada.