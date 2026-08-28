#!/usr/bin/env bash

# Configuração de PATH
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

# Configuração de cores para os logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Iniciando Aresta (Backend, Frontend e Conversor)   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Função para encerrar os processos graciosamente ao pressionar Ctrl+C ou ao sair
cleanup() {
    echo -e "\n${YELLOW}[Aresta] Encerrando serviços (Conversor, Frontend e Backend)...${NC}"
    if [ -n "$CONV_PID" ] && kill -0 "$CONV_PID" 2>/dev/null; then
        kill "$CONV_PID" 2>/dev/null
    fi
    if [ -n "$BACK_PID" ] && kill -0 "$BACK_PID" 2>/dev/null; then
        kill "$BACK_PID" 2>/dev/null
    fi
    if [ -n "$FRONT_PID" ] && kill -0 "$FRONT_PID" 2>/dev/null; then
        kill "$FRONT_PID" 2>/dev/null
    fi
    trap - SIGINT SIGTERM EXIT
    exit 0
}

# Registrar o trap para escutar sinais de interrupção
trap cleanup SIGINT SIGTERM EXIT

if [ -f "$ROOT_DIR/pdf2epub/.venv/bin/uvicorn" ]; then
    echo -e "${GREEN}[Conversor]${NC} Iniciando microsserviço Python em pdf2epub (porta 8000)..."
    (cd "$ROOT_DIR/pdf2epub" && PYTHONPATH=src .venv/bin/uvicorn pdf2epub.api.server:app --host 0.0.0.0 --port 8000) &
    CONV_PID=$!
else
    echo -e "${YELLOW}[Conversor]${NC} ⚠ Ambiente virtual Python não encontrado em pdf2epub/.venv."
    echo -e "            ${YELLOW}→ Execute ${BLUE}npm run setup${YELLOW} para configurar o conversor (requer Python 3 instalado).${NC}"
    echo -e "            ${YELLOW}→ Continuando sem o microsserviço conversor...\n${NC}"
fi

# 2. Iniciar Backend (Express.js / Node na porta 7070)
echo -e "${GREEN}[Backend]${NC} Iniciando servidor Express em aresta-back-node (porta 7070)..."
(cd "$ROOT_DIR/aresta-back-node" && npm run dev) &
BACK_PID=$!

# 3. Iniciar Frontend (Nuxt 4 / Vue na porta 3000)
echo -e "${GREEN}[Frontend]${NC} Iniciando Nuxt dev server em front (porta 3000)..."
(cd "$ROOT_DIR/front" && npm run dev) &
FRONT_PID=$!

echo -e "\n${GREEN}✓ Todos os serviços foram iniciados com sucesso!${NC}"
echo -e "${YELLOW}Acesse:${NC}"
echo -e "  • ${BLUE}Frontend:${NC}     http://localhost:3000"
echo -e "  • ${BLUE}Conversor:${NC}    http://localhost:8000/docs"
echo -e "  • ${BLUE}Backend API:${NC}  http://localhost:7070/api/health"
echo -e "  • ${BLUE}Swagger UI:${NC}   http://localhost:7070/api-docs"
echo -e "${YELLOW}Pressione Ctrl+C a qualquer momento para interromper todos.${NC}\n"

# Aguardar os processos em segundo plano
wait $BACK_PID $FRONT_PID $CONV_PID
