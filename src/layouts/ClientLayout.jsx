import { useState } from 'react'
import { DashboardLayout } from '../components/app-shell/DashboardLayout'
import { Chat } from '../components/Chat'
import { PresenceTracker } from '../components/PresenceTracker'
import { NotificationBell } from '../components/NotificationBell'
import { ClientTutorial } from '../components/tutorial/ClientTutorial'
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
        topActions={<NotificationBell unreadCount={unreadCount} />}
      />
      <Chat onUnreadChange={setUnreadCount} />
      <ClientTutorial />
      <PresenceTracker />
    </>
  )
}
