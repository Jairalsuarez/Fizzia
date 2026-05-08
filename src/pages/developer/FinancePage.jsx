/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/authContext'
import { supabase } from '../../services/supabase'
import { formatMoney, formatDate } from '../../utils/format'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/Toast'

export function FinancePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [savingExpense, setSavingExpense] = useState(false)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    const [{ data: received }, { data: outgoing }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('paid_to_user_id', user.id)
        .eq('type', 'personal')
        .eq('category', 'pago_personal')
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*')
        .eq('created_by', user.id)
        .eq('type', 'developer_expense')
        .order('created_at', { ascending: false }),
    ])
    setIncomes(received || [])
    setExpenses(outgoing || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, i) => s + Number(i.amount || 0), 0)
  const balance = totalIncome - totalExpenses
  const movements = [
    ...incomes.map(item => ({ ...item, movement_type: 'income' })),
    ...expenses.map(item => ({ ...item, movement_type: 'expense' })),
  ].sort((a, b) => new Date(b.expense_date || b.created_at) - new Date(a.expense_date || a.created_at))

  const handleCreateExpense = async (event) => {
    event.preventDefault()
    const amount = Number(expenseAmount)
    if (!amount || amount <= 0 || savingExpense) return
    setSavingExpense(true)
    const { error } = await supabase.from('expenses').insert({
      title: 'Egreso personal',
      category: 'egreso_dev',
      type: 'developer_expense',
      amount,
      currency: 'USD',
      expense_date: new Date().toISOString().slice(0, 10),
      created_by: user.id,
    })
    setSavingExpense(false)
    if (error) {
      toast.error('No se pudo registrar el egreso. Revisa la migracion de Supabase.')
      return
    }
    setExpenseAmount('')
    setShowExpenseForm(false)
    toast.success('Egreso registrado')
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Finanzas</h1>
          <p className="text-dark-400 text-sm mt-1">Tus pagos recibidos y egresos personales</p>
        </div>
        <button
          onClick={() => setShowExpenseForm(true)}
          className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 transition-all hover:bg-rose-500/25"
        >
          Registrar egreso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />)
        ) : (
          <>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatMoney(balance)}</p>
            </div>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Total recibido</p>
              <p className="text-2xl font-bold text-green-400">{formatMoney(totalIncome)}</p>
            </div>
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
              <p className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-1">Egresos</p>
              <p className="text-2xl font-bold text-rose-400">{formatMoney(totalExpenses)}</p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-dark-800 bg-dark-900/50 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Historial</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-dark-800 rounded-lg animate-pulse" />)}
          </div>
        ) : movements.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-8">No hay movimientos registrados aun</p>
        ) : (
          <div className="space-y-2">
            {movements.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 bg-dark-950/50 rounded-lg border border-dark-800">
                <div>
                  <p className="text-white text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-dark-500">{formatDate(i.expense_date || i.created_at)}</p>
                </div>
                <span className={`${i.movement_type === 'income' ? 'text-green-400' : 'text-rose-400'} font-semibold`}>
                  {i.movement_type === 'income' ? '+' : '-'}{formatMoney(i.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Registrar egreso" size="sm">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Valor</label>
            <input
              type="number"
              value={expenseAmount}
              onChange={event => setExpenseAmount(event.target.value)}
              className="w-full rounded-lg border border-dark-700 bg-dark-950 px-3 py-2.5 text-lg font-semibold text-white outline-none focus:border-rose-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowExpenseForm(false)} className="cursor-pointer flex-1 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-sm font-medium text-dark-300 transition-all hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={savingExpense} className="cursor-pointer flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-rose-400 disabled:opacity-50">
              {savingExpense ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
