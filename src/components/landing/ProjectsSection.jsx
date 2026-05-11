import { useLanguage } from '../../contexts/LanguageContext'

export function ProjectsSection() {
  const { t } = useLanguage()
  const heading = t('projects.heading')

  return (
    <section id="proyectos" className="relative bg-dark-950 overflow-hidden pt-8 pb-16 md:pt-10 md:pb-20">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-fizzia-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-4xl mx-auto">
            <span className="text-fizzia-400">{heading[0]}</span> {heading[1]}
          </h2>
        </div>

        <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden border border-dark-800/60 shadow-2xl shadow-black/30 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full block"
          >
            <source src="/videos/fizzia-admin-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
