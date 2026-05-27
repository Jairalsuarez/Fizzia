import { useState, useEffect, useCallback } from 'react'
import { Modal } from '../../components/ui/Modal'
import { PaymentSummary } from '../../components/ui/PaymentSummary'
import { useToast } from '../../components/Toast'
import { formatDate, formatMoney } from '../../utils/format'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { approvePayment, createExpense, getPaymentProofUrl, rejectPayment } from '../../api/paymentsApi'
import { readStoredJson, writeStoredJson } from '../../utils/persistedState'

const CACHE_KEY = 'fizzia-admin-finance-cache'

export function FinancePage() {
  const { session } = useAuth()
  const toast = useToast()
  const cached = readStoredJson(CACHE_KEY, null)
  const [payments, setPayments] = useState(() => cached?.payments || [])
  const [expenses, setExpenses] = useState(() => cached?.expenses || [])
  const [loading, setLoading] = useState(() => !cached)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [reviewingPaymentId, setReviewingPaymentId] = useState('')
  const [selectedMovement, setSelectedMovement] = useState(null)
  const currentUserId = session?.user?.id

  // Income form state
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '', method: 'transfer' })
  const [savingIncome, setSavingIncome] = useState(false)

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'gasto_negocio', amount: '', paid_to_user_id: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [users, setUsers] = useState([])

  const loadData = useCallback(async () => {
    if (!cached) setLoading(true)
    const [payRes, expRes] = await Promise.all([
      supabase.from('payments').select('*, projects(name), clients(name)').order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*, paid_to_user:profiles(full_name, email)')
        .in('category', ['gasto_negocio', 'pago_personal'])
        .order('created_at', { ascending: false }),
    ])
    const nextPayments = await Promise.all((payRes.data || []).map(async (payment) => {
      if (!payment.proof_url) return { ...payment, proofUrl: null }
      return { ...payment, proofUrl: await getPaymentProofUrl(payment.proof_url) }
    }))
    setPayments(nextPayments)
    let nextExpenses = []
    if (expRes.error) {
      const fallback = await supabase
        .from('expenses')
        .select('*')
        .in('category', ['gasto_negocio', 'pago_personal'])
        .order('created_at', { ascending: false })
      nextExpenses = fallback.data || []
      setExpenses(nextExpenses)
    } else {
      nextExpenses = expRes.data || []
      setExpenses(nextExpenses)
    }
    writeStoredJson(CACHE_KEY, {
      payments: nextPayments,
      expenses: nextExpenses,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
     
    loadData()
  }, [loadData])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email, role').order('full_name').then(({ data }) => {
      const filtered = (data || []).filter(u => ['admin', 'manager', 'developer'].includes(u.role))
      setUsers(filtered)
    })
  }, [])

  const approvedPayments = payments.filter(payment => payment.admin_status === 'approved')
  const pendingPayments = payments.filter(payment => payment.admin_status === 'pending')
  const totalIncome = approvedPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const balance = totalIncome - totalExpenses

  const allMovements = [
    ...approvedPayments.map(p => ({ ...p, movement_type: 'income', date: p.paid_at || p.created_at })),
    ...expenses.map(e => ({ ...e, movement_type: 'expense', date: e.expense_date || e.created_at })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50)

  const expenseCategoryLabels = { gasto_negocio: 'Gasto de negocio', pago_personal: 'Pago de personal' }
  const methodLabels = { transfer: 'Transferencia', deposit: 'Depósito', paypal: 'PayPal', google_pay: 'Google Pay', cash: 'Efectivo' }

  const getPaymentStatusLabel = (status) => {
    if (status === 'approved') return 'Aprobado'
    if (status === 'rejected') return 'Rechazado'
    return 'Pendiente'
  }

  const isPaymentMovement = (movement) => movement?.movement_type === 'income' || Boolean(movement?.admin_status)

  const handleApprovePayment = async (paymentId) => {
    if (reviewingPaymentId) return
    setReviewingPaymentId(paymentId)
    try {
      await approvePayment(paymentId, currentUserId)
      toast.success('Pago aprobado')
      loadData()
    } catch {
      toast.error('No se pudo aprobar el pago')
    } finally {
      setReviewingPaymentId('')
    }
  }

  const handleRejectPayment = async (paymentId) => {
    if (reviewingPaymentId) return
    setReviewingPaymentId(paymentId)
    try {
      await rejectPayment(paymentId, currentUserId, 'Rechazado desde finanzas')
      toast.success('Pago rechazado')
      loadData()
    } catch {
      toast.error('No se pudo rechazar el pago')
    } finally {
      setReviewingPaymentId('')
    }
  }

  const handleIncomeSubmit = async (e) => {
    e.preventDefault()
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) return
    setSavingIncome(true)
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('payments').insert({
      amount: parseFloat(incomeForm.amount),
      currency: 'USD',
      method: incomeForm.method,
      description: incomeForm.description || 'Ingreso manual',
      admin_status: 'approved',
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: user?.user?.id,
      paid_at: new Date().toISOString(),
      notes: incomeForm.description || '',
      reference: 'Ingreso registrado manualmente',
    })
    setSavingIncome(false)
    setShowIncomeForm(false)
    setIncomeForm({ amount: '', description: '', method: 'transfer' })
    loadData()
    toast.success('Ingreso registrado')
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    if (!expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) return
    if (expenseForm.category === 'pago_personal' && !expenseForm.paid_to_user_id) return
    setSavingExpense(true)
    await createExpense({
      title: expenseForm.description.trim(),
      category: expenseForm.category,
      type: expenseForm.category === 'pago_personal' ? 'personal' : 'negocio',
      amount: parseFloat(expenseForm.amount),
      paid_to_user_id: expenseForm.category === 'pago_personal' ? expenseForm.paid_to_user_id : null,
      expense_date: new Date().toISOString().slice(0, 10),
    })
    setSavingExpense(false)
    setShowExpenseForm(false)
    setExpenseForm({ description: '', category: 'gasto_negocio', amount: '', paid_to_user_id: '' })
    loadData()
    toast.success('Egreso registrado')
  }

  const isPersonal = expenseForm.category === 'pago_personal'

  return (
    <div className="space-y-5 px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={() => setShowIncomeForm(true)} className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition-all hover:bg-green-500/30 sm:px-4">
            <span className="material-symbols-rounded text-sm">add</span>
            <span className="hidden min-[380px]:inline">Agregar </span>Ingreso
          </button>
          <button onClick={() => setShowExpenseForm(true)} className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 sm:px-4">
            <span className="material-symbols-rounded text-sm">add</span>
            <span className="hidden min-[380px]:inline">Agregar </span>Egreso
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />)
        ) : (
          <>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatMoney(balance)}</p>
            </div>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Ingresos</p>
              <p className="text-2xl font-bold text-green-400">{formatMoney(totalIncome)}</p>
              <p className="text-xs text-dark-600 mt-1">{approvedPayments.length} pagos aprobados</p>
            </div>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Egresos</p>
              <p className="text-2xl font-bold text-red-400">{formatMoney(totalExpenses)}</p>
              <p className="text-xs text-dark-600 mt-1">{expenses.length} movimientos</p>
            </div>
          </>
        )}
      </div>

      {/* Pending payments */}
      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-white">Pagos por revisar</h2>
          <span className="text-xs font-medium text-dark-500">{pendingPayments.length} pendiente{pendingPayments.length === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-dark-800" />)}
          </div>
        ) : pendingPayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-dark-500">No hay pagos pendientes por revisar</p>
        ) : (
          <div className="space-y-2">
            {pendingPayments.map(payment => {
              const isBusy = reviewingPaymentId === payment.id
              return (
                <div
                  key={payment.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMovement({ ...payment, movement_type: 'income', date: payment.paid_at || payment.created_at })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedMovement({ ...payment, movement_type: 'income', date: payment.paid_at || payment.created_at })
                    }
                  }}
                  className="grid cursor-pointer gap-3 rounded-lg border border-dark-800 bg-dark-950/50 p-3 transition-all hover:border-dark-600 hover:bg-dark-900/80 focus:outline-none focus:ring-2 focus:ring-fizzia-500/40 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{payment.clients?.name || 'Cliente sin nombre'}</p>
                    <p className="truncate text-xs text-dark-500">{payment.projects?.name || payment.description || 'Pago sin proyecto'} · {methodLabels[payment.method] || payment.method || 'Metodo'}</p>
                    <p className="mt-1 text-sm font-bold text-amber-300">{formatMoney(payment.amount)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedMovement({ ...payment, movement_type: 'income', date: payment.paid_at || payment.created_at })
                      }}
                      className="col-span-2 cursor-pointer rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm font-medium text-dark-200 transition-all hover:border-dark-500 hover:text-white sm:col-span-1"
                    >
                      Detalles
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleRejectPayment(payment.id)
                      }}
                      disabled={Boolean(reviewingPaymentId)}
                      className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? '...' : 'Rechazar'}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleApprovePayment(payment.id)
                      }}
                      disabled={Boolean(reviewingPaymentId)}
                      className="cursor-pointer rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? '...' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Movement History */}
      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Historial de Movimientos</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-dark-800 rounded-lg animate-pulse" />)}
          </div>
        ) : allMovements.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-8">No hay movimientos</p>
        ) : (
          <div className="space-y-2">
            {allMovements.map(m => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMovement(m)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedMovement(m)
                  }
                }}
                className="grid cursor-pointer gap-3 rounded-lg border border-dark-800 bg-dark-950/50 p-3 transition-all hover:border-dark-600 hover:bg-dark-900/80 focus:outline-none focus:ring-2 focus:ring-fizzia-500/40 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    m.movement_type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className={`material-symbols-rounded text-sm ${
                      m.movement_type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {m.movement_type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {m.movement_type === 'income'
                        ? (m.projects?.name || m.description || 'Ingreso')
                        : (m.title || 'Egreso')
                      }
                    </p>
                    <p className="text-xs text-dark-500">
                      {m.movement_type === 'income'
                        ? (methodLabels[m.method] || m.method)
                        : (expenseCategoryLabels[m.category] || m.category)
                      }
                      {' · '}
                      {formatDate(m.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <span className={`font-semibold sm:block ${m.movement_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {m.movement_type === 'income' ? '+' : '-'}{formatMoney(m.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedMovement(m)
                    }}
                    className="cursor-pointer rounded-lg border border-dark-700 px-3 py-1.5 text-xs font-semibold text-dark-300 transition-all hover:border-dark-500 hover:text-white sm:mt-2"
                  >
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selectedMovement)} onClose={() => setSelectedMovement(null)} title={isPaymentMovement(selectedMovement) ? 'Detalle del pago' : 'Detalle del movimiento'} size="sm">
        {selectedMovement && (
          <PaymentSummary
            title={isPaymentMovement(selectedMovement)
              ? (selectedMovement.projects?.name || selectedMovement.description || 'Detalle del pago')
              : (selectedMovement.title || 'Detalle del movimiento')}
            paymentMethod={{
              icon: <span className="material-symbols-rounded text-lg text-fizzia-300">{isPaymentMovement(selectedMovement) ? 'payments' : 'account_balance_wallet'}</span>,
              name: isPaymentMovement(selectedMovement)
                ? (methodLabels[selectedMovement.method] || selectedMovement.method || 'Pago')
                : (expenseCategoryLabels[selectedMovement.category] || selectedMovement.category || 'Egreso'),
            }}
            items={[
              ...(isPaymentMovement(selectedMovement)
                ? [
                    { label: 'Cliente', value: selectedMovement.clients?.name || '-' },
                    { label: 'Proyecto', value: selectedMovement.projects?.name || '-' },
                    { label: 'Estado', value: getPaymentStatusLabel(selectedMovement.admin_status) },
                  ]
                : [
                    { label: 'Beneficiario', value: selectedMovement.paid_to_user?.full_name || selectedMovement.paid_to_user?.email || '-' },
                  ]),
              { label: 'Fecha', value: formatDate(selectedMovement.date || selectedMovement.paid_at || selectedMovement.expense_date || selectedMovement.created_at) },
              ...(selectedMovement.reference ? [{ label: 'Referencia', value: selectedMovement.reference, valueClassName: 'break-words' }] : []),
            ]}
            total={{
              label: isPaymentMovement(selectedMovement) ? 'Total pagado' : 'Total egreso',
              value: `${isPaymentMovement(selectedMovement) ? '+' : '-'}${formatMoney(selectedMovement.amount)}`,
            }}
          >
              {(selectedMovement.proofUrl || selectedMovement.proof_url) && (
                <a
                  href={selectedMovement.proofUrl || selectedMovement.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:border-dark-500"
                >
                  <span className="material-symbols-rounded text-lg">receipt_long</span>
                  Abrir comprobante
                </a>
              )}
          </PaymentSummary>
        )}
      </Modal>

      {/* Income Modal */}
      <Modal isOpen={showIncomeForm} onClose={() => { setShowIncomeForm(false); setIncomeForm({ amount: '', description: '', method: 'transfer' }) }} title="Agregar Ingreso" size="sm">
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Monto</label>
            <input
              type="number"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-[var(--accent)]"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Descripción</label>
            <input
              type="text"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
              placeholder="Ej: Pago cliente X por proyecto Y"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Método</label>
            <select
              value={incomeForm.method}
              onChange={(e) => setIncomeForm(prev => ({ ...prev, method: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="transfer">Transferencia</option>
              <option value="deposit">Depósito</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowIncomeForm(false); setIncomeForm({ amount: '', description: '', method: 'transfer' }) }} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={savingIncome} className="cursor-pointer flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-400 disabled:opacity-50 transition-all">
              {savingIncome ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={showExpenseForm} onClose={() => { setShowExpenseForm(false); setExpenseForm({ description: '', category: 'gasto_negocio', amount: '', paid_to_user_id: '' }) }} title="Agregar Egreso" size="sm">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Descripción</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)] placeholder-dark-600"
              placeholder="Ej: Licencia hosting mensual"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Monto</label>
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-[var(--accent)]"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExpenseForm(prev => ({ ...prev, category: 'gasto_negocio', paid_to_user_id: '' }))}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  !isPersonal
                    ? 'bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'bg-dark-950 border-dark-700 text-dark-400 hover:border-dark-600'
                }`}
              >
                Gasto de negocio
              </button>
              <button
                type="button"
                onClick={() => setExpenseForm(prev => ({ ...prev, category: 'pago_personal', paid_to_user_id: '' }))}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  isPersonal
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-dark-950 border-dark-700 text-dark-400 hover:border-dark-600'
                }`}
              >
                Pago de personal
              </button>
            </div>
          </div>
          {isPersonal && (
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">¿A quién se le deposita?</label>
              <select
                value={expenseForm.paid_to_user_id}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, paid_to_user_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-dark-950 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Seleccionar...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowExpenseForm(false); setExpenseForm({ description: '', category: 'gasto_negocio', amount: '', paid_to_user_id: '' }) }} className="cursor-pointer flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 text-sm font-medium rounded-lg hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={savingExpense} className="cursor-pointer flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 disabled:opacity-50 transition-all">
              {savingExpense ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
