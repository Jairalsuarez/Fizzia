import { Suspense, lazy } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import { ToastProvider } from './components/Toast'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { CountryProvider } from './contexts/CountryContext'
import { CookieConsent } from './components/CookieConsent'
import { BrandLogo } from './components/BrandLogo'

const LandingLayout = lazy(() => import('./layouts/LandingLayout').then(module => ({ default: module.LandingLayout })))
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })))
const ClientLayout = lazy(() => import('./layouts/ClientLayout').then(module => ({ default: module.ClientLayout })))
const DeveloperLayout = lazy(() => import('./layouts/DeveloperLayout').then(module => ({ default: module.DeveloperLayout })))
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then(module => ({ default: module.RegisterPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })))
const TermsPage = lazy(() => import('./pages/shared/TermsPage').then(module => ({ default: module.TermsPage })))
const AboutPage = lazy(() => import('./pages/shared/AboutPage').then(module => ({ default: module.AboutPage })))
const SimulatorPage = lazy(() => import('./pages/shared/SimulatorPage').then(module => ({ default: module.SimulatorPage })))
const ServiceDetailPage = lazy(() => import('./pages/shared/ServiceDetailPage').then(module => ({ default: module.ServiceDetailPage })))

const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(module => ({ default: module.DashboardPage })))
const AdminProjectDetailPage = lazy(() => import('./pages/admin/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage').then(module => ({ default: module.UsersPage })))
const AdminFinancePage = lazy(() => import('./pages/admin/FinancePage').then(module => ({ default: module.FinancePage })))
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })))
const AdminPriceCalculatorPage = lazy(() => import('./pages/admin/PriceCalculatorPage').then(module => ({ default: module.PriceCalculatorPage })))

const DeveloperDashboardPage = lazy(() => import('./pages/developer/DashboardPage').then(module => ({ default: module.DashboardPage })))
const DeveloperProjectDetailPage = lazy(() => import('./pages/developer/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })))
const DeveloperFinancePage = lazy(() => import('./pages/developer/FinancePage').then(module => ({ default: module.FinancePage })))
const DeveloperSettingsPage = lazy(() => import('./pages/developer/SettingsPage').then(module => ({ default: module.SettingsPage })))

const ClientDashboardPage = lazy(() => import('./pages/client/DashboardPage').then(module => ({ default: module.DashboardPage })))
const ClientNewProjectPage = lazy(() => import('./pages/client/NewProjectPage').then(module => ({ default: module.NewProjectPage })))
const ClientProjectCreatedPage = lazy(() => import('./pages/client/ProjectCreatedPage').then(module => ({ default: module.ProjectCreatedPage })))
const ClientProjectDetailPage = lazy(() => import('./pages/client/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })))
const ClientProjectPage = lazy(() => import('./pages/client/ProjectPage').then(module => ({ default: module.ProjectPage })))
const ClientFinancesPage = lazy(() => import('./pages/client/FinancesPage').then(module => ({ default: module.FinancesPage })))
const ClientPaymentPage = lazy(() => import('./pages/client/PaymentPage').then(module => ({ default: module.PaymentPage })))
const ClientPaymentThanksPage = lazy(() => import('./pages/client/PaymentThanksPage').then(module => ({ default: module.PaymentThanksPage })))
const ClientProfilePage = lazy(() => import('./pages/client/ProfilePage').then(module => ({ default: module.ProfilePage })))
const ClientSettingsPage = lazy(() => import('./pages/client/SettingsPage').then(module => ({ default: module.SettingsPage })))
const ClientTutorialsPage = lazy(() => import('./pages/client/TutorialsPage').then(module => ({ default: module.TutorialsPage })))

function RouteFallback() {
  const { pathname } = useLocation()
  const isAppRoute = ['/admin', '/cliente', '/dev', '/simulador'].some((route) => pathname.startsWith(route))
  const shellClass = isAppRoute ? 'app-shell bg-dark-950' : 'bg-white'

  return (
    <div className={`flex min-h-screen items-center justify-center ${shellClass}`}>
      <div className="text-center space-y-4">
        <BrandLogo mode="mark" markClassName="h-12" className="mx-auto" />
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fizzia-500 mx-auto"></div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="quienes-somos" element={<AboutPage />} />
              <Route path="servicios" element={<ServiceDetailPage />} />
            </Route>

          <Route path="/simulador" element={<SimulatorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<CountryProvider><RegisterPage /></CountryProvider>} />

          <Route element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/proyecto/:projectId" element={<AdminProjectDetailPage />} />
              <Route path="/admin/usuarios" element={<AdminUsersPage />} />
              <Route path="/admin/potenciales" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/admin/clientes" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/admin/desarrolladores" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="/admin/pagos" element={<Navigate to="/admin/finanzas" replace />} />
              <Route path="/admin/finanzas" element={<AdminFinancePage />} />
              <Route path="/admin/calculadora" element={<AdminPriceCalculatorPage />} />
              <Route path="/admin/configuracion" element={<AdminSettingsPage />} />
              <Route path="/admin/configuracion/:section" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/cliente" element={<ClientDashboardPage />} />
              <Route path="/cliente/nuevo-proyecto" element={<ClientNewProjectPage />} />
              <Route path="/cliente/proyecto-creado" element={<ClientProjectCreatedPage />} />
              <Route path="/cliente/proyecto/:projectId" element={<ClientProjectDetailPage />} />
              <Route path="/cliente/mi-proyecto" element={<ClientProjectPage />} />
              <Route path="/cliente/finanzas" element={<ClientFinancesPage />} />
              <Route path="/cliente/pagar" element={<ClientPaymentPage />} />
              <Route path="/cliente/pago-gracias" element={<ClientPaymentThanksPage />} />
              <Route path="/cliente/archivos" element={<Navigate to="/cliente" replace />} />
              <Route path="/cliente/perfil" element={<ClientProfilePage />} />
              <Route path="/cliente/tutoriales" element={<ClientTutorialsPage />} />
              <Route path="/cliente/configuracion" element={<ClientSettingsPage />} />
              <Route path="/cliente/configuracion/:section" element={<ClientSettingsPage />} />
              <Route path="/cliente/terminos" element={<TermsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="developer" />}>
            <Route element={<DeveloperLayout />}>
              <Route path="/dev" element={<DeveloperDashboardPage />} />
              <Route path="/dev/proyecto/:projectId" element={<DeveloperProjectDetailPage />} />
              <Route path="/dev/finanzas" element={<DeveloperFinancePage />} />
              <Route path="/dev/configuracion" element={<DeveloperSettingsPage />} />
              <Route path="/dev/configuracion/:section" element={<DeveloperSettingsPage />} />
              <Route path="/dev/terminos" element={<TermsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<LandingLayout />}>
            <Route path="*" element={<LandingPage />} />
          </Route>
          </Routes>
        </Suspense>
        <CookieConsent />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
