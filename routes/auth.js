const { prisma } = require('../prisma');
const bcrypt = require('bcrypt');

const authPlugin = async function (fastify, opts) {
  const { authenticate, authorize, authenticateApiKey } = require('../lib/auth')(fastify);
  fastify.decorate('authenticateApiKey', authenticateApiKey);
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('authorize', authorize);

  // POST /auth/register
  fastify.post('/register', async function (request, reply) {
    const { email, password, name } = request.body;
    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'Missing required fields: email, password, name' });
    }
    const tenant_id = request.tenant.id;
    const existingUser = await prisma.users.findUnique({
      where: { tenant_id_email: { tenant_id, email } }
    });
    if (existingUser) {
      return reply.code(400).send({ error: 'Email already registered for this tenant' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: { email, name, password_hash: hashedPassword, role: 'admin', tenant_id },
      select: { id: true, email: true, name: true, role: true }
    });
    const token = fastify.jwt.sign({ sub: user.id, tenant_id, role: user.role });
    return reply.send({ user, token });
  });

  // POST /auth/login
  fastify.post('/login', async function (request, reply) {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.code(400).send({ error: 'Missing email or password' });
    }
    const tenant_id = request.tenant.id;
    const user = await prisma.users.findUnique({
      where: { tenant_id_email: { tenant_id, email } },
      select: { id: true, email: true, name: true, role: true, password_hash: true }
    });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const { password_hash: _, ...safeUser } = user;
    const token = fastify.jwt.sign({ sub: user.id, tenant_id, role: user.role });
    return reply.send({ user: safeUser, token });
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: fastify.authenticate }, async function (request, reply) {
    const user = await prisma.users.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, name: true, role: true, created_at: true }
    });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return user;
  });

  // POST /auth/change-password
  fastify.post('/change-password', { preHandler: fastify.authenticate }, async function (request, reply) {
    const { current_password, new_password } = request.body;
    if (!current_password || !new_password) {
      return reply.code(400).send({ error: 'Missing current_password or new_password' });
    }
    const user = await prisma.users.findUnique({
      where: { id: request.user.id },
      select: { password_hash: true }
    });
    if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid current password' });
    }
    const newHashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.users.update({
      where: { id: request.user.id },
      data: { password_hash: newHashedPassword }
    });
    return reply.send({ message: 'Password changed successfully' });
  });

  // ============ ROTAS DE API KEY ============

  // POST /auth/api-keys — Gerar chave
  fastify.post('/api-keys', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')]
  }, async function (request, reply) {
    const { label } = request.body;
    if (!label) return reply.code(400).send({ error: 'label é obrigatório' });

    const crypto = require('crypto');
    const rawKey = crypto.randomUUID();
    const keyPrefix = rawKey.substring(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);

    await prisma.api_keys.create({
      data: {
        tenant_id: request.tenant.id,
        label,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        role: 'integration'
      }
    });

    return reply.code(201).send({
      raw_key: rawKey,
      label,
      warning: 'Esta chave será exibida apenas uma vez. Armazene-a com segurança.'
    });
  });

  // GET /auth/api-keys — Listar chaves
  fastify.get('/api-keys', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')]
  }, async function (request, reply) {
    const keys = await prisma.api_keys.findMany({
      where: { tenant_id: request.tenant.id },
      select: { id: true, label: true, key_prefix: true, is_active: true, last_used: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
    return keys;
  });

  // DELETE /auth/api-keys/:id — Revogar chave
  fastify.delete('/api-keys/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')]
  }, async function (request, reply) {
    const key = await prisma.api_keys.findFirst({
      where: { id: request.params.id, tenant_id: request.tenant.id }
    });
    if (!key) return reply.code(404).send({ error: 'Chave não encontrada' });

    await prisma.api_keys.update({
      where: { id: key.id },
      data: { is_active: false }
    });
    return reply.code(204).send();
  });
};

module.exports = authPlugin;