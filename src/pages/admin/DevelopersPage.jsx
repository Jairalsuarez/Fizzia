import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import DeveloperList from '../../features/developers/DeveloperList'
import DeveloperDetail from '../../features/developers/DeveloperDetail'
import { readStoredValue, writeStoredValue } from '../../utils/persistedState'

const SELECTED_DEVELOPER_KEY = 'fizzia-admin-selected-developer'

export function DevelopersPage() {
  const [selectedDeveloper, setSelectedDeveloper] = useState(null)
  const [selectedDeveloperId, setSelectedDeveloperId] = useState(() => readStoredValue(SELECTED_DEVELOPER_KEY, ''))
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    writeStoredValue(SELECTED_DEVELOPER_KEY, selectedDeveloperId)
  }, [selectedDeveloperId])

  const handleSelectDeveloper = useCallback((developer) => {
    setSelectedDeveloper(developer)
    setSelectedDeveloperId(developer?.id || '')
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Desarrolladores</h1>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        <div className="w-1/3">
          <DeveloperList selectedId={selectedDeveloper?.id || selectedDeveloperId} onSelect={handleSelectDeveloper} refreshKey={refreshKey} />
        </div>
        <div className="flex-1">
          {selectedDeveloper ? (
            <DeveloperDetail developer={selectedDeveloper} onUpdate={(updated) => { setRefreshKey(k => k + 1); if (updated) handleSelectDeveloper(updated) }} />
          ) : (
            <div className="rounded-xl border border-dark-800 bg-dark-900/50 h-full flex items-center justify-center">
              <EmptyState message="Selecciona un desarrollador para ver detalles" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
