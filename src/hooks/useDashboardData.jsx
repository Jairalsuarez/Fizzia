import { useState, useEffect, useCallback } from 'react'
import { DashboardDataContext } from './dashboardDataContext'
import { loadDashboardData } from '../api/dashboardApi'
import { buildMetrics } from '../utils/business'
import { supabase } from '../services/supabase'
import { readStoredJson, writeStoredJson } from '../utils/persistedState'

const DASHBOARD_CACHE_KEY = 'fizzia-admin-dashboard-cache'
const EMPTY_DASHBOARD_DATA = {
  clients: [],
  projects: [],
  invoices: [],
  payments: [],
  expenses: [],
  leads: [],
  appointments: []
}

export function DashboardDataProvider({ children }) {
  const cachedData = readStoredJson(DASHBOARD_CACHE_KEY, null)
  const [data, setData] = useState(() => cachedData || EMPTY_DASHBOARD_DATA)
  const [loading, setLoading] = useState(() => !cachedData)
  const [error, setError] = useState(null)

  const refreshData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const result = await loadDashboardData()
      setData(result)
      writeStoredJson(DASHBOARD_CACHE_KEY, result)
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
     
    refreshData({ silent: Boolean(cachedData) })
  }, [refreshData])

  useEffect(() => {
    let timer = null
    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => refreshData({ silent: true }), 250)
    }
    const channel = supabase
      .channel('dashboard:data:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_users' }, scheduleRefresh)
      .subscribe()
    return () => {
      clearTimeout(timer)
      channel.unsubscribe()
    }
  }, [refreshData])

  const metrics = buildMetrics(data)

  return (
    <DashboardDataContext.Provider value={{ data, loading, error, refreshData, metrics }}>
      {children}
    </DashboardDataContext.Provider>
  )
}

 
export { useDashboardData } from './dashboardDataContext'
