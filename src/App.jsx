import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { inventoryApi } from './lib/inventory-api'
import { hasSupabaseEnv, supabase } from './lib/supabase'

const emptyForm = {
  name: '',
  room: '',
  category: 'Ciências Humanas',
  location: '',
  condition: 'Bom',
  acquisitionDate: '',
  notes: '',
  image: '',
}

// eslint-disable-next-line no-unused-vars
const CATEGORY_OPTIONS = [
  'Ciências Humanas',
  'Linguagem',
  'Ciências da Natureza',
  'Robótica',
  'Informática',
  'Matemática',
  'Maker',
  'Sala de Recurso',
  'Biblioteca',
]

// eslint-disable-next-line no-unused-vars
const ROOM_OPTIONS_BY_CATEGORY = {
  'CiÃªncias Humanas': ['Sala 1', 'Sala 2', 'Sala 3'],
  Linguagem: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5'],
  'CiÃªncias da Natureza': ['Sala 1', 'Sala 2'],
  'MatemÃ¡tica': ['Sala 1', 'Sala 2'],
}

const DEFAULT_CATEGORY = 'Ciências Humanas'

const FIXED_CATEGORY_OPTIONS = [
  'Ciências Humanas',
  'Linguagem',
  'Ciências da Natureza',
  'Matemática',
  'Robótica',
  'Informática',
  'Maker',
  'Sala de Recurso',
  'Biblioteca',
  'Sala dos professores',
  'Sala do Grêmio Estudantil',
  'Outros',
]

const FIXED_ROOM_OPTIONS_BY_CATEGORY = {
  'Ciências Humanas': ['Sala 1', 'Sala 2', 'Sala 3'],
  Linguagem: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5'],
  'Ciências da Natureza': ['Sala 1', 'Sala 2'],
  Matemática: ['Sala 1', 'Sala 2'],
}

const INITIAL_FORM = {
  ...emptyForm,
  category: DEFAULT_CATEGORY,
  room: '',
}

