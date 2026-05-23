export const adminNav = [
  { to: '/admin', label: 'Inicio', icon: 'dashboard', end: true, preload: () => import('../pages/admin/DashboardPage') },
  { to: '/admin/potenciales', label: 'Potenciales', icon: 'person_search', preload: () => import('../pages/admin/LeadsPage') },
  { to: '/admin/clientes', label: 'Clientes', icon: 'groups', preload: () => import('../pages/admin/ClientsPage') },
  { to: '/admin/desarrolladores', label: 'Desarrolladores', icon: 'code', preload: () => import('../pages/admin/DevelopersPage') },
  { to: '/admin/pagos', label: 'Pagos', icon: 'payments', preload: () => import('../pages/admin/PaymentsPage') },
  { to: '/admin/finanzas', label: 'Finanzas', icon: 'account_balance_wallet', preload: () => import('../pages/admin/FinancePage') },
  { to: '/admin/calculadora', label: 'Calculadora', icon: 'calculate', preload: () => import('../pages/admin/PriceCalculatorPage') },
]

export const clientNav = [
  { to: '/cliente', label: 'Inicio', icon: 'dashboard', end: true, preload: () => import('../pages/client/DashboardPage') },
  { to: '/cliente/finanzas', label: 'Finanzas', icon: 'payments', preload: () => import('../pages/client/FinancesPage') },
]

export const developerNav = [
  { to: '/dev', label: 'Inicio', icon: 'dashboard', end: true, preload: () => import('../pages/developer/DashboardPage') },
  { to: '/dev/finanzas', label: 'Finanzas', icon: 'account_balance_wallet', preload: () => import('../pages/developer/FinancePage') },
]
