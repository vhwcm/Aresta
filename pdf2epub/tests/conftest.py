import pytest
import fitz
from pathlib import Path
import tempfile

@pytest.fixture
def sample_pdf_single_column():
    """Cria um PDF sintético de 2 páginas com layout de coluna única"""
    doc = fitz.open()
    
    # Página 1
    page1 = doc.new_page(width=595, height=842) # A4
    page1.insert_text((50, 80), "Capítulo 1: Introdução", fontsize=24)
    page1.insert_text((50, 140), "Este é o primeiro parágrafo do livro digital gerado para testes.", fontsize=12)
    page1.insert_text((50, 170), "Este é o segundo parágrafo com mais algumas informações relevantes.", fontsize=12)
    page1.insert_text((280, 800), "1", fontsize=10) # page number

    # Página 2
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text((50, 80), "Capítulo 2: Desenvolvimento", fontsize=24)
    page2.insert_text((50, 140), "Aqui continuamos o conteúdo com novos parágrafos bem estruturados.", fontsize=12)
    page2.insert_text((280, 800), "2", fontsize=10)

    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    doc.save(temp_file.name)
    doc.close()

    yield temp_file.name
    Path(temp_file.name).unlink(missing_ok=True)

@pytest.fixture
def sample_pdf_double_column():
    """Cria um PDF sintético de duas colunas"""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    
    # Título spanning
    page.insert_text((50, 60), "Artigo em Duas Colunas", fontsize=22)
    
    # Coluna 1 (esquerda)
    page.insert_text((50, 120), "Texto da coluna esquerda linha 1.", fontsize=11)
    page.insert_text((50, 140), "Texto da coluna esquerda linha 2.", fontsize=11)
    
    # Coluna 2 (direita)
    page.insert_text((320, 120), "Texto da coluna direita linha 1.", fontsize=11)
    page.insert_text((320, 140), "Texto da coluna direita linha 2.", fontsize=11)
    
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    doc.save(temp_file.name)
    doc.close()

    yield temp_file.name
    Path(temp_file.name).unlink(missing_ok=True)
