from pathlib import Path
import tempfile
from fastapi.testclient import TestClient
from pdf2epub.pipeline.converter import PDFToEpubConverter
from pdf2epub.api.server import app

def test_full_pipeline_conversion(sample_pdf_single_column):
    converter = PDFToEpubConverter(dpi=100)
    
    temp_out = tempfile.NamedTemporaryFile(suffix=".epub", delete=False)
    temp_out.close()
    
    try:
        res = converter.convert(
            pdf_path=sample_pdf_single_column,
            output_path=temp_out.name,
            title="Livro Teste Completo",
            author="Autor Teste"
        )

        assert res["status"] == "success"
        assert res["pages_count"] == 2
        assert res["chapters_count"] >= 1
        assert Path(res["epub_path"]).exists()
        assert res["validation"]["is_valid"] is True
    finally:
        Path(temp_out.name).unlink(missing_ok=True)

def test_fastapi_server_endpoints(sample_pdf_single_column):
    client = TestClient(app)

    # 1. Health
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "ok"

    # 2. Convert from path
    temp_out = tempfile.NamedTemporaryFile(suffix=".epub", delete=False)
    temp_out.close()

    try:
        c_res = client.post("/convert", json={
            "file_path": sample_pdf_single_column,
            "output_path": temp_out.name,
            "title": "API Test",
            "author": "API Author"
        })
        assert c_res.status_code == 200
        data = c_res.json()
        assert data["status"] == "success"
        assert data["pages_count"] == 2
        assert data["validation"]["is_valid"] is True
    finally:
        Path(temp_out.name).unlink(missing_ok=True)
