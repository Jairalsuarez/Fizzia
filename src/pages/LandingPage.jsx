import { LanguageProvider } from '../contexts/LanguageContext'
import { CountryProvider } from '../contexts/CountryContext'
import { Header } from '../components/landing/Header'
import { Footer } from '../components/landing/Footer'
import { HeroSection } from '../components/landing/HeroSection'
import { BusinessCarousel } from '../components/landing/BusinessCarousel'
import { ServicesSection } from '../components/landing/ServicesSection'
import { ProjectsSection } from '../components/landing/ProjectsSection'
import { TrustSection } from '../components/landing/TrustSection'
import { FAQSection } from '../components/landing/FAQSection'
import { useCountry } from '../contexts/CountryContext'
import { useLandingSeo } from '../hooks/useLandingSeo'

function LandingContent() {
  const { city } = useCountry()
  const seoContext = useLandingSeo(city)

  return (
    <div className="landing-page bg-dark-950 text-dark-50 overflow-x-hidden w-full max-w-full">
      <Header />
      <HeroSection seoContext={seoContext} />
      <BusinessCarousel />
      <ServicesSection />
      <ProjectsSection />
      <TrustSection />
      <FAQSection />
      <Footer />
    </div>
  )
}

export function LandingPage() {
  return (
    <LanguageProvider>
      <CountryProvider>
        <LandingContent />
      </CountryProvider>
    </LanguageProvider>
  )
}
