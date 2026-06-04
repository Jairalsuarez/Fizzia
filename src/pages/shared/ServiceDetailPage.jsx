import { useEffect } from 'react'
import { ArrowRight, Boxes, Clock, DollarSign, LayoutDashboard, Play, ReceiptText, ShoppingCart, Smartphone } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { CountryProvider } from '../../contexts/CountryContext'
import { Header } from '../../components/landing/Header'
import { Footer } from '../../components/landing/Footer'
import { DEMO_URL, servicePages } from '../../data/servicePages'

const serviceLooks = {
  'sistemas-web': {
    Icon: LayoutDashboard,
    label: 'Paneles y operaciones',
  },
  'aplicaciones-moviles': {
    Icon: Smartphone,
    label: 'Experiencia movil',
  },
  'tiendas-online': {
    Icon: ShoppingCart,
    label: 'Catalogo y carrito',
  },
  'gestion-inventarios': {
    Icon: Boxes,
    label: 'Productos y costos',
  },
  'sistemas-ventas': {
    Icon: ReceiptText,
    label: 'Caja y movimientos',
  },
}

function ServiceVisual({ service }) {
  const isMobile = service.slug === 'aplicaciones-moviles'
  const isStore = service.slug === 'tiendas-online'
  const isInventory = service.slug === 'gestion-inventarios'
  const isSales = service.slug === 'sistemas-ventas'
  const rows = {
    'sistemas-web': ['Clientes activos', 'Solicitudes', 'Archivos', 'Reportes'],
    'aplicaciones-moviles': ['Reservar', 'Pedidos', 'Perfil', 'Avisos'],
    'tiendas-online': ['Cafe premium', 'Pan artesanal', 'Combo desayuno', 'Gift card'],
    'gestion-inventarios': ['Arroz 25kg', 'Cafe molido', 'Cajas kraft', 'Botellas'],
    'sistemas-ventas': ['Venta #1042', 'Cliente frecuente', 'Caja diaria', 'Factura'],
  }[service.slug] || ['Dashboard', 'Clientes', 'Reportes', 'Ajustes']

  if (isMobile) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dark-800 bg-dark-900 p-6">
        <div className="relative h-full max-h-80 w-40 rounded-[2rem] border border-dark-700 bg-dark-950 p-3 shadow-2xl shadow-black/20">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-dark-700" />
          <div className="rounded-2xl bg-fizzia-500 p-4 text-white">
            <p className="text-xs font-bold opacity-80">Fizzia App</p>
            <p className="mt-3 text-2xl font-black">Hoy</p>
          </div>
          <div className="mt-4 space-y-2">
            {rows.map((row, itemIndex) => (
              <div key={row} className="flex items-center gap-2 rounded-xl border border-dark-800 bg-dark-900 p-2">
                <span className="size-7 rounded-lg bg-fizzia-500/15" />
                <span className="text-xs font-bold text-dark-100">{row}</span>
                <span className="ml-auto text-[10px] font-black text-fizzia-300">{itemIndex + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isStore) {
    const products = [
      ['Cafe premium', '$12'],
      ['Pan artesanal', '$4'],
      ['Combo desayuno', '$8'],
    ]

    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-dark-800 bg-dark-900 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between border-b border-dark-800 bg-dark-950 px-4 py-3">
          <span className="text-xs font-black text-fizzia-300">catalogo.fizzia</span>
          <span className="rounded-full bg-fizzia-500 px-3 py-1 text-xs font-black text-white">Carrito: $24</span>
        </div>
        <div className="grid h-full grid-cols-[1fr_150px] gap-4 p-4">
          <div>
            <p className="mb-3 text-xs font-black uppercase text-dark-500">Catalogo</p>
            <div className="grid grid-cols-3 gap-3">
              {products.map(([name, price]) => (
                <div key={name} className="rounded-xl border border-dark-800 bg-dark-950 p-3">
                  <div className="mb-3 aspect-square rounded-lg bg-fizzia-500/15" />
                  <p className="text-xs font-black text-dark-100">{name}</p>
                  <p className="mt-1 text-sm font-black text-fizzia-300">{price}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-xl border border-dark-800 bg-dark-950 p-3">
            <p className="mb-3 text-xs font-black uppercase text-dark-500">Carrito</p>
            {products.slice(0, 2).map(([name, price]) => (
              <div key={name} className="mb-2 flex items-center justify-between rounded-lg bg-dark-900 px-3 py-2 text-xs">
                <span className="font-bold text-dark-100">{name}</span>
                <span className="font-black text-fizzia-300">{price}</span>
              </div>
            ))}
            <div className="mt-4 rounded-lg bg-fizzia-500 px-3 py-2 text-center text-xs font-black text-white">
              Confirmar pedido
            </div>
          </aside>
        </div>
      </div>
    )
  }

  if (isInventory) {
    const products = [
      ['Arroz 25kg', '$38', '$29'],
      ['Cafe molido', '$12', '$7'],
      ['Cajas kraft', '$0.80', '$0.42'],
      ['Botellas', '$1.20', '$0.70'],
    ]

    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-dark-800 bg-dark-900 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between border-b border-dark-800 bg-dark-950 px-4 py-3">
          <span className="text-xs font-black text-fizzia-300">inventario.fizzia</span>
          <span className="text-xs font-bold text-dark-400">Stock bajo: 4</span>
        </div>
        <div className="p-4">
          <div className="mb-3 grid grid-cols-[1fr_70px_70px] px-3 text-[10px] font-black uppercase text-dark-500">
            <span>Producto</span>
            <span>Precio</span>
            <span>Costo</span>
          </div>
          <div className="space-y-2">
            {products.map(([name, price, cost]) => (
              <div key={name} className="grid grid-cols-[1fr_70px_70px] rounded-xl border border-dark-800 bg-dark-950 px-3 py-3 text-xs">
                <span className="font-black text-dark-100">{name}</span>
                <span className="font-black text-fizzia-300">{price}</span>
                <span className="font-bold text-dark-300">{cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isSales) {
    const sales = [
      ['Venta #1042', '+$48'],
      ['Venta #1043', '+$126'],
      ['Egreso caja', '-$22'],
    ]

    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-dark-800 bg-dark-900 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between border-b border-dark-800 bg-dark-950 px-4 py-3">
          <span className="text-xs font-black text-fizzia-300">ventas.fizzia</span>
          <span className="text-xs font-bold text-dark-400">Caja abierta</span>
        </div>
        <div className="grid h-full grid-cols-[160px_1fr] gap-4 p-4">
          <aside className="space-y-3">
            <button type="button" className="w-full rounded-xl bg-fizzia-500 px-3 py-3 text-xs font-black text-white">
              Agregar venta
            </button>
            <button type="button" className="w-full rounded-xl border border-dark-800 bg-dark-950 px-3 py-3 text-xs font-black text-dark-100">
              Agregar egreso
            </button>
            <div className="rounded-xl border border-dark-800 bg-dark-950 p-3">
              <p className="text-[10px] font-black uppercase text-dark-500">Total dia</p>
              <p className="mt-1 text-2xl font-black text-dark-50">$470</p>
            </div>
          </aside>
          <div className="space-y-2">
            {sales.map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-dark-800 bg-dark-950 px-4 py-3 text-xs">
                <span className="font-black text-dark-100">{name}</span>
                <span className={`font-black ${amount.startsWith('+') ? 'text-fizzia-300' : 'text-red-400'}`}>{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-dark-800 bg-dark-900 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-dark-800 bg-dark-950 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-fizzia-400" />
        </div>
        <span className="text-xs font-black text-dark-500">{service.slug}.fizzia</span>
      </div>
      <div className="grid h-full grid-cols-[130px_1fr]">
        <aside className="border-r border-dark-800 bg-dark-950 p-4">
          <p className="mb-4 text-xs font-black text-fizzia-300">Panel</p>
          <div className="space-y-2">
            {rows.slice(0, 4).map((row, itemIndex) => (
              <div key={row} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${itemIndex === 0 ? 'bg-fizzia-500 text-white' : 'bg-dark-900 text-dark-300'}`}>
                {row}
              </div>
            ))}
          </div>
        </aside>
        <div className="p-4">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {['Hoy', 'Mes', 'Meta'].map((label, itemIndex) => (
              <div key={label} className="rounded-xl border border-dark-800 bg-dark-950 p-3">
                <p className="text-[10px] font-bold uppercase text-dark-500">{label}</p>
                <p className="mt-1 text-xl font-black text-dark-50">{itemIndex === 0 ? '128' : itemIndex === 1 ? '$8.4k' : '91%'}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {rows.map((row, itemIndex) => (
              <div key={row} className="grid grid-cols-[1fr_56px] rounded-lg border border-dark-800 bg-dark-950 px-3 py-2 text-xs">
                <span className="font-bold text-dark-100">{row}</span>
                <span className="text-right font-black text-fizzia-300">{itemIndex % 2 ? 'Listo' : 'Activo'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceContent() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const targetId = location.hash.replace('#', '')

    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [location.hash])

  return (
    <>
      <Header />
      <main className="landing-page min-h-screen bg-dark-950 text-dark-50">
        <section className="px-4 pb-10 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-dark-400 transition-colors hover:text-fizzia-300">
              <ArrowRight className="size-4 rotate-180" />
              Volver al inicio
            </a>

            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
              Todo lo que podemos hacer.
            </h1>
            <div className="mt-8 flex flex-wrap gap-2">
              {servicePages.map((service) => {
                const look = serviceLooks[service.slug]
                const Icon = look?.Icon || LayoutDashboard

                return (
                  <a
                    key={service.slug}
                    href={`#${service.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-dark-800 bg-white px-3 py-2 text-xs font-black text-dark-200 shadow-sm transition-colors hover:border-fizzia-500/40 hover:bg-dark-900"
                  >
                    <Icon className="size-3.5 text-fizzia-500" />
                    {service.name}
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8">
            {servicePages.map((service, index) => (
              (() => {
                return (
                  <article
                    id={service.slug}
                    key={service.slug}
                    className="scroll-mt-28 bg-white/60 py-8"
                  >
                    <div className="relative mb-10 flex items-center justify-center">
                      <span className="h-px w-full bg-dark-800" />
                      <span className="absolute bg-dark-950 px-6 text-5xl font-black leading-none tracking-tight text-fizzia-500 md:text-6xl">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-10">
                      <div className={`${index % 2 ? 'md:order-2' : ''}`}>
                        <ServiceVisual service={service} />
                      </div>

                      <div className={`${index % 2 ? 'md:order-1' : ''}`}>
                        <h2 className="text-3xl font-black text-white md:text-4xl">{service.name}</h2>
                        <p className="mt-4 max-w-xl text-sm leading-relaxed text-dark-300 md:text-base">
                          {service.text}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full border border-dark-800 bg-white px-3 py-1.5 text-xs font-bold text-dark-300">
                            <Clock className="size-4 text-fizzia-500" />
                            {service.time}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-dark-800 bg-white px-3 py-1.5 text-xs font-bold text-dark-300">
                            <DollarSign className="size-4 text-fizzia-500" />
                            {service.price}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-dark-400">
                          Precio y tiempo referenciales. Pueden variar segun alcance y funciones.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                          {service.canTry && (
                            <a
                              href={DEMO_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-fizzia-500 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-fizzia-400"
                            >
                              <Play className="size-4" />
                              Probar
                            </a>
                          )}
                          <a
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-xl border border-dark-700 bg-white px-5 py-3 text-sm font-black text-dark-100 transition-colors hover:border-fizzia-500/40 hover:bg-dark-900"
                          >
                            Quiero uno similar
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })()
            ))}

            <div className="relative py-10 text-center">
              <div className="relative mb-8 flex items-center justify-center">
                <span className="h-px w-full bg-dark-800" />
                <span className="absolute bg-dark-950 px-6 text-5xl font-black leading-none tracking-tight text-fizzia-500 md:text-6xl">
                  10+
                </span>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-dark-400">
                Y muchos tipos de proyectos mas
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export function ServiceDetailPage() {
  return (
    <LanguageProvider>
      <CountryProvider>
        <ServiceContent />
      </CountryProvider>
    </LanguageProvider>
  )
}
