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

  const inputClass = "w-full px-4 py-3.5 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-fizzia-500/50 transition-all text-lg"
  const btnPrimary = "w-full cursor-pointer px-6 py-4 bg-[var(--accent)] text-white font-bold text-lg rounded-xl hover:bg-[var(--accent-lighter)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/25 hover:shadow-[var(--accent)]/25"

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col justify-center">
      <div className="mb-10 text-center" data-tour="new-project-title">
        <h1 className="text-4xl font-bold text-white mb-2">Comencemos tu proyecto</h1>
        <p className="text-dark-400 text-lg">Solo unas cuantas preguntas sencillas para entender lo que necesitas</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center mb-8">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tour="new-project-form">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">¿Este proyecto es personal o para un negocio?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { update('type', 'personal'); handleNext(); }}
              className="cursor-pointer flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dark-700 bg-dark-900/50 hover:border-fizzia-500 hover:bg-fizzia-500/10 transition-all group"
            >
              <span className="material-symbols-rounded text-5xl text-dark-400 group-hover:text-fizzia-400 transition-colors">person</span>
              <span className="text-xl font-medium text-white">Personal</span>
            </button>
            <button
              onClick={() => { update('type', 'negocio'); handleNext(); }}
              className="cursor-pointer flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dark-700 bg-dark-900/50 hover:border-fizzia-500 hover:bg-fizzia-500/10 transition-all group"
            >
              <span className="material-symbols-rounded text-5xl text-dark-400 group-hover:text-fizzia-400 transition-colors">store</span>
              <span className="text-xl font-medium text-white">Para Negocio</span>
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
              className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                formData.contactPreference === 'whatsapp' 
                  ? 'border-fizzia-500 bg-fizzia-500/10' 
                  : 'border-dark-700 bg-dark-900/50 hover:border-dark-600'
              }`}
            >
              <span className={`material-symbols-rounded text-4xl ${formData.contactPreference === 'whatsapp' ? 'text-fizzia-400' : 'text-dark-400'}`}>chat</span>
              <span className="text-lg font-medium text-white">Por WhatsApp</span>
            </button>
            <button
              onClick={() => { update('contactPreference', 'plataforma'); }}
              className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                formData.contactPreference === 'plataforma' 
                  ? 'border-fizzia-500 bg-fizzia-500/10' 
                  : 'border-dark-700 bg-dark-900/50 hover:border-dark-600'
              }`}
            >
              <span className={`material-symbols-rounded text-4xl ${formData.contactPreference === 'plataforma' ? 'text-fizzia-400' : 'text-dark-400'}`}>forum</span>
              <span className="text-lg font-medium text-white">Aquí en Fizzia</span>
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

