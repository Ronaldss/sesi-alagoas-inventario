import { hasSupabaseEnv, supabase } from './supabase'

const SESSION_KEY = 'sesi-inventario-session'
const ITEMS_KEY = 'sesi-inventario-items'
const ACTIVE_UNIT_KEY = 'sesi-inventario-active-unit'
const USERS_KEY = 'sesi-inventario-users'
const UNITS_KEY = 'sesi-inventario-units'

const seedUnits = [{ id: 'unit-001', code: '001', description: 'SESI 001', isActive: true }]

const seedUsers = [
  {
    id: 'demo-admin',
    email: 'admin@sesi-al.demo',
    password: 'sesi123',
    role: 'Administrador',
    name: 'Administrador SESI',
    unitIds: ['unit-001'],
    lastUnitId: 'unit-001',
  },
  {
    id: 'demo-supervisor',
    email: 'supervisora@sesi-al.demo',
    password: 'sesi123',
    role: 'Supervisor',
    name: 'Nome (teste)',
    unitIds: ['unit-001'],
    lastUnitId: 'unit-001',
  },
  {
    id: 'demo-colaborador',
    email: 'colaborador@sesi-al.demo',
    password: 'sesi123',
    role: 'Colaborador',
    name: 'Carlos Lima',
    unitIds: ['unit-001'],
    lastUnitId: 'unit-001',
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
    category: 'Robotica',
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

function readDemoUnits() {
  const units = readStorage(UNITS_KEY, seedUnits)
  return units.sort((left, right) => left.code.localeCompare(right.code, 'pt-BR'))
}

function writeDemoUnits(units) {
  writeStorage(UNITS_KEY, units)
}

function readDemoUsers() {
  return readStorage(USERS_KEY, seedUsers)
}

function writeDemoUsers(users) {
  writeStorage(USERS_KEY, users)
}

function buildDemoSession(user) {
  if (!user?.email) {
    return null
  }

  const units = readDemoUnits().filter((unit) => user.unitIds.includes(unit.id))
  const persistedUnitId = window.localStorage.getItem(ACTIVE_UNIT_KEY)
  const activeUnitId =
    units.find((unit) => unit.id === persistedUnitId)?.id ??
    units.find((unit) => unit.id === user.lastUnitId)?.id ??
    units[0]?.id ??
    ''

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    units,
    activeUnitId,
  }
}

function normalizeDemoSession(session) {
  if (!session?.email) {
    return session
  }

  const matched = readDemoUsers().find((user) => user.email === session.email)
  return buildDemoSession(matched)
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

function ensureAdmin(session) {
  if (session?.role !== 'Administrador') {
    throw new Error('Apenas administradores podem acessar este modulo.')
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
    email: '',
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
    email: profile.email,
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
      return normalizeDemoSession(readStorage(SESSION_KEY, null))
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
      const user = readDemoUsers().find(
        (entry) => entry.email === email.trim().toLowerCase() && entry.password === password,
      )

      if (!user) {
        throw new Error('Credenciais invalidas.')
      }

      const normalizedUser = buildDemoSession(user)
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
      const users = readDemoUsers()
      const nextUsers = users.map((user) =>
        user.id === session.id ? { ...user, lastUnitId: unitId } : user,
      )
      writeDemoUsers(nextUsers)

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

  async listUnits(session) {
    ensureAdmin(session)

    if (!hasSupabaseEnv) {
      return readDemoUnits()
    }

    const { data, error } = await supabase
      .from('units')
      .select('id, code, description, is_active, created_at, updated_at')
      .order('code', { ascending: true })

    if (error) {
      throw error
    }

    return data.map((unit) => ({
      id: unit.id,
      code: unit.code,
      description: unit.description,
      isActive: unit.is_active,
      createdAt: unit.created_at,
      updatedAt: unit.updated_at,
    }))
  },

  async saveUnit(payload, session) {
    ensureAdmin(session)

    if (!payload.code?.trim() || !payload.description?.trim()) {
      throw new Error('Informe o codigo e a descricao da unidade.')
    }

    if (!hasSupabaseEnv) {
      const units = readDemoUnits()
      const nextPayload = {
        id: payload.id || crypto.randomUUID(),
        code: payload.code.trim(),
        description: payload.description.trim(),
        isActive: payload.isActive !== false,
      }

      const nextUnits = payload.id
        ? units.map((unit) => (unit.id === payload.id ? nextPayload : unit))
        : [...units, nextPayload]

      writeDemoUnits(nextUnits)
      return nextPayload
    }

    const normalizedPayload = {
      code: payload.code.trim(),
      description: payload.description.trim(),
      is_active: payload.isActive !== false,
    }

    const query = payload.id
      ? supabase.from('units').update(normalizedPayload).eq('id', payload.id)
      : supabase.from('units').insert(normalizedPayload)

    const { data, error } = await query
      .select('id, code, description, is_active, created_at, updated_at')
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      code: data.code,
      description: data.description,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async listAccessUsers(session) {
    ensureAdmin(session)

    if (!hasSupabaseEnv) {
      const units = readDemoUnits()

      return readDemoUsers()
        .map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastUnitId: user.lastUnitId ?? user.unitIds[0] ?? '',
          unitIds: user.unitIds,
          units: units.filter((unit) => user.unitIds.includes(unit.id)),
        }))
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, last_unit_id, profile_units(unit_id, units(id, code, description, is_active))')
      .order('full_name', { ascending: true })

    if (error) {
      throw error
    }

    return data.map((profile) => {
      const units = (profile.profile_units ?? [])
        .map((entry) => entry.units)
        .filter(Boolean)
        .map((unit) => ({
          id: unit.id,
          code: unit.code,
          description: unit.description,
          isActive: unit.is_active,
        }))
        .sort((left, right) => left.code.localeCompare(right.code, 'pt-BR'))

      return {
        id: profile.id,
        email: profile.email ?? '',
        name: profile.full_name,
        role: profile.role,
        lastUnitId: profile.last_unit_id ?? '',
        unitIds: units.map((unit) => unit.id),
        units,
      }
    })
  },

  async saveAccessUser(userId, payload, session) {
    ensureAdmin(session)

    if (!payload.name?.trim()) {
      throw new Error('Informe o nome do usuario.')
    }

    if (!payload.role) {
      throw new Error('Selecione o perfil de acesso.')
    }

    if (!payload.unitIds?.length) {
      throw new Error('Vincule o usuario a pelo menos uma unidade.')
    }

    const normalizedLastUnitId = payload.unitIds.includes(payload.lastUnitId)
      ? payload.lastUnitId
      : payload.unitIds[0]

    if (!hasSupabaseEnv) {
      const users = readDemoUsers()
      const nextUsers = users.map((user) =>
        user.id === userId
          ? {
              ...user,
              name: payload.name.trim(),
              role: payload.role,
              unitIds: payload.unitIds,
              lastUnitId: normalizedLastUnitId,
            }
          : user,
      )

      writeDemoUsers(nextUsers)

      if (session.id === userId) {
        const refreshed = buildDemoSession(nextUsers.find((user) => user.id === userId))
        writeStorage(SESSION_KEY, refreshed)
      }

      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: payload.name.trim(),
        role: payload.role,
        last_unit_id: normalizedLastUnitId,
      })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    const { error: deleteError } = await supabase.from('profile_units').delete().eq('profile_id', userId)

    if (deleteError) {
      throw deleteError
    }

    const { error: insertError } = await supabase.from('profile_units').insert(
      payload.unitIds.map((unitId) => ({
        profile_id: userId,
        unit_id: unitId,
      })),
    )

    if (insertError) {
      throw insertError
    }
  },
}
