import { Outlet } from 'react-router-dom'

export function LandingLayout() {
  return (
    <div className="bg-dark-950 min-h-[100dvh] overflow-x-hidden">
      <main>
        <Outlet />
      </main>
    </div>
  )
}
