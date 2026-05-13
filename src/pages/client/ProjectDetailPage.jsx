import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProjectMessages, markProjectMessagesRead, sendProjectMessage, subscribeToMessages } from '../../api/messagesApi'
import { createClientPayment, deleteClientPayment, getProjectDirectPayments, getProjectInvoices, uploadPaymentProof } from '../../api/paymentsApi'
import { Modal } from '../../components/ui'
import { fulfillFileRequest, getClientProjectFileRequests, getMyProjectAppointments, getMyProjectMilestones, getMyProjects, requestProjectAppointment } from '../../api/projectsApi'
import { getProjectFiles, uploadProjectFile } from '../../api/filesApi'
import { formatDate, formatMoney } from '../../utils/format'
import { useToast } from '../../components/Toast'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../features/auth/authContext'
import { loadScript } from '@paypal/paypal-js'
import { AvatarIcon } from '../../data/avatars.jsx'
import { fetchGitHubCommits, formatCommitTime, getCommitAuthorName, getCommitDate, parseGitHubUrl } from '../../utils/github'
import { getMessageAuthor, getMessageAuthorName, getMessageAvatarId } from '../../utils/messageIdentity'
import { getDeliveryStatus, markMessageFailed, markMessageSent, mergeRealtimeMessage, mergeRealtimeMessages } from '../../utils/messageStatus'
import { sumApprovedPayments } from '../../utils/paymentStatus'
import { readStoredValue, writeStoredValue } from '../../utils/persistedState'
import { useRealtimeProject } from '../../hooks/useRealtimeProjects'
import { MeetingCards, ProjectRoadmap } from '../../components/projects/ProjectRoadmap'

let pendingId = Date.now()
function genId() { return `pending-${pendingId++}` }

const phases = [
  { key: 'solicitado', label: 'Solicitado', textColor: 'text-fizzia-400' },
  { key: 'preparando', label: 'Preparando', textColor: 'text-purple-400' },
  { key: 'trabajando', label: 'Trabajando', textColor: 'text-blue-400' },
  { key: 'pausado', label: 'Pausado', textColor: 'text-yellow-400' },
  { key: 'entregado', label: 'Entregado', textColor: 'text-green-400' },
  { key: 'cancelado', label: 'Cancelado', textColor: 'text-red-400' },
]

