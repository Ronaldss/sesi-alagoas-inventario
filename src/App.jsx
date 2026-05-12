import { useEffect, useMemo, useState } from 'react'
import { inventoryApi } from './lib/inventory-api'

const emptyForm = {
  name: '',
  category: 'Maker',
  location: '',
  condition: 'Bom',
  acquisitionDate: '',
  notes: '',
  image: '',
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/sesi-alagoas-logo.jpg" alt="SESI Alagoas" className="h-11 w-auto sm:h-12" />
      <div className="hidden sm:block">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sesi-blue">Sistema de Inventario</p>
        <p className="text-sm text-slate-500">Unidade escolar - SESI Alagoas</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, help }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-sesi-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{help}</p>
    </div>
  )
}

function SectionToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {[
        { id: 'cadastro', label: 'Cadastro' },
        { id: 'consulta', label: 'Consulta' },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === item.id ? 'bg-white text-sesi-blue shadow-sm' : 'text-slate-500'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function ConditionBadge({ value }) {
  const tones = {
    Excelente: 'bg-emerald-50 text-emerald-700',
    Bom: 'bg-sky-50 text-sky-700',
    Regular: 'bg-amber-50 text-amber-700',
    'Requer manutencao': 'bg-rose-50 text-rose-700',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[value] ?? 'bg-slate-100 text-slate-700'}`}>
      {value}
    </span>
  )
}

function formatSessionName(session) {
  if (session?.role === 'Supervisor' && session?.name === 'Ana Beatriz') {
    return 'Nome (teste)'
  }

  return session?.name ?? ''
}

function App() {
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState({ search: '', category: 'Todos', condition: 'Todos' })
  const [activeSection, setActiveSection] = useState('cadastro')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenError, setScreenError] = useState('')

  useEffect(() => {
    async function bootstrap() {
      try {
        const [restoredSession, loadedItems] = await Promise.all([
          inventoryApi.restoreSession(),
          inventoryApi.listItems(),
        ])

        setSession(restoredSession)
        setItems(loadedItems)

        if (!inventoryApi.isRemote) {
          setLoginForm({ email: 'supervisora@sesi-al.demo', password: 'sesi123' })
        }
      } catch (error) {
        setScreenError(error.message || 'Nao foi possivel carregar os dados iniciais.')
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    const beforeInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', beforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', beforeInstall)
  }, [])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.location.toLowerCase().includes(filters.search.toLowerCase())
        const matchesCategory = filters.category === 'Todos' || item.category === filters.category
        const matchesCondition = filters.condition === 'Todos' || item.condition === filters.condition

        return matchesSearch && matchesCategory && matchesCondition
      }),
    [filters, items],
  )

  const stats = {
    total: items.length,
    locations: new Set(items.map((item) => item.location)).size,
    maintenance: items.filter((item) => item.condition === 'Requer manutencao').length,
  }

  const authModeLabel = inventoryApi.isRemote ? 'Supabase conectado' : 'Modo demonstracao'
  const displayName = formatSessionName(session)

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setScreenError('')

    try {
      const user = await inventoryApi.login(loginForm)
      setSession(user)
    } catch (error) {
      setLoginError(error.message || 'Nao foi possivel entrar.')
    }
  }

  const handleLogout = async () => {
    await inventoryApi.logout()
    setSession(null)
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')

    try {
      const created = await inventoryApi.createItem(form, selectedFile, session)
      setItems((current) => [created, ...current])
      setForm(emptyForm)
      setSelectedFile(null)
      setFeedback(inventoryApi.isRemote ? 'Item salvo no Supabase.' : 'Item cadastrado com sucesso.')
      setActiveSection('consulta')
      window.setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      setFeedback(error.message || 'Nao foi possivel salvar o item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Carregando sistema...
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <section className="grid w-full gap-6 lg:grid-cols-[1fr_430px]">
          <div className="rounded-[2rem] bg-[linear-gradient(145deg,#0b3b75,#0f5bad)] p-8 text-white shadow-2xl shadow-sky-950/20">
            <Brand />
            <div className="mt-10 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-100/80">
                Inventario patrimonial
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Controle de equipamentos com foco em simplicidade e agilidade.
              </h1>
              <p className="mt-5 text-base leading-7 text-sky-50/88">
                Registre itens, organize por ambiente e consulte rapidamente durante a supervisao da unidade.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/8 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-sesi-ink">Acesso ao sistema</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {authModeLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {inventoryApi.isRemote
                ? 'Entre com seu usuario cadastrado no Supabase.'
                : 'Entre com um perfil de demonstracao enquanto o Supabase nao estiver configurado.'}
            </p>

            {screenError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {screenError}
              </div>
            ) : null}

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">E-mail</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sesi-blue focus:bg-white"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Senha</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sesi-blue focus:bg-white"
                  required
                />
              </label>

              {loginError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {loginError}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-sesi-blue px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sesi-navy"
              >
                Entrar
              </button>
            </form>

            {!inventoryApi.isRemote ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-sesi-ink">Perfis demo</p>
                <p className="mt-2">supervisora@sesi-al.demo / sesi123</p>
                <p>colaborador@sesi-al.demo / sesi123</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/8">
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Brand />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden"
              >
                Sair
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SectionToggle value={activeSection} onChange={setActiveSection} />
              {installPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="rounded-2xl bg-sesi-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-sesi-navy"
                >
                  Instalar
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:inline-flex"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sesi-ink">Painel de inventario</h1>
              <p className="mt-1 text-sm text-slate-500">
                Usuario: <span className="font-semibold text-sesi-ink">{displayName}</span> - {session.role}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{authModeLabel}</span>
            </div>
          </div>

          {screenError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {screenError}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Itens cadastrados" value={stats.total} help="Total atual do inventario" />
            <StatCard label="Locais mapeados" value={stats.locations} help="Ambientes com itens registrados" />
            <StatCard label="Manutencao" value={stats.maintenance} help="Itens que exigem atencao" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <article className={`${activeSection === 'consulta' ? 'hidden xl:block' : 'block'} rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5`}>
              <div>
                <h2 className="text-xl font-bold text-sesi-ink">Cadastro de item</h2>
                <p className="text-sm text-slate-500">Preencha apenas as informacoes essenciais.</p>
              </div>

              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                Campos obrigatorios: nome, categoria, localizacao, estado e data de aquisicao.
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  placeholder="Nome do item"
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  >
                    <option>Oficina</option>
                    <option>Maker</option>
                    <option>Aula</option>
                  </select>

                  <select
                    value={form.condition}
                    onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  >
                    <option>Excelente</option>
                    <option>Bom</option>
                    <option>Regular</option>
                    <option>Requer manutencao</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  placeholder="Localizacao"
                  required
                />

                <input
                  type="date"
                  value={form.acquisitionDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, acquisitionDate: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  required
                />

                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                  placeholder="Observacoes"
                />

                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 py-6 text-center">
                    <span className="text-sm font-semibold text-sesi-ink">Foto do item</span>
                    <span className="text-xs text-slate-500">Camera ou galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Pre-visualizacao do item"
                      className="mt-4 h-40 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                </div>

                {feedback ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      feedback.toLowerCase().includes('nao foi')
                        ? 'border border-rose-200 bg-rose-50 text-rose-700'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {feedback}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-sesi-blue px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sesi-navy disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar item'}
                </button>
              </form>
            </article>

            <article className={`${activeSection === 'cadastro' ? 'hidden xl:block' : 'block'} rounded-[1.75rem] border border-slate-200 bg-white p-5`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sesi-ink">Consulta de itens</h2>
                  <p className="text-sm text-slate-500">Busca e conferencia por ambiente ou categoria.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                    placeholder="Buscar"
                  />
                  <select
                    value={filters.category}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, category: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                  >
                    <option>Todos</option>
                    <option>Oficina</option>
                    <option>Maker</option>
                    <option>Aula</option>
                  </select>
                  <select
                    value={filters.condition}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, condition: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                  >
                    <option>Todos</option>
                    <option>Excelente</option>
                    <option>Bom</option>
                    <option>Regular</option>
                    <option>Requer manutencao</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[120px_1fr]"
                    >
                      <div className="overflow-hidden rounded-2xl bg-slate-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full min-h-28 items-center justify-center bg-sesi-ice px-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-sesi-blue">
                            Sem foto
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sesi-blue">
                                {item.category}
                              </span>
                              <ConditionBadge value={item.condition} />
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-sesi-ink">{item.name}</h3>
                          </div>
                          <p className="text-sm text-slate-500">{item.location}</p>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p>Aquisicao: {new Intl.DateTimeFormat('pt-BR').format(new Date(item.acquisitionDate))}</p>
                          <p>Registro: {new Intl.DateTimeFormat('pt-BR').format(new Date(item.createdAt))}</p>
                        </div>

                        {item.notes ? <p className="text-sm leading-6 text-slate-600">{item.notes}</p> : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-base font-semibold text-sesi-ink">Nenhum item encontrado</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Ajuste os filtros ou registre um novo item no inventario.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
