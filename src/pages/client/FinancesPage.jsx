import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal, Skeleton } from '../../components/ui/'
import { getMyInvoices, getMyPayments } from '../../api/paymentsApi'
import { getMyProjects } from '../../api/projectsApi'
import { formatDate, formatMoney } from '../../utils/format'
import { getAcceptedInvoiceTotal } from '../../utils/paymentStatus'

const methodLabels = {
  paypal: 'PayPal',
  transfer: 'Transferencia',
  deposit: 'Deposito',
}

function getPaymentStatus(payment) {
  if (payment.admin_status === 'approved') return { label: 'Verificado', className: 'bg-fizzia-500/15 text-fizzia-300' }
  if (payment.admin_status === 'rejected') return { label: 'Rechazado', className: 'bg-red-500/15 text-red-400' }
  return { label: 'En revision', className: 'bg-amber-500/15 text-amber-300' }
}

function getProjectTotal(project) {
  return Number(project?.final_price || project?.budget || 0)
}

function getPaymentPublicId(payment) {
  if (!payment?.id) return 'Sin ID'
  return `PAGO-${String(payment.id).slice(0, 8).toUpperCase()}`
}

function getInvoicePending(invoice) {
  return Math.max(Number(invoice.total || 0) - getAcceptedInvoiceTotal(invoice), 0)
}

