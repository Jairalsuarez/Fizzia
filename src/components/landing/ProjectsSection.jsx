import { useState } from 'react'
import { Icon } from '../ui/Icon'

const DEMO_URL = 'https://demostracion-alpha.vercel.app/'

const previewRows = [
  { item: 'Café americano', stock: '34', sales: '$128' },
  { item: 'Combo desayuno', stock: '12', sales: '$246' },
  { item: 'Pan artesanal', stock: '8', sales: '$96' },
]

export function ProjectsSection() {
  const [showRedirectMessage, setShowRedirectMessage] = useState(false)

  const handleDemoClick = () => {
    setShowRedirectMessage(true)
    window.open(DEMO_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="proyectos" className="relative overflow-hidden bg-dark-950 py-16 md:py-20">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <h2 className="max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
              Prueba nuestra demostracion
            </h2>
            <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-dark-300">
              Explora una demo funcional del tipo de sistema que podemos construir para tu negocio.
            </p>
            <button
              type="button"
              onClick={handleDemoClick}
              className="mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-fizzia-500/30 bg-fizzia-500 px-8 py-5 text-lg font-black text-white shadow-lg shadow-fizzia-500/25 transition-all duration-200 hover:bg-fizzia-400 hover:shadow-fizzia-500/40 active:scale-[0.98] sm:w-fit"
            >
              Ver demostracion
              <Icon name="arrow_forward" size={22} />
            </button>
          </div>

          <div className="overflow-hidden rounded-[1.35rem] border border-dark-800 bg-dark-900 shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between border-b border-dark-800 bg-dark-950/70 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-fizzia-400" />
              </div>
              <span className="text-xs font-bold text-dark-500">ventas.fizzia</span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-[0.62fr_1.38fr] md:p-5">
              <aside className="rounded-2xl border border-dark-800 bg-dark-950 p-4">
                <div className="flex items-center gap-2 text-fizzia-300">
                  <Icon name="storefront" size={20} />
                  <span className="text-sm font-black">Tienda Centro</span>
                </div>
                <div className="mt-6 space-y-2 text-sm text-dark-300">
                  {['Panel', 'Productos', 'Vender', 'Métricas'].map((item, index) => (
                    <div key={item} className={`rounded-lg px-3 py-2 ${index === 0 ? 'bg-fizzia-500 text-white' : 'bg-dark-900'}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
              <div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Ventas', '$470'],
                    ['Utilidad', '$185'],
                    ['Stock bajo', '3'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-dark-800 bg-dark-950 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-dark-500">{label}</p>
                      <p className="mt-1 text-2xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-dark-800">
                  {previewRows.map((row) => (
                    <div key={row.item} className="grid grid-cols-[1fr_64px_72px] border-b border-dark-800 px-3 py-3 text-sm last:border-b-0">
                      <span className="font-semibold text-dark-100">{row.item}</span>
                      <span className="text-dark-400">{row.stock}</span>
                      <span className="font-bold text-fizzia-300">{row.sales}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRedirectMessage && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-fizzia-500/30 bg-dark-900 px-5 py-4 text-sm text-dark-100 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fizzia-500/15 text-fizzia-300">
              <Icon name="arrow_forward" size={16} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-white">Redireccionando a la pagina en otra pestana.</p>
              <p className="mt-1 text-dark-300">
                Si no la ves,{' '}
                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-fizzia-300 underline decoration-fizzia-300/40 underline-offset-4 hover:text-fizzia-200"
                >
                  presiona aqui
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRedirectMessage(false)}
              className="ml-auto cursor-pointer rounded-full p-1 text-dark-500 transition-colors hover:bg-dark-800 hover:text-white"
              aria-label="Cerrar mensaje"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
