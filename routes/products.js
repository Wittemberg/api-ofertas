const { prisma } = require('../prisma');

const productRoutes = async function (fastify, opts) {
  fastify.get('/', { preHandler: fastify.authenticate }, async function (request, reply) {
    const { page = 1, limit = 20, search } = request.query;
    const skip = (page - 1) * limit;
    const tenant_id = request.tenant.id;

    const where = { tenant_id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { internal_code: { contains: search } },
        { barcode: { contains: search } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where, skip: parseInt(skip), take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } }
      }),
      prisma.products.count({ where })
    ]);

    return { products, total, page: parseInt(page), limit: parseInt(limit) };
  });

  fastify.get('/:id', { preHandler: fastify.authenticate }, async function (request, reply) {
    const product = await prisma.products.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id },
      include: { category: true }
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return product;
  });

  fastify.post('/', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const { internal_code, barcode, name, category_id, description, unit } = request.body;
    if (!name) return reply.code(400).send({ error: 'Product name is required' });

    const product = await prisma.products.create({
      data: { internal_code, barcode, name, description, unit, category_id, tenant_id: request.tenant.id }
    });
    return reply.code(201).send(product);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const product = await prisma.products.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });

    const updated = await prisma.products.update({
      where: { id: request.params.id },
      data: request.body
    });
    return updated;
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate, fastify.authorize('admin')] }, async function (request, reply) {
    const product = await prisma.products.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    await prisma.products.delete({ where: { id: request.params.id } });
    return reply.code(204).send();
  });
};

module.exports = productRoutes;