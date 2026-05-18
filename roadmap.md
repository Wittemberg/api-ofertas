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
- Rate limit: 10 requisições/minuto por chave
- Tabela `integration_logs` registra toda requisição (IP, status, sumário)

### Funcionalidades Base (Sprints Anteriores)
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

---

## 🗺️ Roadmap de Funcionalidades

| # | Item | Complexidade | Status |
|---|---|---|---|
| 1 | Gerenciamento Visual de Ofertas | Média | ✅ Concluído |
| 2 | Upload de imagens (MinIO S3) | Média | ✅ Concluído |
| 3 | Dashboard com métricas e gráficos | Média | ✅ Concluído |
| 4 | Exportação de relatórios | Baixa | ✅ Concluído |
| 5 | API de integração com ERPs | Alta | ✅ Concluído |
| **6** | **Webhook de callback** | **Média** | **⬅️ Próximo** |
| 7 | API de integração — documentação pública (Swagger/OpenAPI) | Baixa | Pendente |

### Detalhamento — Próximos Itens

#### 6 — Webhook de callback
**Complexidade:** Média
Notificar o ERP quando uma importação for processada de forma assíncrona (para lotes futuros > 500 registros). O ERP informa `webhook_url` no payload e o sistema dispara um POST com o resultado quando o processamento concluir.

#### 7 — Documentação pública da API de Integração
**Complexidade:** Baixa
Gerar documentação Swagger/OpenAPI para o endpoint `/api/v1/integration/import` e disponibilizar no próprio domínio da API para consulta pelos ERPs.

---

## 🤖 Roadmap de IA

| # | Item | Prioridade | Impacto | Status |
|---|---|---|---|---|
| 1 | Busca automática de imagens (nome + código de barras) | Média | Alto | Pendente |
| 2 | Sugestão de categoria por IA | Baixa | Médio | Pendente |
| 3 | Geração de descrição de produto | Baixa | Médio | Pendente |
| 4 | Enriquecimento por código de barras (consulta API pública EAN) | Média | Alto | Pendente |
| 5 | Paleta de cores a partir da logo do produto | Média | Alto | Pendente |
| 6 | Ofertas inteligentes (preços baseados em histórico) | Alta | Muito Alto | Pendente |

### Detalhamento — Roadmap de IA

#### 1 — Busca automática de imagens via IA
Nome + código de barras → busca web → preview no frontend.

#### 2 — Sugestão de categoria por IA
Sugestão automática baseada no nome do produto.

#### 3 — Geração de descrição de produto
Descrição automática baseada em nome, categoria e código de barras.

#### 4 — Enriquecimento por código de barras
Consulta a APIs públicas pelo EAN (marca, fabricante, imagem).

#### 5 — Paleta de cores a partir da logo
Extrair paleta dominante da imagem do produto.

#### 6 — Ofertas inteligentes
Sugestão de preço promocional baseado em histórico e margem.