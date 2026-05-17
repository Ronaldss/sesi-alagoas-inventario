import { hasSupabaseEnv, supabase } from './supabase'

const SESSION_KEY = 'sesi-inventario-session'
const ITEMS_KEY = 'sesi-inventario-items'
const ACTIVE_UNIT_KEY = 'sesi-inventario-active-unit'

const demoUnits = [
  { id: 'unit-001', code: '001', description: 'SESI 001', isActive: true },
]

const demoUsers = [
  {
    id: 'demo-supervisor',
    email: 'supervisora@sesi-al.demo',
    password: 'sesi123',
    role: 'Supervisor',
    name: 'Nome (teste)',
    units: demoUnits,
  },
  {
    id: 'demo-colaborador',
    email: 'colaborador@sesi-al.demo',
    password: 'sesi123',
    role: 'Colaborador',
    name: 'Carlos Lima',
    units: demoUnits,
  },
]

const seedItems = [
  {
    id: crypto.randomUUID(),
    unitId: 'unit-001',
    createdBy: 'demo-supervisor',
    name: 'Impressora 3D Ender',
    category: 'Maker',
    room: '',
    location: 'Laboratorio Maker 01',
    condition: 'Bom',
    acquisitionDate: '2025-02-12',
    notes: 'Uso compartilhado com turmas tecnicas.',
    image: '',
    imagePath: '',
    createdAt: '2026-05-12T08:00:00.000Z',
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    unitId: 'unit-001',
    createdBy: 'demo-supervisor',
    name: 'Projetor Epson X39',
    category: 'Linguagem',
    room: 'Sala 4',
    location: 'Sala 04',
    condition: 'Excelente',
    acquisitionDate: '2024-08-02',
    notes: 'Revisado no inicio do semestre.',
    image: '',
    imagePath: '',
    createdAt: '2026-05-11T14:30:00.000Z',
    updatedAt: '2026-05-11T14:30:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    unitId: 'unit-001',
    createdBy: 'demo-colaborador',
    name: 'Kit de Ferramentas CNC',
    category: 'Robótica',
    room: '',
    location: 'Oficina de Mecanica',
    condition: 'Requer manutencao',
    acquisitionDate: '2023-11-16',
    notes: 'Separar itens com desgaste nas brocas.',
    image: '',
    imagePath: '',
    createdAt: '2026-05-10T10:15:00.000Z',
    updatedAt: '2026-05-10T10:15:00.000Z',
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

function clearStorage(key) {
  window.localStorage.removeItem(key)
}

function normalizeDemoUser(session) {
  if (!session?.email) {
    return session
  }

  const matched = demoUsers.find((user) => user.email === session.email)

  if (!matched) {
    return session
  }

  const persistedUnitId = window.localStorage.getItem(ACTIVE_UNIT_KEY)
  const activeUnitId =
    matched.units.find((unit) => unit.id === persistedUnitId)?.id ?? matched.units[0]?.id ?? ''

  return {
    ...matched,
    activeUnitId,
  }
}

function toUiItem(item) {
  return {
    id: item.id,
    unitId: item.unit_id,
    createdBy: item.created_by,
    name: item.name,
    category: item.category,
    room: item.room ?? '',
    location: item.location,
    condition: item.condition,
    acquisitionDate: item.acquisition_date,
    notes: item.notes ?? '',
    image: '',
    imagePath: item.image_path ?? '',
    createdAt: item.created_at,
    updatedAt: item.updated_at ?? item.created_at,
  }
}

function ensureActiveUnit(session) {
  if (!session?.activeUnitId) {
    throw new Error('Nenhuma unidade ativa foi selecionada.')
  }
}

async function uploadImage(file, itemId, userId, unitId) {
  if (!file || !supabase) {
    return ''
  }

  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${unitId}/${userId}/${itemId}-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('inventory-images').upload(path, file, {
    upsert: false,
  })

  if (error) {
    throw error
  }

  return path
}

async function deleteImage(path) {
  if (!path || !supabase) {
    return
  }

  await supabase.storage.from('inventory-images').remove([path])
}

async function getSignedImageUrl(path) {
  if (!path || !supabase) {
    return ''
  }

  const { data, error } = await supabase.storage.from('inventory-images').createSignedUrl(path, 60 * 60)

  if (error) {
    return ''
  }

  return data.signedUrl
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, last_unit_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    name: data.full_name,
    role: data.role,
    lastUnitId: data.last_unit_id,
  }
}

async function getUserUnits(userId) {
  const { data, error } = await supabase
    .from('profile_units')
    .select('unit_id, units(id, code, description, is_active)')
    .eq('profile_id', userId)

  if (error) {
    throw error
  }

  return data
    .map((entry) => entry.units)
    .filter(Boolean)
    .map((unit) => ({
      id: unit.id,
      code: unit.code,
      description: unit.description,
      isActive: unit.is_active,
    }))
    .sort((left, right) => left.code.localeCompare(right.code, 'pt-BR'))
}

async function buildRemoteSession(userId) {
  const [profile, units] = await Promise.all([getProfile(userId), getUserUnits(userId)])

  const persistedUnitId = window.localStorage.getItem(ACTIVE_UNIT_KEY)
  const activeUnitId =
    units.find((unit) => unit.id === persistedUnitId)?.id ??
    units.find((unit) => unit.id === profile.lastUnitId)?.id ??
    units[0]?.id ??
    ''

  if (activeUnitId) {
    writeStorage(ACTIVE_UNIT_KEY, activeUnitId)
  }

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    units,
    activeUnitId,
  }
}

