export const DEMO_URL = 'https://demostracion-alpha.vercel.app/'

export const servicePages = [
  {
    slug: 'sistemas-web',
    name: 'Sistemas Web',
    text: 'Paneles, clientes, archivos, estados y reportes en un solo lugar.',
    time: '4 a 8 semanas',
    price: 'desde $600',
    canTry: true,
  },
  {
    slug: 'aplicaciones-moviles',
    name: 'Aplicaciones Moviles',
    text: 'Una app clara para usuarios, reservas, pedidos o seguimiento.',
    time: '6 a 10 semanas',
    price: 'desde $900',
    canTry: false,
  },
  {
    slug: 'tiendas-online',
    name: 'Tiendas Online',
    text: 'Catalogo, carrito, pedidos y pagos listos para vender.',
    time: '4 a 7 semanas',
    price: 'desde $700',
    canTry: false,
  },
  {
    slug: 'gestion-inventarios',
    name: 'Sistema de Inventarios',
    text: 'Stock, entradas, salidas, alertas y movimientos sin desorden.',
    time: '4 a 6 semanas',
    price: 'desde $550',
    canTry: true,
  },
  {
    slug: 'sistemas-ventas',
    name: 'Sistema de Ventas',
    text: 'Ventas, clientes, caja, productos y reportes diarios.',
    time: '4 a 7 semanas',
    price: 'desde $600',
    canTry: true,
  },
]

export const getServiceSlugByName = (name = '') => {
  const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const aliases = {
    'gestion de inventarios': 'gestion-inventarios',
    'sistemas de ventas': 'sistemas-ventas',
    'aplicaciones moviles': 'aplicaciones-moviles',
  }
  return aliases[normalizedName] || servicePages.find((service) => (
    service.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedName
  ))?.slug
}
