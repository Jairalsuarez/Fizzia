import { useState, useEffect, useCallback } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/Toast'
import { formatDate, formatMoney } from '../../utils/format'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { createExpense } from '../../api/paymentsApi'

export function FinancePage() {
  const { session } = useAuth()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [personalIncomes, setPersonalIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const currentUserId = session?.user?.id

  // Income form state
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '', method: 'transfer' })
  const [savingIncome, setSavingIncome] = useState(false)

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'gasto_negocio', amount: '', paid_to_user_id: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [users, setUsers] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [payRes, expRes] = await Promise.all([
      supabase.from('payments').select('*, projects(name)').eq('admin_status', 'approved').order('paid_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*, paid_to_user:profiles(full_name, email)')
        .in('category', ['gasto_negocio', 'pago_personal'])
        .order('created_at', { ascending: false }),
    ])
    setPayments(payRes.data || [])
    if (expRes.error) {
      const fallback = await supabase
        .from('expenses')
        .select('*')
        .in('category', ['gasto_negocio', 'pago_personal'])
        .order('created_at', { ascending: false })
      setExpenses(fallback.data || [])
    } else {
      setExpenses(expRes.data || [])
    }

    if (currentUserId) {
      const { data: personal } = await supabase
        .from('expenses')
        .select('*')
        .eq('paid_to_user_id', currentUserId)
        .eq('type', 'personal')
        .order('created_at', { ascending: false })
      setPersonalIncomes(personal || [])
    }
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
     
    loadData()
  }, [loadData])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email, role').order('full_name').then(({ data }) => {
      const filtered = (data || []).filter(u => ['admin', 'manager', 'developer'].includes(u.role))
      setUsers(filtered)
    })
  }, [])

  const totalIncome = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const balance = totalIncome - totalExpenses

  const allMovements = [
    ...payments.map(p => ({ ...p, movement_type: 'income', date: p.paid_at || p.created_at })),
    ...expenses.map(e => ({ ...e, movement_type: 'expense', date: e.expense_date || e.created_at })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50)

  const expenseCategoryLabels = { gasto_negocio: 'Gasto de negocio', pago_personal: 'Pago de personal' }
  const methodLabels = { transfer: 'Transferencia', deposit: 'Depósito', paypal: 'PayPal', cash: 'Efectivo' }

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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowIncomeForm(true)} className="cursor-pointer px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-all flex items-center gap-1.5">
            <span className="material-symbols-rounded text-sm">add</span>
            Agregar Ingreso
          </button>
          <button onClick={() => setShowExpenseForm(true)} className="cursor-pointer px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-1.5">
            <span className="material-symbols-rounded text-sm">add</span>
            Agregar Egreso
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
              <p className="text-xs text-dark-600 mt-1">{payments.length} pagos aprobados</p>
            </div>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Egresos</p>
              <p className="text-2xl font-bold text-red-400">{formatMoney(totalExpenses)}</p>
              <p className="text-xs text-dark-600 mt-1">{expenses.length} movimientos</p>
            </div>
          </>
        )}
      </div>

      {/* Personal Finances */}
      {personalIncomes.length > 0 && (
        <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-rounded text-[var(--accent)]">account_balance_wallet</span>
            <h2 className="text-sm font-semibold text-white">Mis Finanzas Personales</h2>
            <span className="text-xs text-dark-500 ml-auto">{formatMoney(personalIncomes.reduce((s, p) => s + Number(p.amount || 0), 0))}</span>
          </div>
          <div className="space-y-2">
            {personalIncomes.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-dark-950/50 rounded-lg border border-dark-800">
                <div>
                  <p className="text-white text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-dark-500">{formatDate(p.expense_date || p.created_at)}</p>
                </div>
                <span className="text-green-400 font-semibold">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement History */}
      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
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
              <div key={m.id} className="flex items-center justify-between p-3 bg-dark-950/50 rounded-lg border border-dark-800 hover:border-dark-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    m.movement_type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className={`material-symbols-rounded text-sm ${
                      m.movement_type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {m.movement_type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
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
                <span className={`font-semibold shrink-0 ml-4 ${m.movement_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {m.movement_type === 'income' ? '+' : '-'}{formatMoney(m.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