export const inventoryApi = {
  isRemote: hasSupabaseEnv,

  async restoreSession() {
    if (!hasSupabaseEnv) {
      return normalizeDemoUser(readStorage(SESSION_KEY, null))
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    return buildRemoteSession(session.user.id)
  },

  async login({ email, password }) {
    if (!hasSupabaseEnv) {
      const user = demoUsers.find(
        (entry) => entry.email === email.trim().toLowerCase() && entry.password === password,
      )

      if (!user) {
        throw new Error('Credenciais invalidas.')
      }

      const normalizedUser = normalizeDemoUser(user)
      writeStorage(SESSION_KEY, normalizedUser)
      writeStorage(ACTIVE_UNIT_KEY, normalizedUser.activeUnitId)
      return normalizedUser
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw error ?? new Error('Nao foi possivel autenticar.')
    }

    return buildRemoteSession(data.user.id)
  },

  async logout() {
    clearStorage(ACTIVE_UNIT_KEY)

    if (!hasSupabaseEnv) {
      clearStorage(SESSION_KEY)
      return
    }

    await supabase.auth.signOut()
  },

  async setActiveUnit(session, unitId) {
    if (!session?.units?.find((unit) => unit.id === unitId)) {
      throw new Error('Acesso negado a unidade selecionada.')
    }

    writeStorage(ACTIVE_UNIT_KEY, unitId)

    if (!hasSupabaseEnv) {
      const nextSession = { ...session, activeUnitId: unitId }
      writeStorage(SESSION_KEY, nextSession)
      return nextSession
    }

    const { error } = await supabase
      .from('profiles')
      .update({ last_unit_id: unitId })
      .eq('id', session.id)

    if (error) {
      throw error
    }

    return { ...session, activeUnitId: unitId }
  },

  async listItems(unitId) {
    if (!unitId) {
      return []
    }

    if (!hasSupabaseEnv) {
      return readStorage(ITEMS_KEY, seedItems).filter((item) => item.unitId === unitId)
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select(
        'id, unit_id, created_by, name, category, room, location, condition, acquisition_date, notes, created_at, updated_at, image_path',
      )
      .eq('unit_id', unitId)
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
    ensureActiveUnit(session)

    if (!hasSupabaseEnv) {
      const payload = {
        ...form,
        id: crypto.randomUUID(),
        unitId: session.activeUnitId,
        createdBy: session.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: form.image,
        imagePath: '',
      }

      const current = readStorage(ITEMS_KEY, seedItems)
      writeStorage(ITEMS_KEY, [payload, ...current])
      return payload
    }

    const itemId = crypto.randomUUID()
    const imageUrl = await uploadImage(file, itemId, session.id, session.activeUnitId)

    const payload = {
      id: itemId,
      unit_id: session.activeUnitId,
      created_by: session.id,
      name: form.name,
      category: form.category,
      room: form.room || null,
      location: form.location,
      condition: form.condition,
      acquisition_date: form.acquisitionDate,
      notes: form.notes || null,
      image_path: imageUrl || null,
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(payload)
      .select(
        'id, unit_id, created_by, name, category, room, location, condition, acquisition_date, notes, created_at, updated_at, image_path',
      )
      .single()

    if (error) {
      throw error
    }

    return {
      ...toUiItem(data),
      image: data.image_path ? await getSignedImageUrl(data.image_path) : '',
    }
  },

  async updateItem(itemId, form, file, session, currentItem) {
    ensureActiveUnit(session)

    if (!hasSupabaseEnv) {
      const current = readStorage(ITEMS_KEY, seedItems)
      const updatedItem = {
        ...currentItem,
        ...form,
        unitId: currentItem.unitId ?? session.activeUnitId,
        createdBy: currentItem.createdBy ?? session.id,
        image: file ? form.image : currentItem.image,
        updatedAt: new Date().toISOString(),
      }

      const nextItems = current.map((item) => (item.id === itemId ? updatedItem : item))
      writeStorage(ITEMS_KEY, nextItems)
      return updatedItem
    }

    let nextImagePath = currentItem.imagePath ?? null

    if (file) {
      nextImagePath = await uploadImage(file, itemId, session.id, session.activeUnitId)
    }

    const payload = {
      name: form.name,
      category: form.category,
      room: form.room || null,
      location: form.location,
      condition: form.condition,
      acquisition_date: form.acquisitionDate,
      notes: form.notes || null,
      image_path: nextImagePath,
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update(payload)
      .eq('id', itemId)
      .eq('unit_id', session.activeUnitId)
      .select(
        'id, unit_id, created_by, name, category, room, location, condition, acquisition_date, notes, created_at, updated_at, image_path',
      )
      .single()

    if (error) {
      throw error
    }

    return {
      ...toUiItem(data),
      image: data.image_path ? await getSignedImageUrl(data.image_path) : '',
    }
  },

  async deleteItem(item, session) {
    ensureActiveUnit(session)

    if (!hasSupabaseEnv) {
      const current = readStorage(ITEMS_KEY, seedItems)
      const nextItems = current.filter((entry) => entry.id !== item.id)
      writeStorage(ITEMS_KEY, nextItems)
      return
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', item.id)
      .eq('unit_id', session.activeUnitId)

    if (error) {
      throw error
    }

    if (session.role === 'Supervisor' && item.imagePath) {
      await deleteImage(item.imagePath)
    }
  },
}
