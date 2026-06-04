import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

export function TrustSection() {
  const { t } = useLanguage()
  const [selectedTech, setSelectedTech] = useState(null)
  const test = t('trust.testimonials')[0]
  const copy = t('trust.showcase')
  const stack = [
    {
      name: 'React',
      value: 'SPA',
      label: copy.stack.react,
      concept: 'React es la tecnologia con la que construimos la interfaz que ve y toca el usuario.',
      usage: 'La usamos para que cada pantalla se sienta rapida, ordenada y facil de actualizar sin recargar toda la pagina.',
      trend: true,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    },
    {
      name: 'Supabase',
      value: 'DB',
      label: copy.stack.supabase,
      concept: 'Supabase es la base de datos y el sistema que guarda usuarios, ventas, proyectos y archivos.',
      usage: 'La usamos para que la informacion del negocio quede segura, sincronizada y disponible cuando el cliente entra al sistema.',
      trend: true,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg',
    },
    {
      name: 'Vercel',
      value: 'Edge',
      label: copy.stack.vercel,
      concept: 'Vercel es la plataforma donde publicamos la aplicacion para que pueda abrirse desde internet.',
      usage: 'La usamos para entregar sitios rapidos, con despliegues simples y enlaces listos para compartir con clientes o equipos.',
      trend: true,
      logo: 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
    },
    {
      name: 'Tailwind',
      value: 'UI',
      label: copy.stack.tailwind,
      concept: 'Tailwind es la herramienta que nos ayuda a construir el diseno visual con reglas consistentes.',
      usage: 'La usamos para mantener botones, tarjetas, espacios, colores y versiones moviles con el mismo estilo en todo el proyecto.',
      trend: false,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
    },
  ]
  const activeTech = selectedTech || stack[0]

  const toggleTech = (stat) => {
    setSelectedTech((current) => current?.name === stat.name ? null : stat)
  }

  return (
    <section className="relative overflow-hidden bg-dark-950 px-4 py-16 md:px-8 md:py-24 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-fizzia-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-dark-900 px-4 py-1 text-xs font-bold uppercase tracking-wider text-dark-300">
            {copy.badge}
          </div>
        </div>

        <TooltipProvider delayDuration={120}>
          <div className="mx-auto max-w-screen-xl text-center text-dark-50">
            <div className="mb-6 flex items-center justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block align-middle">
                    <span className="relative block h-12 w-14 origin-center overflow-hidden rounded-full border-2 border-dark-950 transition-all duration-300 hover:w-36 sm:h-16 sm:w-16">
                      <img
                        src="/images/maria-moreira.png"
                        alt={test.name}
                        className="h-full w-full object-cover object-[50%_28%] transition-transform duration-300 hover:scale-105"
                      />
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs rounded-lg border border-dark-800 bg-dark-950 p-4 text-dark-50 shadow-lg">
                  <p className="mb-2 text-sm leading-relaxed">
                    &ldquo;{copy.mariaTooltip}&rdquo;
                  </p>
                  <p className="text-sm font-bold">{test.name}</p>
                  <p className="text-xs text-fizzia-500">{test.location}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block align-middle">
                    <span className="relative block h-14 w-14 origin-center overflow-hidden rounded-full border-2 border-dark-950 transition-all duration-300 hover:w-36 sm:h-16 sm:w-16">
                      <img
                        src="/images/maria-moreira-work.png"
                        alt={copy.teamAlt}
                        className="h-full w-full object-cover object-[50%_4%] transition-transform duration-300 hover:scale-105"
                      />
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs rounded-lg border border-dark-800 bg-dark-950 p-4 text-dark-50 shadow-lg">
                  <p className="mb-2 text-sm leading-relaxed">{copy.teamTooltip}</p>
                  <p className="text-sm font-bold">Fizzia</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <blockquote className="mx-auto max-w-5xl text-2xl font-semibold leading-tight text-dark-50 md:text-4xl lg:text-5xl">
              &ldquo;{test.quote}
              {test.hasFizzia && <span className="font-black text-fizzia-500">Fizzia</span>}
              {test.quote2}&rdquo;
              <footer className="mt-6 flex items-center justify-center gap-2 text-sm font-medium">
                <span className="font-bold uppercase tracking-wider text-dark-300">{test.name}</span>
                <span className="text-dark-600">|</span>
                <span className="text-fizzia-500/80">{test.location}</span>
              </footer>
            </blockquote>
          </div>

          <motion.div
            className="hide-scrollbar -mx-4 mt-9 flex gap-3 overflow-x-auto px-4 pb-1 md:hidden"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {stack.map((stat, index) => (
              <motion.button
                key={stat.name}
                type="button"
                onClick={() => toggleTech(stat)}
                className={`group flex min-w-[9.5rem] snap-start items-center gap-3 rounded-2xl border bg-dark-900 px-3.5 py-3 text-left shadow-[0_18px_42px_-34px_rgba(0,0,0,0.85)] transition-colors active:border-fizzia-500/45 ${
                  selectedTech?.name === stat.name ? 'border-fizzia-500/50' : 'border-dark-800'
                }`}
                aria-expanded={selectedTech?.name === stat.name}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.96 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.38, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileTap={{ scale: 0.96, y: 1 }}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-dark-950 ring-1 ring-dark-800">
                  <img src={stat.logo} alt="" className="h-6 w-6 object-contain grayscale transition duration-200 group-active:grayscale-0" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-dark-50">{stat.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-dark-400 group-active:text-fizzia-300">
                    {stat.trend ? <ArrowUp className="size-3.5 text-fizzia-500" /> : <ArrowDown className="size-3.5 text-dark-500" />}
                    {stat.value}
                  </span>
                </span>
              </motion.button>
            ))}
          </motion.div>

          <div className="mx-auto mt-10 hidden w-full gap-4 rounded-lg border border-dark-800 bg-dark-900 px-4 py-6 md:flex md:px-8">
            {stack.map((stat, index) => (
              <button
                key={stat.name}
                type="button"
                onClick={() => toggleTech(stat)}
                className={`relative flex flex-1 cursor-pointer gap-4 rounded-xl text-left transition-colors sm:pl-8 ${
                  selectedTech?.name === stat.name ? 'bg-dark-950/70 ring-1 ring-fizzia-500/35' : 'hover:bg-dark-950/40'
                }`}
                aria-expanded={selectedTech?.name === stat.name}
              >
                {index !== 0 && (
                  <div className="absolute left-0 hidden h-10 border-l border-dashed border-dark-700 sm:block" />
                )}
                <div className="group relative h-16 w-full overflow-hidden">
                  <div className="flex h-full flex-col items-center justify-center gap-1 transition-all duration-300 ease-out group-hover:-translate-y-16 group-hover:opacity-0">
                    <img
                      src={stat.logo}
                      alt={stat.name}
                      className="h-8 w-[85%] object-contain grayscale transition duration-300 group-hover:grayscale-0"
                    />
                    <span className="text-xs font-semibold text-dark-300">{stat.name}</span>
                  </div>
                  <div className="absolute inset-x-0 top-16 flex flex-col items-center justify-center opacity-0 transition-all duration-300 ease-out group-hover:top-0 group-hover:opacity-100">
                    <div className="flex items-center justify-center gap-2">
                      {stat.trend ? (
                        <ArrowUp className="h-4 w-4 text-fizzia-500 md:h-6 md:w-6" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-dark-500 md:h-6 md:w-6" />
                      )}
                      <span className="text-2xl font-black text-dark-50 md:text-4xl">{stat.value}</span>
                    </div>
                    <p className="text-center text-xs text-dark-300 md:text-sm">{stat.label}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedTech && (
            <motion.div
              className="mx-auto mt-4 max-w-3xl rounded-2xl border border-fizzia-500/25 bg-dark-900 px-5 py-4 text-left shadow-2xl shadow-black/20"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              role="status"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-dark-950 ring-1 ring-dark-800">
                  <img src={activeTech.logo} alt="" className="h-6 w-6 object-contain" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-dark-50">{activeTech.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-dark-300">
                    {activeTech.concept}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-dark-300">
                    {activeTech.usage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </TooltipProvider>
      </div>
    </section>
  )
}
