const { prisma } = require('../prisma')

const reportRoutes = async function (fastify, opts) {
  // Relatório 1: Ofertas vigentes
  fastify.get('/active-offers', {
    preHandler: fastify.authenticate
  }, async function (request, reply) {
    const { tenant_id } = request.tenant

    const offers = await prisma.offers.findMany({
      where: { tenant_id, is_active: true },
      include: {
        product: { select: { name: true, internal_code: true, barcode: true, unit: true } },
        store: { select: { name: true, slug: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    return offers.map(o => ({
      produto: o.product?.name || '-',
      codigo_interno: o.product?.internal_code || '-',
      codigo_barras: o.product?.barcode || '-',
      loja: o.store?.name || 'Todas',
      preco_de: o.price_from ? Number(o.price_from) : '-',
      preco_por: Number(o.price_to),
      inicio: o.starts_at ? o.starts_at.toISOString().split('T')[0] : '-',
      fim: o.ends_at ? o.ends_at.toISOString().split('T')[0] : '-',
      destaque: o.is_featured ? 'Sim' : 'Não'
    }))
  })

  // Relatório 2: Produtos sem oferta
  fastify.get('/without-offers', {
    preHandler: fastify.authenticate
  }, async function (request, reply) {
    const { tenant_id } = request.tenant

    const products = await prisma.products.findMany({
      where: { tenant_id, is_active: true },
      include: { category: { select: { name: true } } }
    })

    const productIds = products.map(p => p.id)
    const offers = await prisma.offers.findMany({
      where: { product_id: { in: productIds }, is_active: true },
      select: { product_id: true }
    })
    const productsWithOffer = new Set(offers.map(o => o.product_id))

    const withoutOffers = products.filter(p => !productsWithOffer.has(p.id))

    return withoutOffers.map(p => ({
      nome: p.name,
      codigo_interno: p.internal_code || '-',
      codigo_barras: p.barcode || '-',
      categoria: p.category?.name || '-',
      unidade: p.unit || '-'
    }))
  })

  // Relatório 3: Filiais inativas
  fastify.get('/inactive-stores', {
    preHandler: fastify.authenticate
  }, async function (request, reply) {
    const { tenant_id } = request.tenant

    const stores = await prisma.stores.findMany({
      where: { tenant_id, is_active: false },
      orderBy: { name: 'asc' }
    })

    return stores.map(s => ({
      nome: s.name,
      slug: s.slug,
      cidade: s.city || '-',
      estado: s.state || '-',
      telefone: s.phone || '-'
    }))
  })
}

module.exports = reportRoutes