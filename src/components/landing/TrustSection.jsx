import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export function TrustSection() {
  const { t } = useLanguage()
  const test = t('trust.testimonials')[0]
  const copy = t('trust.showcase')
  const stack = [
    {
      name: 'React',
      value: 'SPA',
      label: copy.stack.react,
      trend: true,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    },
    {
      name: 'Supabase',
      value: 'DB',
      label: copy.stack.supabase,
      trend: true,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg',
    },
    {
      name: 'Vercel',
      value: 'Edge',
      label: copy.stack.vercel,
      trend: true,
      logo: 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
    },
    {
      name: 'Tailwind',
      value: 'UI',
      label: copy.stack.tailwind,
      trend: false,
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
    },
  ]

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

          <div className="mx-auto mt-10 grid w-full grid-cols-2 gap-4 rounded-lg border border-dark-800 bg-dark-900 px-4 py-6 sm:flex sm:px-8">
            {stack.map((stat, index) => (
              <div key={stat.name} className="relative flex flex-1 gap-4 sm:pl-8">
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
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </section>
  )
}
