# 🗺️ Roadmap — Admin Ofertas
> Documento central do projeto. Mantido pela IA da Adapta ONE para contexto entre sessões.

---

## ✅ Status Atual — Concluído

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

### Sprint 6 — Super Admin System 🆕
#### Infraestrutura e Segurança
- Tabela `system_configs` no PostgreSQL (criada manualmente no banco)
- Tabela `audit_logs` no PostgreSQL (criada manualmente no banco)
- Models `system_configs` e `audit_logs` adicionados ao `prisma/schema.prisma`
- `lib/config.js` — sistema de cache + CRUD (getAllConfigs, setConfig, deleteConfig, invalidateCache)
- Chain de resolução: Banco → Env vars → Hardcoded fallback no código
- `lib/auth.js` — corrigido bug crítico: `decoded.id` → `decoded.sub` (JWT usava `sub` mas o middleware buscava `decoded.id` = `undefined`)

#### Backend — Rotas Admin (`routes/admin.js`)
- `GET /admin/config` — lista todas as configurações (mascara valores secretos)
- `GET /admin/config/:category` — lista configurações de uma categoria
- `PUT /admin/config/:category/:key` — atualiza configuração com registro em audit_logs
- `POST /admin/config` — cria nova configuração com registro em audit_logs
- `DELETE /admin/config/:category/:key` — remove configuração com registro em audit_logs
- `POST /admin/config/reload` — invalida o cache
- Todas as rotas protegidas com `fastify.authorize('superadmin')`

#### Frontend — Tela Super Admin
- `src/api/admin.js` — 5 funções de API (getConfigs, updateConfig, createConfig, deleteConfig, reloadCache)
- `src/pages/SuperAdminConfig.jsx` — tela CRUD completa com:
  - 4 abas de categoria (Storage, Database, Geral, Email)
  - Formulário de criação de nova configuração
  - Edição inline com salvamento individual
  - Exclusão com confirmação
  - Campos secretos mascarados (`••••••••`) com toggle de visualização
  - Botão "Recarregar Cache"
  - Guard de segurança: `user?.role !== 'superadmin'` → bloqueio
- `src/App.jsx` — rota `/super-admin/configuracoes`

#### Auditoria
- Toda alteração (create/update/delete) registra em `audit_logs`:
  - `user_id` — quem fez
  - `action` — o que foi feito (create_config, update_config, delete_config)
  - `entity_id` — qual registro (`{category}.{key}`)
  - `old_value` / `new_value` — diff completo
  - `ip_address` — IP de origem

#### Usuário Super Admin
- Usuário `superadmim@wrtec.com.br` criado com role `superadmin`
- Usuário `admin@portonovo.com` mantém role `admin` (sem acesso ao super admin)

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
- Pipeline CI/CD da API (git push → build GHCR → SSH prisma migrate → webhook Portainer)
- Portainer Enterprise Edition com Re-pull image e Force redeployment
- Registry ghcr.io configurado no Portainer
- Deploy em Docker Swarm com Traefik + Let's Encrypt

---

## 🎯 Próximas Fases

### Fase 7 — Tela de Auditoria 🆕
| Item | Detalhes | Esforço |
|---|---|---|
| **Backend** | `GET /admin/audit` — listar logs com paginação, filtros por ação e entity_id | ~30min |
| **Frontend** | `src/pages/SuperAdminAudit.jsx` — tabela com Data/Hora, Usuário, Ação, Entidade, Valor Antigo, Novo Valor, IP + filtros | ~1h30min |
| **Rota** | `/super-admin/auditoria` no App.jsx | ~5min |
| **Total** | | ~2h |

**Backend — `routes/admin.js`:**
```javascript
fastify.get('/audit', {
  preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
}, async function (request, reply) {
  const { limit = 50, offset = 0, action, entity_id } = request.query
  const where = {}
  if (action) where.action = action
  if (entity_id) where.entity_id = { contains: entity_id }
  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where, orderBy: { created_at: 'desc' },
      take: Math.min(parseInt(limit), 200), skip: parseInt(offset)
    }),
    prisma.audit_logs.count({ where })
  ])
  return { logs, total, limit: parseInt(limit), offset: parseInt(offset) }
})