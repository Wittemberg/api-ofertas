# 🗺️ Roadmap - Admin Ofertas
> Documento central do projeto. Mantido pela IA da Adapta ONE para contexto entre sessões.

## ✅ Status Atual — Concluído

### Sprint 1 — Gerenciamento Visual de Ofertas
- Modal CRUD de ofertas (produto, loja, preços, datas, destaque)
- Adicionado `updateOffer` e `getOffer` na API do frontend

### Sprint 2 — Upload de Imagens (MinIO S3)
- Rota `POST /upload/product/:id` no backend com `@aws-sdk/client-s3`
- Upload para MinIO S3
- Seção de imagem no modal de edição de produtos
- Coluna "Imagem" com botão "🔗 Ver" na tabela
- Modal de preview em tela cheia
- Rotas faltantes registradas no server.js (categories, upload, dashboard)

### Sprint 3 — Dashboard com Métricas e Gráficos
- 4 cards métricos (Produtos, Lojas, Categorias, Ofertas)
- Totalizador de ofertas em destaque
- Gráfico de barras "Ofertas por Loja"
- Gráfico de barras "Produtos por Categoria"
- Navegação rápida com links para todas as páginas
- Link "Importar CSV" incluso no dashboard
- Dashboard.jsx reescrito com cards clicáveis (links)

### Sprint 4 — Exportação de Relatórios
- Endpoint `GET /reports/active-offers` — ofertas vigentes
- Endpoint `GET /reports/without-offers` — produtos sem oferta ativa
- Endpoint `GET /reports/inactive-stores` — filiais inativas
- Página `/relatorios` com 3 cards de download CSV
- Exportação CSV nativa (sem dependências, abre no Excel)
- Rota no App.jsx + link no Dashboard

### Sprint 5 — API de Integração com ERPs
- Schema: tabelas `api_keys` e `integration_logs` no PostgreSQL
- Middleware `authenticateApiKey` em `lib/auth.js` (header `X-API-Key`)
- Endpoint único `POST /api/v1/integration/import`
  - Importação em lote de stores, categories, products e offers
  - Upsert por slug (stores/categories) e internal_code/barcode (products)
  - Resolução automática de produto por código na oferta
  - Validação individual por registro (erros não bloqueiam o lote)
  - Relatório detalhado de created/updated/errors/warnings
- Idempotência via `idempotency_key`
- Endpoint `GET /api/v1/integration/status/:idempotency_key`
- Geração de API Key via `POST /auth/api-keys` (mostrada 1 vez)
- Listagem e revogação de chaves
- Página `/api-keys` no frontend com gerenciamento completo
- Cópia automática da chave para área de transferência ao clicar
- Rate limit: 10 requisições/minuto por chave
- Tabela `integration_logs` registra toda requisição (IP, status, sumário)
- Workflow CI/CD da API com SSH para migrations via `appleboy/ssh-action`

### Funcionalidades Base (Sprints Anteriores)
- Autenticação JWT com multi-tenant
- CRUD completo de produtos, filiais (stores), categorias
- Tela de importação CSV com abas (Ofertas / Filiais / Categorias)
- Importação de ofertas via CSV com validações (preço, warnings)
- Importação de filiais via CSV (criação ou atualização por slug)
- Importação de categorias via CSV
- Dashboard com métricas básicas + navegação entre páginas
- Modal de edição de produtos
- Correção de CORS (PUT, DELETE, PATCH, OPTIONS)
- Pipeline CI/CD do frontend e da API (git push → build GHCR → webhook Portainer → redeploy)
- Portainer Enterprise Edition com Re-pull image e Force redeployment
- Registry ghcr.io configurado no Portainer
- Deploy em Docker Swarm com Traefik + Let's Encrypt

---

## 🗺️ Roadmap de Funcionalidades

| # | Item | Complexidade | Status |
|---|---|---|---|
| 1 | Gerenciamento Visual de Ofertas | Média | ✅ Concluído |
| 2 | Upload de imagens (MinIO S3) | Média | ✅ Concluído |
| 3 | Dashboard com métricas e gráficos | Média | ✅ Concluído |
| 4 | Exportação de relatórios | Baixa | ✅ Concluído |
| 5 | API de integração com ERPs | Alta | ✅ Concluído |
| **6** | **Configurações da Empresa (Branding + Dados Públicos)** | **Média** | **⬅️ Em andamento** |
| 7 | Webhook de callback para notificar ERP | Média | ⏸️ Pausado |
| 8 | Documentação pública Swagger/OpenAPI | Baixa | ⏸️ Pausado |
| 9 | Site público do cliente (vitrine de ofertas) | Alta | Pendente |
| 10 | Painel de analytics para o cliente | Média | Pendente |

### Detalhamento — Próximas Features

#### 6 — Configurações da Empresa (Branding + Dados Públicos)
**Complexidade:** Média | **Status:** ⬅️ Em andamento
Tela de administração para o cliente configurar:
- Informações gerais da empresa (descrição, contato, endereço)
- Upload de logo
- Paleta de cores (pré-preenchida por IA com base na logo)
- Redes sociais e horários de funcionamento
- Fonte e identidade visual
- Preview em tempo real do site público

#### 7 — Webhook de callback
**Complexidade:** Média | **Status:** ⏸️ Pausado
Notificar o ERP quando uma importação for processada de forma assíncrona.

#### 8 — Documentação pública da API de Integração
**Complexidade:** Baixa | **Status:** ⏸️ Pausado
Gerar documentação Swagger/OpenAPI para o endpoint `/api/v1/integration/import`.

#### 9 — Site público do cliente
**Complexidade:** Alta
Portal público onde o consumidor final navega por ofertas, lojas e categorias. Consumirá os dados configurados nas Configurações da Empresa.

---

## 🤖 Roadmap de IA

| # | Item | Prioridade | Impacto | Status |
|---|---|---|---|---|
| 1 | 🎨 **Extração de paleta de cores a partir da logo** | **Alta** | **Alto** | **⬅️ Em andamento** |
| 2 | Busca automática de imagens (nome + código de barras) | Média | Alto | Pendente |
| 3 | Sugestão de categoria por IA | Baixa | Médio | Pendente |
| 4 | Geração de descrição de produto | Baixa | Médio | Pendente |
| 5 | Enriquecimento por código de barras (consulta API pública EAN) | Média | Alto | Pendente |
| 6 | Ofertas inteligentes (preços baseados em histórico) | Alta | Muito Alto | Pendente |

### Detalhamento — Roadmap de IA

#### 1 — Extração de paleta de cores a partir da logo
Quando o cliente fizer upload da logo, a IA analisa a imagem e extrai as cores dominantes para pré-preencher os campos de paleta (primary, secondary, accent, background, text).

#### 2 — Busca automática de imagens via IA
Nome + código de barras → busca web → preview no frontend.

#### 3 — Sugestão de categoria por IA
Sugestão automática baseada no nome do produto.

#### 4 — Geração de descrição de produto
Descrição automática baseada em nome, categoria e código de barras.

#### 5 — Enriquecimento por código de barras
Consulta a APIs públicas pelo EAN (marca, fabricante, imagem).

#### 6 — Ofertas inteligentes
Sugestão de preço promocional baseado em histórico e margem.