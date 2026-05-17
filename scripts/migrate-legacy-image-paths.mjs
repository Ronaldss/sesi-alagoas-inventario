import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'inventory-images'

if (!supabaseUrl) {
  throw new Error('Defina SUPABASE_URL ou VITE_SUPABASE_URL antes de executar o script.')
}

if (!serviceRoleKey) {
  throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY antes de executar o script.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function isLegacyPath(path) {
  if (!path) {
    return false
  }

  return path.split('/').length === 2
}

function buildNewPath(unitId, legacyPath) {
  return `${unitId}/${legacyPath}`
}

async function fetchLegacyItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, unit_id, image_path')
    .not('image_path', 'is', null)

  if (error) {
    throw error
  }

  return data.filter((item) => isLegacyPath(item.image_path))
}

async function moveImage(item) {
  const from = item.image_path
  const to = buildNewPath(item.unit_id, from)

  const { error: moveError } = await supabase.storage.from(bucketName).move(from, to)

  if (moveError) {
    throw new Error(`Falha ao mover ${from} -> ${to}: ${moveError.message}`)
  }

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ image_path: to })
    .eq('id', item.id)

  if (updateError) {
    throw new Error(`Imagem movida, mas falhou ao atualizar item ${item.id}: ${updateError.message}`)
  }

  return { from, to }
}

async function run() {
  const legacyItems = await fetchLegacyItems()

  if (!legacyItems.length) {
    console.log('Nenhuma imagem legada encontrada.')
    return
  }

  console.log(`Encontradas ${legacyItems.length} imagens legadas.`)

  let migrated = 0

  for (const item of legacyItems) {
    const result = await moveImage(item)
    migrated += 1
    console.log(`[${migrated}/${legacyItems.length}] ${result.from} -> ${result.to}`)
  }

  console.log('Migracao concluida com sucesso.')
}

run().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
