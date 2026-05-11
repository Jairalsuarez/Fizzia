import { useLanguage } from '../../contexts/LanguageContext'

export function Footer() {
  const { t } = useLanguage()

  const navItems = t('footer.navItems')
  const services = t('footer.services')

  return (
    <footer className="bg-dark-950 border-t border-dark-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fizzia-500/20 to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fizzia-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          <div>
            <a href="#inicio" className="inline-flex items-center gap-2">
              <img src="/images/Solo la figura del logo.png" alt="Fizzia" className="h-8 w-auto" onError={(e) => { e.target.style.display = 'none' }} />
              <span className="text-fizzia-500 font-black text-2xl">Fizzia</span>
            </a>
            <p className="mt-4 text-dark-300 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.navTitle')}</h3>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item}>
                  <a
                    href={({
                      'Inicio': '#inicio', 'Home': '#inicio',
                      'Servicios': '#servicios', 'Services': '#servicios',
                      'Quiénes somos': '/quienes-somos', 'About us': '/quienes-somos',
                      'Proceso': '#proceso', 'Process': '#proceso',
                      'Contacto': '#contacto', 'Contact': '#contacto',
                    })[item] || `#${item.toLowerCase()}`}
                    className="text-dark-300 hover:text-fizzia-400 text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.servicesTitle')}</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <a
                    href="#servicios"
                    className="text-dark-300 hover:text-fizzia-400 text-sm transition-colors"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.talkTitle')}</h3>
            <p className="text-dark-300 text-sm mb-4">{t('footer.talkText')}</p>
            <a
              href="mailto:fizziadev@outlook.com"
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-dark-800 border border-dark-800 text-white px-4 py-2 rounded-lg text-sm transition-colors mb-4"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {t('footer.sendEmail')}
            </a>
            <address className="not-italic text-dark-300 text-sm space-y-1">
              <p>Ecuador</p>
              <p>fizziadev@outlook.com</p>
            </address>
            <a
              href="/login"
              className="inline-flex items-center gap-2 mt-4 text-fizzia-400 hover:text-fizzia-300 text-sm font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {t('footer.adminAccess')}
            </a>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-9 pt-7 text-center">
          <p className="text-dark-400 text-sm">
            © {new Date().getFullYear()} Fizzia.dev — {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
