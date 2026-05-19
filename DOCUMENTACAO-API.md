# api-ofertas — Documentação Técnica

API Fastify + Prisma + PostgreSQL para gestão de ofertas de supermercados.
Deploy em Docker Swarm com Traefik + Let's Encrypt.

---

## Stack

| PostgreSQL | — | Banco de dados |
| @fastify/cors | ^11.2.0 | CORS |

---

## Autenticação

### JWT (usuários do painel)
- Login: `POST /auth/login` → retorna `{ user, token }`<br/>
- Middleware: `fastify.authenticate` decodifica JWT, verifica `decoded.sub` e busca usuário ativo<br/>
- Autorização: `fastify.authorize(...roles)` — verifica `user.role` contra lista de roles<br/>
- Guards usados: `authorize('admin')` e `authorize('superadmin')`

### API Key (integração ERPs)
- Header: `X-API-Key` com hash bcrypt armazenado<br/>
- Middleware: `fastify.authenticateApiKey` — verifica prefixo + hash<br/>
- Rate limit: 10 req/min por chave

---

## Endpoints Públicos (/api/public) — SEM autenticação

Endpoint criados para consumo pelo site público (app-ofertas). A identificação do tenant é feita pelo header Host.

| GET | /api/public/stores | Lojas do tenant |

GET /api/public/tenant retorna:
- name, description, domain
- Cores: primary_color, secondary_color, accent_color, background_color, text_color
- logo_url, font_family
- Contato, endereço, redes sociais, horários de funcionamento

---

## Endpoints (autenticados)

### Auth (/auth)
| POST | /auth/api-keys | JWT (admin) | Gerar nova API Key |

### Admin — System Configs (/admin)
Todas protegidas com JWT + authorize('superadmin').

| POST | /admin/config | Cria nova config + audit log |

### Admin — Auditoria (/admin)

### Reports (/reports)

### Integration (/api/v1/integration)

---

## Models (Prisma ORM)

| Model | Finalidade 
| products | Produtos (código interno, EAN, nome, unidade) |
| api_keys | Chaves de API para integração com ERPs |

---

## System Configs — Chain de Resolução

1. Banco (system_configs) — painel Super Admin
2. Env vars (STORAGE_ENDPOINT, etc.) — docker-compose
3. Hardcoded fallback — código

Categorias: storage, database, geral, email

---

## Auditoria (audit_logs)

| Campo | Descrição 
| new_value | Valor novo |

---

## Docker e Deploy

| Item | Detalhe 
| URL | https://api-ofertas.wrtec.com.br |

---

> Documentação gerada em 19/05/2026.