const { prisma } = require('../prisma');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: true
});

const tenantRoutes = async function (fastify, opts) {

  // GET /auth/tenant/settings — Retorna configurações do tenant logado
  fastify.get('/tenant/settings', {
    preHandler: [fastify.authenticate]
  }, async function (request, reply) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: request.user.tenant_id },  // ✅ Corrigido: request.tenant → request.user
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
    const key = `tenants/${request.user.tenant_id}/logo.${ext}`;  // ✅ Corrigido

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'ofertas',
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    }));

    const logoUrl = `${process.env.S3_PUBLIC_URL}/${key}`;

    await prisma.tenants.update({
      where: { id: request.user.tenant_id },  // ✅ Corrigido
      data: { logo_url: logoUrl, updated_at: new Date() }
    });

    return reply.send({ logo_url: logoUrl });
  });

};

module.exports = tenantRoutes;