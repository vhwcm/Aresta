from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class ConvertRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    file_path: Optional[str] = Field(None, description="Caminho do arquivo PDF no servidor")
    output_path: Optional[str] = Field(None, description="Caminho desejado para o EPUB de saída")
    title: Optional[str] = Field(None, description="Título do livro")
    author: Optional[str] = Field(None, description="Autor do livro")
    dpi: int = Field(150, description="DPI de renderização")
    confidence: float = Field(0.35, description="Confiança mínima do detector de layout")
    device: str = Field("cpu", description="Dispositivo para inferência (cpu ou cuda)")
    run_validation: bool = Field(True, alias="validate", description="Executar validação do EPUB gerado")

class ValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    epubcheck_executed: bool = False

class ConvertResponse(BaseModel):
    status: str
    epub_path: str
    pages_count: int
    chapters_count: int
    assets_count: int
    processing_time_seconds: float
    classification: str
    validation: Optional[ValidationResponse] = None
    document_json: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    device: str
