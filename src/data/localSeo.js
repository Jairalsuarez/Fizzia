export const SUPPORTED_CITIES = [
  {
    name: 'Guayaquil',
    slug: 'guayaquil',
    region: 'Guayas',
    accent: 'Puerto principal',
    description: 'software para ventas, inventario y atencion al cliente en negocios de Guayaquil',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vista%20del%20Malec%C3%B3n%202000.jpg?width=1600',
    imageAlt: 'Vista del Malecon 2000 en Guayaquil',
  },
  {
    name: 'Quito',
    slug: 'quito',
    region: 'Pichincha',
    accent: 'Capital comercial',
    description: 'aplicaciones web y moviles para empresas, consultorios y servicios en Quito',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/El%20Panecillo%2C%20Quito%20Historic%20Center%2C%20UNESCO%20World%20Heritage%20Sites%2C%20Quito%20Colonial%20Center%2C.jpg?width=1600',
    imageAlt: 'Vista del centro historico de Quito desde El Panecillo',
  },
  {
    name: 'Quevedo',
    slug: 'quevedo',
    region: 'Los Rios',
    accent: 'Centro agricola y comercial',
    description: 'sistemas de ventas, pedidos e inventario para negocios de Quevedo',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Foto%20panor%C3%A1mica%20drone%20vista%20puente%20y%20malec%C3%B3n%20de%20Quevedo.jpg?width=1600',
    imageAlt: 'Vista panoramica del puente y malecon de Quevedo',
  },
  {
    name: 'Buena Fe',
    slug: 'buena-fe',
    region: 'Los Rios',
    accent: 'Negocios locales en crecimiento',
    description: 'aplicaciones a medida para comercios y emprendimientos de Buena Fe',
    image: '/images/buenafe.png',
    imageAlt: 'Letras turisticas de Buena Fe iluminadas de noche',
  },
]

export const SEO_INTENTS = [
  {
    key: 'desarrollo',
    slug: 'desarrollo-software',
    aliases: ['desarrollo', 'desarrollo web', 'programas', 'programacion', 'software'],
    label: 'Desarrollo de software',
    title: 'Desarrollo de software en {city}',
    heading: 'Desarrollo de software en {city}',
    summary: 'Creamos sistemas web, aplicaciones moviles y plataformas a medida para negocios que necesitan vender, organizarse y crecer con tecnologia clara.',
    keywords: ['desarrollo de software', 'desarrollo web', 'programas para negocios', 'programacion a medida'],
  },
  {
    key: 'aplicaciones-personalizadas',
    slug: 'aplicaciones-personalizadas',
    aliases: ['aplicacion personalizada', 'aplicaciones personalizadas', 'apps personalizadas', 'aplicaciones a medida'],
    label: 'Aplicaciones personalizadas',
    title: 'Aplicaciones personalizadas en {city}',
    heading: 'Aplicaciones personalizadas en {city}',
    summary: 'Disenamos aplicaciones web y moviles adaptadas a la forma real en la que trabaja tu negocio, sin plantillas rigidas ni funciones innecesarias.',
    keywords: ['aplicaciones personalizadas', 'aplicaciones a medida', 'apps para empresas', 'software personalizado'],
  },
  {
    key: 'ventas',
    slug: 'aplicacion-ventas',
    aliases: ['aplicacion de ventas', 'aplicaciones de ventas', 'sistema de ventas', 'programa de ventas'],
    label: 'Aplicaciones de ventas',
    title: 'Aplicacion de ventas en {city}',
    heading: 'Aplicacion de ventas en {city}',
    summary: 'Construimos sistemas para controlar ventas, clientes, pedidos, facturas e inventario desde un solo lugar, pensado para equipos que necesitan orden diario.',
    keywords: ['aplicacion de ventas', 'sistema de ventas', 'programa de ventas', 'control de ventas'],
  },
  {
    key: 'inventario',
    slug: 'sistema-inventario',
    aliases: ['inventario', 'sistema de inventario', 'programa de inventario', 'control de inventario'],
    label: 'Sistemas de inventario',
    title: 'Sistema de inventario en {city}',
    heading: 'Sistema de inventario en {city}',
    summary: 'Digitalizamos entradas, salidas, stock minimo y reportes para que sepas que tienes, que falta y que productos mueven tu negocio.',
    keywords: ['sistema de inventario', 'programa de inventario', 'control de inventario', 'inventario digital'],
  },
]

export const DEFAULT_CITY = SUPPORTED_CITIES[0]
export const NEUTRAL_LOCATION = {
  name: '',
  slug: '',
  region: 'Ecuador',
  accent: 'Soluciones digitales',
  description: 'software a medida para negocios',
  image: '/images/robot-laptop-transparent.png',
  imageAlt: 'Robot de Fizzia usando una laptop',
  isNeutral: true,
}
export const DEFAULT_INTENT = SEO_INTENTS[0]

export function normalizeText(value) {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function findCity(value) {
  const normalized = normalizeText(value)
  if (!normalized) return null
  return SUPPORTED_CITIES.find((city) => normalizeText(city.name) === normalized || city.slug === normalized) || null
}

export function findIntent(value) {
  const normalized = normalizeText(value).replace(/-/g, ' ').trim()
  if (!normalized) return null
  return SEO_INTENTS.find((intent) => {
    if (intent.slug.replace(/-/g, ' ') === normalized || intent.key.replace(/-/g, ' ') === normalized) return true
    return intent.aliases.some((alias) => normalizeText(alias) === normalized)
  }) || null
}

export function formatTemplate(template, city) {
  return template.replace('{city}', city.name)
}
