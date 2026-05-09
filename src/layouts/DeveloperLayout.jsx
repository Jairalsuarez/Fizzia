import { DashboardLayout } from '../components/app-shell/DashboardLayout'
import { developerNav } from '../constants/navigation'
import { DeveloperFloatingChat } from '../components/DeveloperFloatingChat'
import { PresenceTracker } from '../components/PresenceTracker'

export function DeveloperLayout() {
  return (
    <>
      <DashboardLayout
        navItems={developerNav}
        roleLabel="Developer"
        settingsPath="/dev/configuracion"
        termsPath="/dev/terminos"
        theme="rose"
      />
      <DeveloperFloatingChat />
      <PresenceTracker />
    </>
  )
}
