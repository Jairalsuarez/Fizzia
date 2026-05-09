import { DashboardLayout } from '../components/app-shell/DashboardLayout'
import { adminNav } from '../constants/navigation'
import { DashboardDataProvider } from '../hooks/useDashboardData'
import { Chat } from '../components/Chat'
import { PresenceTracker } from '../components/PresenceTracker'

export function AdminLayout() {
  return (
    <DashboardDataProvider>
      <DashboardLayout
        navItems={adminNav}
        roleLabel="Admin"
        settingsPath="/admin/configuracion"
        theme="fizzia"
      />
      <PresenceTracker />
      <Chat />
    </DashboardDataProvider>
  )
}
