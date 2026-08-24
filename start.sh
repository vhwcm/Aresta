#!/usr/bin/env bash

# Configuração de PATH e JAVA_HOME (caso não estejam exportados no ambiente atual)
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

if [ -z "$JAVA_HOME" ]; then
    if [ -d "$HOME/Downloads/idea-IU-262.8665.337/jbr" ]; then
        export JAVA_HOME="$HOME/Downloads/idea-IU-262.8665.337/jbr"
    elif command -v java >/dev/null 2>&1; then
        JAVA_BIN="$(readlink -f "$(command -v java)")"
        export JAVA_HOME="$(dirname "$(dirname "$JAVA_BIN")")"
    fi
fi

# Configuração de cores para os logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}      Iniciando Aresta (Backend & Frontend)   ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Função para encerrar os processos graciosamente ao pressionar Ctrl+C ou ao sair
cleanup() {
    echo -e "\n${YELLOW}[Aresta] Encerrando serviços (Frontend e Backend)...${NC}"
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

# 1. Iniciar Backend (Express.js / Node ou Gradle / Javalin)
if [ -d "$ROOT_DIR/aresta-back-node" ]; then
    echo -e "${GREEN}[Backend]${NC} Iniciando servidor Express em aresta-back-node..."
    (cd "$ROOT_DIR/aresta-back-node" && npm run dev) &
    BACK_PID=$!
else
    echo -e "${GREEN}[Backend]${NC} Iniciando servidor em aresta-back..."
    (cd "$ROOT_DIR/aresta-back" && ./gradlew run) &
    BACK_PID=$!
fi

# 2. Iniciar Frontend (Nuxt 4 / Vue)
echo -e "${GREEN}[Frontend]${NC} Iniciando Nuxt dev server em front..."
(cd "$ROOT_DIR/front" && npm run dev) &
FRONT_PID=$!

echo -e "\n${GREEN}✓ Ambos os serviços foram iniciados!${NC}"
echo -e "${YELLOW}Acesse:${NC}"
echo -e "  • ${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "  • ${BLUE}Backend:${NC}  http://localhost:7070/api/health"
echo -e "${YELLOW}Pressione Ctrl+C a qualquer momento para interromper ambos.${NC}\n"

# Aguardar os processos em segundo plano
wait $BACK_PID $FRONT_PID
