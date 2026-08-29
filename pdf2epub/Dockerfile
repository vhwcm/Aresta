FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Instalar PyTorch CPU otimizado
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baixar checkpoint de pesos neurais YOLO
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

COPY src/ ./src/
COPY pyproject.toml .

ENV PYTHONPATH=/app/src
ENV DOCLAYOUT_YOLO_MODEL=/app/yolov8n.pt
EXPOSE 8000

CMD ["uvicorn", "pdf2epub.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
