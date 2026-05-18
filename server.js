const Fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const multipart = require("@fastify/multipart");
const { parse } = require("csv-parse/sync");
const { prisma } = require("./prisma");

const app = Fastify({ logger: true });

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
app.register(jwt, { secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production' });
app.register(multipart);

// Decorators compartilhados (precisa ser ANTES dos registers das rotas)
const { authenticate, authorize } = require('./lib/auth')(app);
app.decorate('authenticate', authenticate);
app.decorate('authorize', authorize);

// Route modules
app.register(require('./routes/auth'), { prefix: '/auth' });
app.register(require('./routes/products'), { prefix: '/products' });
app.register(require('./routes/stores'), { prefix: '/stores' });
app.register(require('./routes/offers'), { prefix: '/offers' });

app.addHook("preHandler", async (request, reply) => {
  const host = request.headers.host;
  const tenant = await prisma.tenants.findFirst({
    where: { domain: host }
  });
  if (!tenant) {
    return reply.code(404).send({ error: "Tenant não encontrado" });
  }
  request.tenant = tenant;
});

app.get("/", async (req) => {
  return {
    message: "API funcionando 🚀",
    tenant: req.tenant?.name
  };
});

app.post("/imports/csv", async (req, reply) => {
  const file = await req.file();
  if (!file) {
    return reply.code(400).send({ error: "Arquivo CSV não enviado" });
  }

  const buffer = await file.toBuffer();
  const csvText = buffer.toString("utf-8");

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const errors = [];
  const warnings = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const priceTo = Number(row.price_to);
    const priceFrom = Number(row.price_from);

    if (!row.internal_code && !row.barcode) {
      errors.push({ line, message: "Produto sem código interno e sem código de barras" });
    }

    if (!row.name) {
      errors.push({ line, message: "Produto sem nome" });
    }

    if (!priceTo || priceTo <= 0) {
      errors.push({ line, message: "Preço promocional inválido" });
    }

    if (row.price_to && String(row.price_to).includes(",")) {
      warnings.push({ line, message: "Preço com vírgula detectado. Use ponto decimal, exemplo: 19.90." });
    }

    if (priceFrom && priceTo > priceFrom) {
      warnings.push({ line, message: "Preço promocional maior que o preço original" });
    }

    if (priceFrom && priceTo < priceFrom * 0.4) {
      warnings.push({ line, message: "Preço promocional muito abaixo do preço original. Verifique possível erro de digitação." });
    }

    if (priceFrom && priceTo === priceFrom) {
      warnings.push({ line, message: "Preço promocional igual ao preço original" });
    }
  });

  if (errors.length) {
    const importRecord = await prisma.csv_imports.create({
      data: {
        tenant_id: req.tenant.id,
        file_url: file.filename,
        status: "failed",
        total_rows: rows.length,
        valid_rows: rows.length - errors.length,
        invalid_rows: errors.length,
        warnings,
        errors
      }
    });

    return reply.code(400).send({
      import_id: importRecord.id,
      status: "failed",
      total_rows: rows.length,
      valid_rows: rows.length - errors.length,
      invalid_rows: errors.length,
      warnings,
      errors
    });
  }

  let importedRows = 0;
  let skippedRows = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;

    const category = await prisma.categories.findFirst({
      where: { name: row.category, tenant_id: req.tenant.id }
    });

    let product = await prisma.products.findFirst({
      where: {
        tenant_id: req.tenant.id,
        OR: [
          { internal_code: row.internal_code || undefined },
          { barcode: row.barcode || undefined }
        ]
      }
    });

    if (!product) {
      product = await prisma.products.create({
        data: {
          tenant_id: req.tenant.id,
          category_id: category?.id,
          name: row.name,
          internal_code: row.internal_code || null,
          barcode: row.barcode || null,
          unit: row.unit || "UN"
        }
      });
    }

    const store = await prisma.stores.findFirst({
      where: { slug: row.store_slug, tenant_id: req.tenant.id }
    });

    if (!store) {
      skippedRows += 1;
      warnings.push({ line, message: `Loja não encontrada: ${row.store_slug}. Oferta ignorada.` });
      continue;
    }

    const startsAt = row.starts_at ? new Date(row.starts_at) : null;
    const endsAt = row.ends_at ? new Date(row.ends_at) : null;

    const existingOffer = await prisma.offers.findFirst({
      where: { tenant_id: req.tenant.id, store_id: store.id, product_id: product.id, starts_at: startsAt, ends_at: endsAt }
    });

    const offerData = {
      tenant_id: req.tenant.id,
      store_id: store.id,
      product_id: product.id,
      price_from: row.price_from ? Number(row.price_from) : null,
      price_to: Number(row.price_to),
      starts_at: startsAt,
      ends_at: endsAt,
      is_featured: row.is_featured === "true",
      is_active: true
    };

    if (existingOffer) {
      await prisma.offers.update({ where: { id: existingOffer.id }, data: offerData });
    } else {
      await prisma.offers.create({ data: offerData });
    }

    importedRows += 1;
  }

  const importRecord = await prisma.csv_imports.create({
    data: {
      tenant_id: req.tenant.id,
      file_url: file.filename,
      status: "imported",
      total_rows: rows.length,
      valid_rows: importedRows,
      invalid_rows: skippedRows,
      warnings,
      errors
    }
  });

  return {
    import_id: importRecord.id,
    status: "imported",
    total_rows: rows.length,
    valid_rows: importedRows,
    skipped_rows: skippedRows,
    invalid_rows: skippedRows,
    warnings,
    errors
  };
});

