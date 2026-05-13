import { useLanguage } from '../../contexts/LanguageContext'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

export function SimulatorSection() {
  const { t } = useLanguage()

  return (
    <section className="relative pt-16 pb-10 md:pt-20 md:pb-12 bg-dark-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-[30%] w-[500px] h-[500px] bg-fizzia-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fizzia-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
          {t('simulator.heading')}
        </h2>
        <p className="text-dark-300 text-base md:text-lg max-w-xl mx-auto mb-8">
          {t('simulator.description')}
        </p>
        <Link
          to="/simulador"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-fizzia-500 text-white font-bold rounded-xl hover:bg-fizzia-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-fizzia-500/25 hover:shadow-fizzia-500/40 text-base md:text-lg cursor-pointer group"
        >
          <Icon name="calculate" size={22} />
          {t('simulator.cta')}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <Icon name="arrow_forward" size={18} />
          </span>
        </Link>
      </div>
    </section>
  )
}
