# 📦 api-ofertas — Documentação Técnica

> Backend do sistema Admin Ofertas — API REST para gestão de ofertas de supermercado

## 📋 Visão Geral

API REST com Fastify + Prisma + PostgreSQL. Multi-tenant para produtos, filiais, categorias e ofertas com importação CSV.

## 🛠️ Stack

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 20 (Alpine) | Runtime |
| Fastify | ^5.8.5 | Framework HTTP |
| Prisma | ^6.19.3 | ORM + Migrations |
| PostgreSQL | — | Banco de dados |
| @fastify/jwt | ^10.0.0 | Autenticação JWT |
| csv-parse | ^6.2.1 | Parsing CSV |
| bcrypt | ^6.0.0 | Hash de senhas |
| @fastify/cors | ^11.2.0 | CORS |
| @fastify/multipart | ^10.0.0 | Upload |

## 📁 Estrutura
api-ofertas/
.github/workflows/       CI/CD
lib/                     auth middleware
prisma/                  schema + migrations
routes/
auth.js                login JWT
products.js            CRUD produtos
stores.js              CRUD filiais
categories.js          CRUD categorias
offers.js              CRUD ofertas
server.js                entry point + imports
prisma.js                Prisma Client
package.json
Dockerfile
docker-compose.yml


## 🗄️ Modelo

**tenants** — id (UUID), name, slug, domain, is_active
**users** — id (UUID), tenant_id (FK), name, email, password_hash, role
**stores** — id (UUID), tenant_id (FK), name, slug, city, state, address, phone, is_active
**categories** — id (UUID), tenant_id (FK), name, slug, is_active
**products** — id (UUID), tenant_id (FK), category_id (FK), internal_code, barcode, name, unit, is_active
**offers** — id (UUID), tenant_id (FK), store_id (FK), product_id (FK), price_from, price_to, starts_at, ends_at, is_featured
**csv_imports** — id (UUID), tenant_id (FK), file_url, status, rows, errors (JSON)
**media_assets** — id (UUID), tenant_id (FK), product_id (FK), file_url, file_type

## 🔐 Autenticação

JWT com authenticate/authorize('admin'). Multi-tenant por header Host.

## 🐳 Docker

Dockerfile: node:20-alpine → npm install → npx prisma generate → node server.js
docker-compose: app + postgresql

## 🔄 CI/CD

Push main → GitHub Actions → ghcr.io → webhook Portainer → Swarm

## 🌐 Deploy

Docker Swarm + Traefik + Let's Encrypt + Portainer EE

## 📡 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | /auth/login | Público | Login |
| GET | /products | JWT | Listar (page, limit, search) |
| GET | /products/:id | JWT | Detalhe |
| POST | /products | JWT+Admin | Criar |
| PUT | /products/:id | JWT+Admin | Atualizar |
| DELETE | /products/:id | JWT+Admin | Excluir |
| GET | /stores | JWT | Listar |
| GET | /stores/:id | JWT | Detalhe |
| POST | /stores | JWT+Admin | Criar |
| PUT | /stores/:id | JWT+Admin | Atualizar |
| DELETE | /stores/:id | JWT+Admin | Excluir |
| GET | /categories | JWT | Listar |
| GET | /categories/:id | JWT | Detalhe |
| POST | /categories | JWT+Admin | Criar |
| PUT | /categories/:id | JWT+Admin | Atualizar |
| DELETE | /categories/:id | JWT+Admin | Excluir |
| GET | /offers | JWT | Listar |
| GET | /offers/:id | JWT | Detalhe |
| POST | /offers | JWT+Admin | Criar |
| PUT | /offers/:id | JWT+Admin | Atualizar |
| DELETE | /offers/:id | JWT+Admin | Excluir |
| POST | /imports/csv | JWT | Importar ofertas |
| POST | /imports/stores | JWT | Importar filiais |
| POST | /imports/categories | JWT | Importar categorias |
| GET | / | Público | Health check |

---
Documentação gerada em 18/05/2026.