app.post("/imports/stores", async (req, reply) => {
  const file = await req.file();
  if (!file) {
    return reply.code(400).send({ error: "Arquivo CSV não enviado" });
  }
  const buffer = await file.toBuffer();
  const csvText = buffer.toString("utf-8");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const tenant_id = req.tenant.id;
  let validRows = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const line = index + 2; // +2 porque linha 1 é header

    if (!row.name || !row.slug) {
      errors.push({ line, error: "Campos obrigatórios: name, slug" });
      continue;
    }

    try {
      const existing = await prisma.stores.findFirst({
        where: { slug: row.slug, tenant_id }
      });

      if (existing) {
        await prisma.stores.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            city: row.city || null,
            state: row.state || null,
            address: row.address || null,
            phone: row.phone || null,
            is_active: row.is_active === "TRUE" || row.is_active === "true" || row.is_active === "1"
          }
        });
      } else {
        await prisma.stores.create({
          data: {
            name: row.name,
            slug: row.slug,
            city: row.city || null,
            state: row.state || null,
            address: row.address || null,
            phone: row.phone || null,
            is_active: row.is_active === "TRUE" || row.is_active === "true" || row.is_active === "1",
            tenant_id
          }
        });
      }

      validRows++;
    } catch (err) {
      errors.push({ line, error: err.message });
    }
  }

  return {
    valid_rows: validRows,
    errors: errors.length > 0 ? errors : undefined
  };
});

app.post("/imports/categories", async (req, reply) => {
  const file = await req.file();
  if (!file) {
    return reply.code(400).send({ error: "Arquivo CSV não enviado" });
  }
  const buffer = await file.toBuffer();
  const csvText = buffer.toString("utf-8");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const tenant_id = req.tenant.id;
  let validRows = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const line = index + 2;

    if (!row.name || !row.slug) {
      errors.push({ line, error: "Campos obrigatórios: name, slug" });
      continue;
    }

    try {
      const existing = await prisma.categories.findFirst({
        where: { slug: row.slug, tenant_id }
      });

      if (existing) {
        await prisma.categories.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            is_active: row.is_active === "TRUE" || row.is_active === "true" || row.is_active === "1"
          }
        });
      } else {
        await prisma.categories.create({
          data: {
            name: row.name,
            slug: row.slug,
            is_active: row.is_active === "TRUE" || row.is_active === "true" || row.is_active === "1",
            tenant_id
          }
        });
      }

      validRows++;
    } catch (err) {
      errors.push({ line, error: err.message });
    }
  }

  return {
    valid_rows: validRows,
    errors: errors.length > 0 ? errors : undefined
  };
});

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});