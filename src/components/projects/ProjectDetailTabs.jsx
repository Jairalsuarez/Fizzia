import { useEffect, useMemo } from 'react'

export function ProjectDetailTabs({ tabs, activeTab, onChange, className = '', density = 'default' }) {
  const getId = tab => tab.id || tab.key
  const compact = density === 'compact'
  const mobileTabs = useMemo(() => {
    if (tabs.length <= 1) return tabs

    const [primaryTab, ...restTabs] = tabs
    const leftCount = Math.floor(restTabs.length / 2)
    return [...restTabs.slice(0, leftCount), primaryTab, ...restTabs.slice(leftCount)]
  }, [tabs])

  useEffect(() => {
    document.body.classList.add('has-project-detail-dock')
    return () => document.body.classList.remove('has-project-detail-dock')
  }, [])

  const handleSelect = tab => {
    onChange(getId(tab))
  }

  return (
    <nav className={className} aria-label="Secciones del proyecto">
      <div className="fixed inset-x-0 bottom-0 z-[800] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
        <div className="w-full rounded-[1.65rem] border border-dark-800 bg-dark-950 px-3 py-2 shadow-[0_18px_36px_-30px_rgba(0,0,0,0.9)]">
          <div className="flex min-h-16 w-full items-center justify-between gap-1.5">
            {mobileTabs.map(tab => {
              const id = getId(tab)
              const isActive = id === activeTab

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(tab)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={tab.label}
                  title={tab.label}
                  className={`cursor-pointer flex shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-out active:scale-[0.96] ${
                    isActive
                      ? 'h-16 w-16 border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_16px_32px_-20px_var(--accent)]'
                      : 'h-9 w-9 border-dark-800 bg-dark-900 text-dark-400 hover:border-dark-700 hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-rounded ${isActive ? 'text-2xl' : 'text-base'}`}>{tab.icon || 'circle'}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={`hidden sm:flex sm:overflow-x-auto sm:hide-scrollbar sm:snap-x ${compact ? 'sm:gap-1' : 'sm:gap-1 sm:rounded-xl sm:border sm:border-dark-800 sm:bg-dark-900/50 sm:p-1'}`}>
        {tabs.map(tab => {
          const id = getId(tab)
          const isActive = id === activeTab

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(tab)}
              className={`cursor-pointer min-w-max snap-start flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                compact
                  ? `border-b-2 px-4 py-3 ${isActive ? 'border-[var(--accent)] text-white' : 'border-transparent text-dark-400 hover:border-dark-600 hover:text-white'}`
                  : `flex-1 rounded-lg px-4 py-2.5 ${isActive ? 'bg-[var(--accent)] text-white' : 'text-dark-400 hover:bg-dark-800/50 hover:text-white'}`
              }`}
            >
              {tab.icon && <span className="material-symbols-rounded text-lg">{tab.icon}</span>}
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