export function FinancesPage() {
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [invoiceData, paymentData, projectData] = await Promise.all([getMyInvoices(), getMyPayments(), getMyProjects()])
        if (cancelled) return
        setInvoices(invoiceData || [])
        setPayments(paymentData || [])
        setProjects(projectData || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar tus finanzas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const projectPendingItems = useMemo(() => projects
    .map(project => {
      const total = getProjectTotal(project)
      const paid = payments
        .filter(payment => payment.project_id === project.id && payment.admin_status === 'approved')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      return { project, total, paid, pending: Math.max(total - paid, 0) }
    })
    .filter(item => item.pending > 0), [projects, payments])

  const invoicePendingItems = useMemo(() => invoices
    .map(invoice => ({
      project: { id: invoice.project_id, name: invoice.projects?.name || invoice.invoice_number || 'Factura' },
      total: Number(invoice.total || 0),
      paid: getAcceptedInvoiceTotal(invoice),
      pending: getInvoicePending(invoice),
    }))
    .filter(item => item.pending > 0), [invoices])

  const pendingItems = projectPendingItems.length ? projectPendingItems : invoicePendingItems

  const stats = useMemo(() => {
    const paid = payments
      .filter(payment => payment.admin_status === 'approved')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const inReview = payments
      .filter(payment => payment.admin_status !== 'approved' && payment.admin_status !== 'rejected')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const projectPending = projectPendingItems.reduce((sum, item) => sum + item.pending, 0)
    const invoicePending = invoicePendingItems.reduce((sum, item) => sum + item.pending, 0)
    const methodCounts = payments.reduce((acc, payment) => {
      const method = payment.method || 'transfer'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {})
    const mostUsedMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { paid, inReview, pending: Math.max(projectPending, invoicePending), mostUsedMethod }
  }, [invoicePendingItems, payments, projectPendingItems])

  const approvedPayments = payments.filter(payment => payment.admin_status === 'approved')

  const askAboutPayment = (payment = null) => {
    if (!payment) {
      window.dispatchEvent(new CustomEvent('fizzia-open-chat', {
        detail: { message: 'Hola, quiero hablar con soporte sobre mis pagos y saldos pendientes.' },
      }))
      return
    }
    const projectName = payment.projects?.name || payment.invoices?.invoice_number || 'Sin proyecto asociado'
    window.dispatchEvent(new CustomEvent('fizzia-open-chat', {
      detail: {
        message: `Hola, quiero recibir mas informacion del siguiente pago: ${formatMoney(payment.amount)} del proyecto "${projectName}". ID de pago: ${getPaymentPublicId(payment)}.`,
      },
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-9 w-80" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-xl border border-red-700 bg-red-900/20 px-4 py-3 text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" data-tour="client-finance-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="finance-greeting text-3xl font-bold leading-tight text-white">
          Tus pagos al dia, <span>saldo claro y soporte listo.</span>
        </h1>
        <button
          type="button"
          onClick={() => askAboutPayment()}
          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-fizzia-500/30 bg-fizzia-500/10 px-4 py-3 text-sm font-semibold text-fizzia-200 transition-all hover:bg-fizzia-500/15 active:scale-[0.98]"
          data-tour="finance-ask"
        >
          <span className="material-symbols-rounded text-lg">chat</span>
          Hablar con soporte
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-tour="finance-summary">
        <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-5">
          <p className="text-sm text-dark-400">Pendiente por pagar</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{formatMoney(stats.pending)}</p>
          <p className="mt-2 text-xs text-dark-500">{pendingItems.length} proyecto{pendingItems.length === 1 ? '' : 's'} con saldo</p>
        </div>
        <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-5">
          <p className="text-sm text-dark-400">Pagado y verificado</p>
          <p className="mt-2 text-2xl font-bold text-fizzia-300">{formatMoney(stats.paid)}</p>
          <p className="mt-2 text-xs text-dark-500">{approvedPayments.length} pago{approvedPayments.length === 1 ? '' : 's'} aprobado{approvedPayments.length === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-5" data-tour="finance-method">
          <p className="text-sm text-dark-400">Metodo mas usado</p>
          <p className="mt-2 text-2xl font-bold text-white">{methodLabels[stats.mostUsedMethod] || 'Sin pagos'}</p>
          <p className="mt-2 text-xs text-dark-500">{stats.inReview > 0 ? `${formatMoney(stats.inReview)} en revision` : 'Sin comprobantes pendientes'}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-dark-800 bg-dark-900/60" data-tour="finance-pending">
        <div className="border-b border-dark-800 p-5">
          <h2 className="text-lg font-semibold text-white">Pagos pendientes</h2>
          <p className="mt-1 text-sm text-dark-500">Saldos calculados desde tus proyectos y pagos verificados.</p>
        </div>
        {pendingItems.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-rounded text-4xl text-fizzia-400">task_alt</span>
            <p className="mt-2 text-sm font-semibold text-white">No tienes pagos pendientes</p>
            <p className="mt-1 text-sm text-dark-500">Cuando haya un saldo por pagar, aparecera aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {pendingItems.map(item => {
              const progress = item.total > 0 ? Math.min((item.paid / item.total) * 100, 100) : 0
              return (
                <div key={item.project.id || item.project.name} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.project.name || 'Proyecto'}</p>
                    <p className="mt-1 text-xs text-dark-500">Total {formatMoney(item.total)} · pagado {formatMoney(item.paid)}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-dark-800">
                      <div className="h-full rounded-full bg-fizzia-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div className="md:text-right">
                      <p className="text-xs text-dark-500">Saldo</p>
                      <p className="text-lg font-bold text-amber-300">{formatMoney(item.pending)}</p>
                    </div>
                    {item.project.id && (
                      <Link to={`/cliente/proyecto/${item.project.id}`} className="cursor-pointer rounded-xl bg-fizzia-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-fizzia-400 active:scale-[0.98]">
                        Pagar
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-dark-800 bg-dark-900/60" data-tour="finance-history">
        <div className="border-b border-dark-800 p-5">
          <h2 className="text-lg font-semibold text-white">Pagos realizados</h2>
          <p className="mt-1 text-sm text-dark-500">Historial de comprobantes, transferencias y pagos por PayPal.</p>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-rounded text-4xl text-dark-600">receipt_long</span>
            <p className="mt-2 text-sm font-semibold text-white">Aun no registras pagos</p>
            <p className="mt-1 text-sm text-dark-500">Cuando pagues un proyecto, el movimiento aparecera aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {payments.map(payment => {
              const status = getPaymentStatus(payment)
              return (
                <div key={payment.id || `${payment.created_at}-${payment.amount}`} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-xl ${payment.method === 'paypal' ? 'bg-white px-1' : 'bg-fizzia-500/15'}`}>
                      {payment.method === 'paypal' ? (
                        <img src="/Logo metodos de pagos/Paypal_2014_logo.png" alt="PayPal" className="h-full w-full object-contain" />
                      ) : (
                        <span className="material-symbols-rounded text-fizzia-300">account_balance</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{payment.projects?.name || payment.invoices?.invoice_number || 'Pago registrado'}</p>
                      <p className="mt-1 text-xs text-dark-500">{getPaymentPublicId(payment)} · {methodLabels[payment.method] || payment.method || 'Metodo'} · {formatDate(payment.paid_at || payment.created_at)}</p>
                      {payment.reference && <p className="mt-1 truncate text-xs text-dark-600">Ref: {payment.reference}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                    <p className="text-base font-bold text-white">{formatMoney(payment.amount)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                    <button type="button" onClick={() => setSelectedPayment(payment)} className="cursor-pointer rounded-xl border border-dark-700 px-3 py-2 text-xs font-semibold text-dark-200 transition-all hover:border-dark-500 hover:text-white">
                      Ver detalles
                    </button>
                    <button type="button" onClick={() => askAboutPayment(payment)} className="cursor-pointer rounded-xl bg-dark-800 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-dark-700">
                      Soporte
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)}>
        {selectedPayment && (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fizzia-400">Detalle de pago</p>
                <h3 className="mt-2 text-xl font-bold text-white">{formatMoney(selectedPayment.amount)}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatus(selectedPayment).className}`}>
                {getPaymentStatus(selectedPayment).label}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-dark-800 pb-3">
                <span className="text-dark-500">ID de pago</span>
                <span className="text-right font-mono text-xs font-medium text-white">{getPaymentPublicId(selectedPayment)}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-dark-800 pb-3">
                <span className="text-dark-500">Proyecto</span>
                <span className="text-right font-medium text-white">{selectedPayment.projects?.name || 'Sin proyecto asociado'}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-dark-800 pb-3">
                <span className="text-dark-500">Metodo</span>
                <span className="text-right font-medium text-white">{methodLabels[selectedPayment.method] || selectedPayment.method}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-dark-800 pb-3">
                <span className="text-dark-500">Fecha</span>
                <span className="text-right font-medium text-white">{formatDate(selectedPayment.paid_at || selectedPayment.created_at)}</span>
              </div>
              {selectedPayment.reference && (
                <div className="flex justify-between gap-4 border-b border-dark-800 pb-3">
                  <span className="text-dark-500">Referencia</span>
                  <span className="text-right font-medium text-white">{selectedPayment.reference}</span>
                </div>
              )}
              {selectedPayment.proof_url && (
                <a href={selectedPayment.proof_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:border-dark-500">
                  <span className="material-symbols-rounded text-lg">receipt_long</span>
                  Abrir comprobante
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
