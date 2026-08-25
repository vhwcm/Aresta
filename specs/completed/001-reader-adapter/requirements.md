# Requisitos: Reader Adapter Pattern (Multi-formato EPUB e PDF)

## 1. Objetivo Geral
Permitir a leitura e navegação uniforme de livros digitais em múltiplos formatos (**EPUB** e **PDF**) através de uma interface de documento unificada (`IBookDocument`), abstraindo bibliotecas de terceiros (`foliate-js` e `pdfjs-dist`).

## 2. Escopo
- **Incluído**:
  - Fábrica de documentos (`BookDocumentFactory`).
  - Adaptador EPUB (`EpubDocumentAdapter`) com renderização em Canvas/SVG e camada de texto.
  - Adaptador PDF (`PdfDocumentAdapter`) com suporte a páginas, texto e renderização gráfica.
  - Navegação de página, cálculo de progresso e busca de texto.
- **Não Incluído**:
  - Conversão de arquivos no cliente (executada via serviço `pdf2epub`).

## 3. Requisitos Funcionais

### R1. Identificação e Carregamento por Formato
- **Descrição**: O leitor deve detectar o formato com base na extensão ou MIME type do arquivo e instanciar o adaptador correto via `BookDocumentFactory.loadDocument()`.
- **Atores**: Usuário Leitor.
- **Regra de Validação**: Arquivos não suportados devem disparar erro amigável na interface.

### R2. Renderização de Páginas e Cache
- **Descrição**: Cada página solicitada deve ser renderizada em um elemento `<canvas>` com dimensões escaladas e suporte a cache em memória para navegação instantânea.
- **Atores**: Sistema / UI do Leitor.

### R3. Extração e Seleção de Camada de Texto
- **Descrição**: Permitir a extração de texto para marcações e anotações vinculadas a CFIs ou números de página.
- **Atores**: Usuário Leitor.

## 4. Requisitos Não Funcionais
- **Performance**: Tempo de renderização da primeira página < 800ms.
- **Consumo de Memória**: Descarte e liberação de memória em `destroy()`.

## 5. Critérios de Aceite
- [x] Carregamento de arquivos EPUB funcionando via Foliate.
- [x] Carregamento de arquivos PDF funcionando via PDF.js.
- [x] Interface `IBookDocument` desacoplada da UI do Vue 3.
- [x] Testes unitários cobrindo o `BookDocumentFactory`.
