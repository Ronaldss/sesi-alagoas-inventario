import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === '--email' && next) {
      args.email = next.trim().toLowerCase()
      index += 1
    }

    if (current === '--password' && next) {
      args.password = next
      index += 1
    }
  }

  return args
}

async function findUserByEmail(email) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw error
    }

    const users = data?.users ?? []
    const matched = users.find((user) => user.email?.toLowerCase() === email)

    if (matched) {
      return matched
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function run() {
  const { email, password } = parseArgs(process.argv.slice(2))

  if (!email) {
    throw new Error('Informe o e-mail com --email usuario@dominio.com')
  }

  if (!password) {
    throw new Error('Informe a nova senha com --password "NovaSenha@2026"')
  }

  if (password.length < 6) {
    throw new Error('A senha precisa ter pelo menos 6 caracteres.')
  }

  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error(`Usuario nao encontrado para o e-mail ${email}.`)
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
  })

  if (error) {
    throw error
  }

  console.log(`Senha redefinida com sucesso para ${email}.`)
}

run().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
