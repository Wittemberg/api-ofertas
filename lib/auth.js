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

      if (!request.tenant) {
        return reply.code(401).send({ error: 'Tenant not identified' });
      }

      if (decoded.tenant_id !== request.tenant.id) {
        return reply.code(401).send({ error: 'Token tenant mismatch' });
      }

      const user = await prisma.users.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, name: true, role: true, tenant_id: true }
      });

      if (!user || user.tenant_id !== request.tenant.id) {
        return reply.code(401).send({ error: 'User not found or unauthorized' });
      }

      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id
      };
    } catch (err) {
      request.log?.error(err);
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

  return { authenticate, authorize };
};