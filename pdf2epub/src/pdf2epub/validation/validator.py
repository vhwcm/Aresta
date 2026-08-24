import zipfile
import shutil
import subprocess
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any

@dataclass
class ValidationReport:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    epubcheck_executed: bool = False
    epubcheck_output: str = ""

class EpubValidator:
    """
    Valida a conformidade estrutural do EPUB 3 internamente e via EPUBCheck.
    """
    def validate(self, epub_path: str | Path) -> ValidationReport:
        path = Path(epub_path)
        report = ValidationReport(is_valid=True)

        if not path.exists():
            report.is_valid = False
            report.errors.append(f"Arquivo não existe: {path}")
            return report

        # 1. Validação do arquivo ZIP
        try:
            with zipfile.ZipFile(path, 'r') as z:
                namelist = z.namelist()

                # Verifica mimetype
                if "mimetype" not in namelist:
                    report.errors.append("Arquivo 'mimetype' ausente no pacote EPUB.")
                else:
                    mimetype_content = z.read("mimetype").decode("utf-8").strip()
                    if mimetype_content != "application/epub+zip":
                        report.errors.append(f"Mimetype inválido: '{mimetype_content}'")

                # Verifica container.xml
                if "META-INF/container.xml" not in namelist:
                    report.errors.append("Arquivo 'META-INF/container.xml' ausente no pacote EPUB.")

                # Valida XML dos arquivos XHTML
                for name in namelist:
                    if name.endswith(".xhtml") or name.endswith(".html") or name.endswith(".opf") or name.endswith(".xml"):
                        try:
                            content = z.read(name)
                            ET.fromstring(content)
                        except ET.ParseError as pe:
                            report.errors.append(f"Erro de sintaxe XML no arquivo {name}: {pe}")

        except zipfile.BadZipFile:
            report.is_valid = False
            report.errors.append("Arquivo EPUB corrompido ou formato zip inválido.")

        # 2. Execução opcional do EPUBCheck se disponível no sistema
        epubcheck_bin = shutil.which("epubcheck")
        if epubcheck_bin:
            try:
                result = subprocess.run(
                    [epubcheck_bin, str(path)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=30
                )
                report.epubcheck_executed = True
                report.epubcheck_output = result.stdout
                if result.returncode != 0:
                    report.warnings.append(f"EPUBCheck reportou pendências:\n{result.stdout}")
            except Exception as e:
                report.warnings.append(f"Falha ao executar EPUBCheck: {e}")

        if report.errors:
            report.is_valid = False

        return report
