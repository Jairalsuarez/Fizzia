import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { createProjectRequest } from '../../api/projectsApi'

export function NewProjectPage() {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    budget: '',
    deadline: '',
    contactPreference: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleNext = () => {
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    setSubmitting(true)

    const fullDesc = `Tipo de proyecto: ${formData.type === 'personal' ? 'Personal' : 'Para Negocio'}

Descripción de la idea o problema:
${formData.description}

Presupuesto estimado: ${formData.budget}

Preferencia de contacto: ${formData.contactPreference === 'whatsapp' ? 'WhatsApp' : 'Plataforma Fizzia'}`

    try {
      const budgetValue = parseFloat(formData.budget.replace(/[^0-9.]/g, '')) || 0
      
      const result = await createProjectRequest(
        'Nuevo Proyecto', 
        fullDesc, 
        budgetValue, 
        '',
        formData.deadline || null
      )

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else if (result.project) {
        toast.success('¡Tu proyecto se ha enviado exitosamente!')
        navigate('/cliente/proyecto-creado', { state: { project: result.project } })
      }
    } catch (err) {
      setError(err.message || 'Error desconocido')
      toast.error('Error al crear el proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-4 bg-dark-900/50 border-2 border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-[var(--accent)] focus:bg-dark-900 focus:shadow-[0_0_15px_var(--accent-bg)] transition-all duration-300 text-lg hover:border-dark-600"
  const btnPrimary = "w-full cursor-pointer px-6 py-4 bg-[var(--accent)] text-white font-bold text-lg rounded-xl hover:bg-[var(--accent-lighter)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent-bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100 transition-all duration-300 shadow-lg shadow-[var(--accent)]/20"

  if (step === 6) {
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 fade-in">
        <div className="w-24 h-24 bg-[var(--accent-bg)] rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_var(--accent-bg)] animate-bounce">
          <span className="material-symbols-rounded text-6xl text-[var(--accent)]">check_circle</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">¡Solicitud Enviada!</h2>
        <p className="text-dark-300 text-lg mb-8 max-w-md mx-auto">
          Hemos recibido tu solicitud de proyecto. Nos pondremos en contacto contigo lo antes posible para darte una cotización.
        </p>
        <button
          onClick={() => navigate('/cliente/proyectos')}
          className="cursor-pointer px-8 py-4 bg-dark-800 hover:bg-dark-700 hover:shadow-lg hover:shadow-black/50 text-white font-medium rounded-xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
        >
          Ir a mis proyectos
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col justify-center">
      <div className="mb-10 text-center" data-tour="new-project-title">
        <h1 className="text-4xl font-bold text-white mb-2">Comencemos tu proyecto</h1>
        <p className="text-dark-400 text-lg">Solo unas cuantas preguntas sencillas para entender lo que necesitas</p>
      </div>

      {error && (
        <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-4 text-[var(--error-text)] text-center mb-8">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tour="new-project-form">
          <h2 className="text-2xl font-semibold text-center text-[var(--text-main)] mb-8">¿Este proyecto es personal o para un negocio?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { update('type', 'personal'); handleNext(); }}
              className="cursor-pointer flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-[var(--accent-bg)] group"
            >
              <span className="material-symbols-rounded text-5xl text-dark-400 group-hover:text-[var(--accent-lighter)] group-hover:scale-110 transition-all duration-300">person</span>
              <span className="text-xl font-medium text-white group-hover:text-[var(--accent-lighter)] transition-colors duration-300">Personal</span>
            </button>
            <button
              onClick={() => { update('type', 'negocio'); handleNext(); }}
              className="cursor-pointer flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-[var(--accent-bg)] group"
            >
              <span className="material-symbols-rounded text-5xl text-dark-400 group-hover:text-[var(--accent-lighter)] group-hover:scale-110 transition-all duration-300">store</span>
              <span className="text-xl font-medium text-white group-hover:text-[var(--accent-lighter)] transition-colors duration-300">Para Negocio</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">
            {formData.type === 'personal' 
              ? 'Cuéntanos un poco sobre tu idea o el problema que quieres resolver' 
              : 'Describe la idea de tu negocio o la necesidad que tienen'}
          </h2>
          <div>
            <textarea
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
              className={`${inputClass} resize-none h-40`}
              placeholder="Escribe aquí con tus propias palabras... (mínimo 10 letras)"
              autoFocus
            />
          </div>
          <button 
            onClick={handleNext} 
            disabled={formData.description.trim().length < 10} 
            className={btnPrimary}
          >
            Siguiente pregunta
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">¿Cuánto es el presupuesto que tienes pensado invertir?</h2>
          <div>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => update('budget', e.target.value)}
              className={inputClass}
              placeholder="Ejemplo: $100 - $1500"
              autoFocus
            />
          </div>
          <button 
            onClick={handleNext} 
            disabled={!formData.budget.trim()} 
            className={btnPrimary}
          >
            Siguiente pregunta
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">¿Para cuándo te gustaría tener listo este proyecto?</h2>
          <div>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => update('deadline', e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
              autoFocus
            />
          </div>
          <button 
            onClick={handleNext} 
            disabled={!formData.deadline.trim()} 
            className={btnPrimary}
          >
            Siguiente pregunta
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">¿Cómo prefieres que nos comuniquemos contigo?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => { update('contactPreference', 'whatsapp'); }}
              className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent-bg)] group ${
                formData.contactPreference === 'whatsapp' 
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] shadow-[var(--accent-bg)]' 
                  : 'border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]/50'
              }`}
            >
              <span className={`material-symbols-rounded text-4xl group-hover:scale-110 transition-all duration-300 ${formData.contactPreference === 'whatsapp' ? 'text-[var(--accent-lighter)]' : 'text-dark-400 group-hover:text-[var(--accent-lighter)]'}`}>chat</span>
              <span className={`text-lg font-medium transition-colors duration-300 ${formData.contactPreference === 'whatsapp' ? 'text-[var(--accent-lighter)]' : 'text-white group-hover:text-[var(--accent-lighter)]'}`}>Por WhatsApp</span>
            </button>
            <button
              onClick={() => { update('contactPreference', 'plataforma'); }}
              className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent-bg)] group ${
                formData.contactPreference === 'plataforma' 
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] shadow-[var(--accent-bg)]' 
                  : 'border-dark-700 bg-dark-900/50 hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]/50'
              }`}
            >
              <span className={`material-symbols-rounded text-4xl group-hover:scale-110 transition-all duration-300 ${formData.contactPreference === 'plataforma' ? 'text-[var(--accent-lighter)]' : 'text-dark-400 group-hover:text-[var(--accent-lighter)]'}`}>forum</span>
              <span className={`text-lg font-medium transition-colors duration-300 ${formData.contactPreference === 'plataforma' ? 'text-[var(--accent-lighter)]' : 'text-white group-hover:text-[var(--accent-lighter)]'}`}>Aquí en Fizzia</span>
            </button>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={!formData.contactPreference || submitting} 
            className={btnPrimary}
          >
            {submitting ? 'Enviando tu solicitud...' : 'Finalizar y Enviar'}
          </button>
        </div>
      )}
      
      {step > 1 && !submitting && (
        <button 
          onClick={() => setStep(s => s - 1)}
          className="mt-8 text-dark-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer w-fit mx-auto"
        >
          <span className="material-symbols-rounded text-sm">arrow_back</span>
          Volver a la pregunta anterior
        </button>
      )}
      
      {step === 1 && (
        <button 
          onClick={() => navigate('/cliente')}
          className="mt-8 text-dark-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer w-fit mx-auto"
        >
          <span className="material-symbols-rounded text-sm">arrow_back</span>
          Cancelar y volver al inicio
        </button>
      )}
    </div>
  )
}

