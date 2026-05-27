import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loadScript } from '@paypal/paypal-js'
import { Building2, Copy, FileCheck2, UploadCloud } from 'lucide-react'
import { ModernPaymentForm } from '../../components/ui'
import { createClientPayment, getMyInvoices, getMyPayments, uploadPaymentProof } from '../../api/paymentsApi'
import { getMyProjects } from '../../api/projectsApi'
import { useToast } from '../../components/Toast'
import { formatMoney } from '../../utils/format'

const BANK_INFO = {
  bank: 'Banco del Pichincha',
  holder: 'Jordan Jair Suarez Alcivar',
  cedula: '1208478378',
  account: '2210323937',
}

function getProjectTotal(project) {
  return Number(project?.final_price || project?.budget || 0)
}

function canPayProject(project) {
  return project?.status !== 'solicitado' && getProjectTotal(project) > 0
}

function getPayPalClientId() {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim()
  if (!clientId) return ''
  const looksLikeSql = /\b(alter|create|drop|policy|constraint|select|insert|update|delete)\b/i.test(clientId)
  const hasUnsafeWhitespace = /\s/.test(clientId)
  return looksLikeSql || hasUnsafeWhitespace ? '' : clientId
}

function getMethodLabel(method) {
  if (method === 'paypal') return 'PayPal'
  if (method === 'google_pay') return 'Google Pay'
  return 'Transferencia'
}

