import { useState } from 'react'
import { DashboardLayout } from '../components/app-shell/DashboardLayout'
import { Chat } from '../components/Chat'
import { PresenceTracker } from '../components/PresenceTracker'
import { NotificationBell } from '../components/NotificationBell'
import { ClientTutorial } from '../components/tutorial/ClientTutorial'
import { ThemeToggle } from '../components/ThemeToggle'
import { clientNav } from '../constants/navigation'

export function ClientLayout() {
  const [unreadCount, setUnreadCount] = useState(0)

  return (
    <>
      <DashboardLayout
        navItems={clientNav}
        roleLabel="Cliente"
        settingsPath="/cliente/configuracion"
        termsPath="/cliente/terminos"
        theme="fizzia"
        topActions={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell unreadCount={unreadCount} />
          </div>
        }
      />
      <Chat onUnreadChange={setUnreadCount} />
      <ClientTutorial />
      <PresenceTracker />
    </>
  )
}
