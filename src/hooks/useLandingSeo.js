import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import {
  DEFAULT_INTENT,
  NEUTRAL_LOCATION,
  SUPPORTED_CITIES,
  findCity,
  findIntent,
} from '../data/localSeo'

const SITE_URL = 'https://fizzia.dev'

function setMeta(selector, attr, value) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    const nameMatch = selector.match(/meta\[name="([^"]+)"\]/)
    const propertyMatch = selector.match(/meta\[property="([^"]+)"\]/)
    if (nameMatch) tag.setAttribute('name', nameMatch[1])
    if (propertyMatch) tag.setAttribute('property', propertyMatch[1])
    document.head.appendChild(tag)
  }
  tag.setAttribute(attr, value)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

function setJsonLd(id, payload) {
  let script = document.getElementById(id)
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(payload)
}

export function useLandingSeo(cityFromIp) {
  const location = useLocation()
  const { lang, t } = useLanguage()

  const seoContext = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const pathParts = location.pathname.split('/').filter(Boolean)
    const pathText = pathParts.join(' ')
    const cityFromPath = SUPPORTED_CITIES.find((item) => location.pathname.includes(item.slug))
    const cityFromQuery = findCity(params.get('ciudad'))
    const cityFromLastPathPart = findCity(pathParts.at(-1))

    const city =
      cityFromQuery ||
      cityFromLastPathPart ||
      cityFromPath ||
      cityFromIp ||
      null
    const hasLocation = !!city
    const activeLocation = city || NEUTRAL_LOCATION

    const intent =
      findIntent(params.get('servicio')) ||
      findIntent(params.get('q')) ||
      findIntent(pathText.replace(activeLocation.slug, '').replace(/-$/, '').trim()) ||
      DEFAULT_INTENT

    const intentCopy = t(`localSeo.intents.${intent.key}`)
    const canonicalPath = hasLocation ? `/${intent.slug}-${activeLocation.slug}` : '/'
    const heading = hasLocation ? `${intentCopy.label} ${t('localSeo.inCity')} ${activeLocation.name}` : intentCopy.label
    const title = `${heading} | Fizzia`
    const description = `${intentCopy.summary} ${t('localSeo.intentFooter')}`
    const keywords = [...intentCopy.keywords, activeLocation.name, activeLocation.region, 'Fizzia'].filter(Boolean).join(', ')

    return {
      city: activeLocation,
      intent,
      hasLocation,
      canonicalPath,
      canonicalUrl: `${SITE_URL}${canonicalPath}`,
      title,
      description,
      heading,
      keywords,
    }
  }, [cityFromIp, location.pathname, location.search, t])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = seoContext.title
    setMeta('meta[name="description"]', 'content', seoContext.description)
    setMeta('meta[name="keywords"]', 'content', seoContext.keywords)
    setMeta('meta[property="og:title"]', 'content', seoContext.title)
    setMeta('meta[property="og:description"]', 'content', seoContext.description)
    setMeta('meta[property="og:url"]', 'content', seoContext.canonicalUrl)
    setMeta('meta[name="twitter:title"]', 'content', seoContext.title)
    setMeta('meta[name="twitter:description"]', 'content', seoContext.description)
    setCanonical(seoContext.canonicalUrl)
    setJsonLd('landing-local-business-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Fizzia',
      url: seoContext.canonicalUrl,
      description: seoContext.description,
      areaServed: seoContext.hasLocation
        ? {
            '@type': 'City',
            name: seoContext.city.name,
            containedInPlace: {
              '@type': 'AdministrativeArea',
              name: seoContext.city.region,
            },
          }
        : {
            '@type': 'Country',
            name: 'Ecuador',
          },
      serviceType: t(`localSeo.intents.${seoContext.intent.key}.label`),
      knowsAbout: t(`localSeo.intents.${seoContext.intent.key}.keywords`),
      email: 'fizziadev@outlook.com',
      priceRange: '$$',
    })
  }, [lang, seoContext, t])

  return seoContext
}
