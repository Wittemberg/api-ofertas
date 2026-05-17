# 🗺️ Roadmap - Admin Ofertas

## ✅ Status Atual

- Autenticação JWT com multi-tenant
- CRUD completo de produtos (listagem, cadastro, edição, paginação, busca)
- Importação de ofertas via CSV
- Dashboard básico
- Navegação aprimorada com voltar em todas as páginas e edição via modal
- Correção de CORS (PUT, DELETE, PATCH, OPTIONS)
- Pipeline CI/CD Frontend (GitHub Actions → GHCR → Portainer webhook)
- Pipeline CI/CD API
- Portainer EE com Re-pull image e Force redeployment
- Registry ghcr.io configurado no Portainer
- Docker Swarm + Traefik + Let's Encrypt

## 🏗️ Backend — Rotas Existentes

- **auth.js** — autenticação JWT
- **products.js** — GET /, GET /:id, POST /, PUT /:id, DELETE /:id
- **offers.js** — gestão de ofertas
- **stores.js** — gestão de lojas
- **categories.js** — gestão de categorias

## 🗺️ Roadmap de Funcionalidades

1. **Gerenciamento de Categorias** — Baixa complexidade
2. **Gerenciamento de Lojas** — Baixa complexidade
3. **Upload de imagens dos produtos** — Média complexidade
4. **Gerenciamento visual de ofertas** — Média complexidade
5. **Dashboard com métricas e gráficos** — Média complexidade
6. **Exportação de relatórios** — Baixa complexidade

## 🤖 Roadmap de IA

1. **Busca automática de imagens via IA** — Prioridade Média | Impacto Alto
2. **Sugestão de categoria por IA** — Prioridade Baixa | Impacto Médio
3. **Geração de descrição de produto** — Prioridade Baixa | Impacto Médio
4. **Enriquecimento por código de barras** — Prioridade Média | Impacto Alto
5. **Ofertas inteligentes** — Prioridade Alta | Impacto Muito Alto