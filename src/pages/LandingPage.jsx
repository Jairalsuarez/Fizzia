import { LanguageProvider } from '../contexts/LanguageContext'
import { CountryProvider } from '../contexts/CountryContext'
import { Header } from '../components/landing/Header'
import { Footer } from '../components/landing/Footer'
import { HeroSection } from '../components/landing/HeroSection'
import { ServicesSection } from '../components/landing/ServicesSection'
import { ProjectsSection } from '../components/landing/ProjectsSection'
import { TrustSection } from '../components/landing/TrustSection'

import { ProcessSection } from '../components/landing/ProcessSection'
import { SimulatorSection } from '../components/landing/SimulatorSection'
import { ContactSection } from '../components/landing/ContactSection'

export function LandingPage() {
  return (
    <LanguageProvider>
    <CountryProvider>
    <div className="landing-page bg-dark-950 overflow-x-hidden w-full max-w-full">
      <Header />
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <TrustSection />

      <ProcessSection />
      <SimulatorSection />
      <ContactSection />
      <Footer />
    </div>
    </CountryProvider>
    </LanguageProvider>
  )
}
