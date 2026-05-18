const { prisma } = require('../prisma')

let cache = { data: {}, timestamp: 0 }
const TTL = 60 * 1000

async function getConfig(key, category, fallback = null) {
  const now = Date.now()
  if (now - cache.timestamp < TTL) {
    const cached = cache.data[`${category}.${key}`]
    if (cached !== undefined) return cached
  }

  try {
    const config = await prisma.system_configs.findUnique({
      where: { category_key: { category, key } }
    })
    if (config) {
      cache.data[`${category}.${key}`] = config.value
      cache.timestamp = now
      return config.value
    }
  } catch {}

  const envKey = `${category.toUpperCase()}_${key.toUpperCase()}`
  if (process.env[envKey]) return process.env[envKey]

  return fallback
}

async function getSecret(key, category, fallback = null) {
  try {
    const config = await prisma.system_configs.findUnique({
      where: { category_key: { category, key } }
    })
    if (config) return config.value
  } catch {}
  return fallback
}

async function getAllConfigs() {
  const configs = await prisma.system_configs.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] })
  return configs.map(c => ({
    ...c,
    value: c.is_secret ? '••••••••' : c.value
  }))
}

async function setConfig(category, key, value, options = {}) {
  const { is_secret = false, description = null } = options
  const config = await prisma.system_configs.upsert({
    where: { category_key: { category, key } },
    create: { category, key, value, is_secret, description },
    update: { value, is_secret, description, updated_at: new Date() }
  })
  delete cache.data[`${category}.${key}`]
  return config
}

async function deleteConfig(category, key) {
  await prisma.system_configs.delete({
    where: { category_key: { category, key } }
  })
  delete cache.data[`${category}.${key}`]
}

function invalidateCache() {
  cache = { data: {}, timestamp: 0 }
}

module.exports = { getConfig, getSecret, getAllConfigs, setConfig, deleteConfig, invalidateCache }