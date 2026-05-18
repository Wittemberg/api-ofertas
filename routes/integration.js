const { prisma } = require('../prisma')

const integrationRoutes = async function (fastify, opts) {
  // POST /import — endpoint único de importação
  fastify.post('/import', {
    preHandler: [fastify.authenticateApiKey]
  }, async function (request, reply) {
    const tenant_id = request.tenant.id
    const { idempotency_key, stores = [], categories = [], products = [], offers = [] } = request.body

    // Idempotência
    if (idempotency_key) {
      const existing = await prisma.integration_logs.findFirst({
        where: { idempotency_key, tenant_id }
      })
      if (existing) {
        return reply.code(200).send({
          idempotency_key,
          status: existing.summary?.status || 'already_processed',
          message: 'Requisição já processada',
          summary: existing.summary
        })
      }
    }

    const startTime = Date.now()
    const result = {
      stores: { created: 0, updated: 0, errors: 0 },
      categories: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      offers: { created: 0, updated: 0, errors: 0 }
    }
    const errors = []
    const warnings = []

    // Cache de resoluções
    const storeCache = {}
    const catCache = {}
    const productCache = {}

    // 1. Processar stores
    for (const s of stores) {
      try {
        if (!s.slug || !s.name) {
          errors.push({ entity: 'store', reference: s.slug || '(sem slug)', message: 'slug e name são obrigatórios' })
          result.stores.errors++
          continue
        }
        const existing = storeCache[s.slug]
          ? { id: storeCache[s.slug] }
          : await prisma.stores.findFirst({ where: { slug: s.slug, tenant_id } })

        if (existing) {
          await prisma.stores.update({
            where: { id: existing.id },
            data: {
              name: s.name,
              city: s.city || null,
              state: s.state || null,
              address: s.address || null,
              phone: s.phone || null,
              is_active: s.is_active !== false
            }
          })
          storeCache[s.slug] = existing.id
          result.stores.updated++
        } else {
          const created = await prisma.stores.create({
            data: {
              slug: s.slug,
              name: s.name,
              city: s.city || null,
              state: s.state || null,
              address: s.address || null,
              phone: s.phone || null,
              is_active: s.is_active !== false,
              tenant_id
            }
          })
          storeCache[s.slug] = created.id
          result.stores.created++
        }
      } catch (err) {
        errors.push({ entity: 'store', reference: s.slug || '(sem slug)', message: err.message })
        result.stores.errors++
      }
    }

    // 2. Processar categories
    for (const c of categories) {
      try {
        if (!c.slug || !c.name) {
          errors.push({ entity: 'category', reference: c.slug || '(sem slug)', message: 'slug e name são obrigatórios' })
          result.categories.errors++
          continue
        }
        const existing = catCache[c.slug]
          ? { id: catCache[c.slug] }
          : await prisma.categories.findFirst({ where: { slug: c.slug, tenant_id } })

        if (existing) {
          await prisma.categories.update({
            where: { id: existing.id },
            data: { name: c.name, is_active: c.is_active !== false }
          })
          catCache[c.slug] = existing.id
          result.categories.updated++
        } else {
          const created = await prisma.categories.create({
            data: { slug: c.slug, name: c.name, is_active: c.is_active !== false, tenant_id }
          })
          catCache[c.slug] = created.id
          result.categories.created++
        }
      } catch (err) {
        errors.push({ entity: 'category', reference: c.slug || '(sem slug)', message: err.message })
        result.categories.errors++
      }
    }

    // 3. Processar products
    for (const p of products) {
      try {
        if (!p.name) {
          errors.push({ entity: 'product', reference: p.internal_code || p.barcode || '(sem ref)', message: 'name é obrigatório' })
          result.products.errors++
          continue
        }

        // Resolver categoria por slug
        let categoryId = null
        if (p.category_slug) {
          if (catCache[p.category_slug]) {
            categoryId = catCache[p.category_slug]
          } else {
            const cat = await prisma.categories.findFirst({ where: { slug: p.category_slug, tenant_id } })
            categoryId = cat?.id || null
            catCache[p.category_slug] = categoryId
          }
        }

        // Buscar produto existente por internal_code ou barcode
        const whereClauses = []
        if (p.internal_code) whereClauses.push({ internal_code: p.internal_code, tenant_id })
        if (p.barcode) whereClauses.push({ barcode: p.barcode, tenant_id })

        let existing = null
        if (whereClauses.length > 0) {
          existing = await prisma.products.findFirst({ where: { OR: whereClauses } })
        }

        const productData = {
          name: p.name,
          internal_code: p.internal_code || null,
          barcode: p.barcode || null,
          description: p.description || null,
          unit: p.unit || 'UN',
          category_id: categoryId,
          is_active: p.is_active !== false
        }

        if (existing) {
          await prisma.products.update({ where: { id: existing.id }, data: productData })
          productCache[p.internal_code || p.barcode] = existing.id
          result.products.updated++
        } else {
          const created = await prisma.products.create({ data: { ...productData, tenant_id } })
          productCache[p.internal_code || p.barcode] = created.id
          result.products.created++
        }
      } catch (err) {
        errors.push({ entity: 'product', reference: p.internal_code || p.barcode || p.name, message: err.message })
        result.products.errors++
      }
    }

    // 4. Processar offers
    for (const o of offers) {
      try {
        if (!o.product_code || !o.price_to) {
          errors.push({ entity: 'offer', reference: o.product_code || '(sem ref)', message: 'product_code e price_to são obrigatórios' })
          result.offers.errors++
          continue
        }

        // Resolver produto
        let productId = productCache[o.product_code]
        if (!productId) {
          const found = await prisma.products.findFirst({
            where: {
              tenant_id,
              OR: [
                { internal_code: o.product_code },
                { barcode: o.product_code }
              ]
            }
          })
          if (!found) {
            errors.push({ entity: 'offer', reference: o.product_code, message: 'Produto não encontrado' })
            result.offers.errors++
            continue
          }
          productId = found.id
          productCache[o.product_code] = found.id
        }

        // Resolver loja (opcional)
        let storeId = null
        if (o.store_slug) {
          if (storeCache[o.store_slug]) {
            storeId = storeCache[o.store_slug]
          } else {
            const store = await prisma.stores.findFirst({ where: { slug: o.store_slug, tenant_id } })
            storeId = store?.id || null
            storeCache[o.store_slug] = storeId
          }
        }

        const startsAt = o.starts_at ? new Date(o.starts_at) : null
        const endsAt = o.ends_at ? new Date(o.ends_at) : null

        // Buscar oferta existente
        const existingOffer = await prisma.offers.findFirst({
          where: {
            tenant_id,
            product_id: productId,
            store_id: storeId,
            starts_at: startsAt,
            ends_at: endsAt,
            is_active: true
          }
        })

        const offerData = {
          product_id: productId,
          store_id: storeId,
          price_from: o.price_from ? parseFloat(o.price_from) : null,
          price_to: parseFloat(o.price_to),
          starts_at: startsAt,
          ends_at: endsAt,
          is_featured: o.is_featured === true,
          is_active: true
        }

        if (existingOffer) {
          await prisma.offers.update({ where: { id: existingOffer.id }, data: offerData })
          result.offers.updated++
        } else {
          await prisma.offers.create({ data: { ...offerData, tenant_id } })
          result.offers.created++
        }
      } catch (err) {
        errors.push({ entity: 'offer', reference: o.product_code || '(sem ref)', message: err.message })
        result.offers.errors++
      }
    }

    const elapsed = Date.now() - startTime
    const totalErrors = errors.length
    const status = totalErrors > 0 ? 'completed_with_errors' : 'completed'

    // Log da integração
    const logSummary = {
      status,
      stores: result.stores,
      categories: result.categories,
      products: result.products,
      offers: result.offers,
      elapsed_ms: elapsed
    }

    await prisma.integration_logs.create({
      data: {
        tenant_id,
        api_key_id: request.apiKey?.id || null,
        idempotency_key: idempotency_key || null,
        endpoint: '/api/v1/integration/import',
        method: 'POST',
        status_code: 200,
        ip_address: request.ip,
        summary: logSummary,
        errors: errors,
        warnings: warnings
      }
    })

    return reply.code(200).send({
      idempotency_key: idempotency_key || null,
      status,
      summary: result,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    })
  })

  // GET /status/:idempotency_key — consultar resultado
  fastify.get('/status/:idempotency_key', {
    preHandler: [fastify.authenticateApiKey]
  }, async function (request, reply) {
    const log = await prisma.integration_logs.findFirst({
      where: {
        idempotency_key: request.params.idempotency_key,
        tenant_id: request.tenant.id
      }
    })
    if (!log) {
      return reply.code(404).send({ error: 'Nenhum registro encontrado para esta chave de idempotência' })
    }
    return {
      idempotency_key: log.idempotency_key,
      status: log.summary?.status,
      summary: log.summary,
      errors: log.errors,
      warnings: log.warnings,
      created_at: log.created_at
    }
  })
}

module.exports = integrationRoutes