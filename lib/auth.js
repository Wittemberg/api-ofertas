const bcrypt = require('bcrypt')
const { prisma } = require('../prisma');

module.exports = (fastify) => {
  const authenticate = async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Missing or invalid authorization header' });
      }
      const token = authHeader.substring(7);
      const decoded = await fastify.jwt.verify(token);
      const user = await prisma.users.findFirst({
        where: { id: decoded.sub, is_active: true }
      });
      if (!user) {
        return reply.code(401).send({ error: 'User not found or inactive' });
      }
      request.user = user;
    } catch (err) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  };

  const authorize = (...allowedRoles) => {
    return async (request, reply) => {
      if (!request.user || !allowedRoles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }
    };
  };

  const authenticateApiKey = async (request, reply) => {
    const apiKey = request.headers['x-api-key']
    if (!apiKey) {
      return reply.code(401).send({ error: 'X-API-Key header is required' })
    }

    const keyPrefix = apiKey.substring(0, 8)
    const keys = await prisma.api_keys.findMany({
      where: { key_prefix: keyPrefix, is_active: true },
      include: { tenant: true }
    })

    if (keys.length === 0) {
      return reply.code(401).send({ error: 'Invalid API Key' })
    }

    let matched = null
    for (const k of keys) {
      if (await bcrypt.compare(apiKey, k.key_hash)) {
        matched = k
        break
      }
    }

    if (!matched) {
      return reply.code(401).send({ error: 'Invalid API Key' })
    }

    // Atualizar last_used (fire-and-forget)
    prisma.api_keys.update({
      where: { id: matched.id },
      data: { last_used: new Date() }
    }).catch(() => {})

    request.tenant = matched.tenant
    request.apiKey = matched
  }

  return { authenticate, authorize, authenticateApiKey };
};