const { getAllConfigs, setConfig, deleteConfig, invalidateCache } = require('../lib/config')

const adminRoutes = async function (fastify, opts) {

  // GET /admin/config
  fastify.get('/config', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const configs = await getAllConfigs()
    return configs
  })

  // GET /admin/config/:category
  fastify.get('/config/:category', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { prisma } = require('../prisma')
    const configs = await prisma.system_configs.findMany({
      where: { category: request.params.category },
      orderBy: { key: 'asc' }
    })
    return configs.map(c => ({ ...c, value: c.is_secret ? '••••••••' : c.value }))
  })

  // PUT /admin/config/:category/:key
  fastify.put('/config/:category/:key', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { category, key } = request.params
    const { value, is_secret, description } = request.body
    const config = await setConfig(category, key, value, { is_secret, description })
    return config
  })

  // POST /admin/config
  fastify.post('/config', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { category, key, value, is_secret, description } = request.body
    if (!category || !key || value === undefined) {
      return reply.code(400).send({ error: 'Campos obrigatórios: category, key, value' })
    }
    const config = await setConfig(category, key, value, { is_secret, description })
    return reply.code(201).send(config)
  })

  // DELETE /admin/config/:category/:key
  fastify.delete('/config/:category/:key', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { category, key } = request.params
    await deleteConfig(category, key)
    return { message: 'Configuração removida' }
  })

  // POST /admin/config/reload
  fastify.post('/config/reload', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    invalidateCache()
    return { message: 'Cache invalidado' }
  })
}

module.exports = adminRoutes