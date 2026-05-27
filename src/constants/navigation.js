export const adminNav = [
  { to: '/admin', label: 'Inicio', icon: 'dashboard', end: true, preload: () => import('../pages/admin/DashboardPage') },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'groups', preload: () => import('../pages/admin/UsersPage') },
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
