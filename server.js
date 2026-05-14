const Fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

const multipart = require("@fastify/multipart");
const { parse } = require("csv-parse/sync");

app.register(cors);
app.register(jwt, { secret: "supersecret" });
app.register(multipart);

/**
 * Middleware multi-tenant
 */
app.addHook("preHandler", async (request, reply) => {
  const host = request.headers.host;

  const tenant = await prisma.tenants.findFirst({
    where: {
      domain: host
    }
  });

  if (!tenant) {
    return reply.code(404).send({ error: "Tenant não encontrado" });
  }

  request.tenant = tenant;
});

/**
 * Rota teste
 */
app.get("/", async (req) => {
  return {
    message: "API funcionando 🚀",
    tenant: req.tenant?.name
  };
});

app.get("/offers", async (req) => {
  const offers = await prisma.offers.findMany({
    where: {
      tenant_id: req.tenant.id,
      is_active: true
    },
    include: {
      product: true,
      store: true
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return {
    tenant: req.tenant.name,
    total: offers.length,
    offers
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

    if (!row.internal_code && !row.barcode) {
      errors.push({
        line,
        message: "Produto sem código interno e sem código de barras"
      });
    }

    if (!row.name) {
      errors.push({
        line,
        message: "Produto sem nome"
      });
    }

    const priceTo = Number(row.price_to);
    const priceFrom = Number(row.price_from);

    if (!priceTo || priceTo <= 0) {
      errors.push({
        line,
        message: "Preço promocional inválido"
      });
    }

    if (priceFrom && priceTo > priceFrom) {
      warnings.push({
        line,
        message: "Preço promocional maior que o preço original"
      });
    }
  });

  const importRecord = await prisma.csv_imports.create({
    data: {
      tenant_id: req.tenant.id,
      file_url: file.filename,
      status: errors.length ? "failed" : "validated",
      total_rows: rows.length,
      valid_rows: rows.length - errors.length,
      invalid_rows: errors.length,
      warnings,
      errors
    }
  });

  return {
    import_id: importRecord.id,
    status: importRecord.status,
    total_rows: rows.length,
    valid_rows: importRecord.valid_rows,
    invalid_rows: importRecord.invalid_rows,
    warnings,
    errors
  };
});

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});