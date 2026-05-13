import { useEffect, useMemo, useRef, useState } from 'react'
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

const CATEGORY_OPTIONS = [
  'Oficina',
  'Maker',
  'Ciências Humanas',
  'Linguagem',
  'Ciências da Natureza',
  'Robótica',
  'Informática',
  'Matemática',
]

function buildFormFromItem(item) {
  return {
    name: item.name,
    category: item.category,
    location: item.location,
    condition: item.condition,
    acquisitionDate: item.acquisitionDate,
    notes: item.notes ?? '',
    image: item.image ?? '',
  }
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <img src="/sesi-alagoas-logo.jpg" alt="SESI Alagoas" className="h-12 w-auto sm:h-14" />
      </div>
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
        { id: 'relatorios', label: 'Relatorios' },
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

function CategoryCombobox({ value, onChange, placeholder, required = false }) {
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase()

    if (!normalizedValue) {
      return CATEGORY_OPTIONS
    }

    const matches = CATEGORY_OPTIONS.filter((option) => option.toLowerCase().includes(normalizedValue))
    return matches.length ? matches : CATEGORY_OPTIONS
  }, [value])

  const hasCustomValue = value.trim() && !CATEGORY_OPTIONS.some((option) => option.toLowerCase() === value.trim().toLowerCase())

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-sesi-blue"
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500"
          aria-label="Abrir categorias"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`}>
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
          <div className="space-y-1">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  option === value ? 'bg-sesi-ice font-semibold text-sesi-blue' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}

            {hasCustomValue ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl border border-dashed border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Usar "{value.trim()}"
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function detectIos() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function shouldShowInstallGuideOnLoad() {
  const dismissed = window.localStorage.getItem('sesi-install-guide-dismissed')
  return !dismissed && !isStandaloneMode()
}

function InstallGuide({ canInstall, isIos, onInstall, onDismiss }) {
  return (
    <div className="rounded-3xl border border-sky-200 bg-[linear-gradient(135deg,#eef7ff,#f8fbff)] p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sesi-blue">Instale no celular</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {canInstall
              ? 'Toque em instalar para adicionar este sistema a tela inicial com experiencia de aplicativo.'
              : isIos
                ? 'No iPhone, abra no Safari e toque em Compartilhar > Adicionar a Tela de Inicio.'
                : 'Se o navegador nao mostrar o instalador, use o menu e escolha Adicionar a tela inicial.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="rounded-2xl bg-sesi-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-sesi-navy"
            >
              Instalar agora
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatSessionName(session) {
  if (session?.role === 'Supervisor' && session?.name === 'Ana Beatriz') {
    return 'Nome (teste)'
  }

  return session?.name ?? ''
}

function formatDate(value, options) {
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(value))
}

function slugifyFilename(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function ConfirmDialog({ item, pending, onCancel, onConfirm }) {
  if (!item) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/45 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.981-1.742 2.981H4.42c-1.53 0-2.492-1.647-1.742-2.98l5.58-9.92ZM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1-7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Confirmar exclusao</p>
            <h3 className="mt-2 text-xl font-bold text-sesi-ink">Excluir item do inventario?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              O item <span className="font-semibold text-sesi-ink">{item.name}</span> sera removido da base. Essa acao nao podera ser desfeita.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? 'Excluindo...' : 'Confirmar exclusao'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FloatingActionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#0057b8,#0b3b75)] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-900/30 transition hover:opacity-95"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-lg leading-none">+</span>
      Novo item
    </button>
  )
}

function ReportSummaryTable({ title, rows }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className="text-sm font-semibold text-sesi-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportActionCard({ title, description, buttonLabel, onClick, primary = false }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          primary
            ? 'bg-[linear-gradient(135deg,#0057b8,#0b3b75)] text-white hover:opacity-95'
            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

function ReportDetailCard({ item }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-sesi-ink">{item.name}</h4>
          <p className="mt-1 text-sm text-slate-500">{item.location}</p>
        </div>
        <ConditionBadge value={item.condition} />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        <p><span className="font-semibold text-sesi-ink">Categoria:</span> {item.category}</p>
        <p><span className="font-semibold text-sesi-ink">Aquisicao:</span> {formatDate(item.acquisitionDate)}</p>
        <p><span className="font-semibold text-sesi-ink">Cadastro:</span> {formatDate(item.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</p>
        {item.notes ? <p><span className="font-semibold text-sesi-ink">Observacoes:</span> {item.notes}</p> : null}
      </div>
    </article>
  )
}

function ReportHeaderCard({ totalItems, totalLocations, totalMaintenance }) {
  const generatedAt = formatDate(new Date(), { dateStyle: 'full', timeStyle: 'short' })

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ffffff)] p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <img src="/sesi-alagoas-logo.jpg" alt="SESI Alagoas" className="h-12 w-auto sm:h-14" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sesi-blue">Relatorio institucional</p>
            <h2 className="mt-2 text-2xl font-bold text-sesi-ink">Relatorio geral de inventario</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Consolidado de itens cadastrados para acompanhamento da unidade escolar do SESI Alagoas.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm lg:min-w-[290px]">
          <p><span className="font-semibold text-sesi-ink">Emitido em:</span> {generatedAt}</p>
          <p className="mt-2"><span className="font-semibold text-sesi-ink">Itens considerados:</span> {totalItems}</p>
          <p className="mt-2"><span className="font-semibold text-sesi-ink">Locais incluidos:</span> {totalLocations}</p>
          <p className="mt-2"><span className="font-semibold text-sesi-ink">Itens em manutencao:</span> {totalMaintenance}</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState({ search: '', category: '', condition: 'Todos' })
  const [reportFilters, setReportFilters] = useState({ search: '', category: '', condition: 'Todos' })
  const [activeSection, setActiveSection] = useState('cadastro')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemPendingDelete, setItemPendingDelete] = useState('')
  const [editingItemId, setEditingItemId] = useState('')
  const [confirmingDeleteItemId, setConfirmingDeleteItemId] = useState('')
  const [screenError, setScreenError] = useState('')
  const [showInstallGuide, setShowInstallGuide] = useState(() => shouldShowInstallGuideOnLoad())
  const [isIosDevice] = useState(() => detectIos())
  const [reportFeedback, setReportFeedback] = useState('')
  const formCardRef = useRef(null)

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
      if (!isStandaloneMode()) {
        setShowInstallGuide(true)
      }
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
        const matchesCategory = !filters.category || item.category === filters.category
        const matchesCondition = filters.condition === 'Todos' || item.condition === filters.condition

        return matchesSearch && matchesCategory && matchesCondition
      }),
    [filters, items],
  )

  const filteredReportItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
          item.location.toLowerCase().includes(reportFilters.search.toLowerCase())
        const matchesCategory = !reportFilters.category || item.category === reportFilters.category
        const matchesCondition =
          reportFilters.condition === 'Todos' || item.condition === reportFilters.condition

        return matchesSearch && matchesCategory && matchesCondition
      }),
    [items, reportFilters],
  )

  const stats = {
    total: items.length,
    locations: new Set(items.map((item) => item.location)).size,
    maintenance: items.filter((item) => item.condition === 'Requer manutencao').length,
  }

  const reportCategoryRows = useMemo(() => {
    const counts = filteredReportItems.reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] ?? 0) + 1
      return accumulator
    }, {})

    return Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right, 'pt-BR'))
      .map(([label, value]) => ({ label, value }))
  }, [filteredReportItems])

  const reportConditionRows = useMemo(
    () =>
      ['Excelente', 'Bom', 'Regular', 'Requer manutencao'].map((condition) => ({
        label: condition,
        value: filteredReportItems.filter((item) => item.condition === condition).length,
      })),
    [filteredReportItems],
  )

  const reportDetailRows = useMemo(
    () =>
      filteredReportItems.map((item) => ({
        'Nome do item': item.name,
        Categoria: item.category,
        Localizacao: item.location,
        'Estado de conservacao': item.condition,
        'Data de aquisicao': formatDate(item.acquisitionDate),
        Observacoes: item.notes || '',
        'Data do cadastro': formatDate(item.createdAt, { dateStyle: 'short', timeStyle: 'short' }),
      })),
    [filteredReportItems],
  )

  const authModeLabel = inventoryApi.isRemote ? 'Supabase conectado' : 'Modo demonstracao'
  const displayName = formatSessionName(session)
  const isEditing = Boolean(editingItemId)
  const editingItem = items.find((item) => item.id === editingItemId) ?? null
  const itemBeingConfirmed = items.find((item) => item.id === confirmingDeleteItemId) ?? null

  const canEditItem = (item) => session.role === 'Supervisor' || item.createdBy === session.id
  const canDeleteItem = () => session.role === 'Supervisor'

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

  const resetFormState = () => {
    setForm(emptyForm)
    setSelectedFile(null)
    setEditingItemId('')
  }

  const handleEditItem = (item) => {
    setEditingItemId(item.id)
    setForm(buildFormFromItem(item))
    setSelectedFile(null)
    setFeedback('')
    setActiveSection('cadastro')
    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleCancelEdit = () => {
    resetFormState()
    setFeedback('')
  }

  const handleCreateNewItem = () => {
    handleCancelEdit()
    setActiveSection('cadastro')
    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')

    try {
      if (editingItem && canEditItem(editingItem)) {
        const updated = await inventoryApi.updateItem(editingItem.id, form, selectedFile, session, editingItem)
        setItems((current) => current.map((item) => (item.id === editingItem.id ? updated : item)))
        resetFormState()
        setFeedback('Item atualizado com sucesso.')
      } else {
        const created = await inventoryApi.createItem(form, selectedFile, session)
        setItems((current) => [created, ...current])
        resetFormState()
        setFeedback(inventoryApi.isRemote ? 'Item salvo no Supabase.' : 'Item cadastrado com sucesso.')
      }

      setActiveSection('consulta')
      window.setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      setFeedback(error.message || 'Nao foi possivel salvar o item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteItem = async (item) => {
    setItemPendingDelete(item.id)
    setFeedback('')

    try {
      await inventoryApi.deleteItem(item, session)
      setItems((current) => current.filter((entry) => entry.id !== item.id))

      if (editingItemId === item.id) {
        resetFormState()
      }

      setFeedback('Item excluido com sucesso.')
      window.setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      setFeedback(error.message || 'Nao foi possivel excluir o item.')
    } finally {
      setItemPendingDelete('')
      setConfirmingDeleteItemId('')
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    setInstallPrompt(null)
    setShowInstallGuide(false)
  }

  const dismissInstallGuide = () => {
    setShowInstallGuide(false)
    window.localStorage.setItem('sesi-install-guide-dismissed', 'true')
  }

  const exportReportXlsx = async () => {
    const XLSX = await import('xlsx')
    const summaryRows = [
      { Indicador: 'Itens no relatorio', Valor: filteredReportItems.length },
      { Indicador: 'Locais no relatorio', Valor: new Set(filteredReportItems.map((item) => item.location)).size },
      { Indicador: 'Itens em manutencao', Valor: filteredReportItems.filter((item) => item.condition === 'Requer manutencao').length },
      { Indicador: 'Gerado em', Valor: formatDate(new Date(), { dateStyle: 'short', timeStyle: 'short' }) },
    ]

    const categoryRows = reportCategoryRows.map((row) => ({ Categoria: row.label, Quantidade: row.value }))
    const conditionRows = reportConditionRows.map((row) => ({ 'Estado de conservacao': row.label, Quantidade: row.value }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Resumo')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryRows), 'Categorias')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(conditionRows), 'Conservacao')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reportDetailRows), 'Detalhado')

    XLSX.writeFile(workbook, `relatorio-inventario-${slugifyFilename(formatDate(new Date()))}.xlsx`)
    setReportFeedback('Relatorio Excel gerado com sucesso.')
  }

  const exportReportCsv = async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(reportDetailRows)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `relatorio-detalhado-${slugifyFilename(formatDate(new Date()))}.csv`)
    setReportFeedback('Relatorio CSV detalhado gerado com sucesso.')
  }

  const printReport = () => {
    const opened = window.open('', '_blank', 'width=1080,height=800')

    if (!opened) {
      setReportFeedback('Nao foi possivel abrir a janela de impressao neste navegador.')
      return
    }

    const detailRows = filteredReportItems
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.location}</td>
            <td>${item.condition}</td>
            <td>${formatDate(item.acquisitionDate)}</td>
          </tr>
        `,
      )
      .join('')

    opened.document.write(`
      <html lang="pt-BR">
        <head>
          <title>Relatorio de Inventario - SESI Alagoas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #12304f; }
            h1, h2 { margin: 0 0 12px; }
            .meta, .grid { margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .card { border: 1px solid #dbe4ee; border-radius: 16px; padding: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #dbe4ee; padding: 10px; text-align: left; font-size: 14px; }
            th { background: #f5f8fc; }
          </style>
        </head>
        <body>
          <h1>Relatorio de Inventario</h1>
          <div class="meta">SESI Alagoas • Gerado em ${formatDate(new Date(), {
            dateStyle: 'short',
            timeStyle: 'short',
          })}</div>
          <div class="grid">
            <div class="card"><strong>Itens no relatorio</strong><br />${filteredReportItems.length}</div>
            <div class="card"><strong>Locais mapeados</strong><br />${new Set(filteredReportItems.map((item) => item.location)).size}</div>
            <div class="card"><strong>Itens em manutencao</strong><br />${filteredReportItems.filter((item) => item.condition === 'Requer manutencao').length}</div>
          </div>
          <h2>Detalhamento</h2>
          <table>
            <thead>
              <tr>
                <th>Nome do item</th>
                <th>Categoria</th>
                <th>Localizacao</th>
                <th>Estado</th>
                <th>Aquisicao</th>
              </tr>
            </thead>
            <tbody>${detailRows}</tbody>
          </table>
        </body>
      </html>
    `)
    opened.document.close()
    opened.focus()
    opened.print()
    setReportFeedback('Janela de impressao do relatorio aberta.')
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
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-900/5">
              <img src="/sesi-alagoas-logo.jpg" alt="SESI Alagoas" className="h-20 w-auto sm:h-24" />
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sesi-blue">
                Sistema de Inventario
              </p>
              <h1 className="mt-3 text-3xl font-bold text-sesi-ink">Acesso ao sistema</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ambiente de uso interno para cadastro e consulta de itens da unidade escolar.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {authModeLabel}
            </span>
          </div>

          {screenError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {screenError}
            </div>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-sesi-ink">Identificacao do usuario</p>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  acesso seguro
                </span>
              </div>

              <div className="space-y-5">
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
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#0057b8,#0b3b75)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/15 transition hover:opacity-95"
            >
              Entrar
            </button>
          </form>

          {!inventoryApi.isRemote ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-semibold text-sesi-ink">Acesso de demonstracao</p>
              <p className="mt-2">supervisora@sesi-al.demo / sesi123</p>
            </div>
          ) : null}
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <ConfirmDialog
        item={itemBeingConfirmed}
        pending={itemPendingDelete === confirmingDeleteItemId}
        onCancel={() => setConfirmingDeleteItemId('')}
        onConfirm={() => handleDeleteItem(itemBeingConfirmed)}
      />

      {activeSection !== 'relatorios' ? <FloatingActionButton onClick={handleCreateNewItem} /> : null}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/8">
        <header className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-5 sm:px-8">
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
                  className="rounded-2xl bg-[linear-gradient(135deg,#0057b8,#0b3b75)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
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
          <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ffffff)] px-5 py-5 shadow-sm">
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
          </div>

          {showInstallGuide ? (
            <InstallGuide
              canInstall={Boolean(installPrompt)}
              isIos={isIosDevice}
              onInstall={handleInstall}
              onDismiss={dismissInstallGuide}
            />
          ) : null}

          {screenError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {screenError}
            </div>
          ) : null}

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

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Itens cadastrados" value={stats.total} help="Total atual do inventario" />
            <StatCard label="Locais mapeados" value={stats.locations} help="Ambientes com itens registrados" />
            <StatCard label="Manutencao" value={stats.maintenance} help="Itens que exigem atencao" />
          </section>

          {activeSection !== 'relatorios' ? (
            <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <article ref={formCardRef} className={`${activeSection === 'consulta' ? 'hidden xl:block' : 'block'} rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5`}>
              <div>
                <h2 className="text-xl font-bold text-sesi-ink">{isEditing ? 'Edicao de item' : 'Cadastro de item'}</h2>
                <p className="text-sm text-slate-500">
                  {isEditing ? 'Atualize os dados e salve as alteracoes.' : 'Preencha apenas as informacoes essenciais.'}
                </p>
              </div>

              {isEditing && editingItem ? (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  Editando: <span className="font-semibold">{editingItem.name}</span>
                </div>
              ) : null}

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
                  <CategoryCombobox
                    value={form.category}
                    onChange={(category) => setForm((current) => ({ ...current, category }))}
                    placeholder="Categoria"
                    required
                  />

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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-sesi-blue px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sesi-navy disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar item'}
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
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
                  <CategoryCombobox
                    value={filters.category}
                    onChange={(category) => setFilters((current) => ({ ...current, category }))}
                    placeholder="Categoria"
                  />
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
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                Atualizado em {formatDate(item.updatedAt ?? item.createdAt, { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-sesi-ink">{item.name}</h3>
                          </div>
                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <p className="text-sm text-slate-500">{item.location}</p>
                            <div className="flex flex-wrap gap-2">
                              {canEditItem(item) ? (
                                <button
                                  type="button"
                                  onClick={() => handleEditItem(item)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                  Editar
                                </button>
                              ) : null}
                              {canDeleteItem() ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteItemId(item.id)}
                                  disabled={itemPendingDelete === item.id}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {itemPendingDelete === item.id ? 'Excluindo...' : 'Excluir'}
                                </button>
                              ) : null}
                            </div>
                          </div>
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
          ) : null}

          {activeSection === 'relatorios' ? (
            <section className="space-y-6">
              <article className="space-y-6">
              <ReportHeaderCard
                totalItems={filteredReportItems.length}
                totalLocations={new Set(filteredReportItems.map((item) => item.location)).size}
                totalMaintenance={filteredReportItems.filter((item) => item.condition === 'Requer manutencao').length}
              />

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-sesi-ink">Exportacao e analise</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Gere arquivos compativeis com Excel, LibreOffice e PDF para envio, impressao ou arquivo interno.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Os dados abaixo respeitam exclusivamente os filtros do relatorio.
                  </div>
                </div>

                {reportFeedback ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {reportFeedback}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <StatCard label="Itens no relatorio" value={filteredReportItems.length} help="Total com os filtros atuais" />
                <StatCard label="Locais incluidos" value={new Set(filteredReportItems.map((item) => item.location)).size} help="Ambientes presentes na exportacao" />
                <StatCard label="Em manutencao" value={filteredReportItems.filter((item) => item.condition === 'Requer manutencao').length} help="Itens que exigem acompanhamento" />
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">Filtros do relatorio</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Use os filtros para montar um recorte especifico antes de exportar ou imprimir.
                    </p>
                    <div className="mt-4 grid gap-3">
                      <input
                        type="search"
                        value={reportFilters.search}
                        onChange={(event) => setReportFilters((current) => ({ ...current, search: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                        placeholder="Buscar por item ou local"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CategoryCombobox
                          value={reportFilters.category}
                          onChange={(category) => setReportFilters((current) => ({ ...current, category }))}
                          placeholder="Categoria"
                        />
                        <select
                          value={reportFilters.condition}
                          onChange={(event) => setReportFilters((current) => ({ ...current, condition: event.target.value }))}
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
                  </div>

                  <ReportSummaryTable title="Resumo por categoria" rows={reportCategoryRows} />
                  <ReportSummaryTable title="Resumo por estado" rows={reportConditionRows} />
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ReportActionCard
                      title="Planilha Excel"
                      description="Exporta relatorio completo em .xlsx para Excel e LibreOffice."
                      buttonLabel="Exportar .xlsx"
                      onClick={exportReportXlsx}
                      primary
                    />
                    <ReportActionCard
                      title="Arquivo CSV"
                      description="Gera tabela simples para importacao e abertura rapida."
                      buttonLabel="Exportar .csv"
                      onClick={exportReportCsv}
                    />
                    <ReportActionCard
                      title="Impressao"
                      description="Abre versao pronta para impressao ou salvamento em PDF."
                      buttonLabel="Abrir impressao"
                      onClick={printReport}
                    />
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">Detalhamento do inventario</h3>
                        <p className="mt-1 text-sm text-slate-500">Visualizacao adaptada para consulta em celular e desktop.</p>
                      </div>
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                        {filteredReportItems.length} itens
                      </p>
                    </div>

                    <div className="mt-4 space-y-4 md:hidden">
                      {filteredReportItems.length ? (
                        filteredReportItems.map((item) => <ReportDetailCard key={`report-card-${item.id}`} item={item} />)
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <p className="text-base font-semibold text-sesi-ink">Nenhum item encontrado</p>
                          <p className="mt-2 text-sm text-slate-500">Ajuste os filtros do relatorio para continuar.</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold">Categoria</th>
                            <th className="px-4 py-3 font-semibold">Localizacao</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 font-semibold">Aquisicao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReportItems.length ? (
                            filteredReportItems.map((item) => (
                              <tr key={`report-${item.id}`} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-medium text-sesi-ink">{item.name}</td>
                                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                                <td className="px-4 py-3 text-slate-600">{item.location}</td>
                                <td className="px-4 py-3 text-slate-600">{item.condition}</td>
                                <td className="px-4 py-3 text-slate-600">{formatDate(item.acquisitionDate)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                Nenhum item disponivel para o relatorio com os filtros atuais.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              </article>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default App
