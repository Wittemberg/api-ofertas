const { prisma } = require('../prisma');

async function resolveTenant(domain) {
  if (!domain) return null;
  return prisma.tenants.findFirst({ where: { domain } });
}

const publicRoutes = async function (fastify, opts) {

  // GET /api/public/tenant — Branding + dados do tenant
  fastify.get('/tenant', async function (request, reply) {
    const { domain } = request.query;
    if (!domain) return reply.code(400).send({ error: 'Parâmetro domain é obrigatório' });

    const tenant = await resolveTenant(domain);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      accent_color: tenant.accent_color,
      background_color: tenant.background_color,
      text_color: tenant.text_color
    };
  });

  // GET /api/public/offers — Ofertas ativas
  fastify.get('/offers', async function (request, reply) {
    const { domain, page = 1, limit = 50, store_id, is_featured } = request.query;
    if (!domain) return reply.code(400).send({ error: 'Parâmetro domain é obrigatório' });

    const tenant = await resolveTenant(domain);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const skip = (page - 1) * limit;

    const where = {
      tenant_id: tenant.id,
      ends_at: { gte: new Date() }
    };
    if (store_id) where.store_id = store_id;
    if (is_featured === 'true') where.is_featured = true;

    const [offers, total] = await Promise.all([
      prisma.offers.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, internal_code: true, barcode: true, unit: true, image_url: true, category_id: true } },
          store: { select: { id: true, name: true, slug: true, city: true, state: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.offers.count({ where })
    ]);

    return { total, page: parseInt(page), limit: parseInt(limit), offers };
  });

  // GET /api/public/products — Produtos do tenant
  fastify.get('/products', async function (request, reply) {
    const { domain, page = 1, limit = 50, category_id, search } = request.query;
    if (!domain) return reply.code(400).send({ error: 'Parâmetro domain é obrigatório' });

    const tenant = await resolveTenant(domain);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const skip = (page - 1) * limit;

    const where = { tenant_id: tenant.id };
    if (category_id) where.category_id = category_id;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { internal_code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.products.count({ where })
    ]);

    return { total, page: parseInt(page), limit: parseInt(limit), products };
  });

  // GET /api/public/stores — Lojas do tenant
  fastify.get('/stores', async function (request, reply) {
    const { domain } = request.query;
    if (!domain) return reply.code(400).send({ error: 'Parâmetro domain é obrigatório' });

    const tenant = await resolveTenant(domain);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const stores = await prisma.stores.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      select: { id: true, name: true, slug: true, city: true, state: true, address: true, phone: true },
      orderBy: { name: 'asc' }
    });

    return stores;
  });

  // GET /api/public/categories — Categorias do tenant
  fastify.get('/categories', async function (request, reply) {
    const { domain } = request.query;
    if (!domain) return reply.code(400).send({ error: 'Parâmetro domain é obrigatório' });

    const tenant = await resolveTenant(domain);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const categories = await prisma.categories.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' }
    });

    return categories;
  });

};

module.exports = publicRoutes;