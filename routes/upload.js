const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { prisma } = require('../prisma')
const path = require('path')
const crypto = require('crypto')

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'https://s3.wrtec.com.br',
  region: process.env.MINIO_REGION || 'eu-south',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'wrtec',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'Zxsa@667'
  },
  forcePathStyle: true
})

const BUCKET = process.env.MINIO_BUCKET || 'admin-ofertas'

const uploadRoutes = async function (fastify, opts) {
  fastify.post('/product/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')]
  }, async function (request, reply) {
    const { id } = request.params

    // Verifica se o produto existe e pertence ao tenant
    const product = await prisma.products.findFirst({
      where: { id, tenant_id: request.tenant.id }
    })
    if (!product) return reply.code(404).send({ error: 'Produto não encontrado' })

    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'Nenhum arquivo enviado' })

    const ext = path.extname(data.filename) || '.jpg'
    const key = `products/${id}/${crypto.randomUUID()}${ext}`

    const chunks = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: data.mimetype,
      ACL: 'public-read'
    }))

    const imageUrl = `https://s3.wrtec.com.br/${BUCKET}/${key}`

    await prisma.products.update({
      where: { id },
      data: { image_url: imageUrl }
    })

    return { image_url: imageUrl }
  })
}

module.exports = uploadRoutes