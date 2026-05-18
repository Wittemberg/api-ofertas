const { prisma } = require('../prisma');

const categoriesRoutes = async function (fastify, opts) {
  // GET / - Listar categorias
  fastify.get('/', {
    preHandler: fastify.authenticate,
    async handler(request, reply) {
      const { page = 1, limit = 20, search } = request.query;
      const skip = (page - 1) * limit;
      const tenant_id = request.tenant.id;
      const where = { tenant_id };

      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      const [categories, total] = await Promise.all([
        prisma.categories.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { name: 'asc' }
        }),
        prisma.categories.count({ where })
      ]);

      return { categories, total, page: parseInt(page), limit: parseInt(limit) };
    }
  });

  // GET /:id - Detalhe
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
    async handler(request, reply) {
      const category = await prisma.categories.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id }
      });
      if (!category) return reply.code(404).send({ error: 'Categoria não encontrada' });
      return category;
    }
  });

  // POST / - Criar
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const { name, slug, is_active } = request.body;
      if (!name || !slug) {
        return reply.code(400).send({ error: 'Nome e slug são obrigatórios' });
      }
      const category = await prisma.categories.create({
        data: {
          name,
          slug,
          is_active: is_active ?? true,
          tenant_id: request.tenant.id
        }
      });
      return reply.code(201).send(category);
    }
  });

  // PUT /:id - Atualizar
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const category = await prisma.categories.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id }
      });
      if (!category) return reply.code(404).send({ error: 'Categoria não encontrada' });

      const updated = await prisma.categories.update({
        where: { id: request.params.id },
        data: request.body
      });
      return updated;
    }
  });

  // DELETE /:id - Excluir
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')],
    async handler(request, reply) {
      const category = await prisma.categories.findFirst({
        where: { id: request.params.id, tenant_id: request.tenant.id }
      });
      if (!category) return reply.code(404).send({ error: 'Categoria não encontrada' });

      await prisma.categories.delete({ where: { id: request.params.id } });
      return reply.code(204).send();
    }
  });
};

module.exports = categoriesRoutes;