function getPayPalClientId() {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim()
  if (!clientId) return ''
  const looksLikeSql = /\b(alter|create|drop|policy|constraint|select|insert|update|delete)\b/i.test(clientId)
  const hasUnsafeWhitespace = /\s/.test(clientId)
  return looksLikeSql || hasUnsafeWhitespace ? '' : clientId
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { session, user } = useAuth()
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [messageAuthors, setMessageAuthors] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [visibleTimeMessageId, setVisibleTimeMessageId] = useState(null)
  const [fileRequests, setFileRequests] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => readStoredValue(`client-project-tab-${projectId}`, 'info', value => ['info', 'plan', 'actividad', 'pagos', 'files'].includes(value)))
  const [milestones, setMilestones] = useState([])
  const [appointments, setAppointments] = useState([])
  const [meetingNote, setMeetingNote] = useState('')
  const [requestingMeeting, setRequestingMeeting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editData, setEditData] = useState({ name: '', description: '', budget: '', repo_url: '', live_url: '', notes: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingRejected, setDeletingRejected] = useState(false)
  const [showDeleteRejectedModal, setShowDeleteRejectedModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileNote, setFileNote] = useState('')
  const [fulfillingRequestId, setFulfillingRequestId] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const handleRealtimeProject = useCallback((updatedProject) => {
    if (!updatedProject) return navigate('/cliente/proyectos')
    setProject(prev => prev ? { ...prev, ...updatedProject } : prev)
    setEditData(prev => ({
      ...prev,
      name: updatedProject.name ?? prev.name,
      description: updatedProject.description ?? prev.description,
      budget: updatedProject.budget ?? prev.budget,
      repo_url: updatedProject.repo_url ?? updatedProject.repository_url ?? prev.repo_url,
      live_url: updatedProject.live_url ?? prev.live_url,
      notes: updatedProject.notes ?? prev.notes,
    }))
  }, [navigate])

  useRealtimeProject(projectId, handleRealtimeProject)

  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentStep, setPaymentStep] = useState(0)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [transferType, setTransferType] = useState('transfer')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountCedula, setAccountCedula] = useState('')
  const [savePaymentDetails, setSavePaymentDetails] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [commits, setCommits] = useState([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const proofInputRef = useRef(null)
  const paypalButtonRef = useRef(null)
  const paypalButtonsRef = useRef(null)

  const projectTotal = project?.final_price || project?.budget || 0
  const approvedPaid = sumApprovedPayments(payments)
  const pending = Math.max(projectTotal - approvedPaid, 0)
  const paymentProgress = projectTotal > 0 ? Math.min((approvedPaid / projectTotal) * 100, 100) : 0
  const selectedAmount = Number(paymentAmount || 0)
  const paymentAmountIsValid = selectedAmount > 0 && selectedAmount <= pending

   
  useEffect(() => {
    writeStoredValue(`client-project-tab-${projectId}`, activeTab)
  }, [activeTab, projectId])

  useEffect(() => {
    const saved = localStorage.getItem('fizzia_payment_details')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d.accountHolderName) setAccountHolderName(d.accountHolderName)
        if (d.accountCedula) setAccountCedula(d.accountCedula)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])
   

  const canEdit = project?.status === 'solicitado'

  const capturePayPalOrder = async (orderId) => {
    setPaypalProcessing(true)
    try {
      throw new Error(`No se puede verificar la orden ${orderId} fuera de la ventana activa de PayPal`)
    } catch (err) {
      console.error('PayPal capture error:', err)
      toast.error(err.message || 'Error verificando pago con PayPal')
    } finally {
      setPaypalProcessing(false)
    }
  }

  const recordPayPalPayment = useCallback(async (details, fallbackOrderId) => {
    const capture = details.purchase_units?.[0]?.payments?.captures?.[0]
    const amount = Number(capture?.amount?.value || paymentAmount || pending)
    const transactionId = capture?.id || fallbackOrderId
    const { data: paymentData, error } = await createClientPayment({
      invoice_id: invoices[0]?.id,
      project_id: projectId,
      amount,
      currency: 'USD',
      method: 'paypal',
      reference: transactionId,
      paid_at: new Date().toISOString(),
      admin_status: 'approved',
    })
    if (error) throw error
    setPayments(prev => [{ ...paymentData, invoice_number: invoices[0]?.invoice_number }, ...prev])
    setPaymentSuccess(true)
    toast.success('Pago verificado exitosamente')
  }, [invoices, paymentAmount, pending, projectId, toast])

  useEffect(() => {
    const loadData = async () => {
      try {
        const projects = await getMyProjects()
        const found = projects?.find(p => p.id === projectId)
        if (!found) {
          navigate('/cliente')
          return
        }
        setProject(found)
        setEditData({
          name: found.name || '',
          description: found.description || '',
          budget: found.budget ? String(found.budget) : '',
          repo_url: found.repo_url || '',
          live_url: found.live_url || '',
          notes: found.notes || '',
        })

        const [filesRes, msgsRes, fileReqsRes, invoicesRes, directPaymentsRes, milestonesRes, appointmentsRes] = await Promise.all([
          getProjectFiles(projectId),
          getProjectMessages(projectId),
          getClientProjectFileRequests(projectId),
          getProjectInvoices(projectId),
          getProjectDirectPayments(projectId),
          getMyProjectMilestones(projectId),
          getMyProjectAppointments(projectId),
        ])
        setFiles(filesRes || [])
        setMessages(msgsRes || [])
        setFileRequests(fileReqsRes || [])
        setInvoices(invoicesRes || [])
        setMilestones(milestonesRes || [])
        setAppointments(appointmentsRes || [])
        const invoicePayments = (invoicesRes || []).flatMap(inv => (inv.payments || []).map(p => ({ ...p, invoice_number: inv.invoice_number })))
        const directPayments = (directPaymentsRes || []).map(p => ({ ...p, invoice_number: '' }))
        const allPayments = [...invoicePayments, ...directPayments].sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at))
        setPayments(allPayments)
      } catch (err) {
        console.error('Error loading project:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [projectId, navigate])

  useEffect(() => {
    if (paymentMethod !== 'paypal' || paymentStep !== 1) return
    const amount = Number(paymentAmount)
    if (!paypalButtonRef.current || !amount || amount <= 0 || amount > pending) {
      setPaypalReady(false)
      return
    }

    let cancelled = false
    const container = paypalButtonRef.current
    container.innerHTML = ''
    setPaypalReady(false)

    const renderButtons = async () => {
      try {
        const paypalClientId = getPayPalClientId()
        if (!paypalClientId) throw new Error('PayPal no configurado. Revisa VITE_PAYPAL_CLIENT_ID.')
        const paypal = await loadScript({
          'client-id': paypalClientId,
          currency: 'USD',
          intent: 'capture',
          'enable-funding': 'card',
        })
        if (cancelled || !paypal?.Buttons) return
        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 45,
          },
          createOrder: (_data, actions) => actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: { currency_code: 'USD', value: amount.toFixed(2) },
              description: `Pago proyecto: ${project?.name || 'Fizzia'}`,
            }],
          }),
          onClick: () => {
            if (amount <= 0 || amount > pending) {
              toast.error('Monto invalido')
              return false
            }
            return true
          },
          onApprove: async (data, actions) => {
            setPaypalProcessing(true)
            try {
              const details = await actions.order.capture()
              await recordPayPalPayment(details, data.orderID)
            } catch (err) {
              console.error('PayPal capture error:', err)
              toast.error(err.message || 'Error verificando pago con PayPal')
            } finally {
              setPaypalProcessing(false)
            }
          },
          onCancel: () => {
            toast.info('Pago cancelado')
            setPaypalProcessing(false)
          },
          onError: (err) => {
            console.error('PayPal error:', err)
            toast.error('Error al abrir PayPal')
            setPaypalProcessing(false)
          },
        })
        paypalButtonsRef.current = buttons
        await buttons.render(container)
        if (!cancelled) setPaypalReady(true)
      } catch (err) {
        console.error(err)
        const message = String(err?.message || '')
        if (message.includes('failed to load') || message.includes('400')) {
          toast.error('PayPal rechazo el Client ID configurado. Revisa VITE_PAYPAL_CLIENT_ID.')
        } else {
          toast.error(err.message || 'Error al cargar PayPal')
        }
      }
    }

    renderButtons()
    return () => {
      cancelled = true
      paypalButtonsRef.current?.close?.()
      paypalButtonsRef.current = null
      container.innerHTML = ''
    }
  }, [paymentMethod, paymentStep, paymentAmount, pending, project?.name, recordPayPalPayment, toast])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('token')
    const paypalApproved = params.get('approved')
    if (paypalApproved === 'true' && orderId) {
      capturePayPalOrder(orderId)
    } else if (paypalApproved === 'false') {
      toast.info('Pago cancelado')
      setPaypalProcessing(false)
    }
    if (params.has('token') || params.has('approved')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (project && activeTab === 'mensajes') {
      markProjectMessagesRead(project.id).then(readMessages => {
        if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
      })
      channelRef.current = subscribeToMessages(project.id, (payload) => {
        setMessages(prev => mergeRealtimeMessage(prev, payload))
        if (payload?.sender_id !== session?.user?.id) {
          markProjectMessagesRead(project.id).then(readMessages => {
            if (readMessages.length) setMessages(prev => mergeRealtimeMessages(prev, readMessages))
          })
        }
      })
    }
    return () => { if (channelRef.current) channelRef.current.unsubscribe() }
  }, [project, activeTab, session?.user?.id])

  useEffect(() => {
    const ids = [...new Set(messages.map(m => m.sender_id).filter(Boolean))]
      .filter(id => !messageAuthors[id])
    if (!ids.length) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name, first_name, email, avatar_id, role')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled) return
        setMessageAuthors(prev => ({
          ...prev,
          ...Object.fromEntries((data || []).map(profile => [profile.id, profile])),
        }))
      })
    return () => { cancelled = true }
  }, [messages, messageAuthors])

  useEffect(() => {
    const repo = project?.repo_url || project?.repository_url
    if (activeTab !== 'actividad' || !repo) return
    let cancelled = false
     
    setCommitsLoading(true)
    fetchGitHubCommits(repo, 15)
      .then(data => { if (!cancelled) setCommits(data || []) })
      .finally(() => { if (!cancelled) setCommitsLoading(false) })
    return () => { cancelled = true }
  }, [activeTab, project])

  const scrollMessagesToEnd = (behavior = 'auto') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' }))
    })
  }

  useEffect(() => {
    if (activeTab === 'mensajes') scrollMessagesToEnd(messages.length ? 'smooth' : 'auto')
  }, [messages, activeTab])

  useEffect(() => {
    if (activeTab === 'mensajes') scrollMessagesToEnd('auto')
  }, [activeTab])

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method)
    setPaymentStep(1)
    setPaymentSuccess(false)
    if (method === 'paypal') {
      setPaymentAmount(pending > 0 ? String(pending.toFixed(2)) : '')
    }
  }

  const handleTransferContinue = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) { toast.error('Ingresa un monto válido'); return }
    if (Number(paymentAmount) > pending) { toast.error('El monto excede lo pendiente'); return }
    setPaymentStep(2)
  }

  const handleTransferDetails = () => {
    const required = transferType === 'transfer' ? accountHolderName : accountCedula
    if (!required) { toast.error(transferType === 'transfer' ? 'Ingresa el nombre del titular' : 'Ingresa tu cédula'); return }
    if (savePaymentDetails) {
      localStorage.setItem('fizzia_payment_details', JSON.stringify({
        accountHolderName: transferType === 'transfer' ? accountHolderName : '',
        accountCedula: transferType === 'transfer' ? '' : accountCedula,
      }))
    }
    setPaymentStep(3)
  }

  const handleProofFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('El archivo no debe superar 10MB'); return }
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmitTransferPayment = async () => {
    if (!proofFile) { toast.error('Sube el comprobante'); return }
    setPaymentSubmitting(true)
    try {
      const { data: proofUrl, error: uploadErr } = await uploadPaymentProof(proofFile)
      if (uploadErr) throw uploadErr
      const { data, error } = await createClientPayment({
        invoice_id: invoices[0]?.id || null,
        project_id: projectId,
        amount: Number(paymentAmount),
        currency: 'USD',
        method: transferType === 'transfer' ? 'transfer' : 'deposit',
        account_holder_name: transferType === 'transfer' ? accountHolderName : null,
        account_cedula: transferType === 'transfer' ? null : accountCedula,
        proof_url: proofUrl,
        reference: `${transferType === 'transfer' ? 'Transferencia' : 'Depósito'} - ${accountHolderName || accountCedula}`,
        paid_at: new Date().toISOString(),
        admin_status: 'pending',
      })
      if (error) throw error
      setPayments(prev => [{ ...data, invoice_number: invoices[0]?.invoice_number || '' }, ...prev])
      setPaymentSubmitting(false)
      toast.success('Comprobante enviado, pendiente de verificación')
      setPaymentStep(4)
      setPaymentSuccess(true)
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.message || 'Error al registrar el pago')
      setPaymentSubmitting(false)
    }
  }

  const resetPaymentForm = () => {
    setPaymentMethod(null)
    setPaymentStep(0)
    setPaymentAmount('')
    setAccountHolderName('')
    setAccountCedula('')
    setProofFile(null)
    setProofPreview(null)
    setPaymentSuccess(false)
    setPaypalProcessing(false)
    setPaypalReady(false)
    if (proofInputRef.current) proofInputRef.current.value = ''
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !project) return
    const content = newMessage.trim()
    setNewMessage('')
    const tempId = genId()
    const tempMsg = {
      id: tempId,
      project_id: project.id,
      sender_id: session?.user?.id,
      content,
      created_at: new Date().toISOString(),
      _status: 'sending',
    }
    setMessages(prev => [...prev, tempMsg])
    try {
      const msg = await sendProjectMessage(project.id, content)
      setMessages(prev => markMessageSent(prev, tempId, msg))
    } catch {
      setMessages(prev => markMessageFailed(prev, tempId))
      toast.error('Error enviando mensaje')
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!canEdit || savingEdit) return
    setSavingEdit(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editData.name.trim(),
          description: editData.description.trim(),
          budget: editData.budget ? Number(editData.budget) : 0,
          repo_url: editData.repo_url.trim() || null,
          live_url: editData.live_url.trim() || null,
          notes: editData.notes.trim() || null,
        })
        .eq('id', projectId)

      if (error) throw error

      setProject(prev => ({
        ...prev,
        name: editData.name.trim(),
        description: editData.description.trim(),
        budget: editData.budget ? Number(editData.budget) : 0,
        repo_url: editData.repo_url.trim() || null,
        live_url: editData.live_url.trim() || null,
        notes: editData.notes.trim() || null,
      }))
      setShowEdit(false)
      toast.success('Proyecto actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit || deleting) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast.success('Proyecto eliminado')
      navigate('/cliente')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const phase = phases.find(p => p.key === project?.status) || phases[0]

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (!selectedFiles.length) return
    setUploading(true)
    for (const file of selectedFiles) {
      const result = await uploadProjectFile(projectId, file, null, fileNote)
      if (result.error) {
        toast.error(`Error al subir ${file.name}`)
      } else {
        setFiles(prev => [result.data, ...prev])
        if (fulfillingRequestId) {
          await fulfillFileRequest(fulfillingRequestId, result.data.id)
          setFileRequests(prev => prev.map(r => r.id === fulfillingRequestId ? { ...r, fulfilled: true } : r))
          setFulfillingRequestId(null)
          toast.success('Archivo enviado para la solicitud')
        }
      }
    }
    setUploading(false)
    setFileNote('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!fulfillingRequestId) {
      toast.success(selectedFiles.length > 1 ? `${selectedFiles.length} archivos subidos` : 'Archivo subido')
    }
  }

  const getFileIcon = (file) => {
    if (file.file_type?.includes('image')) return 'image'
    if (file.file_type?.includes('pdf')) return 'picture_as_pdf'
    if (file.file_type?.includes('zip') || file.file_type?.includes('rar')) return 'folder_zip'
    if (file.file_type?.includes('video')) return 'video_file'
    if (file.file_type?.includes('figma') || file.file_type?.includes('design')) return 'design_services'
    return 'attach_file'
  }

  const getFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDeleteAllRejectedPayments = async () => {
    const rejected = payments.filter(p => p.admin_status === 'rejected')
    if (rejected.length === 0) return
    setDeletingRejected(true)
    try {
      await Promise.all(rejected.map(p => deleteClientPayment(p.id)))
      setPayments(prev => prev.filter(p => p.admin_status !== 'rejected'))
      toast.success(`${rejected.length} pago(s) eliminado(s)`)
      setShowDeleteRejectedModal(false)
    } catch {
      toast.error('Error eliminando pagos')
    } finally {
      setDeletingRejected(false)
    }
  }

  const handleRequestMeeting = async () => {
    setRequestingMeeting(true)
    try {
      const { data, error } = await requestProjectAppointment(projectId, project, meetingNote)
      if (error) throw error
      setAppointments(prev => [...prev, data].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)))
      setMeetingNote('')
      toast.success('Solicitud de reunión enviada')
    } catch {
      toast.error('No se pudo solicitar la reunión')
    } finally {
      setRequestingMeeting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-dark-800 rounded animate-pulse" />
        <div className="h-64 bg-dark-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cliente')} className="cursor-pointer text-dark-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className={`text-sm font-medium ${phase.textColor}`}>{phase.icon} {phase.label}</span>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-dark-800 text-dark-300 rounded-lg hover:text-white hover:bg-dark-700 transition-all text-sm"
            >
              <span className="material-symbols-rounded text-base">edit</span>
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm"
            >
              <span className="material-symbols-rounded text-base">delete</span>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Editar proyecto</h3>
              <button onClick={() => setShowEdit(false)} className="cursor-pointer text-dark-400 hover:text-white">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Descripción</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] resize-none transition-all"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Presupuesto (USD)</label>
                <input
                  type="number"
                  value={editData.budget}
                  onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Repositorio (GitHub, GitLab, etc.)</label>
                <input
                  type="url"
                  value={editData.repo_url}
                  onChange={(e) => setEditData({ ...editData, repo_url: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                  placeholder="https://github.com/usuario/proyecto"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">URL en vivo / Demo</label>
                <input
                  type="url"
                  value={editData.live_url}
                  onChange={(e) => setEditData({ ...editData, live_url: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                  placeholder="https://mi-proyecto.com"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Notas adicionales</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-[var(--accent)] resize-none transition-all"
                  rows={3}
                  placeholder="Instrucciones, accesos, comentarios..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="cursor-pointer flex-1 py-3 bg-dark-800 text-white font-medium rounded-xl hover:bg-dark-700 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit} className="cursor-pointer flex-1 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-lighter)] disabled:opacity-50 transition-all">
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-red-400 text-3xl">delete</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar proyecto?</h3>
            <p className="text-dark-400 text-sm mb-6">Esta acción no se puede deshacer</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="cursor-pointer flex-1 py-3 bg-dark-800 text-white font-medium rounded-xl hover:bg-dark-700 transition-all">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} className="cursor-pointer flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-400 disabled:opacity-50 transition-all">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900/50 border border-dark-800 rounded-xl p-1">
        {[
          { key: 'info', label: 'Detalles' },
          { key: 'plan', label: 'Plan' },
          { key: 'pagos', label: 'Pagos' },
          { key: 'actividad', label: 'Cambios' },
          { key: 'files', label: 'Archivos' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); if (tab.key !== 'pagos') resetPaymentForm() }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--accent)] text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {project.status === 'solicitado' && ['plan', 'pagos', 'actividad', 'files'].includes(activeTab) ? (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-4xl text-dark-500">lock</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aún no puedes acceder a esta parte del proyecto</h3>
          <p className="text-dark-400 text-sm max-w-md">
            Espera a que el equipo de Fizzia se contacte contigo y habilite tu proyecto para ver esta información.
          </p>
        </div>
      ) : (
        <>
      {activeTab === 'info' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-6 space-y-4">
          {project.description && (
            <div>
              <h3 className="text-sm font-semibold text-dark-400 mb-2">Descripción</h3>
              <p className="text-white text-sm whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(project.final_price || project.budget) && (
              <div>
                <p className="text-xs text-dark-500 mb-1">{project.final_price ? 'Precio' : 'Presupuesto'}</p>
                <p className="text-white font-semibold">{formatMoney(project.final_price || project.budget)}</p>
              </div>
            )}
            {project.start_date && (
              <div>
                <p className="text-xs text-dark-500 mb-1">Inicio</p>
                <p className="text-white font-semibold">{formatDate(project.start_date)}</p>
              </div>
            )}
            {project.due_date && (
              <div>
                <p className="text-xs text-dark-500 mb-1">Entrega</p>
                <p className="text-white font-semibold">{formatDate(project.due_date)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-dark-500 mb-1">Creado</p>
              <p className="text-white font-semibold">{formatDate(project.created_at)}</p>
            </div>
          </div>
          {(project.repo_url || project.repository_url || project.live_url || project.notes) && (
            <div className="pt-4 border-t border-dark-700 space-y-4">
              {(project.repo_url || project.repository_url) && (
                <a
                  href={project.repo_url || project.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-all group"
                >
                  <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-rounded text-fizzia-400">code</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Repositorio</p>
                    <p className="text-dark-400 text-xs truncate">{project.repo_url || project.repository_url}</p>
                  </div>
                  <span className="material-symbols-rounded text-dark-500 group-hover:text-white transition-colors">open_in_new</span>
                </a>
              )}
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-all group"
                >
                  <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-rounded text-green-400">language</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Sitio en vivo</p>
                    <p className="text-dark-400 text-xs truncate">{project.live_url}</p>
                  </div>
                  <span className="material-symbols-rounded text-dark-500 group-hover:text-white transition-colors">open_in_new</span>
                </a>
              )}
              {project.notes && (
                <div className="p-3 bg-dark-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-rounded text-yellow-400 text-lg">sticky_note_2</span>
                    <p className="text-white text-sm font-medium">Notas</p>
                  </div>
                  <p className="text-dark-300 text-sm whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mensajes' && (
        <div className="flex h-[calc(100dvh-14rem)] min-h-[32rem] max-h-[44rem] flex-col overflow-hidden rounded-xl border border-dark-800 bg-dark-950/40">
          <div className="border-b border-dark-800 bg-dark-900/60 p-4">
            <p className="text-sm font-semibold text-white">{project.name}</p>
            <p className="text-xs text-dark-500">Chat con el equipo de Fizzia</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full"><p className="text-dark-500 text-sm">No hay mensajes aún</p></div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === session?.user?.id
                const status = getDeliveryStatus(msg, isMine)
                const author = getMessageAuthor(msg, messageAuthors)
                const authorName = getMessageAuthorName({ message: msg, isMine, author, clientName: 'Equipo' })
                const avatarId = getMessageAvatarId({ message: msg, isMine, author, currentUser: user })
                const time = new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                const showTime = visibleTimeMessageId === msg.id
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="h-8 w-8 rounded-full bg-white overflow-hidden shrink-0">
                        <AvatarIcon id={avatarId || '2'} size={32} />
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`mb-1 flex items-center gap-2 text-[11px] ${isMine ? 'justify-end text-fizzia-400' : 'text-dark-400'}`}>
                        <span className="font-medium">{authorName}</span>
                      </div>
                      <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <button
                          type="button"
                          onClick={() => setVisibleTimeMessageId(prev => prev === msg.id ? null : msg.id)}
                          className={`cursor-pointer px-4 py-2.5 rounded-2xl text-sm text-left shadow-sm ${
                            isMine
                              ? status === 'error' ? 'bg-red-500/80 text-white rounded-br-sm'
                              : 'bg-[var(--accent)] text-white rounded-br-sm'
                              : 'bg-dark-800 text-dark-100 rounded-bl-sm'
                          }`}
                        >
                          <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                        </button>
                        {isMine && (
                          <span className={`mb-1 flex h-4 w-4 items-center justify-center ${status === 'error' ? 'text-red-400' : 'text-dark-500'}`}>
                            {status === 'sending' && (
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                            {status === 'sent' && <span className="material-symbols-rounded text-[13px]">check</span>}
                            {status === 'read' && <span className="material-symbols-rounded text-[13px] text-sky-400">done_all</span>}
                            {status === 'error' && <span className="material-symbols-rounded text-[13px]">error</span>}
                          </span>
                        )}
                      </div>
                        {showTime && <span className={`mt-1 text-[10px] ${isMine ? 'mr-6 text-fizzia-500/60' : 'ml-2 text-dark-500'}`}>{time}</span>}
                    </div>
                    {isMine && (
                      <div className="h-8 w-8 rounded-full bg-white overflow-hidden shrink-0">
                        <AvatarIcon id={avatarId || '1'} size={32} />
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-dark-800 flex gap-2 shrink-0">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-[var(--accent)] text-sm" placeholder="Escribir mensaje..." />
            <button type="submit" disabled={!newMessage.trim()} className="cursor-pointer px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-lighter)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <span className="material-symbols-rounded text-lg">send</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Ruta del proyecto</p>
              <h3 className="mt-2 text-xl font-bold text-white">Lo que sigue, sin ruido</h3>
              <p className="mt-2 text-sm leading-6 text-dark-400">
                Aquí ves los pasos importantes: revisión, reuniones, pagos, demos, ajustes y entrega.
              </p>
            </div>
            <ProjectRoadmap milestones={milestones} />
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-5">
              <h3 className="text-lg font-bold text-white">Reuniones</h3>
              <p className="mt-1 text-sm leading-6 text-dark-400">Cuando una reunión esté confirmada, verás plataforma, fecha y enlace disponible.</p>
              <textarea
                value={meetingNote}
                onChange={(event) => setMeetingNote(event.target.value)}
                rows={3}
                className="mt-4 w-full rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
                placeholder="Opcional: cuéntanos qué quieres revisar en la reunión..."
              />
              <button
                onClick={handleRequestMeeting}
                disabled={requestingMeeting}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-lighter)] disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-base">event_available</span>
                {requestingMeeting ? 'Enviando...' : 'Solicitar reunión'}
              </button>
            </div>
            <MeetingCards appointments={appointments} />
          </section>
        </div>
      )}

      {activeTab === 'actividad' && (
        <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Cambios del proyecto</h3>
              <p className="text-dark-500 text-xs mt-1">
                {parseGitHubUrl(project.repo_url || project.repository_url)
                  ? 'Commits recientes del repositorio'
                  : 'El equipo configurara el repositorio de GitHub cuando este disponible'}
              </p>
            </div>
            {(project.repo_url || project.repository_url) && (
              <a
                href={project.repo_url || project.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-fizzia-400 hover:text-fizzia-300 text-sm font-medium"
              >
                Ver repo
              </a>
            )}
          </div>
          {commitsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-dark-800 animate-pulse" />
              ))}
            </div>
          ) : commits.length ? (
            <div className="space-y-3">
              {commits.map(commit => (
                <a
                  key={commit.sha}
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer flex items-start gap-3 rounded-xl border border-dark-800 bg-dark-950/70 p-4 hover:border-dark-700 transition-all"
                >
                  <div className="w-8 h-8 rounded-full border border-dark-700 bg-dark-800 overflow-hidden flex items-center justify-center shrink-0">
                    {commit.author?.avatar_url ? (
                      <img src={commit.author.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-rounded text-fizzia-400 text-sm">terminal</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{commit.commit?.message?.split('\n')[0]}</p>
                    <p className="text-dark-500 text-xs mt-1">
                        {getCommitAuthorName(commit)} · {formatCommitTime(getCommitDate(commit))}
                    </p>
                  </div>
                  <code className="cursor-pointer text-xs text-fizzia-400 hover:text-fizzia-300 font-mono shrink-0">{commit.sha?.slice(0, 7)}</code>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-rounded text-dark-600 text-4xl">commit</span>
              <p className="text-dark-400 text-sm mt-2">No hay commits disponibles</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pagos' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="rounded-2xl border border-dark-800 bg-dark-900/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-fizzia-400">Pagos del proyecto</p>
                <h3 className="mt-1 text-xl font-bold text-white">{formatMoney(projectTotal)}</h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-dark-500">Pendiente</p>
                <p className="text-lg font-bold text-amber-300">{formatMoney(pending)}</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark-800">
              <div
                className="h-full rounded-full bg-fizzia-500 transition-[width] duration-300 ease-out"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-dark-800 bg-dark-950/70 p-3">
                <p className="text-xs text-dark-500">{project.final_price ? 'Precio final' : 'Presupuesto'}</p>
                <p className="mt-1 text-base font-semibold text-white">{formatMoney(projectTotal)}</p>
              </div>
              <div className="rounded-xl border border-fizzia-500/20 bg-fizzia-500/10 p-3">
                <p className="text-xs text-fizzia-300">Verificado</p>
                <p className="mt-1 text-base font-semibold text-fizzia-300">{formatMoney(approvedPaid)}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-200">Por pagar</p>
                <p className="mt-1 text-base font-semibold text-amber-200">{formatMoney(pending)}</p>
              </div>
            </div>
          </div>

          {/* Payment flow */}
          {pending > 0 && !paymentSuccess && (
            <div className="overflow-hidden rounded-2xl border border-dark-800 bg-dark-900/40">
              <div className="flex flex-col gap-3 border-b border-dark-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-dark-500">Checkout</p>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    {paymentMethod === 'paypal' ? 'Pago con PayPal' : paymentMethod === 'transfer' ? 'Pago por banco' : 'Elige como quieres pagar'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <span className={`h-2 w-2 rounded-full ${paymentAmountIsValid ? 'bg-fizzia-400' : 'bg-dark-600'}`} />
                  <span>{paymentAmountIsValid ? `${formatMoney(selectedAmount)} listo` : `${formatMoney(pending)} disponible`}</span>
                </div>
              </div>
              <div className="p-4 sm:p-5">
              {/* Step 0: Method selection */}
              {paymentStep === 0 && (
                <>
                  <div className="mb-4 flex flex-col gap-1">
                    <h4 className="text-white font-semibold">Método de pago</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                    <button
                      onClick={() => handleSelectPaymentMethod('paypal')}
                      className="cursor-pointer flex min-h-[104px] items-center gap-4 rounded-2xl border border-dark-700 bg-dark-950 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 active:translate-y-0"
                    >
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white px-2">
                        <img src="/Logo metodos de pagos/Paypal_2014_logo.png" alt="PayPal" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm">PayPal</p>
                        <p className="mt-1 text-dark-400 text-xs leading-relaxed">Necesitas una cuenta PayPal.</p>
                      </div>
                      <span className="material-symbols-rounded text-dark-500">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleSelectPaymentMethod('transfer')}
                      className="cursor-pointer flex min-h-[104px] items-center gap-4 rounded-2xl border border-dark-700 bg-dark-950 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 active:translate-y-0"
                    >
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white px-2">
                        <img src="/Logo metodos de pagos/Banco_Pichincha_nuevo.png" alt="Banco Pichincha" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm">Transferencia o depósito</p>
                        <p className="mt-1 text-dark-400 text-xs leading-relaxed">Necesitas subir el comprobante.</p>
                      </div>
                      <span className="material-symbols-rounded text-dark-500">arrow_forward</span>
                    </button>
                  </div>
                </>
              )}

              {/* PayPal flow */}
              {paymentMethod === 'paypal' && paymentStep === 1 && (
                <div className="mx-auto w-full max-w-[620px] space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-white font-semibold">PayPal o tarjeta</h4>
                      <p className="mt-1 text-sm text-dark-500">Pendiente: <span className="font-medium text-fizzia-300">{formatMoney(pending)}</span></p>
                    </div>
                    <button onClick={resetPaymentForm} className="cursor-pointer rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-white">
                      <span className="material-symbols-rounded text-lg">close</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-dark-300 mb-1.5">Monto a pagar (USD)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full rounded-xl border border-dark-700 bg-dark-950 px-4 py-3 text-white transition-colors focus:border-[var(--accent)] focus:outline-none"
                        placeholder="0.00"
                        max={pending}
                        step="0.01"
                      />
                    </div>
                    <div className="rounded-xl border border-dark-800 bg-dark-950 p-1.5">
                      <div ref={paypalButtonRef} className={`[&>*]:!min-w-0 ${paypalProcessing ? 'pointer-events-none opacity-60' : ''}`} />
                      {!paypalReady && paymentAmountIsValid && (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm text-dark-400">
                          <span className="material-symbols-rounded text-lg animate-spin">progress_activity</span>
                          Cargando PayPal...
                        </div>
                      )}
                      {!paymentAmountIsValid && (
                        <p className="py-2 text-center text-sm text-dark-500">Ingresa un monto válido para activar PayPal</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer/Deposit flow */}
              {paymentMethod === 'transfer' && paymentStep === 1 && (
                <div className="mx-auto w-full max-w-[620px] space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-white font-semibold">Transferencia o depósito</h4>
                      <p className="mt-1 text-sm text-dark-500">Pendiente: <span className="font-medium text-fizzia-300">{formatMoney(pending)}</span></p>
                    </div>
                    <button onClick={resetPaymentForm} className="cursor-pointer rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-white">
                      <span className="material-symbols-rounded text-lg">close</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-dark-300 mb-1.5">Monto a pagar (USD)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full rounded-xl border border-dark-700 bg-dark-950 px-4 py-3 text-white transition-colors focus:border-[var(--accent)] focus:outline-none"
                        placeholder="0.00"
                        max={pending}
                        step="0.01"
                      />
                      <p className="text-dark-500 text-xs mt-1">Pendiente: {formatMoney(pending)}</p>
                    </div>
                    <button
                      onClick={handleTransferContinue}
                      className="cursor-pointer w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-lighter)] active:translate-y-px"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* Transfer/Deposit Step 2: Account details */}
              {paymentMethod === 'transfer' && paymentStep === 2 && (
                <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-dark-800 bg-dark-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Datos de tu pago</h3>
                    <button onClick={() => setPaymentStep(1)} className="cursor-pointer rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-white">
                      <span className="material-symbols-rounded text-lg">arrow_back</span>
                    </button>
                  </div>

                  {/* Transfer type toggle */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-dark-800 bg-dark-900 p-1">
                    <button
                      onClick={() => setTransferType('transfer')}
                      className={`rounded-lg py-2.5 text-sm font-medium transition-all ${transferType === 'transfer' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
                    >
                      Transferencia
                    </button>
                    <button
                      onClick={() => setTransferType('deposit')}
                      className={`rounded-lg py-2.5 text-sm font-medium transition-all ${transferType === 'deposit' ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:text-white'}`}
                    >
                      Depósito
                    </button>
                  </div>

                  {/* Account details */}
                  {transferType === 'transfer' ? (
                    <div>
                      <label className="block text-sm text-dark-300 mb-1.5">Nombre del titular de la cuenta</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white transition-colors focus:border-[var(--accent)] focus:outline-none"
                        placeholder="Nombre completo"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-dark-300 mb-1.5">Número de cédula de quien deposita</label>
                      <input
                        type="text"
                        value={accountCedula}
                        onChange={(e) => setAccountCedula(e.target.value)}
                        className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white transition-colors focus:border-[var(--accent)] focus:outline-none"
                        placeholder="Ej: 1234567890"
                      />
                    </div>
                  )}

                  {/* Save details */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={savePaymentDetails}
                      onChange={(e) => setSavePaymentDetails(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-600 bg-dark-950 text-fizzia-500 focus:ring-fizzia-500"
                    />
                    <span className="text-sm text-dark-300">Guardar estos datos para futuros pagos</span>
                  </label>

                  <button
                    onClick={handleTransferDetails}
                    disabled={
                      (transferType === 'transfer' && !accountHolderName.trim()) ||
                      (transferType === 'deposit' && !accountCedula.trim())
                    }
                    className="cursor-pointer w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-lighter)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Transfer/Deposit Step 3: Bank info + Upload proof */}
              {paymentMethod === 'transfer' && paymentStep === 3 && (
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Datos bancarios</h3>
                    <button onClick={() => setPaymentStep(2)} className="cursor-pointer rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-white">
                      <span className="material-symbols-rounded text-lg">arrow_back</span>
                    </button>
                  </div>

                  {/* Bank details */}
                  <div className="rounded-2xl border border-dark-800 bg-dark-950/70 p-4 space-y-3 lg:row-start-2">
                    <p className="text-white text-sm font-medium mb-2">Realiza el pago a esta cuenta</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">Banco</span>
                      <span className="text-white text-sm font-medium">Banco del Pichincha</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">Titular</span>
                      <span className="text-white text-sm font-medium">Jordan Jair Suarez Alcivar</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">Cédula</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono">1208478378</span>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText('1208478378'); toast.success('Cédula copiada') }}
                          className="cursor-pointer p-1 rounded hover:bg-dark-700 transition-colors"
                        >
                          <span className="material-symbols-rounded text-dark-400 text-base">content_copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">Cuenta</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono">2210323937</span>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText('2210323937'); toast.success('Cuenta copiada') }}
                          className="cursor-pointer p-1 rounded hover:bg-dark-700 transition-colors"
                        >
                          <span className="material-symbols-rounded text-dark-400 text-base">content_copy</span>
                        </button>
                      </div>
                    </div>
                    {transferType === 'transfer' && accountHolderName && (
                      <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                        <span className="text-xs text-dark-500">Tu nombre</span>
                        <span className="text-white text-sm">{accountHolderName}</span>
                      </div>
                    )}
                    {transferType === 'deposit' && accountCedula && (
                      <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                        <span className="text-xs text-dark-500">Tu cédula</span>
                        <span className="text-white text-sm font-mono">{accountCedula}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-dark-800 bg-dark-950/70 p-4 lg:row-span-2">
                  <p className="text-dark-400 text-sm">Sube el comprobante de tu pago</p>

                  <input
                    ref={proofInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleProofFileSelect}
                    className="hidden"
                    capture="environment"
                  />

                  {!proofPreview ? (
                    <button
                      onClick={() => proofInputRef.current?.click()}
                      className="mt-3 flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-dark-600 py-12 text-dark-400 transition-all hover:border-[var(--accent)]/50 hover:text-white"
                    >
                      <span className="material-symbols-rounded text-4xl">camera_alt</span>
                      <p className="text-sm font-medium">Tomar foto o subir comprobante</p>
                      <p className="text-xs text-dark-500">JPG, PNG o PDF (máx 10MB)</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border border-dark-700 bg-dark-950">
                        {proofFile?.type?.includes('pdf') ? (
                          <div className="p-8 flex flex-col items-center gap-2">
                            <span className="material-symbols-rounded text-6xl text-dark-400">picture_as_pdf</span>
                            <p className="text-white text-sm">{proofFile.name}</p>
                          </div>
                        ) : (
                          <img src={proofPreview} alt="Comprobante" className="w-full h-48 object-contain bg-dark-950" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setProofFile(null); setProofPreview(null); proofInputRef.current?.click() }}
                          className="cursor-pointer flex-1 rounded-xl bg-dark-800 py-2.5 text-sm font-medium text-white transition-all hover:bg-dark-700"
                        >
                          Cambiar
                        </button>
                        <button
                          onClick={handleSubmitTransferPayment}
                          disabled={paymentSubmitting}
                          className="cursor-pointer flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-lighter)] disabled:opacity-50"
                        >
                          {paymentSubmitting ? 'Enviando...' : 'Enviar comprobante'}
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Transfer/Deposit Step 4: Waiting confirmation */}
              {paymentMethod === 'transfer' && paymentStep === 4 && paymentSuccess && (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="material-symbols-rounded text-amber-400 text-3xl">hourglass_top</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Comprobante enviado</h3>
                  <p className="text-dark-400 text-sm max-w-xs">Espera a que confirmemos tu pago. Te notificaremos cuando esté verificado.</p>
                  <button
                    onClick={resetPaymentForm}
                    className="cursor-pointer px-6 py-2.5 bg-dark-800 text-white text-sm font-medium rounded-lg hover:bg-dark-700 transition-all"
                  >
                    Volver a pagos
                  </button>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Payment success for PayPal (redirect back) */}
          {paymentMethod === 'paypal' && paypalProcessing && (
            <div className="rounded-2xl border border-dark-800 bg-dark-900/40 p-5">
              <div className="py-8 flex flex-col items-center text-center space-y-4">
                <span className="material-symbols-rounded text-4xl text-fizzia-400 animate-spin">progress_activity</span>
                <h3 className="text-lg font-bold text-white">Verificando tu pago</h3>
                <p className="text-dark-400 text-sm">Estamos confirmando tu pago con PayPal...</p>
              </div>
            </div>
          )}

          {/* Payment history */}
          <div className="rounded-2xl border border-dark-800 bg-dark-900/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-white font-semibold">Historial de pagos</h3>
                <p className="mt-1 text-sm text-dark-500">{payments.length ? `${payments.length} movimiento${payments.length === 1 ? '' : 's'} registrado${payments.length === 1 ? '' : 's'}` : 'Aún no hay movimientos'}</p>
              </div>
              <div className="flex items-center gap-2">
                {payments.filter(p => p.admin_status === 'rejected').length > 0 && (
                  <button
                    onClick={() => setShowDeleteRejectedModal(true)}
                    className="cursor-pointer flex items-center gap-1.5 py-1.5 px-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    <span className="material-symbols-rounded text-sm">delete_sweep</span>
                    Eliminar todos
                  </button>
                )}
                <span className="material-symbols-rounded text-dark-600">receipt_long</span>
              </div>
            </div>
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-dark-700 bg-dark-950/50 py-10 text-center">
                <span className="material-symbols-rounded mb-2 block text-3xl text-dark-600">payments</span>
                <p className="text-dark-400 text-sm font-medium">No hay pagos registrados</p>
                <p className="mt-1 text-dark-600 text-xs">Cuando pagues, aparecerá aquí con su estado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="grid gap-3 rounded-xl border border-dark-800 bg-dark-950/70 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${p.method === 'paypal' ? 'bg-white px-1' : 'bg-fizzia-500/15'}`}>
                        {p.method === 'paypal' ? (
                          <img src="/Logo metodos de pagos/Paypal_2014_logo.png" alt="PayPal" className="w-full h-full object-contain" />
                        ) : (
                          <span className="material-symbols-rounded text-fizzia-300 text-lg">account_balance</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">{p.method === 'paypal' ? 'PayPal' : p.method === 'deposit' ? 'Depósito' : 'Transferencia'}</p>
                        <p className="truncate text-dark-500 text-xs">{formatDate(p.paid_at)}{p.invoice_number ? ` · ${p.invoice_number}` : ''}</p>
                        {p.reference && <p className="truncate text-dark-600 text-xs">Ref: {p.reference}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end sm:text-right">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm sm:mb-1">{formatMoney(p.amount)}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          p.admin_status === 'approved' ? 'bg-fizzia-500/20 text-fizzia-300' :
                          p.admin_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {p.admin_status === 'approved' ? 'Verificado' :
                           p.admin_status === 'rejected' ? 'Rechazado' :
                           'Pendiente'}
                        </span>
                      </div>
                      {p.admin_status === 'rejected' && (
                        <button
                          onClick={async () => {
                            if (!confirm('¿Eliminar este pago rechazado?')) return
                            try {
                              await deleteClientPayment(p.id)
                              setPayments(prev => prev.filter(pm => pm.id !== p.id))
                              toast.success('Pago eliminado')
                            } catch {
                              toast.error('Error al eliminar')
                            }
                          }}
                          className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-dark-500 hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0"
                          title="Eliminar pago"
                        >
                          <span className="material-symbols-rounded text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete all rejected modal */}
      <Modal open={showDeleteRejectedModal} onClose={() => !deletingRejected && setShowDeleteRejectedModal(false)}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="material-symbols-rounded text-red-400 text-3xl">delete_sweep</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Eliminar pagos rechazados</h3>
          <p className="text-dark-400 text-sm mb-6">
            ¿Eliminar permanentemente {payments.filter(p => p.admin_status === 'rejected').length} pago(s) rechazado(s)? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteRejectedModal(false)}
              disabled={deletingRejected}
              className="cursor-pointer flex-1 py-3 bg-dark-800 text-white font-medium rounded-xl hover:bg-dark-700 disabled:opacity-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteAllRejectedPayments}
              disabled={deletingRejected}
              className="cursor-pointer flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-400 disabled:opacity-50 transition-all"
            >
              {deletingRejected ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* File requests from admin */}
          {fileRequests.length > 0 && (
            <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="material-symbols-rounded text-fizzia-400 text-lg">assignment_turned_in</span>
                Archivos solicitados por Fizzia
              </h3>
              <div className="space-y-2">
                {fileRequests.map(req => (
                  <div key={req.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${req.fulfilled ? 'bg-green-500/10 border border-green-500/20' : 'bg-dark-950 border border-dark-700'}`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className={`truncate ${req.fulfilled ? 'text-green-400' : 'text-dark-200'}`}>{req.request_text}</p>
                      <p className="text-xs text-dark-500 mt-0.5">{formatDate(req.created_at)}</p>
                    </div>
                    {req.fulfilled ? (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium shrink-0">Enviado</span>
                    ) : (
                      <button
                        onClick={() => { setFulfillingRequestId(req.id); fileInputRef.current?.click() }}
                        className="cursor-pointer px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-medium rounded-lg hover:bg-[var(--accent-lighter)] transition-all shrink-0"
                      >
                        Enviar archivo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">Subir archivos</h3>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip,.rar,.psd,.ai,.fig,.sketch,.mp4,.mov,.svg"
            />
            <textarea
              value={fileNote}
              onChange={(e) => setFileNote(e.target.value)}
              className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white text-sm placeholder-dark-500 focus:outline-none focus:border-[var(--accent)] resize-none transition-all mb-3"
              rows={2}
              placeholder="Nota opcional (ej: logo en alta resolución, referencias...)"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer w-full py-3 bg-fizzia-500/10 border border-fizzia-500/30 text-fizzia-400 font-medium rounded-xl hover:bg-fizzia-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded text-lg">cloud_upload</span>
                  Seleccionar archivos
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold px-1">Archivos del proyecto</h3>
            {files.length === 0 ? (
              <div className="text-center py-12 bg-dark-900/50 border border-dark-800 rounded-xl">
                <div className="text-3xl mb-3">📁</div>
                <p className="text-dark-400 text-sm">Los archivos del proyecto aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="group flex items-start gap-3 bg-dark-900/50 border border-dark-800 rounded-xl p-4 hover:border-dark-700 transition-all"
                  >
                    <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-fizzia-400">{getFileIcon(file)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-dark-500 text-xs">{formatDate(file.created_at)} · {getFileSize(file.file_size)}</p>
                      {file.note && <p className="text-dark-400 text-xs mt-1">{file.note}</p>}
                      <p className="text-dark-500 text-xs mt-0.5">
                        {file.uploader_id === session?.user?.id ? 'Tú' : 'Equipo Fizzia'}
                      </p>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer p-2 rounded-lg text-dark-500 hover:text-white hover:bg-dark-800 transition-all"
                    >
                      <span className="material-symbols-rounded text-lg">download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
