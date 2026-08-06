'use client'

import { LayoutDashboard, Beef, HeartPulse, Baby, Scale, Wheat, DollarSign, BarChart3, Menu } from 'lucide-react'
import { useApp, ViewName } from './app-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const navItems: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'animais', label: 'Animais', icon: Beef },
  { id: 'saude', label: 'Saúde', icon: HeartPulse },
  { id: 'reproducao', label: 'Reprodução', icon: Baby },
  { id: 'pesagem', label: 'Pesagem', icon: Scale },
  { id: 'alimentacao', label: 'Alimentação', icon: Wheat },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useApp()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
        <NavContent view={view} setView={setView} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Mobile sheet sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <NavContent view={view} setView={setView} setSidebarOpen={setSidebarOpen} />
        </SheetContent>
      </Sheet>
    </>
  )
}

function NavContent({ view, setView, setSidebarOpen }: { view: ViewName; setView: (v: ViewName) => void; setSidebarOpen: (v: boolean) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5 bg-primary text-primary-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
          <Beef className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-bold leading-tight">BoiControl</div>
          <div className="text-[10px] uppercase tracking-wider text-primary-foreground/70">Gestão Pecuária</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map(item => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                setSidebarOpen(false)
              }}
              className={cn(
                'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">BoiControl v1.0</p>
        <p>Gestão de Gado de Corte</p>
      </div>
    </div>
  )
}

export function TopBar() {
  const { view, setSidebarOpen } = useApp()
  const current = navItems.find(n => n.id === view)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 flex-1">
        {current && <current.icon className="h-5 w-5 text-primary" />}
        <h1 className="font-semibold text-base">{current?.label}</h1>
      </div>
    </header>
  )
}

export function BottomNav() {
  const { view, setView } = useApp()

  // Mobile mostra apenas 5 itens principais
  const mobileItems = navItems.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur pb-safe">
      <div className="grid grid-cols-5">
        {mobileItems.map(item => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
