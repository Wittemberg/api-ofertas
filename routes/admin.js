const { getAllConfigs, setConfig, deleteConfig, invalidateCache } = require('../lib/config')
const { prisma } = require('../prisma')

const adminRoutes = async function (fastify, opts) {

  // ========================================================================
  // GET /admin/config — Lista todas as configurações (leitura, sem audit)
  // ========================================================================
  fastify.get('/config', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    const configs = await getAllConfigs()
    return configs
  })

  // ========================================================================
  // GET /admin/config/:category — Lista configs de uma categoria (leitura)
  // ========================================================================
  fastify.get('/config/:category', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    const configs = await prisma.system_configs.findMany({
      where: { category: request.params.category },
      orderBy: { key: 'asc' }
    })
    return configs.map(c => ({
      ...c,
      value: c.is_secret ? '••••••••' : c.value
    }))
  })

  // ========================================================================
  // PUT /admin/config/:category/:key — ATUALIZA uma configuração
  // Antes de atualizar, busca o valor ANTIGO. Depois registra no audit_logs.
  // ========================================================================
  fastify.put('/config/:category/:key', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    const { category, key } = request.params
    const { value, is_secret, description } = request.body

    // 1) Busca o valor ANTIGO antes de alterar
    const oldConfig = await prisma.system_configs.findUnique({
      where: { category_key: { category, key } }
    })

    // 2) Salva o novo valor
    const config = await setConfig(category, key, value, { is_secret, description })

    // 3) Registra no AUDIT LOG
    await prisma.audit_logs.create({
      data: {
        user_id: request.user.id,
        action: 'update_config',
        entity_type: 'system_configs',
        entity_id: `${category}.${key}`,
        old_value: oldConfig?.value || null,
        new_value: value,
        ip_address: request.ip
      }
    })

    return config
  })

  // ========================================================================
  // POST /admin/config — CRIA uma nova configuração
  // ========================================================================
  fastify.post('/config', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    const { category, key, value, is_secret, description } = request.body

    if (!category || !key || value === undefined) {
      return reply.code(400).send({ error: 'Campos obrigatórios: category, key, value' })
    }

    const config = await setConfig(category, key, value, { is_secret, description })

    // AUDIT LOG — criação
    await prisma.audit_logs.create({
      data: {
        user_id: request.user.id,
        action: 'create_config',
        entity_type: 'system_configs',
        entity_id: `${category}.${key}`,
        old_value: null,
        new_value: value,
        ip_address: request.ip
      }
    })

    return reply.code(201).send(config)
  })

  // ========================================================================
  // DELETE /admin/config/:category/:key — REMOVE uma configuração
  // ========================================================================
  fastify.delete('/config/:category/:key', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    const { category, key } = request.params

    // 1) Busca o valor ANTES de deletar
    const oldConfig = await prisma.system_configs.findUnique({
      where: { category_key: { category, key } }
    })

    // 2) Deleta
    await deleteConfig(category, key)

    // 3) AUDIT LOG
    await prisma.audit_logs.create({
      data: {
        user_id: request.user.id,
        action: 'delete_config',
        entity_type: 'system_configs',
        entity_id: `${category}.${key}`,
        old_value: oldConfig?.value || null,
        new_value: null,
        ip_address: request.ip
      }
    })

    return { message: 'Configuração removida. Sistema usará valor padrão (env/hardcoded).' }
  })

  // ========================================================================
  // POST /admin/config/reload — Invalida o cache (não altera dados)
  // ========================================================================
  fastify.post('/config/reload', {
    preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
  }, async function (request, reply) {
    invalidateCache()
    return { message: 'Cache invalidado. Próximas leituras buscarão do banco.' }
  })
}

// ========================================================================
// GET /admin/audit — Lista logs de auditoria (paginado, filtrável)
// ========================================================================
fastify.get('/audit', {
  preHandler: [fastify.authenticate, fastify.authorize('superadmin')]
}, async function (request, reply) {
  const { limit = 50, offset = 0, action, entity_id } = request.query
  const where = {}

  if (action) where.action = action
  if (entity_id) where.entity_id = { contains: entity_id }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Math.min(parseInt(limit), 200),
      skip: parseInt(offset)
    }),
    prisma.audit_logs.count({ where })
  ])

  return { logs, total, limit: parseInt(limit), offset: parseInt(offset) }
})

module.exports = adminRoutes