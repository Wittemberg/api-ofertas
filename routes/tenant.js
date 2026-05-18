const { prisma } = require('../prisma');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'https://s3.wrtec.com.br',
  region: process.env.MINIO_REGION || 'eu-south',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'wrtec',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'Zxsa@667'
  },
  forcePathStyle: true
});

const BUCKET = process.env.MINIO_BUCKET || 'admin-ofertas';

const tenantRoutes = async function (fastify, opts) {

  // GET /auth/tenant/settings — Retorna configurações do tenant logado
  fastify.get('/tenant/settings', {
    preHandler: [fastify.authenticate]
  }, async function (request, reply) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: request.tenant.id },
      select: {
        name: true,
        slug: true,
        domain: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        accent_color: true,
        background_color: true,
        text_color: true,
        description: true,
        contact_phone: true,
        contact_email: true,
        contact_whatsapp: true,
        address_street: true,
        address_number: true,
        address_city: true,
        address_state: true,
        address_zip: true,
        social_media: true,
        opening_hours: true,
        font_family: true
      }
    });

    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });
    return tenant;
  });

  // PUT /auth/tenant/settings — Atualiza configurações
  fastify.put('/tenant/settings', {
    preHandler: [fastify.authenticate]
  }, async function (request, reply) {
    const allowedFields = [
      'name', 'description', 'domain',
      'contact_phone', 'contact_email', 'contact_whatsapp',
      'address_street', 'address_number', 'address_city', 'address_state', 'address_zip',
      'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color',
      'social_media', 'opening_hours', 'font_family'
    ];

    const data = {};
    for (const field of allowedFields) {
      if (request.body[field] !== undefined) {
        data[field] = request.body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: 'Nenhum campo válido para atualizar' });
    }

    data.updated_at = new Date();

    const tenant = await prisma.tenants.update({
      where: { id: request.tenant.id },
      data,
      select: {
        name: true,
        slug: true,
        domain: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        accent_color: true,
        background_color: true,
        text_color: true,
        description: true,
        contact_phone: true,
        contact_email: true,
        contact_whatsapp: true,
        address_street: true,
        address_number: true,
        address_city: true,
        address_state: true,
        address_zip: true,
        social_media: true,
        opening_hours: true,
        font_family: true
      }
    });

    return reply.send(tenant);
  });

  // POST /auth/tenant/logo — Upload da logo
  fastify.post('/tenant/logo', {
    preHandler: [fastify.authenticate]
  }, async function (request, reply) {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: 'Arquivo de imagem não enviado' });
    }

    const buffer = await file.toBuffer();
    const ext = file.filename.split('.').pop() || 'png';
    const key = `tenants/${request.tenant.id}/logo.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET || 'admin-ofertas',
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    }));

    const logoUrl = `https://s3.wrtec.com.br/${BUCKET}/${key}`;

    await prisma.tenants.update({
      where: { id: request.tenant.id },
      data: { logo_url: logoUrl, updated_at: new Date() }
    });

    return reply.send({ logo_url: logoUrl });
  });
};

module.exports = tenantRoutes;