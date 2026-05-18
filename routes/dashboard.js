const { prisma } = require('../prisma')

const dashboardRoutes = async function (fastify, opts) {
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async function (request, reply) {
    const tenant_id = request.tenant.id

    const [products, stores, categories, offers, offersByStore, productsByCategory] = await Promise.all([
      prisma.products.count({ where: { tenant_id } }),
      prisma.stores.count({ where: { tenant_id } }),
      prisma.categories.count({ where: { tenant_id } }),
      prisma.offers.findMany({
        where: { tenant_id, is_active: true },
        select: { id: true, is_featured: true, store_id: true, store: { select: { name: true } } }
      }),
      prisma.offers.groupBy({
        by: ['store_id'],
        where: { tenant_id, is_active: true },
        _count: { id: true }
      }),
      prisma.products.groupBy({
        by: ['category_id'],
        where: { tenant_id },
        _count: { id: true }
      })
    ])

    // Buscar nomes das lojas para offersByStore
    const storeIds = offersByStore.map(o => o.store_id)
    const storeNames = storeIds.length > 0
      ? await prisma.stores.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true } })
      : []
    const storeMap = Object.fromEntries(storeNames.map(s => [s.id, s.name]))

    // Buscar nomes das categorias para productsByCategory
    const catIds = productsByCategory.map(p => p.category_id).filter(Boolean)
    const catNames = catIds.length > 0
      ? await prisma.categories.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
      : []
    const catMap = Object.fromEntries(catNames.map(c => [c.id, c.name]))

    const activeOffers = offers.length
    const featuredOffers = offers.filter(o => o.is_featured).length

    return {
      products,
      stores,
      categories,
      offers: activeOffers,
      featuredOffers,
      offers_by_store: offersByStore.map(o => ({
        store_name: storeMap[o.store_id] || 'Desconhecida',
        count: o._count.id
      })),
      products_by_category: productsByCategory.map(p => ({
        category_name: catMap[p.category_id] || 'Sem categoria',
        count: p._count.id
      }))
    }
  })
}

module.exports = dashboardRoutes