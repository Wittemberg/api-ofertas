# 🗺️ Roadmap - Admin Ofertas

17 de maio de 2026

## ✅ Status Atual

Itens já implementados e operacionais no ambiente de produção:

- **Autenticação JWT com multi-tenant:** isolamento de dados por organização.
- **CRUD completo de produtos:** interface frontend com listagem, cadastro, edição, paginação e busca dinâmica.
- **Importação de ofertas via CSV:** processamento em lote de preços e validades.
- **Dashboard básico:** visualização inicial de métricas do sistema.
- **Navegação aprimorada:** funcionalidade de retorno em todas as páginas e fluxo de edição via modal.
- **Correção de CORS:** suporte completo aos métodos **PUT**, **DELETE**, **PATCH** e **OPTIONS** na API.
- **Pipeline CI/CD Frontend:** automação via GitHub Actions integrando build GHCR e webhook Portainer.
- **Pipeline CI/CD API:** automação completa de build e deploy para o backend.
- **Infraestrutura Portainer:** Business Edition (EE) configurado com *Re-pull image* e *Force redeployment*.
- **Registry:** integração direta com **ghcr.io** configurada no Portainer para imagens privadas.
- **Orquestração:** deploy em **Docker Swarm** utilizando **Traefik** como Reverse Proxy e **Let's Encrypt** para SSL automático.

## 🏗️ Backend — Rotas Existentes

Endpoints disponíveis na API para consumo do frontend:

- **auth.js:** gestão de tokens e autenticação.
- **products.js:** operações de listagem (GET /), detalhe (GET /:id), criação (POST /), atualização (PUT /:id) e remoção (DELETE /:id).
- **offers.js:** gestão de ofertas e preços promocionais.
- **stores.js:** gerenciamento de unidades/lojas físicas.
- **categories.js:** organização taxonômica de produtos.

## 🗺️ Roadmap de Funcionalidades

### 1. Gerenciamento de Categorias
Interface para controle das categorias vinculadas aos produtos e ofertas.
- Listagem de categorias com filtro de busca.
- Fluxo de cadastro e edição via modal.
- Controle de status (Ativar/Desativar).
- **Complexidade:** Baixa

### 2. Gerenciamento de Lojas
Interface para gestão das unidades que compõem o tenant.
- Listagem de lojas com dados de contato e localização.
- Cadastro e edição de informações da unidade.
- **Complexidade:** Baixa

### 3. Upload de Imagens dos Produtos
Implementação do fluxo de mídia utilizando o schema existente.
- Integração com `@fastify/multipart` já registrado no backend.
- Utilização dos campos `image_url` e tabela `media_assets`.
- Componente de upload com preview no frontend.
- **Complexidade:** Média

### 4. Gerenciamento Visual de Ofertas
Evolução do sistema para permitir gestão manual além do CSV.
- Interface para criação e edição visual de ofertas.
- Configuração de preço de/para, períodos de validade e destaque (featured).
- Gestão de vigência das promoções.
- **Complexidade:** Média

### 5. Dashboard com Métricas e Gráficos
Evolução da análise de dados para tomada de decisão.
- Indicadores de produtos com ofertas ativas.
- Distribuição de ofertas por loja e categoria.
- Gráficos de volume de promoções.
- **Complexidade:** Média

### 6. Exportação de Relatórios
Ferramentas de extração de dados para conferência offline.
- Geração de planilhas com ofertas vigentes.
- Relatório de produtos sem oferta ou com dados incompletos.
- **Complexidade:** Baixa

## 🤖 Roadmap de IA

### 1. Busca automática de imagens via IA
Automação do catálogo visual para reduzir trabalho manual.
- **Prioridade:** Média | **Impacto:** Alto
- Uso de **Nome + Código de Barras** para busca automatizada na web.
- Serviço de IA para seleção inteligente da melhor imagem (evitando fotos genéricas).
- Endpoint `POST /products/:id/fetch-image` no backend.
- Interface de preview no frontend para aceitar ou recusar a imagem sugerida.

### 2. Sugestão de Categoria por IA
Classificação inteligente de produtos durante o cadastro.
- **Prioridade:** Baixa | **Impacto:** Médio
- Sugestão automática de categoria baseada no processamento de linguagem natural (NLP) do nome do produto.

### 3. Geração de Descrição de Produto
Criação de conteúdo comercial automatizado.
- **Prioridade:** Baixa | **Impacto:** Médio
- IA gera descrições otimizadas a partir do nome, unidade e categoria para uso em apps/sites.

### 4. Enriquecimento por Código de Barras
Integração com bases de dados globais.
- **Prioridade:** Média | **Impacto:** Alto
- Uso do EAN para consultar APIs públicas e preencher automaticamente nome oficial, marca e fabricante.

### 5. Ofertas Inteligentes
Análise preditiva de preços.
- **Prioridade:** Alta | **Impacto:** Muito Alto
- Sugestão de preços promocionais baseada em histórico de vendas, margens de lucro e sazonalidade.

---

*Este arquivo serve como índice central do projeto. A IA da Adapta ONE consulta este roadmap via GitHub para manter o contexto do projeto.*