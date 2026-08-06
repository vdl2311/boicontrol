'use client'

import { AppProvider, useApp } from '@/components/app-provider'
import { Sidebar, TopBar, BottomNav } from '@/components/navigation'
import { Dashboard } from '@/components/dashboard'
import { AnimaisModule } from '@/components/animais-module'
import { SaudeModule } from '@/components/saude-module'
import { ReproducaoModule } from '@/components/reproducao-module'
import { PesagemModule } from '@/components/pesagem-module'
import { AlimentacaoModule } from '@/components/alimentacao-module'
import { FinanceiroModule } from '@/components/financeiro-module'
import { RelatoriosModule } from '@/components/relatorios-module'

function AppContent() {
  const { view } = useApp()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {view === 'dashboard' && <Dashboard />}
          {view === 'animais' && <AnimaisModule />}
          {view === 'saude' && <SaudeModule />}
          {view === 'reproducao' && <ReproducaoModule />}
          {view === 'pesagem' && <PesagemModule />}
          {view === 'alimentacao' && <AlimentacaoModule />}
          {view === 'financeiro' && <FinanceiroModule />}
          {view === 'relatorios' && <RelatoriosModule />}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
