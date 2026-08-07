#!/usr/bin/env bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   Configurando Quality Gates (Pre-commit)    ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. Verificar se o pre-commit está instalado, se não, instalar via pip
if ! command -v pre-commit >/dev/null 2>&1; then
    echo -e "${YELLOW}[pre-commit] Ferramenta não encontrada no PATH. Instalando via pip...${NC}"
    python3 -m pip install --user pre-commit
    export PATH="$HOME/.local/bin:$PATH"
fi

if ! command -v pre-commit >/dev/null 2>&1; then
    echo -e "${RED}[ERRO] Falha ao localizar o comando pre-commit após a instalação.${NC}"
    echo -e "${YELLOW}Certifique-se de que \$HOME/.local/bin está no seu PATH.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ pre-commit encontrado:${NC} $(pre-commit --version)"

# 2. Instalar dependências npm no frontend se necessário
if [ ! -d "front/node_modules/eslint" ]; then
    echo -e "${YELLOW}[Frontend] Instalando dependências de dev (ESLint)...${NC}"
    (cd front && npm install)
fi

# 3. Instalar os git hooks (pre-commit e pre-push)
echo -e "${YELLOW}[Git Hooks] Instalando hooks no repositório...${NC}"
pre-commit install --hook-type pre-commit --hook-type pre-push

echo -e "\n${GREEN}✓ Quality Gates configurados com sucesso!${NC}"
echo -e "${BLUE}Hooks ativos:${NC}"
echo -e "  - ${YELLOW}pre-commit:${NC} Validação de arquivos, tamanho de métodos/classes e identação."
echo -e "  - ${YELLOW}pre-push:${NC}   Typecheck, testes frontend (Vitest) e testes backend (Gradle)."
