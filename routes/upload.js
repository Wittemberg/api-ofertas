const { getConfig, getSecret } = require('../lib/config')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { prisma } = require('../prisma')
const path = require('path')
const crypto = require('crypto')

// Inicialização lazy — carrega configs do banco na primeira requisição
let s3Client = null
let bucket = null
let initPromise = null

async function ensureStorageConfig() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const endpoint = await getConfig('endpoint', 'storage', 'https://s3.wrtec.com.br')
    const accessKey = await getConfig('access_key', 'storage', 'wrtec')
    const secretKey = await getSecret('secret_key', 'storage', 'Zxsa@667')
    bucket = await getConfig('bucket', 'storage', 'admin-ofertas')

    s3Client = new S3Client({
      endpoint,
      region: process.env.MINIO_REGION || 'eu-south',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true
    })
  })()
  return initPromise
}

const uploadRoutes = async function (fastify, opts) {

  fastify.post('/product/:id', {
    preHandler: [fastify.authenticate, fastify.authorize('admin')]
  }, async function (request, reply) {
    const { id } = request.params

    // Garante que as configs de storage foram carregadas
    await ensureStorageConfig()

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

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: data.mimetype,
      ACL: 'public-read'
    }))

    const imageUrl = `https://s3.wrtec.com.br/${bucket}/${key}`

    await prisma.products.update({
      where: { id },
      data: { image_url: imageUrl }
    })

    return { image_url: imageUrl }
  })
}

module.exports = uploadRoutes