export function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState([])
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '')
  const [selectedMethod, setSelectedMethod] = useState('paypal')
  const [amount, setAmount] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)
  const paypalContainerRef = useRef(null)
  const paypalButtonsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        setLoading(true)
        const [projectData, paymentData, invoiceData] = await Promise.all([getMyProjects(), getMyPayments(), getMyInvoices()])
        if (cancelled) return
        const safeProjects = (projectData || []).filter(canPayProject)
        setProjects(safeProjects)
        setPayments(paymentData || [])
        setInvoices(invoiceData || [])
        const selectedIsPayable = safeProjects.some(project => project.id === selectedProjectId)
        if ((!selectedProjectId || !selectedIsPayable) && safeProjects.length) setSelectedProjectId(safeProjects[0].id)
      } catch (error) {
        console.error(error)
        toast.error('No pudimos cargar tus proyectos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [selectedProjectId, toast])

  const paymentStateByProject = useMemo(() => {
    return projects.reduce((acc, project) => {
      const total = getProjectTotal(project)
      const projectPayments = payments.filter(payment => payment.project_id === project.id)
      const approved = projectPayments
        .filter(payment => payment.admin_status === 'approved')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      const inReview = projectPayments
        .filter(payment => payment.admin_status !== 'approved' && payment.admin_status !== 'rejected')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      acc[project.id] = {
        total,
        approved,
        inReview,
        remaining: Math.max(total - approved, 0),
      }
      return acc
    }, {})
  }, [payments, projects])

  const selectedProject = projects.find(project => project.id === selectedProjectId)
  const selectedInvoice = invoices.find(invoice => invoice.project_id === selectedProjectId)
  const selectedState = selectedProjectId ? paymentStateByProject[selectedProjectId] : null
  const maxAmount = selectedState?.remaining || 0
  const numericAmount = Number(amount || 0)
  const amountIsValid = numericAmount > 0 && numericAmount <= maxAmount

  useEffect(() => {
    if (!selectedProjectId) return
    setSuccess(null)
    setProofFile(null)
    setProofPreview(null)
    setPaypalReady(false)
    const max = paymentStateByProject[selectedProjectId]?.remaining || 0
    setAmount(max > 0 ? String(max.toFixed(2)) : '')
  }, [paymentStateByProject, selectedProjectId])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast.error('El comprobante no debe superar 8MB')
      return
    }
    setProofFile(file)
    if (file.type?.includes('pdf')) {
      setProofPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const createPaymentRecord = useCallback(async ({ method, reference, proofUrl = null, status = 'pending' }) => {
    const { data, error } = await createClientPayment({
      invoice_id: selectedInvoice?.id || null,
      project_id: selectedProjectId,
      amount: numericAmount,
      currency: 'USD',
      method,
      account_holder_name: method === 'transfer' ? accountHolderName.trim() : null,
      proof_url: proofUrl,
      reference,
      paid_at: new Date().toISOString(),
      admin_status: status,
    })
    if (error) throw error
    setPayments(prev => [{ ...data, projects: { name: selectedProject?.name } }, ...prev])
    return data
  }, [accountHolderName, numericAmount, selectedInvoice?.id, selectedProject?.name, selectedProjectId])

  useEffect(() => {
    if (selectedMethod !== 'paypal' || !amountIsValid || success || loading) return
    const container = paypalContainerRef.current
    if (!container) return
    let cancelled = false
    container.innerHTML = ''
    setPaypalReady(false)

    async function renderPayPal() {
      try {
        const paypalClientId = getPayPalClientId()
        if (!paypalClientId) throw new Error('PayPal no esta configurado todavia.')
        const paypal = await loadScript({
          'client-id': paypalClientId,
          currency: 'USD',
          intent: 'capture',
          'enable-funding': 'card',
        })
        if (cancelled || !paypal?.Buttons) return
        const buttons = paypal.Buttons({
          style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 45 },
          createOrder: (_data, actions) => actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: { currency_code: 'USD', value: numericAmount.toFixed(2) },
              description: `Pago proyecto: ${selectedProject?.name || 'Fizzia'}`,
            }],
          }),
          onApprove: async (data, actions) => {
            setPaypalProcessing(true)
            try {
              const details = await actions.order.capture()
              const capture = details.purchase_units?.[0]?.payments?.captures?.[0]
              const reference = capture?.id || data.orderID
              await createPaymentRecord({ method: 'paypal', reference, status: 'approved' })
              toast.success('Gracias por tu pago')
              goToThanks('paypal', numericAmount)
            } catch (error) {
              console.error(error)
              toast.error(error.message || 'No pudimos confirmar el pago con PayPal')
            } finally {
              setPaypalProcessing(false)
            }
          },
          onCancel: () => toast.info('Pago cancelado'),
          onError: (error) => {
            console.error(error)
            toast.error('PayPal no pudo procesar el pago')
          },
        })
        paypalButtonsRef.current = buttons
        await buttons.render(container)
        if (!cancelled) setPaypalReady(true)
      } catch (error) {
        console.error(error)
        toast.error(error.message || 'No se pudo cargar PayPal')
      }
    }

    renderPayPal()
    return () => {
      cancelled = true
      paypalButtonsRef.current?.close?.()
      paypalButtonsRef.current = null
      container.innerHTML = ''
    }
  }, [amountIsValid, createPaymentRecord, loading, numericAmount, selectedMethod, selectedProject?.name, success, toast])

  const submitTransfer = async () => {
    if (!amountIsValid) {
      toast.error('El monto debe ser mayor a cero y no puede superar el saldo del proyecto')
      return
    }
    if (!accountHolderName.trim()) {
      toast.error('Ingresa el nombre del titular')
      return
    }
    if (!proofFile) {
      toast.error('Sube el comprobante de pago')
      return
    }
    setSubmitting(true)
    try {
      const { data: proofUrl, error: uploadError } = await uploadPaymentProof(proofFile)
      if (uploadError) throw uploadError
      await createPaymentRecord({
        method: 'transfer',
        proofUrl,
        reference: `Transferencia - ${accountHolderName.trim()}`,
        status: 'pending',
      })
      toast.success('Gracias por tu pago')
      goToThanks('transfer', numericAmount)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'No pudimos registrar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const submitGooglePay = async () => {
    if (!amountIsValid) {
      toast.error('El monto debe ser mayor a cero y no puede superar el saldo del proyecto')
      return
    }
    setSubmitting(true)
    try {
      await createPaymentRecord({
        method: 'google_pay',
        reference: `Google Pay - ${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        status: 'pending',
      })
      toast.success('Gracias por tu pago')
      goToThanks('google_pay', numericAmount)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'No pudimos registrar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado`)
  }

  const goToThanks = (method, paidAmount) => {
    navigate('/cliente/pago-gracias', {
      replace: true,
      state: {
        method,
        amount: paidAmount,
        projectId: selectedProjectId,
        projectName: selectedProject?.name || 'Proyecto',
      },
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="mx-auto h-12 w-auto" />
          <div className="mx-auto mt-4 h-10 w-10 animate-spin rounded-full border-b-2 border-fizzia-500" />
        </div>
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#cbd8cd] bg-white p-6 text-center shadow-lg">
          <h1 className="text-2xl font-black text-[#0b120d]">No hay pagos disponibles</h1>
          <Link to="/cliente" className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#2fb65d] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#27a650]">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-4">
        <div className="w-full rounded-[2rem] border border-[#b9ddc1] bg-white p-6 text-center shadow-[0_30px_70px_-46px_rgba(29,185,84,0.8)] sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf8f0] text-[#16843a]">
            <FileCheck2 className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#16843a]">Pago recibido</p>
          <h1 className="mt-2 text-2xl font-black text-[#0b120d] sm:text-3xl">Gracias por tu pago</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#526154]">
            En un momento tu pago se hara efectivo. Si necesita revision, nuestro equipo lo validara y actualizara el estado del proyecto.
          </p>
          <div className="mt-6 rounded-2xl border border-[#d7e4da] bg-[#f7fbf7] p-4 text-left">
            <div className="flex items-center justify-between gap-4 border-b border-[#d7e4da] pb-3">
              <span className="text-sm text-[#526154]">Proyecto</span>
              <span className="text-right text-sm font-bold text-[#0b120d]">{selectedProject?.name || 'Proyecto'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#d7e4da] py-3">
              <span className="text-sm text-[#526154]">Metodo</span>
              <span className="text-right text-sm font-bold text-[#0b120d]">{getMethodLabel(success.method)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-3">
              <span className="text-sm text-[#526154]">Monto</span>
              <span className="text-right text-lg font-black text-[#16843a]">{formatMoney(success.amount)}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to={`/cliente/proyecto/${selectedProjectId}`} className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#cbd8cd] px-4 py-3 text-sm font-bold text-[#263529] transition-all hover:bg-[#f7fbf7]">
              Ver proyecto
            </Link>
            <Link to="/cliente/finanzas" className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#2fb65d] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#27a650]">
              Ir a finanzas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#cbd8cd] bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#0b120d]">Realizar pago</h1>
          <span className="rounded-full bg-[#edf8f0] px-3 py-1 text-xs font-bold text-[#16843a]">{formatMoney(maxAmount)}</span>
        </div>

        <ModernPaymentForm selectedMethod={selectedMethod} onSelectMethod={setSelectedMethod} disabled={!selectedProjectId || maxAmount <= 0} />

        <div className="my-6 flex items-center text-[#617064]">
          <hr className="flex-grow border-t border-[#cbd8cd]" />
          <span className="mx-2 text-xs font-medium">datos del pago</span>
          <hr className="flex-grow border-t border-[#cbd8cd]" />
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#263529]">Proyecto</span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#cbd8cd] bg-white px-3 text-sm text-[#0b120d] outline-none transition-all focus:border-[#2fb65d] focus:ring-4 focus:ring-[#2fb65d]/10"
            >
              {projects.map(project => {
                const state = paymentStateByProject[project.id]
                return (
                  <option key={project.id} value={project.id}>
                    {project.name || 'Proyecto'} ({formatMoney(state?.remaining || 0)})
                  </option>
                )
              })}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#263529]">Monto</span>
            <input
              type="number"
              min="0"
              max={maxAmount}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#cbd8cd] bg-white px-3 text-sm text-[#0b120d] outline-none transition-all focus:border-[#2fb65d] focus:ring-4 focus:ring-[#2fb65d]/10"
              placeholder="0.00"
            />
          </label>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] font-medium text-[#617064]">Precio</p>
              <p className="text-sm font-black text-[#0b120d]">{formatMoney(selectedState?.total || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#617064]">Pagado</p>
              <p className="text-sm font-black text-[#16843a]">{formatMoney(selectedState?.approved || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#617064]">Maximo</p>
              <p className="text-sm font-black text-[#b45309]">{formatMoney(maxAmount)}</p>
            </div>
          </div>

          {!amountIsValid && (
            <p className="rounded-lg bg-[#fff7ed] px-3 py-2 text-xs font-semibold text-[#9a3412]">
              Monto invalido.
            </p>
          )}
        </div>

        {selectedMethod === 'paypal' && (
          <div className="mt-5">
            <div className={`rounded-xl border border-[#cbd8cd] bg-[#f7fbf7] p-2 ${paypalProcessing ? 'pointer-events-none opacity-70' : ''}`}>
              <div ref={paypalContainerRef} />
              {!paypalReady && amountIsValid && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#526154]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2fb65d] border-t-transparent" />
                  Cargando PayPal
                </div>
              )}
              {!amountIsValid && <p className="py-3 text-center text-sm text-[#526154]">Ingresa un monto valido.</p>}
            </div>
          </div>
        )}

        {selectedMethod === 'transfer' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-[#cbd8cd] bg-[#f7fbf7] p-3">
              {[
                ['Banco', BANK_INFO.bank],
                ['Titular', BANK_INFO.holder],
                ['Cedula', BANK_INFO.cedula],
                ['Cuenta', BANK_INFO.account],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-[#d7e4da] py-2 last:border-b-0">
                  <span className="text-xs font-semibold text-[#526154]">{label}</span>
                  <span className="flex items-center gap-2 text-right text-xs font-bold text-[#0b120d]">
                    {value}
                    {['Cedula', 'Cuenta'].includes(label) && (
                      <button type="button" onClick={() => copy(value, label)} className="cursor-pointer rounded p-1 text-[#617064] hover:bg-white hover:text-[#16843a]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-[#263529]">Titular</span>
              <input
                value={accountHolderName}
                onChange={(event) => setAccountHolderName(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#cbd8cd] bg-white px-3 text-sm text-[#0b120d] outline-none transition-all focus:border-[#2fb65d] focus:ring-4 focus:ring-[#2fb65d]/10"
                placeholder="Nombre completo"
              />
            </label>

            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[98px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#9aaa9d] bg-[#f7fbf7] px-4 py-4 text-center transition-all hover:border-[#2fb65d] hover:bg-[#edf8f0]"
            >
              {proofFile ? (
                <>
                  <FileCheck2 className="h-6 w-6 text-[#16843a]" />
                  <span className="mt-2 max-w-full truncate text-sm font-bold text-[#0b120d]">{proofFile.name}</span>
                  {proofPreview && <img src={proofPreview} alt="Comprobante" className="mt-3 max-h-28 rounded-lg object-contain" />}
                </>
              ) : (
                <>
                  <UploadCloud className="h-6 w-6 text-[#617064]" />
                  <span className="mt-2 text-sm font-bold text-[#263529]">Subir comprobante</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={submitTransfer}
              disabled={submitting || !amountIsValid}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#2fb65d] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#27a650] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Enviar pago'}
            </button>
          </div>
        )}

        {selectedMethod === 'google_pay' && (
          <button
            type="button"
            onClick={submitGooglePay}
            disabled={submitting || !amountIsValid}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0b120d] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#263529] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Building2 className="h-4 w-4" />
            {submitting ? 'Procesando...' : 'Confirmar Google Pay'}
          </button>
        )}
      </div>
    </div>
  )
}
