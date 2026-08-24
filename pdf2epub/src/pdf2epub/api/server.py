import tempfile
import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Optional

from pdf2epub import __version__
from pdf2epub.api.schemas import ConvertRequest, ConvertResponse, HealthResponse
from pdf2epub.pipeline.converter import PDFToEpubConverter

app = FastAPI(
    title="Aresta PDF to EPUB Microservice",
    description="Serviço de alta fidelidade para conversão de PDF para EPUB 3",
    version=__version__
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        version=__version__,
        device="cpu"
    )

@app.post("/convert", response_model=ConvertResponse)
def convert_from_path(req: ConvertRequest):
    if not req.file_path or not Path(req.file_path).exists():
        raise HTTPException(status_code=400, detail=f"Arquivo PDF não encontrado: {req.file_path}")

    converter = PDFToEpubConverter(
        dpi=req.dpi,
        confidence_threshold=req.confidence,
        device=req.device
    )

    try:
        res = converter.convert(
            pdf_path=req.file_path,
            output_path=req.output_path,
            title=req.title,
            author=req.author,
            validate=req.run_validation
        )
        return ConvertResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na conversão: {str(e)}")

@app.post("/convert/upload")
async def convert_upload(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    dpi: int = Form(150),
    download: bool = Form(True)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")

    temp_dir = tempfile.mkdtemp(prefix="pdf2epub_")
    pdf_temp_path = os.path.join(temp_dir, file.filename)
    epub_temp_path = os.path.join(temp_dir, Path(file.filename).stem + ".epub")

    with open(pdf_temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    converter = PDFToEpubConverter(dpi=dpi)
    try:
        res = converter.convert(
            pdf_path=pdf_temp_path,
            output_path=epub_temp_path,
            title=title,
            author=author,
            validate=True
        )

        headers = {
            "X-Status": res["status"],
            "X-Pages-Count": str(res["pages_count"]),
            "X-Chapters-Count": str(res["chapters_count"]),
            "X-Assets-Count": str(res["assets_count"]),
            "X-Processing-Time": str(res["processing_time_seconds"]),
            "X-Classification": str(res["classification"]),
            "X-Is-Valid": str(res.get("validation", {}).get("is_valid", True))
        }

        if download:
            return FileResponse(
                epub_temp_path,
                media_type="application/epub+zip",
                filename=Path(epub_temp_path).name,
                headers=headers
            )

        return ConvertResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na conversão: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
