# 🗺️ Roadmap - Admin Ofertas

> Documento central do projeto. Mantido pela IA da Adapta ONE para contexto entre sessões.

## ✅ Status Atual — Concluído

- Autenticação JWT com multi-tenant
- CRUD completo de produtos (API + frontend com listagem, cadastro, edição, paginação, busca)
- CRUD completo de filiais (stores) com modal de cadastro/edição
- CRUD completo de categorias
- Tela de importação CSV com abas (Ofertas / Filiais / Categorias)
- Importação de ofertas via CSV com validações (preço, warnings)
- Importação de filiais via CSV (criação ou atualização por slug)
- Importação de categorias via CSV
- Dashboard com métricas básicas
- Navegação entre páginas (voltar em todas as páginas)
- Modal de edição de produtos
- Correção de CORS (PUT, DELETE, PATCH, OPTIONS)
- Pipeline CI/CD completo do frontend (git push → build GHCR → webhook Portainer → redeploy)
- Pipeline CI/CD da API
- Portainer Enterprise Edition com Re-pull image e Force redeployment
- Registry ghcr.io configurado no Portainer
- Deploy em Docker Swarm com Traefik + Let's Encrypt

## 🏗️ Backend — Rotas da API

### /auth
- `POST /auth/login` — Login JWT

### /products
- `GET /products` — Listar (paginação, busca)
- `GET /products/:id` — Detalhe
- `POST /products` — Criar
- `PUT /products/:id` — Atualizar
- `DELETE /products/:id` — Excluir

### /stores
- `GET /stores` — Listar
- `GET /stores/:id` — Detalhe
- `POST /stores` — Criar
- `PUT /stores/:id` — Atualizar
- `DELETE /stores/:id` — Excluir

### /categories
- `GET /categories` — Listar (paginação, busca)
- `GET /categories/:id` — Detalhe
- `POST /categories` — Criar
- `PUT /categories/:id` — Atualizar
- `DELETE /categories/:id` — Excluir

### /offers
- `GET /offers` — Listar (paginação, filtros)
- `GET /offers/:id` — Detalhe
- `POST /offers` — Criar
- `PUT /offers/:id` — Atualizar
- `DELETE /offers/:id` — Excluir

### /imports
- `POST /imports/csv` — Importar ofertas via CSV
- `POST /imports/stores` — Importar filiais via CSV
- `POST /imports/categories` — Importar categorias via CSV

## 🗺️ Roadmap de Funcionalidades

### Prioridade 1 — Gerenciamento Visual de Ofertas
Interface para criar, editar e gerenciar ofertas visualmente. Preço de/para, período de validade, destaque.
- **Complexidade:** Média

### Prioridade 2 — Upload de imagens dos produtos
O schema tem `image_url` e `media_assets`. `@fastify/multipart` já registrado.
- **Complexidade:** Média

### Prioridade 3 — Dashboard com métricas e gráficos
Indicadores reais (produtos com oferta ativa, ofertas por loja, distribuição por categoria).
- **Complexidade:** Média

### Prioridade 4 — Exportação de relatórios
Gerar planilhas com ofertas vigentes, produtos sem oferta, filiais inativas.
- **Complexidade:** Baixa

### Prioridade 5 — API de integração com ERPs
Endpoint REST para que ERPs enviem dados diretamente sem depender de CSV.
- **Complexidade:** Alta

## 🤖 Roadmap de IA

### 1 — Busca automática de imagens via IA
Prioridade: Média | Impacto: Alto
Nome + código de barras → busca web → preview no frontend.

### 2 — Sugestão de categoria por IA
Prioridade: Baixa | Impacto: Médio
Sugestão automática baseada no nome do produto.

### 3 — Geração de descrição de produto
Prioridade: Baixa | Impacto: Médio
Descrição comercial a partir de nome, unidade e categoria.

### 4 — Enriquecimento por código de barras
Prioridade: Média | Impacto: Alto
Consulta a APIs públicas pelo EAN (marca, fabricante).

### 5 — Sugestão de paleta de cores a partir da logo
Prioridade: Média | Impacto: Alto
Ao fazer upload da logo da empresa, o sistema analisa as cores predominantes e sugere uma paleta completa (primária, secundária, destaque, fundo, texto) para personalizar a interface do cliente final ou portal de ofertas.

### 6 — Ofertas inteligentes
Prioridade: Alta | Impacto: Muito Alto
Sugestão de preços promocionais baseada em histórico e sazonalidade.

---
*Última atualização: 18/05/2026*
*Este arquivo serve como índice central do projeto. Mantido nos dois repositórios.*