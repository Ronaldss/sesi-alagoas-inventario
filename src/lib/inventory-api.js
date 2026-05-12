import { hasSupabaseEnv, supabase } from './supabase'

const SESSION_KEY = 'sesi-inventario-session'
const ITEMS_KEY = 'sesi-inventario-items'

const demoUsers = [
  { email: 'supervisora@sesi-al.demo', password: 'sesi123', role: 'Supervisor', name: 'Nome (teste)' },
  { email: 'colaborador@sesi-al.demo', password: 'sesi123', role: 'Colaborador', name: 'Carlos Lima' },
]

const seedItems = [
  {
    id: crypto.randomUUID(),
    name: 'Impressora 3D Ender',
    category: 'Maker',
    location: 'Laboratorio Maker 01',
    condition: 'Bom',
    acquisitionDate: '2025-02-12',
    notes: 'Uso compartilhado com turmas tecnicas.',
    image: '',
    createdAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    name: 'Projetor Epson X39',
    category: 'Linguagem',
    location: 'Sala 04',
    condition: 'Excelente',
    acquisitionDate: '2024-08-02',
    notes: 'Revisado no inicio do semestre.',
    image: '',
    createdAt: '2026-05-11T14:30:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    name: 'Kit de Ferramentas CNC',
    category: 'Oficina',
    location: 'Oficina de Mecanica',
    condition: 'Requer manutencao',
    acquisitionDate: '2023-11-16',
    notes: 'Separar itens com desgaste nas brocas.',
    image: '',
    createdAt: '2026-05-10T10:15:00.000Z',
  },
]

function readStorage(key, fallback) {
  const value = window.localStorage.getItem(key)

  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function toUiItem(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    location: item.location,
    condition: item.condition,
    acquisitionDate: item.acquisition_date,
    notes: item.notes ?? '',
    image: '',
    createdAt: item.created_at,
  }
}

async function uploadImage(file, itemId, userId) {
  if (!file || !supabase) {
    return ''
  }

  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${itemId}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('inventory-images').upload(path, file, {
    upsert: false,
  })

  if (error) {
    throw error
  }

  return path
}

async function getSignedImageUrl(path) {
  if (!path || !supabase) {
    return ''
  }

  const { data, error } = await supabase.storage
    .from('inventory-images')
    .createSignedUrl(path, 60 * 60)

  if (error) {
    return ''
  }

  return data.signedUrl
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    name: data.full_name,
    role: data.role,
  }
}

export const inventoryApi = {
  isRemote: hasSupabaseEnv,

  async restoreSession() {
    if (!hasSupabaseEnv) {
      return readStorage(SESSION_KEY, null)
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    return getProfile(session.user.id)
  },

  async login({ email, password }) {
    if (!hasSupabaseEnv) {
      const user = demoUsers.find(
        (entry) => entry.email === email.trim().toLowerCase() && entry.password === password,
      )

      if (!user) {
        throw new Error('Credenciais invalidas.')
      }

      writeStorage(SESSION_KEY, user)
      return user
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw error ?? new Error('Nao foi possivel autenticar.')
    }

    return getProfile(data.user.id)
  },

  async logout() {
    if (!hasSupabaseEnv) {
      window.localStorage.removeItem(SESSION_KEY)
      return
    }

    await supabase.auth.signOut()
  },

  async listItems() {
    if (!hasSupabaseEnv) {
      return readStorage(ITEMS_KEY, seedItems)
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, category, location, condition, acquisition_date, notes, created_at, image_path')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const items = await Promise.all(
      data.map(async (item) => ({
        ...toUiItem(item),
        image: item.image_path ? await getSignedImageUrl(item.image_path) : '',
      })),
    )

    return items
  },

  async createItem(form, file, session) {
    if (!hasSupabaseEnv) {
      const payload = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        image: form.image,
      }

      const current = readStorage(ITEMS_KEY, seedItems)
      writeStorage(ITEMS_KEY, [payload, ...current])
      return payload
    }

    const itemId = crypto.randomUUID()
    const imageUrl = await uploadImage(file, itemId, session.id)

    const payload = {
      id: itemId,
      created_by: session.id,
      name: form.name,
      category: form.category,
      location: form.location,
      condition: form.condition,
      acquisition_date: form.acquisitionDate,
      notes: form.notes || null,
      image_path: imageUrl || null,
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(payload)
      .select('id, name, category, location, condition, acquisition_date, notes, created_at, image_path')
      .single()

    if (error) {
      throw error
    }

    return {
      ...toUiItem(data),
      image: data.image_path ? await getSignedImageUrl(data.image_path) : '',
    }
  },
}
