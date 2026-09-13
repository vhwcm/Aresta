# Guia de Deploy e Configuração na AWS (EC2 Free Tier)

Este guia orienta o provisionamento, configuração de segurança, instalação de dependências e inicialização do monólito **Aresta** em uma instância **AWS EC2**.

---

## 1. Arquitetura de Deploy na AWS

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ AWS Cloud (Free Tier)                                                       │
│                                                                             │
│  Security Group (Firewall)                                                  │
│   ├── Porta 22  (SSH)         -> Acesso ao Terminal                        │
│   └── Porta 80  / 443 (HTTP/S)-> Tráfego Seguro Web (SSL Let's Encrypt)     │
│                                                                             │
│  Instância EC2 (Ubuntu 24.04 LTS - t3.small / t2.micro)                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Docker Compose Engine                                                 │  │
│  │  ├── [Container] aresta-caddy (Caddy Reverse Proxy & SSL Automático)  │  │
│  │  │     ├── https://aresta.duckdns.org/      -> aresta-web:80          │  │
│  │  │     └── https://aresta.duckdns.org/api/* -> aresta-api:3001        │  │
│  │  ├── [Container] aresta-db (PostgreSQL 16 + pgvector)                 │  │
│  │  ├── [Container] apps/api  (Node.js / Express / Prisma)              │  │
│  │  └── [Container] apps/web  (Nuxt 3 / Tailwind CSS)                   │  │
│  │                                                                       │  │
│  │ Memória Swap: 2GB (Estabilidade durante builds de containers)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Acesso à Instância (Local)

A chave privada `.pem` está armazenada com segurança em:
`~/.aresta/chave-ssh-aws/aresta-key.pem`

Para conectar à máquina pelo seu terminal local, execute:

```bash
npm run connect-aws
```

Ou conecte diretamente via **Remote Explorer / SSH** no VS Code / IDE selecionando o host `aresta-aws`.

---

## 3. Setup Inicial do Servidor (Dentro da EC2)

Após conectar no terminal da instância Ubuntu na AWS, execute os passos abaixo:

### Passo 1: Atualizar o Sistema e Instalar Pacotes Essenciais
```bash
# Atualizar listas e pacotes existentes
sudo apt update && sudo apt upgrade -y

# Instalar Docker, Docker Compose (v2) e Git
sudo apt install -y docker.io docker-compose-v2 git

# Permitir execução do Docker sem 'sudo'
sudo usermod -aG docker ubuntu
newgrp docker
```

---

### Passo 2: Configurar Memória Swap (Recomendado)
A compilação do frontend (Nuxt / Vite) pode consumir bastante memória temporária. Configure 2GB de Swap para evitar travamentos por falta de RAM:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Passo 3: Clonar e Subir o Monólito Aresta

```bash
# 1. Clonar o repositório
git clone https://github.com/vhwcm/Aresta.git
cd Aresta

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e informe o IP/DNS público da EC2:
# NUXT_PUBLIC_API_URL=http://SEU_IP_PUBLICO:3001
# GEMINI_API_KEY=sua-chave

# 3. Subir todos os serviços com Docker Compose
docker compose up -d --build
```

O frontend é uma aplicação estática e recebe a URL da API durante o build.
Por isso, `NUXT_PUBLIC_API_URL` deve apontar para o endereço que o navegador do
usuário consegue acessar, e não para `http://aresta-api:3001` (esse nome só
existe na rede interna do Docker).

---

## 4. Endpoints e URLs de Acesso

Após subir os containers com o Caddy, a aplicação estará disponível de forma segura em:

* **Aplicação Web (Nuxt + HTTPS)**:
  `https://aresta.duckdns.org`
* **API Backend (Express + HTTPS)**:
  `https://aresta.duckdns.org/api`
* **Healthcheck da API**:
  `https://aresta.duckdns.org/health`
* **OAuth Callback (Google)**:
  `https://aresta.duckdns.org/api/auth/google/callback`

---

## 5. Manutenção e Comandos Úteis

```bash
# Ver status dos containers
docker compose ps

# Visualizar logs em tempo real
docker compose logs -f

# Parar os serviços
docker compose down

# Atualizar com novas versões do git
git pull origin main
docker compose up -d --build
```
