const Fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

app.register(cors);
app.register(jwt, { secret: "supersecret" });

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

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});