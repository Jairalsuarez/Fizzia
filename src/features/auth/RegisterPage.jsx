import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, checkEmailExists } from '../../api/authApi'
import { supabase } from '../../services/supabase'
import { useAuth } from './authContext'
import { useCountry } from '../../contexts/CountryContext'

const phrases = [
  'Tu próximo proyecto empieza aquí',
  'Crea, gestiona y crece con Fizzia',
  'El futuro digital de tu negocio',
  'Ideas que se convierten en realidad',
]

export function RegisterPage() {
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { session, loading } = useAuth()
  const { countryCode } = useCountry()
  const navigate = useNavigate()
  const [phraseIndex, setPhraseIndex] = useState(0)
  const debounceRef = useRef(null)
  const justRegisteredRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (session && !loading && !justRegisteredRef.current) navigate('/cliente', { replace: true })
  }, [session, loading, navigate, justRegisteredRef])

  useEffect(() => {
    if (!email || step !== 2) return
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailStatus('idle')
      return
    }
    clearTimeout(debounceRef.current)
    setEmailStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(trimmed)
        setEmailStatus(exists ? 'taken' : 'available')
      } catch {
        setEmailStatus('idle')
      }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [email, step])

  const handleStep1 = (e) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Ingresa tu nombre'); return }
    if (!lastName.trim()) { setError('Ingresa tu apellido'); return }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) { setError('Ingresa tu correo electrónico'); return }
    if (emailStatus === 'taken') { setError('Este email ya está registrado'); return }
    if (emailStatus === 'checking') { setError('Espera a que verifiquemos el email'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSubmitting(true)
    const fullName = `${firstName} ${lastName}`.trim()
    const metadata = {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role: 'client',
      age: age ? Number(age) : undefined,
      phone: phone || undefined,
    }
    justRegisteredRef.current = true
    const { error } = await signUp(trimmedEmail, password, fullName, metadata)
    if (!error) await supabase.auth.signOut()
    setSubmitting(false)
    if (error) {
      justRegisteredRef.current = false
      setError(error.message)
    } else {
      window.location.href = '/login'
    }
  }

  const back = () => {
    setError('')
    setStep(1)
  }

  const inputClass = "w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-fizzia-500 focus:ring-1 focus:ring-fizzia-500 transition-all"
  const btnClass = "cursor-pointer w-full py-3 bg-fizzia-500 text-white font-semibold rounded-xl hover:bg-fizzia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40"
  const inputAttrs = { autoComplete: 'off', spellCheck: 'false' }

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-dark-950 p-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fizzia-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fizzia-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fizzia-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex bg-dark-900/50 border border-dark-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Left panel - decorative */}
          <div className="auth-accent-panel hidden md:flex md:w-2/5 bg-gradient-to-b from-fizzia-500 to-fizzia-700 flex-col justify-between p-8 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-12 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-16 left-8 w-10 h-10 border-2 border-white/20 rounded-lg rotate-12 animate-float-slow" />
              <div className="absolute top-32 right-6 w-6 h-6 border-2 border-white/30 rounded-full animate-float-fast" />
              <div className="absolute bottom-28 right-4 w-8 h-8 border border-white/15 rounded rotate-45 animate-float-slow" />
              <div className="absolute top-48 right-16 w-2 h-2 bg-white/30 rounded-full animate-bounce" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6 animate-pulse">
                <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-8 w-auto" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">Tu próximo proyecto empieza aquí</h2>
            </div>

            <div className="relative z-10 min-h-[60px]">
              <p key={phraseIndex} className="text-white text-sm font-medium animate-fade-in-up leading-relaxed">
                {phrases[phraseIndex]}
              </p>
            </div>

            <div className="relative z-10">
              <p className="text-white/50 text-xs">© {new Date().getFullYear()} Fizzia.dev</p>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="flex-1 p-8 md:p-10">
            <div className="lg:hidden text-center mb-6">
              <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-12 w-auto mx-auto" onError={(e) => { e.target.style.display = 'none' }} />
            </div>

            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-fizzia-500' : 'bg-dark-700'}`} />
              ))}
            </div>

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-1">Cuéntanos sobre ti</h3>
                <p className="text-dark-400 text-sm mb-6">Queremos conocerte un poco</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-dark-300 mb-1.5">Nombre</label>
                    <input type="text" {...inputAttrs} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Juan" required />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1.5">Apellido</label>
                    <input type="text" {...inputAttrs} value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Pérez" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Edad</label>
                  <input type="number" {...inputAttrs} value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="25" min="14" max="120" />
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
                )}
                <button type="submit" className={btnClass}>Continuar</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-1">Tu acceso a Fizzia</h3>
                <p className="text-dark-400 text-sm mb-6">Crea tu cuenta para empezar</p>

                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <input
                      type="email"
                      {...inputAttrs}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} pr-10 ${emailStatus === 'available' ? 'border-green-500/60 focus:border-green-500' : ''} ${emailStatus === 'taken' ? 'border-red-500/60 focus:border-red-500' : ''}`}
                      placeholder="tu@email.com"
                      required
                    />
                    {emailStatus === 'checking' && (
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-dark-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {emailStatus === 'available' && (
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {emailStatus === 'taken' && (
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>
                  {emailStatus === 'available' && (
                    <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="20 6 9 17 4 12" /></svg>
                      Correo disponible
                    </p>
                  )}
                  {emailStatus === 'taken' && (
                    <p className="text-red-400 text-xs mt-1.5">Este correo ya está registrado</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} {...inputAttrs} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} placeholder="Mínimo 6 caracteres" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors" tabIndex={-1}>
                      <span className="material-symbols-rounded text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">
                    Teléfono <span className="text-dark-500 font-normal">(opcional)</span>
                  </label>
                  <input type="tel" {...inputAttrs} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder={countryCode === 'EC' ? '+593 99 999 9999' : '+52 55 1234 5678'} />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={back} className="py-3 px-6 bg-dark-800 text-white font-medium rounded-xl hover:bg-dark-700 transition-all cursor-pointer">Atrás</button>
                  <button type="submit" disabled={submitting} className={btnClass}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creando cuenta...
                      </span>
                    ) : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-dark-400 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-fizzia-400 hover:text-fizzia-300 font-semibold transition-colors">Inicia sesión</Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="inline-flex items-center gap-1 text-dark-500 hover:text-dark-300 text-sm transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
