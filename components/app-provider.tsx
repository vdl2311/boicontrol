'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ViewName = 'dashboard' | 'animais' | 'saude' | 'reproducao' | 'pesagem' | 'alimentacao' | 'financeiro' | 'relatorios'

interface AppState {
  view: ViewName
  setView: (v: ViewName) => void
  selectedAnimalId: string | null
  setSelectedAnimalId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  refreshKey: number
  triggerRefresh: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // Inicialização lazy: lê do localStorage antes do primeiro render
  const [view, setView] = useState<ViewName>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    const saved = localStorage.getItem('boicontrol:view') as ViewName | null
    return saved || 'dashboard'
  })
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = () => setRefreshKey(k => k + 1)

  // Persistência do view em localStorage
  useEffect(() => {
    localStorage.setItem('boicontrol:view', view)
  }, [view])

  return (
    <AppContext.Provider value={{
      view,
      setView,
      selectedAnimalId,
      setSelectedAnimalId,
      sidebarOpen,
      setSidebarOpen,
      refreshKey,
      triggerRefresh,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}