function buildFormFromItem(item) {
  return {
    name: item.name,
    room: item.room ?? '',
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

function SectionToggle({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {options.map((item) => (
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

function PaginationControls({ page, totalPages, totalItems, visibleItems, onPageChange }) {
  if (totalItems <= visibleItems || totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Exibindo <span className="font-semibold text-sesi-ink">{visibleItems}</span> de{' '}
        <span className="font-semibold text-sesi-ink">{totalItems}</span> itens
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proxima
        </button>
      </div>
    </div>
  )
}

function ReportAccordionSection({ title, description, open, onToggle, badge, children }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {badge ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{badge}</span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {open ? 'Ocultar' : 'Abrir'}
          </span>
        </div>
      </button>
      {open ? <div className="border-t border-slate-200 px-4 py-4">{children}</div> : null}
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

function CategorySelect({ value, onChange, placeholder, required = false, allowAll = false, options = FIXED_CATEGORY_OPTIONS }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
      required={required}
      aria-label={placeholder}
    >
      {allowAll ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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

function isRecoveryContext() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)

  return (
    hash.get('type') === 'recovery' ||
    query.get('type') === 'recovery' ||
    hash.has('access_token') ||
    query.has('code')
  )
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

function PasswordRecoveryCard({
  recoveryForm,
  onChange,
  onSubmit,
  pending,
  error,
  success,
  onBack,
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-900/5">
            <img src="/sesi-alagoas-logo.jpg" alt="SESI Alagoas" className="h-20 w-auto sm:h-24" />
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sesi-blue">Recuperacao de acesso</p>
            <h1 className="mt-3 text-3xl font-bold text-sesi-ink">Definir nova senha</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Crie uma nova senha para concluir a recuperacao da conta e voltar ao sistema com seguranca.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Nova senha</span>
            <input
              type="password"
              value={recoveryForm.password}
              onChange={(event) => onChange('password', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sesi-blue focus:bg-white"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Confirmar nova senha</span>
            <input
              type="password"
              value={recoveryForm.confirmPassword}
              onChange={(event) => onChange('confirmPassword', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sesi-blue focus:bg-white"
              required
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#0057b8,#0b3b75)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/15 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Voltar ao login
          </button>
        </form>
      </section>
    </main>
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
  const maxValue = Math.max(...rows.map((row) => row.value), 0)

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className="text-sm font-semibold text-sesi-ink">{row.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-[linear-gradient(135deg,#0057b8,#0b3b75)]"
                style={{ width: `${maxValue ? Math.max((row.value / maxValue) * 100, 8) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportMetricCard({ label, value, help, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200 bg-white text-sesi-ink',
    attention: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  }

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${tones[tone] ?? tones.default}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{help}</p>
    </div>
  )
}

function ReportPriorityCard({ title, description, rows }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-sesi-ink">{row.label}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{row.value}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{row.help}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportChartCard({ title, description, children }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 h-72 w-full">{children}</div>
    </div>
  )
}

function ReportChartsPanel({ categoryRows, conditionRows, locationRows, timelineRows }) {
  const categoryChartData = categoryRows.slice(0, 6)
  const locationChartData = locationRows.slice(0, 6)
  const conditionChartData = conditionRows.filter((row) => row.value > 0)
  const pieColors = ['#0057b8', '#0b3b75', '#0ea5e9', '#f59e0b']

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ReportChartCard
        title="Categorias com maior volume"
        description="Comparativo rapido das categorias mais representativas do recorte atual."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryChartData} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" allowDecimals={false} />
            <YAxis type="category" dataKey="label" stroke="#475569" width={110} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
            <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="#0057b8" />
          </BarChart>
        </ResponsiveContainer>
      </ReportChartCard>

      <ReportChartCard
        title="Distribuicao por estado"
        description="Leitura visual do equilibrio entre itens excelentes, bons, regulares e em manutencao."
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conditionChartData}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={3}
            >
              {conditionChartData.map((entry, index) => (
                <Cell key={`condition-cell-${entry.label}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
          </PieChart>
        </ResponsiveContainer>
      </ReportChartCard>

      <ReportChartCard
        title="Concentracao por ambiente"
        description="Identifica rapidamente os locais com maior acumulacao de itens no inventario."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={locationChartData} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" angle={-18} textAnchor="end" height={56} interval={0} />
            <YAxis stroke="#64748b" allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </ReportChartCard>

      <ReportChartCard
        title="Evolucao por aquisicao"
        description="Mostra a distribuicao dos registros filtrados ao longo do tempo de aquisicao."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timelineRows} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0b3b75" />
          </BarChart>
        </ResponsiveContainer>
      </ReportChartCard>
    </div>
  )
}

function ReportExportPanel({ onExportXlsx, onExportCsv, onPrint }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ReportActionCard
        title="Planilha institucional"
        description="Exporta relatorio completo em .xlsx para uso executivo, Excel e LibreOffice."
        buttonLabel="Exportar planilha completa"
        onClick={onExportXlsx}
        primary
      />
      <ReportActionCard
        title="CSV tecnico"
        description="Gera tabela simples para integracoes, importacao e leitura operacional rapida."
        buttonLabel="Gerar CSV tecnico"
        onClick={onExportCsv}
      />
      <ReportActionCard
        title="Versao para impressao"
        description="Abre uma apresentacao pronta para impressao ou salvamento em PDF institucional."
        buttonLabel="Abrir versao para impressao"
        onClick={onPrint}
      />
    </div>
  )
}

function ReportDetailsPanel({
  previewItems,
  totalItems,
  showFullDetails,
  onToggleDetails,
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">Detalhamento do inventario</h3>
          <p className="mt-1 text-sm text-slate-500">Itens ordenados por criticidade e atualizacao para priorizar a leitura da diretoria.</p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {previewItems.length} de {totalItems} itens
        </p>
      </div>

      {!showFullDetails && totalItems > REPORT_DETAIL_PREVIEW_COUNT ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Exibindo primeiro os {REPORT_DETAIL_PREVIEW_COUNT} itens mais sensiveis do recorte. Abra o restante apenas se precisar aprofundar.
        </div>
      ) : null}

      <div className="mt-4 space-y-4 md:hidden">
        {previewItems.length ? (
          previewItems.map((item) => <ReportDetailCard key={`report-card-${item.id}`} item={item} />)
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
              <th className="px-4 py-3 font-semibold">Sala</th>
              <th className="px-4 py-3 font-semibold">Localizacao</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Aquisicao</th>
            </tr>
          </thead>
          <tbody>
            {previewItems.length ? (
              previewItems.map((item) => (
                <tr key={`report-${item.id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-sesi-ink">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-4 py-3 text-slate-600">{item.room || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.location}</td>
                  <td className="px-4 py-3 text-slate-600">{item.condition}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.acquisitionDate)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                  Nenhum item disponivel para o relatorio com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > REPORT_DETAIL_PREVIEW_COUNT ? (
        <button
          type="button"
          onClick={onToggleDetails}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {showFullDetails ? 'Voltar ao resumo priorizado' : 'Ver todos os itens do relatorio'}
        </button>
      ) : null}
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
        {item.room ? <p><span className="font-semibold text-sesi-ink">Sala:</span> {item.room}</p> : null}
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

const REPORT_DETAIL_PREVIEW_COUNT = 12

function UnitSelect({ units, value, onChange }) {
  if (!units.length) {
    return null
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-sesi-ink outline-none transition focus:border-sesi-blue"
      aria-label="Selecionar unidade"
    >
      {units.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.code} - {unit.description}
        </option>
      ))}
    </select>
  )
}

function RoleBadge({ value }) {
  const tones = {
    Administrador: 'bg-violet-50 text-violet-700',
    Supervisor: 'bg-sky-50 text-sky-700',
    Colaborador: 'bg-slate-100 text-slate-700',
    Visualizacao: 'bg-amber-50 text-amber-700',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[value] ?? 'bg-slate-100 text-slate-700'}`}>
      {value}
    </span>
  )
}

function UnitStatusBadge({ active }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

const CONSULT_ITEMS_PER_PAGE = 24

function App() {
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [form, setForm] = useState(INITIAL_FORM)
  const [filters, setFilters] = useState({ search: '', category: '', condition: 'Todos' })
  const [reportFilters, setReportFilters] = useState({
    search: '',
    category: '',
    condition: 'Todos',
    acquisitionDateFrom: '',
    acquisitionDateTo: '',
  })
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
  const [showFullReportDetails, setShowFullReportDetails] = useState(false)
  const [reportSectionsOpen, setReportSectionsOpen] = useState({
    summary: true,
    filters: false,
    charts: true,
    exports: false,
    details: false,
  })
  const [consultPage, setConsultPage] = useState(1)
  const [authView, setAuthView] = useState(() => (hasSupabaseEnv && isRecoveryContext() ? 'recovery' : 'login'))
  const [recoveryForm, setRecoveryForm] = useState({ password: '', confirmPassword: '' })
  const [recoveryError, setRecoveryError] = useState('')
  const [recoveryFeedback, setRecoveryFeedback] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [adminUnits, setAdminUnits] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [adminFeedback, setAdminFeedback] = useState('')
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [unitForm, setUnitForm] = useState({ id: '', code: '', description: '', isActive: true })
  const [accessForm, setAccessForm] = useState({
    id: '',
    name: '',
    email: '',
    role: 'Colaborador',
    unitIds: [],
    lastUnitId: '',
  })
  const formCardRef = useRef(null)
  const consultCardRef = useRef(null)
  const isAdmin = session?.role === 'Administrador'
  const canCreateItems = ['Administrador', 'Supervisor', 'Colaborador'].includes(session?.role ?? '')

  const resetUnitForm = () => setUnitForm({ id: '', code: '', description: '', isActive: true })
  const resetAccessForm = () =>
    setAccessForm({
      id: '',
      name: '',
      email: '',
      role: 'Colaborador',
      unitIds: [],
      lastUnitId: '',
    })

  const refreshSessionAndItems = async () => {
    const restoredSession = await inventoryApi.restoreSession()
    const loadedItems = restoredSession?.activeUnitId
      ? await inventoryApi.listItems(restoredSession.activeUnitId)
      : []

    setSession(restoredSession)
    setItems(loadedItems)
    return restoredSession
  }

  const loadAdminData = async (currentSession = session) => {
    if (currentSession?.role !== 'Administrador') {
      return
    }

    setIsAdminLoading(true)

    try {
      const [units, users] = await Promise.all([
        inventoryApi.listUnits(currentSession),
        inventoryApi.listAccessUsers(currentSession),
      ])

      setAdminUnits(units)
      setAdminUsers(users)
    } finally {
      setIsAdminLoading(false)
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        if (hasSupabaseEnv && isRecoveryContext()) {
          setAuthView('recovery')
        }

        const restoredSession = await inventoryApi.restoreSession()
        const loadedItems = restoredSession?.activeUnitId
          ? await inventoryApi.listItems(restoredSession.activeUnitId)
          : []

        setSession(restoredSession)
        setItems(loadedItems)

        if (restoredSession?.role === 'Administrador') {
          const [units, users] = await Promise.all([
            inventoryApi.listUnits(restoredSession),
            inventoryApi.listAccessUsers(restoredSession),
          ])
          setAdminUnits(units)
          setAdminUsers(users)
        }

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
    if (!hasSupabaseEnv || !supabase) {
      return undefined
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('recovery')
        setRecoveryError('')
        setRecoveryFeedback('')
      }
    })

    return () => subscription.unsubscribe()
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
          item.location.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.room ?? '').toLowerCase().includes(filters.search.toLowerCase())
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
          item.location.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
          (item.room ?? '').toLowerCase().includes(reportFilters.search.toLowerCase())
        const matchesCategory = !reportFilters.category || item.category === reportFilters.category
        const matchesCondition =
          reportFilters.condition === 'Todos' || item.condition === reportFilters.condition
        const matchesAcquisitionDateFrom =
          !reportFilters.acquisitionDateFrom || item.acquisitionDate >= reportFilters.acquisitionDateFrom
        const matchesAcquisitionDateTo =
          !reportFilters.acquisitionDateTo || item.acquisitionDate <= reportFilters.acquisitionDateTo

        return (
          matchesSearch &&
          matchesCategory &&
          matchesCondition &&
          matchesAcquisitionDateFrom &&
          matchesAcquisitionDateTo
        )
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
  const reportTopConditionRow = [...reportConditionRows].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label, 'pt-BR'),
  )[0] ?? null

  const reportItemsSortedByPriority = useMemo(() => {
    const conditionWeight = {
      'Requer manutencao': 0,
      Regular: 1,
      Bom: 2,
      Excelente: 3,
    }

    return [...filteredReportItems].sort((left, right) => {
      const conditionDifference = (conditionWeight[left.condition] ?? 99) - (conditionWeight[right.condition] ?? 99)

      if (conditionDifference !== 0) {
        return conditionDifference
      }

      return new Date(right.updatedAt ?? right.createdAt).getTime() - new Date(left.updatedAt ?? left.createdAt).getTime()
    })
  }, [filteredReportItems])

  const reportPreviewItems = showFullReportDetails
    ? reportItemsSortedByPriority
    : reportItemsSortedByPriority.slice(0, REPORT_DETAIL_PREVIEW_COUNT)

  const reportMaintenanceCount = filteredReportItems.filter((item) => item.condition === 'Requer manutencao').length
  const reportMissingImageCount = filteredReportItems.filter((item) => !item.imagePath && !item.image).length
  const reportMissingNotesCount = filteredReportItems.filter((item) => !item.notes?.trim()).length
  const reportMaintenanceRate = filteredReportItems.length
    ? Math.round((reportMaintenanceCount / filteredReportItems.length) * 100)
    : 0
  const reportLeadingCategory = reportCategoryRows[0] ?? null
  const reportLocationRows = useMemo(() => {
    const counts = filteredReportItems.reduce((accumulator, item) => {
      accumulator[item.location] = (accumulator[item.location] ?? 0) + 1
      return accumulator
    }, {})

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'pt-BR'))
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))
  }, [filteredReportItems])
  const reportTimelineRows = useMemo(() => {
    const counts = filteredReportItems.reduce((accumulator, item) => {
      const monthKey = item.acquisitionDate?.slice(0, 7)

      if (!monthKey) {
        return accumulator
      }

      accumulator[monthKey] = (accumulator[monthKey] ?? 0) + 1
      return accumulator
    }, {})

    return Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-6)
      .map(([label, value]) => ({ label, value }))
  }, [filteredReportItems])
  const reportLeadingLocation = reportLocationRows[0] ?? null
  const reportHasActiveFilters = Boolean(
    reportFilters.search ||
    reportFilters.category ||
    reportFilters.condition !== 'Todos' ||
    reportFilters.acquisitionDateFrom ||
    reportFilters.acquisitionDateTo,
  )
  const reportPriorityRows = [
    {
      label: 'Itens em manutencao',
      value: reportMaintenanceCount,
      help: 'Prioridade imediata para acompanhamento tecnico e previsao de substituicao.',
    },
    {
      label: 'Itens sem foto',
      value: reportMissingImageCount,
      help: 'Equipamentos sem evidencia visual reduzem confiabilidade para auditoria e prestacao de contas.',
    },
    {
      label: 'Itens sem observacao',
      value: reportMissingNotesCount,
      help: 'Registros sem contexto dificultam justificativas em manutencao, troca ou remanejamento.',
    },
  ]

  const reportDetailRows = useMemo(
    () =>
      filteredReportItems.map((item) => ({
        'Nome do item': item.name,
        Categoria: item.category,
        Sala: item.room || '',
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
  const activeUnit = session?.units?.find((unit) => unit.id === session.activeUnitId) ?? null
  const isEditing = Boolean(editingItemId)
  const editingItem = items.find((item) => item.id === editingItemId) ?? null
  const itemBeingConfirmed = items.find((item) => item.id === confirmingDeleteItemId) ?? null
  const roomOptions = FIXED_ROOM_OPTIONS_BY_CATEGORY[form.category] ?? []
  const shouldShowRoomSelect = roomOptions.length > 0
  const visibleActiveSection = !canCreateItems && activeSection === 'cadastro' ? 'consulta' : activeSection
  const consultTotalPages = Math.max(1, Math.ceil(filteredItems.length / CONSULT_ITEMS_PER_PAGE))
  const safeConsultPage = Math.min(consultPage, consultTotalPages)
  const paginatedItems = filteredItems.slice(
    (safeConsultPage - 1) * CONSULT_ITEMS_PER_PAGE,
    safeConsultPage * CONSULT_ITEMS_PER_PAGE,
  )
  const sectionOptions = [
    ...(canCreateItems ? [{ id: 'cadastro', label: 'Cadastro' }] : []),
    { id: 'consulta', label: 'Consulta' },
    { id: 'relatorios', label: 'Relatorios' },
    ...(isAdmin ? [{ id: 'administracao', label: 'Administracao' }] : []),
  ]

  const canEditItem = (item) =>
    ['Administrador', 'Supervisor'].includes(session.role) ||
    (session.role === 'Colaborador' && item.createdBy === session.id)
  const canDeleteItem = () => ['Administrador', 'Supervisor'].includes(session.role)

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setScreenError('')

    try {
      const user = await inventoryApi.login(loginForm)
      const loadedItems = user.activeUnitId ? await inventoryApi.listItems(user.activeUnitId) : []
      setSession(user)
      setItems(loadedItems)
      setConsultPage(1)
      setAuthView('app')

      if (user.role === 'Administrador') {
        const [units, users] = await Promise.all([
          inventoryApi.listUnits(user),
          inventoryApi.listAccessUsers(user),
        ])
        setAdminUnits(units)
        setAdminUsers(users)
      }
    } catch (error) {
      setLoginError(error.message || 'Nao foi possivel entrar.')
    }
  }

  const handleUnitChange = async (unitId) => {
    if (!session || unitId === session.activeUnitId) {
      return
    }

    setIsLoading(true)
    setFeedback('')

    try {
      const nextSession = await inventoryApi.setActiveUnit(session, unitId)
      const loadedItems = await inventoryApi.listItems(unitId)
      setSession(nextSession)
      setItems(loadedItems)
      setConsultPage(1)
      resetFormState()
      setActiveSection('consulta')
    } catch (error) {
      setFeedback(error.message || 'Nao foi possivel trocar a unidade ativa.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSectionChange = async (sectionId) => {
    setActiveSection(sectionId)

    if (sectionId === 'administracao' && isAdmin) {
      setAdminFeedback('')

      try {
        await loadAdminData()
      } catch (error) {
        setAdminFeedback(error.message || 'Nao foi possivel carregar os dados administrativos.')
      }
    }
  }

  const handleLogout = async () => {
    await inventoryApi.logout()
    setSession(null)
    setAuthView('login')
    setItems([])
    setConsultPage(1)
    setAdminUnits([])
    setAdminUsers([])
    resetUnitForm()
    resetAccessForm()
  }

  const handleRecoveryFieldChange = (field, value) => {
    setRecoveryForm((current) => ({ ...current, [field]: value }))
  }

  const handlePasswordRecoverySubmit = async (event) => {
    event.preventDefault()
    setRecoveryError('')
    setRecoveryFeedback('')

    if (recoveryForm.password.length < 6) {
      setRecoveryError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (recoveryForm.password !== recoveryForm.confirmPassword) {
      setRecoveryError('A confirmacao da senha nao confere.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      await inventoryApi.updatePassword(recoveryForm.password)
      setRecoveryForm({ password: '', confirmPassword: '' })
      setRecoveryFeedback('Senha atualizada com sucesso. Voce ja pode continuar no sistema.')
      setAuthView('app')

      const refreshedSession = await refreshSessionAndItems()

      if (refreshedSession?.role === 'Administrador') {
        await loadAdminData(refreshedSession)
      }

      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      setRecoveryError(error.message || 'Nao foi possivel atualizar a senha.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleBackToLogin = async () => {
    setRecoveryError('')
    setRecoveryFeedback('')
    setRecoveryForm({ password: '', confirmPassword: '' })
    setAuthView('login')
    window.history.replaceState({}, document.title, window.location.pathname)

    if (hasSupabaseEnv) {
      await inventoryApi.logout()
      setSession(null)
    }
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
    setForm(INITIAL_FORM)
    setSelectedFile(null)
    setEditingItemId('')
  }

  const handleCategoryChange = (category) => {
    setForm((current) => {
      const nextRoomOptions = FIXED_ROOM_OPTIONS_BY_CATEGORY[category] ?? []
      const nextRoom = nextRoomOptions.includes(current.room) ? current.room : ''

      return {
        ...current,
        category,
        room: nextRoom,
      }
    })
  }

  const handleEditItem = (item) => {
    if (!canEditItem(item)) {
      setFeedback('Seu perfil possui acesso somente para visualizacao.')
      return
    }

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
    if (!canCreateItems) {
      setFeedback('Seu perfil possui acesso somente para visualizacao.')
      return
    }

    handleCancelEdit()
    setActiveSection('cadastro')
    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canCreateItems) {
      setFeedback('Seu perfil possui acesso somente para visualizacao.')
      return
    }

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
        setConsultPage(1)
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

  const handleEditUnitRecord = (unit) => {
    setUnitForm({
      id: unit.id,
      code: unit.code,
      description: unit.description,
      isActive: unit.isActive,
    })
    setAdminFeedback('')
    setActiveSection('administracao')
  }

  const handleUnitSubmit = async (event) => {
    event.preventDefault()
    setAdminFeedback('')
    setIsAdminLoading(true)

    try {
      await inventoryApi.saveUnit(unitForm, session)
      await loadAdminData()
      await refreshSessionAndItems()
      resetUnitForm()
      setAdminFeedback('Unidade salva com sucesso.')
    } catch (error) {
      setAdminFeedback(error.message || 'Nao foi possivel salvar a unidade.')
    } finally {
      setIsAdminLoading(false)
    }
  }

  const handleEditAccessUser = (user) => {
    setAccessForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unitIds: user.unitIds,
      lastUnitId: user.lastUnitId || user.unitIds[0] || '',
    })
    setAdminFeedback('')
    setActiveSection('administracao')
  }

  const toggleAccessUnit = (unitId) => {
    setAccessForm((current) => {
      const nextUnitIds = current.unitIds.includes(unitId)
        ? current.unitIds.filter((entry) => entry !== unitId)
        : [...current.unitIds, unitId]

      return {
        ...current,
        unitIds: nextUnitIds,
        lastUnitId: nextUnitIds.includes(current.lastUnitId) ? current.lastUnitId : nextUnitIds[0] ?? '',
      }
    })
  }

  const handleAccessSubmit = async (event) => {
    event.preventDefault()
    setAdminFeedback('')
    setIsAdminLoading(true)

    try {
      await inventoryApi.saveAccessUser(accessForm.id, accessForm, session)
      const refreshedSession = await refreshSessionAndItems()
      await loadAdminData(refreshedSession ?? session)
      setAdminFeedback('Acessos atualizados com sucesso.')

      if (refreshedSession?.role !== 'Administrador') {
        setActiveSection('consulta')
      }
    } catch (error) {
      setAdminFeedback(error.message || 'Nao foi possivel atualizar os acessos do usuario.')
    } finally {
      setIsAdminLoading(false)
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

  const handleConsultFilterChange = (field, value) => {
    setConsultPage(1)
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleReportFilterChange = (field, value) => {
    setShowFullReportDetails(false)
    setReportSectionsOpen((current) => ({ ...current, details: false }))
    setReportFilters((current) => ({ ...current, [field]: value }))
  }

  const resetReportFilters = () => {
    setShowFullReportDetails(false)
    setReportSectionsOpen((current) => ({ ...current, details: false }))
    setReportFilters({
      search: '',
      category: '',
      condition: 'Todos',
      acquisitionDateFrom: '',
      acquisitionDateTo: '',
    })
  }

  const toggleReportSection = (sectionId) => {
    setReportSectionsOpen((current) => ({ ...current, [sectionId]: !current[sectionId] }))
  }

  const handleConsultPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > consultTotalPages) {
      return
    }

    setConsultPage(nextPage)
    window.requestAnimationFrame(() => {
      consultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
            <td>${item.room || '-'}</td>
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
                <th>Sala</th>
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

  if (authView === 'recovery') {
    return (
      <PasswordRecoveryCard
        recoveryForm={recoveryForm}
        onChange={handleRecoveryFieldChange}
        onSubmit={handlePasswordRecoverySubmit}
        pending={isUpdatingPassword}
        error={recoveryError}
        success={recoveryFeedback}
        onBack={handleBackToLogin}
      />
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
              <p className="mt-2">admin@sesi-al.demo / sesi123</p>
              <p className="mt-1">supervisora@sesi-al.demo / sesi123</p>
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

      {canCreateItems && ['cadastro', 'consulta'].includes(visibleActiveSection) ? <FloatingActionButton onClick={handleCreateNewItem} /> : null}

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
              <SectionToggle value={visibleActiveSection} onChange={handleSectionChange} options={sectionOptions} />
              {session?.units?.length ? (
                <UnitSelect units={session.units} value={session.activeUnitId} onChange={handleUnitChange} />
              ) : null}
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
              <h1 className="text-2xl font-bold text-sesi-ink">
                {visibleActiveSection === 'administracao' ? 'Painel administrativo' : 'Painel de inventario'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Usuario: <span className="font-semibold text-sesi-ink">{displayName}</span> - {session.role}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Unidade ativa:{' '}
                <span className="font-semibold text-sesi-ink">
                  {activeUnit ? `${activeUnit.code} - ${activeUnit.description}` : 'Nenhuma unidade vinculada'}
                </span>
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

          {['cadastro', 'consulta'].includes(visibleActiveSection) ? (
            <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <article ref={formCardRef} className={`${visibleActiveSection === 'consulta' ? 'hidden xl:block' : 'block'} rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5`}>
              {canCreateItems ? (
                <>
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

                <div className={`grid gap-4 ${shouldShowRoomSelect ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <CategorySelect
                    value={form.category}
                    onChange={handleCategoryChange}
                    placeholder="Categoria"
                    required
                  />

                  {shouldShowRoomSelect ? (
                    <CategorySelect
                      value={form.room}
                      onChange={(room) => setForm((current) => ({ ...current, room }))}
                      placeholder="Sala"
                      required
                      options={roomOptions}
                    />
                  ) : null}

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
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
                  Este acesso esta configurado somente para visualizacao. Consultas, filtros e relatorios continuam disponiveis, mas o cadastro e a edicao de itens ficam bloqueados.
                </div>
              )}
              </article>

              <article ref={consultCardRef} className={`${visibleActiveSection === 'cadastro' ? 'hidden xl:block' : 'block'} rounded-[1.75rem] border border-slate-200 bg-white p-5`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sesi-ink">Consulta de itens</h2>
                  <p className="text-sm text-slate-500">Busca e conferencia por ambiente ou categoria.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => handleConsultFilterChange('search', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                    placeholder="Buscar"
                  />
                  <CategorySelect
                    value={filters.category}
                    onChange={(category) => handleConsultFilterChange('category', category)}
                    placeholder="Todas as categorias"
                    allowAll
                  />
                  <select
                    value={filters.condition}
                    onChange={(event) => handleConsultFilterChange('condition', event.target.value)}
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
                  paginatedItems.map((item) => (
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
                          {item.room ? <p>Sala: {item.room}</p> : null}
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

              <PaginationControls
                page={safeConsultPage}
                totalPages={consultTotalPages}
                totalItems={filteredItems.length}
                visibleItems={paginatedItems.length}
                onPageChange={handleConsultPageChange}
              />
              </article>
            </section>
          ) : null}

          {visibleActiveSection === 'administracao' && isAdmin ? (
            <section className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ffffff)] p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sesi-blue">Governanca multi-unidade</p>
                    <h2 className="mt-2 text-2xl font-bold text-sesi-ink">Unidades e acessos</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      Controle a estrutura das unidades e os vinculos de acesso dos usuarios. O cadastro de novas credenciais continua sendo feito no Supabase Auth, enquanto este modulo organiza perfis e permissoes operacionais.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <p><span className="font-semibold text-sesi-ink">Unidades:</span> {adminUnits.length}</p>
                    <p className="mt-1"><span className="font-semibold text-sesi-ink">Usuarios:</span> {adminUsers.length}</p>
                  </div>
                </div>
              </div>

              {adminFeedback ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    adminFeedback.toLowerCase().includes('nao foi')
                      ? 'border border-rose-200 bg-rose-50 text-rose-700'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {adminFeedback}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5">
                  <div>
                    <h3 className="text-xl font-bold text-sesi-ink">
                      {unitForm.id ? 'Edicao de unidade' : 'Cadastro de unidade'}
                    </h3>
                    <p className="text-sm text-slate-500">Mantenha o codigo e a descricao institucional de cada unidade.</p>
                  </div>

                  <form className="mt-5 space-y-4" onSubmit={handleUnitSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Codigo</span>
                        <input
                          type="text"
                          value={unitForm.code}
                          onChange={(event) => setUnitForm((current) => ({ ...current, code: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                          placeholder="001"
                          required
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Status</span>
                        <select
                          value={unitForm.isActive ? 'ativa' : 'inativa'}
                          onChange={(event) =>
                            setUnitForm((current) => ({ ...current, isActive: event.target.value === 'ativa' }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                        >
                          <option value="ativa">Ativa</option>
                          <option value="inativa">Inativa</option>
                        </select>
                      </label>
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">Descricao</span>
                      <input
                        type="text"
                        value={unitForm.description}
                        onChange={(event) => setUnitForm((current) => ({ ...current, description: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                        placeholder="SESI 001"
                        required
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isAdminLoading}
                      className="w-full rounded-2xl bg-sesi-blue px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sesi-navy disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isAdminLoading ? 'Salvando...' : unitForm.id ? 'Salvar unidade' : 'Cadastrar unidade'}
                    </button>

                    {unitForm.id ? (
                      <button
                        type="button"
                        onClick={resetUnitForm}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancelar edicao
                      </button>
                    ) : null}
                  </form>
                </article>

                <article className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-sesi-ink">Unidades cadastradas</h3>
                      <p className="text-sm text-slate-500">Edite a estrutura ativa do inventario por unidade.</p>
                    </div>
                    {isAdminLoading ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Atualizando...</span>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {adminUnits.map((unit) => (
                      <article key={unit.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-sesi-blue">{unit.code}</p>
                            <h4 className="mt-1 text-lg font-bold text-sesi-ink">{unit.description}</h4>
                          </div>
                          <UnitStatusBadge active={unit.isActive} />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditUnitRecord(unit)}
                          className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Editar unidade
                        </button>
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <div>
                    <h3 className="text-xl font-bold text-sesi-ink">Usuarios vinculados</h3>
                    <p className="mt-1 text-sm text-slate-500">Selecione um usuario para revisar perfil, unidade padrao e vinculos de acesso.</p>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {adminUsers.map((user) => (
                      <article key={user.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-sesi-ink">{user.name}</h4>
                            <p className="mt-1 text-sm text-slate-500">{user.email || 'E-mail nao sincronizado'}</p>
                          </div>
                          <RoleBadge value={user.role} />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {user.units.map((unit) => (
                            <span key={`${user.id}-${unit.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sesi-blue">
                              {unit.code} - {unit.description}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditAccessUser(user)}
                          className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Configurar acesso
                        </button>
                      </article>
                    ))}
                  </div>
                </article>

                <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5">
                  <div>
                    <h3 className="text-xl font-bold text-sesi-ink">Configuracao de acesso</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {accessForm.id
                        ? 'Ajuste perfil e unidades do usuario selecionado.'
                        : 'Selecione um usuario na lista ao lado para configurar os acessos.'}
                    </p>
                  </div>

                  {accessForm.id ? (
                    <form className="mt-5 space-y-4" onSubmit={handleAccessSubmit}>
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Nome</span>
                        <input
                          type="text"
                          value={accessForm.name}
                          onChange={(event) => setAccessForm((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                          required
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">E-mail</span>
                        <input
                          type="text"
                          value={accessForm.email}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                          disabled
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">Perfil</span>
                          <select
                            value={accessForm.role}
                            onChange={(event) => setAccessForm((current) => ({ ...current, role: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                          >
                            <option>Administrador</option>
                            <option>Supervisor</option>
                            <option>Colaborador</option>
                            <option>Visualizacao</option>
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">Unidade padrao</span>
                          <select
                            value={accessForm.lastUnitId}
                            onChange={(event) => setAccessForm((current) => ({ ...current, lastUnitId: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sesi-blue"
                            disabled={!accessForm.unitIds.length}
                          >
                            {accessForm.unitIds.map((unitId) => {
                              const unit = adminUnits.find((entry) => entry.id === unitId)

                              if (!unit) {
                                return null
                              }

                              return (
                                <option key={`default-${unit.id}`} value={unit.id}>
                                  {unit.code} - {unit.description}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-sesi-ink">Unidades vinculadas</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {adminUnits.map((unit) => (
                            <label
                              key={`checkbox-${unit.id}`}
                              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={accessForm.unitIds.includes(unit.id)}
                                onChange={() => toggleAccessUnit(unit.id)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-sesi-blue focus:ring-sesi-blue"
                              />
                              <div>
                                <p className="text-sm font-semibold text-sesi-ink">{unit.code}</p>
                                <p className="text-sm text-slate-500">{unit.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAdminLoading}
                        className="w-full rounded-2xl bg-sesi-blue px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sesi-navy disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isAdminLoading ? 'Salvando...' : 'Salvar acessos'}
                      </button>

                      <button
                        type="button"
                        onClick={resetAccessForm}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Limpar selecao
                      </button>
                    </form>
                  ) : (
                    <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center">
                      <p className="text-base font-semibold text-sesi-ink">Nenhum usuario selecionado</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Escolha um usuario na lista para editar perfil, unidade padrao e vinculos de acesso.
                      </p>
                    </div>
                  )}
                </article>
              </div>
            </section>
          ) : null}

          {visibleActiveSection === 'relatorios' ? (
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
                    <h2 className="text-xl font-bold text-sesi-ink">Resumo executivo e exportacao</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Painel consolidado para leitura gerencial, identificacao de riscos e emissao de arquivos institucionais.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Os dados abaixo respeitam exclusivamente os filtros e a unidade ativa do relatorio.
                  </div>
                </div>

                {reportFeedback ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {reportFeedback}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 xl:grid-cols-5">
                <StatCard label="Itens no relatorio" value={filteredReportItems.length} help="Total com os filtros atuais" />
                <StatCard label="Locais incluidos" value={new Set(filteredReportItems.map((item) => item.location)).size} help="Ambientes presentes na exportacao" />
                <StatCard label="Em manutencao" value={reportMaintenanceCount} help="Itens que exigem acompanhamento" />
                <ReportMetricCard
                  label="Indice critico"
                  value={`${reportMaintenanceRate}%`}
                  help="Percentual do acervo filtrado em manutencao."
                  tone={reportMaintenanceRate >= 15 ? 'danger' : reportMaintenanceRate >= 8 ? 'attention' : 'default'}
                />
                <ReportMetricCard
                  label="Evidencia pendente"
                  value={reportMissingImageCount}
                  help="Itens sem foto no recorte atual."
                  tone={reportMissingImageCount > 0 ? 'attention' : 'default'}
                />
              </div>

              <div className="space-y-4 lg:hidden">
                <ReportAccordionSection
                  title="Resumo"
                  description="Indicadores principais para leitura executiva do inventario."
                  open={reportSectionsOpen.summary}
                  onToggle={() => toggleReportSection('summary')}
                  badge={`${filteredReportItems.length} itens`}
                >
                  <div className="grid gap-4">
                    <ReportPriorityCard
                      title="Pontos de atencao"
                      description="Leitura rapida das principais pendencias do recorte exibido."
                      rows={reportPriorityRows}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ReportMetricCard
                        label="Categoria lider"
                        value={reportLeadingCategory ? `${reportLeadingCategory.label}` : 'Sem dados'}
                        help={reportLeadingCategory ? `${reportLeadingCategory.value} itens no recorte atual.` : 'Nenhum item encontrado com os filtros atuais.'}
                      />
                      <ReportMetricCard
                        label="Local com maior volume"
                        value={reportLeadingLocation ? reportLeadingLocation.label : 'Sem dados'}
                        help={reportLeadingLocation ? `${reportLeadingLocation.value} itens concentrados neste ambiente.` : 'Nenhum ambiente disponivel no recorte atual.'}
                      />
                      <ReportMetricCard
                        label="Estado predominante"
                        value={reportTopConditionRow ? reportTopConditionRow.label : 'Sem dados'}
                        help={reportTopConditionRow ? `${reportTopConditionRow.value} itens neste estado.` : 'Nenhum estado disponivel no recorte atual.'}
                      />
                    </div>
                  </div>
                </ReportAccordionSection>

                <ReportAccordionSection
                  title="Filtros"
                  description="Defina recortes por busca, categoria, estado e periodo."
                  open={reportSectionsOpen.filters}
                  onToggle={() => toggleReportSection('filters')}
                  badge={reportHasActiveFilters ? 'Ativos' : 'Todos'}
                >
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={resetReportFilters}
                      disabled={!reportHasActiveFilters}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Limpar filtros
                    </button>
                    <input
                      type="search"
                      value={reportFilters.search}
                      onChange={(event) => handleReportFilterChange('search', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                      placeholder="Buscar por item ou local"
                    />
                    <CategorySelect
                      value={reportFilters.category}
                      onChange={(category) => handleReportFilterChange('category', category)}
                      placeholder="Todas as categorias"
                      allowAll
                    />
                    <select
                      value={reportFilters.condition}
                      onChange={(event) => handleReportFilterChange('condition', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                    >
                      <option>Todos</option>
                      <option>Excelente</option>
                      <option>Bom</option>
                      <option>Regular</option>
                      <option>Requer manutencao</option>
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Aquisicao a partir de</span>
                        <input
                          type="date"
                          value={reportFilters.acquisitionDateFrom}
                          onChange={(event) => handleReportFilterChange('acquisitionDateFrom', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Aquisicao ate</span>
                        <input
                          type="date"
                          value={reportFilters.acquisitionDateTo}
                          onChange={(event) => handleReportFilterChange('acquisitionDateTo', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                        />
                      </label>
                    </div>
                  </div>
                </ReportAccordionSection>

                <ReportAccordionSection
                  title="Analises"
                  description="Graficos e comparativos para leitura em estilo BI."
                  open={reportSectionsOpen.charts}
                  onToggle={() => toggleReportSection('charts')}
                >
                  <div className="space-y-4">
                    <ReportChartsPanel
                      categoryRows={reportCategoryRows}
                      conditionRows={reportConditionRows}
                      locationRows={reportLocationRows}
                      timelineRows={reportTimelineRows}
                    />
                    <ReportSummaryTable title="Resumo por categoria" rows={reportCategoryRows} />
                    <ReportSummaryTable title="Resumo por estado" rows={reportConditionRows} />
                    <ReportSummaryTable title="Top locais por concentracao" rows={reportLocationRows} />
                  </div>
                </ReportAccordionSection>

                <ReportAccordionSection
                  title="Exportacao"
                  description="Arquivos prontos para diretoria, operacao e impressao."
                  open={reportSectionsOpen.exports}
                  onToggle={() => toggleReportSection('exports')}
                >
                  <ReportExportPanel
                    onExportXlsx={exportReportXlsx}
                    onExportCsv={exportReportCsv}
                    onPrint={printReport}
                  />
                </ReportAccordionSection>

                <ReportAccordionSection
                  title="Detalhamento"
                  description="Lista priorizada dos itens mais sensiveis do recorte."
                  open={reportSectionsOpen.details}
                  onToggle={() => toggleReportSection('details')}
                  badge={`${reportPreviewItems.length}/${filteredReportItems.length}`}
                >
                  <ReportDetailsPanel
                    previewItems={reportPreviewItems}
                    totalItems={filteredReportItems.length}
                    showFullDetails={showFullReportDetails}
                    onToggleDetails={() => setShowFullReportDetails((current) => !current)}
                  />
                </ReportAccordionSection>
              </div>

              <div className="hidden gap-4 lg:grid xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sesi-blue">Filtros do relatorio</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Use os filtros para montar um recorte especifico antes de exportar ou imprimir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetReportFilters}
                        disabled={!reportHasActiveFilters}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Limpar filtros
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input
                        type="search"
                        value={reportFilters.search}
                        onChange={(event) => handleReportFilterChange('search', event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                        placeholder="Buscar por item ou local"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CategorySelect
                          value={reportFilters.category}
                          onChange={(category) => handleReportFilterChange('category', category)}
                          placeholder="Todas as categorias"
                          allowAll
                        />
                        <select
                          value={reportFilters.condition}
                          onChange={(event) => handleReportFilterChange('condition', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                        >
                          <option>Todos</option>
                          <option>Excelente</option>
                          <option>Bom</option>
                          <option>Regular</option>
                          <option>Requer manutencao</option>
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">Aquisicao a partir de</span>
                          <input
                            type="date"
                            value={reportFilters.acquisitionDateFrom}
                            onChange={(event) => handleReportFilterChange('acquisitionDateFrom', event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">Aquisicao ate</span>
                          <input
                            type="date"
                            value={reportFilters.acquisitionDateTo}
                            onChange={(event) => handleReportFilterChange('acquisitionDateTo', event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sesi-blue focus:bg-white"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <ReportPriorityCard
                    title="Pontos de atencao"
                    description="Leitura rapida das principais pendencias do recorte exibido antes de abrir o detalhamento completo."
                    rows={reportPriorityRows}
                  />
                  <ReportSummaryTable title="Resumo por categoria" rows={reportCategoryRows} />
                  <ReportSummaryTable title="Resumo por estado" rows={reportConditionRows} />
                  <ReportSummaryTable title="Top locais por concentracao" rows={reportLocationRows} />
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ReportMetricCard
                      label="Categoria lider"
                      value={reportLeadingCategory ? `${reportLeadingCategory.label}` : 'Sem dados'}
                      help={reportLeadingCategory ? `${reportLeadingCategory.value} itens no recorte atual.` : 'Nenhum item encontrado com os filtros atuais.'}
                    />
                    <ReportMetricCard
                      label="Local com maior volume"
                      value={reportLeadingLocation ? reportLeadingLocation.label : 'Sem dados'}
                      help={reportLeadingLocation ? `${reportLeadingLocation.value} itens concentrados neste ambiente.` : 'Nenhum ambiente disponivel no recorte atual.'}
                    />
                    <ReportMetricCard
                      label="Estado predominante"
                      value={reportTopConditionRow ? reportTopConditionRow.label : 'Sem dados'}
                      help={reportTopConditionRow ? `${reportTopConditionRow.value} itens neste estado.` : 'Nenhum estado disponivel no recorte atual.'}
                    />
                  </div>

                  <ReportChartsPanel
                    categoryRows={reportCategoryRows}
                    conditionRows={reportConditionRows}
                    locationRows={reportLocationRows}
                    timelineRows={reportTimelineRows}
                  />

                  <ReportExportPanel
                    onExportXlsx={exportReportXlsx}
                    onExportCsv={exportReportCsv}
                    onPrint={printReport}
                  />

                  <ReportDetailsPanel
                    previewItems={reportPreviewItems}
                    totalItems={filteredReportItems.length}
                    showFullDetails={showFullReportDetails}
                    onToggleDetails={() => setShowFullReportDetails((current) => !current)}
                  />
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
