const { prisma } = require('../prisma');

const storeRoutes = async function (fastify, opts) {
  fastify.get('/', { preHandler: fastify.authenticate }, async function (request, reply) {
    const stores = await prisma.stores.findMany({
      where: { tenant_id: request.tenant.id },
      orderBy: { name: 'asc' }
    });
    return stores;
  });

  fastify.get('/:id', { preHandler: fastify.authenticate }, async function (request, reply) {
    const store = await prisma.stores.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!store) return reply.code(404).send({ error: 'Store not found' });
    return store;
  });

  fastify.post('/', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { name, slug, city, state, address, phone } = request.body;
    if (!name || !slug) return reply.code(400).send({ error: 'Name and slug are required' });

    const store = await prisma.stores.create({
      data: { name, slug, city, state, address, phone, tenant_id: request.tenant.id }
    });
    return reply.code(201).send(store);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const store = await prisma.stores.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!store) return reply.code(404).send({ error: 'Store not found' });

    const updated = await prisma.stores.update({
      where: { id: request.params.id },
      data: request.body
    });
    return updated;
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const store = await prisma.stores.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!store) return reply.code(404).send({ error: 'Store not found' });
    await prisma.stores.delete({ where: { id: request.params.id } });
    return reply.code(204).send();
  });
};

module.exports = storeRoutes;