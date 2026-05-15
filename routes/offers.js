const { prisma } = require('../prisma');

const offerRoutes = async function (fastify, opts) {
  // GET / - Listar ofertas
  fastify.get('/', {
    preHandler: fastify.authenticate,
    async handler(request, reply) {
      const { page = 1, limit = 20, store_id, product_id, is_featured, search } = request.query;
      const skip = (page - 1) * limit;
      const tenant_id = request.tenant.id;

      const where = { tenant_id, is_active: true };

      if (store_id) where.store_id = store_id;
      if (product_id) where.product_id = product_id;
      if (is_featured !== undefined) where.is_featured = is_featured === 'true';

      if (search) {
        where.product = { name: { contains: search, mode: 'insensitive' } };
      }

      const [offers, total] = await Promise.all([
        prisma.offers.findMany({
          where,
          skip: parseInt(skip), take: parseInt(limit),
          orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
          include: {
            product: { select: { id: true, name: true, internal_code: true, barcode: true, image_url: true } },
            store: { select: { id: true, name: true, slug: true } }
          }
        }),
        prisma.offers.count({ where })
      ]);

      return { offers, total, page: parseInt(page), limit: parseInt(limit) };
    }
  });

  // GET /:id - Detalhe da oferta
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
    async handler(request, reply) {
      const offer = await prisma.offers.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id },
        include: {
          product: { include: { category: true } },
          store: true
        }
      });
      if (!offer) return reply.code(404).send({ error: 'Oferta não encontrada' });
      return offer;
    }
  });

  // POST / - Criar oferta
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const { product_id, price_to, store_id, price_from, starts_at, ends_at, is_featured } = request.body;
      if (!product_id || !price_to || price_to <= 0) {
        return reply.code(400).send({ error: 'product_id e price_to são obrigatórios' });
      }

      const offer = await prisma.offers.create({
        data: {
          tenant_id: request.tenant.id,
          product_id,
          store_id: store_id || null,
          price_from: price_from || null,
          price_to,
          starts_at: starts_at ? new Date(starts_at) : null,
          ends_at: ends_at ? new Date(ends_at) : null,
          is_featured: is_featured === true,
          is_active: true
        },
        include: {
          product: { select: { id: true, name: true, internal_code: true, barcode: true } },
          store: { select: { id: true, name: true, slug: true } }
        }
      });
      return reply.code(201).send(offer);
    }
  });

  // PUT /:id - Atualizar oferta
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const offer = await prisma.offers.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id }
      });
      if (!offer) return reply.code(404).send({ error: 'Oferta não encontrada' });

      const updated = await prisma.offers.update({
        where: { id: request.params.id },
        data: request.body,
        include: {
          product: { select: { id: true, name: true, internal_code: true, barcode: true } },
          store: { select: { id: true, name: true, slug: true } }
        }
      });
      return updated;
    }
  });

  // DELETE /:id - Excluir oferta (soft delete)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const offer = await prisma.offers.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id }
      });
      if (!offer) return reply.code(404).send({ error: 'Oferta não encontrada' });

      await prisma.offers.update({
        where: { id: request.params.id },
        data: { is_active: false }
      });
      return reply.code(204).send();
    }
  });
};

module.exports = offerRoutes;