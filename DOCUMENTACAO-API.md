# 📦 api-ofertas — Documentação Técnica

> API Fastify + Prisma + PostgreSQL para gestão de ofertas de supermercados.
> Deploy em Docker Swarm com Traefik + Let's Encrypt.

---

## 🔐 Autenticação

### JWT (usuários)
- Login: `POST /auth/login` → retorna `{ user, token }`
- Middleware: `fastify.authenticate` decodifica JWT, verifica `decoded.sub` e busca usuário ativo
- Autorização: `fastify.authorize(...roles)` — verifica `user.role` contra lista de roles permitidas
- Guards usados: `authorize('admin')` e `authorize('superadmin')`

### API Key (integração ERPs)
- Header: `X-API-Key` com hash bcrypt armazenado
- Middleware: `fastify.authenticateApiKey` — verifica prefixo + hash
- Rate limit: 10 req/min por chave

---

## 🗄️ Models (Prisma ORM)

| Model | Tabela | Finalidade |
|---|---|---|
| `tenants` | `tenants` | Multi-tenant, dados da empresa, identidade visual |
| `users` | `users` | Usuários do painel, role `admin` ou `superadmin` |
| `stores` | `stores` | Filiais (lojas) |
| `categories` | `categories` | Categorias de produtos |
| `products` | `products` | Produtos (código interno, EAN, nome, unidade) |
| `offers` | `offers` | Ofertas (preço de/para, período, loja) |
| `csv_imports` | `csv_imports` | Histórico de importações CSV |
| `media_assets` | `media_assets` | Assets de mídia (imagens, etc.) |
| `api_keys` | `api_keys` | Chaves de API para integração |
| `integration_logs` | `integration_logs` | Log de requisições de integração |
| `system_configs` | `system_configs` | Configurações do sistema (cache + fallback env) |
| `audit_logs` | `audit_logs` | Auditoria de alterações no Super Admin |

---

## 📡 Endpoints

### Auth (`/auth`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | API Key | Login (email + senha) → JWT |
| POST | `/auth/register` | API Key | Registro de novo usuário |
| POST | `/auth/change-password` | JWT (qualquer) | Alterar própria senha |
| GET | `/auth/me` | JWT | Dados do usuário logado |
| POST | `/auth/api-keys` | JWT (admin) | Gerar nova API Key |
| GET | `/auth/api-keys` | JWT (admin) | Listar chaves |
| DELETE | `/auth/api-keys/:id` | JWT (admin) | Revogar chave |

### Admin — System Configs (`/admin`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/admin/config` | JWT (superadmin) | Lista todas as configs (secreto mascarado) |
| GET | `/admin/config/:category` | JWT (superadmin) | Lista configs de uma categoria |
| PUT | `/admin/config/:category/:key` | JWT (superadmin) | Atualiza config + registra audit log |
| POST | `/admin/config` | JWT (superadmin) | Cria nova config + registra audit log |
| DELETE | `/admin/config/:category/:key` | JWT (superadmin) | Remove config + registra audit log |
| POST | `/admin/config/reload` | JWT (superadmin) | Invalida o cache |

### Admin — Auditoria (`/admin`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/admin/audit` | JWT (superadmin) | Lista logs de auditoria (paginado, filtrável) |

### Reports (`/reports`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/reports/active-offers` | JWT | Ofertas vigentes (CSV) |
| GET | `/reports/without-offers` | JWT | Produtos sem oferta ativa (CSV) |
| GET | `/reports/inactive-stores` | JWT | Lojas inativas (CSV) |

### Integration (`/api/v1/integration`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/v1/integration/import` | API Key | Importação em lote (stores/categories/products/offers) |
| GET | `/api/v1/integration/status/:idempotency_key` | API Key | Status de importação |

---

## ⚙️ System Configs — Chain de Resolução
1. Banco (system_configs) ← painel Super Admin
2. Env vars (STORAGE_ENDPOINT, etc.) ← docker-compose
3. Hardcoded fallback ← código


Categorias: `storage`, `database`, `geral`, `email`

---

## 🧠 Auditoria (audit_logs)

Toda operação de escrita em `/admin/config` registra:

| Campo | Descrição |
|---|---|
| `user_id` | UUID do superadmin que fez a ação |
| `action` | `create_config`, `update_config`, `delete_config` |
| `entity_id` | `{category}.{key}` (ex: `storage.endpoint`) |
| `old_value` | Valor antes da alteração |
| `new_value` | Valor depois da alteração |
| `ip_address` | IP de origem da requisição |

---

## 🐳 Docker & Deploy

| Item | Detalhe |
|---|---|
| Imagem | `ghcr.io/wittemberg/api-ofertas:latest` |
| CI/CD | GitHub Action → build → push GHCR → SSH prisma migrate → Portainer webhook |
| Orquestração | Docker Swarm |
| Proxy | Traefik + Let's Encrypt |
| URL | `https://api-ofertas.wrtec.com.br` |

---

> Documentação gerada em 19/05/2026.

