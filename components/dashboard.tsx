'use client'

import { useEffect, useState } from 'react'
import { useApp } from './app-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Beef, DollarSign, TrendingUp, HeartPulse, Baby, Scale, AlertTriangle, Calendar, Wheat, ArrowUpRight, ArrowDownRight, Play } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatNumber, formatDate, daysUntil } from '@/lib/utils'
import { toast } from 'sonner'

interface DashboardData {
  fazenda: { id: string; nome: string; cidade?: string; estado?: string; areaTotal?: number }
  kpis: {
    totalAnimais: number
    ativos: number
    machos: number
    femeas: number
    pesoTotal: number
    pesoMedio: number
    receitas: number
    despesas: number
    saldo: number
    gestantes: number
    paridas: number
    totalSaude: number
    vacinasVencendo: number
    custoAlimentacaoMensal: number
  }
  porCategoria: Record<string, number>
  porRaca: Record<string, number>
  despesasPorCategoria: Record<string, number>
  proximosPartos: Array<{ id: string; femea: string; identificacao: string; dataPrevista: string; tipo: string }>
  evolucaoPeso: Array<{ mes: string; media: number }>
  evolucaoFinanceira: Array<{ mes: string; receita: number; despesa: number }>
  alertasVacinas: Array<{ id: string; animal: string; identificacao: string; descricao: string; proximaDose: string }>
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function Dashboard() {
  const { setView, setSelectedAnimalId, refreshKey } = useApp()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard')
      if (res.status === 404) {
        // Auto-seed se não houver fazenda
        const seedRes = await fetch('/api/seed', { method: 'POST' })
        if (!seedRes.ok) {
          throw new Error('Falha ao inicializar banco de dados')
        }
        const retry = await fetch('/api/dashboard')
        if (!retry.ok) {
          throw new Error('Falha ao carregar dashboard após inicialização')
        }
        const d = await retry.json()
        if (d && !d.error && d.kpis) {
          setData(d)
          toast.success('Dados de demonstração carregados!')
        } else {
          throw new Error(d?.error || 'Dados inválidos')
        }
        return
      }
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`)
      }
      const d = await res.json()
      if (d && !d.error && d.kpis) {
        setData(d)
      } else {
        throw new Error(d?.error || 'Dados inválidos no dashboard')
      }
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar dashboard')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [refreshKey])

  const seedData = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const result = await res.json()
      if (res.ok && !result.error) {
        toast.success(result.message || 'Dados de demonstração carregados!')
        loadDashboard()
      } else {
        toast.error(result.error || 'Erro ao carregar dados')
      }
    } catch (e) {
      toast.error('Erro ao carregar dados')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-6">
        <Beef className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-center max-w-sm">
          Bem-vindo ao BoiControl! Comece carregando dados de demonstração para explorar o app.
        </p>
        <Button onClick={seedData} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Carregar dados de demonstração
        </Button>
      </div>
    )
  }

  const k = data.kpis
  const saldoPositivo = k.saldo >= 0

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      {/* Cabeçalho da fazenda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D5A40] text-white shadow-sm">
              <Beef className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3D2C1D]">{data?.fazenda?.nome || 'Minha Fazenda'}</h1>
              <p className="text-sm text-[#8B5E3C] italic font-medium">
                {data?.fazenda ? [data.fazenda.cidade, data.fazenda.estado].filter(Boolean).join(' - ') : 'Localização não informada'}
                {data?.fazenda?.areaTotal && ` · ${formatNumber(data.fazenda.areaTotal, 0)} ha`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={seedData} variant="outline" className="rounded-full border-[#D9D1C2] text-[#3D2C1D] hover:bg-[#F5F1EB] font-medium">
            <Play className="h-4 w-4 mr-1.5 text-[#8B5E3C]" />
            Carregar Demo
          </Button>
          <Button onClick={() => setView('animais')} className="rounded-full bg-[#3D5A40] text-white hover:bg-[#2D4430] font-medium shadow-sm">
            + Novo Animal
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Animais"
          value={formatNumber(k.totalAnimais, 0)}
          subtitle={`${k.machos} Machos · ${k.femeas} Fêmeas`}
          icon={Beef}
          onClick={() => setView('animais')}
        />
        <KpiCard
          title="Peso Média e Total"
          value={`${formatNumber(k.pesoMedio, 0)} kg`}
          subtitle={`Total: ${formatNumber(k.pesoTotal, 0)} kg`}
          icon={Scale}
          onClick={() => setView('pesagem')}
        />
        <KpiCard
          title="Saldo do Mês"
          value={formatCurrency(k.saldo)}
          subtitle={saldoPositivo ? 'Lucro operacional' : 'Prejuízo operacional'}
          icon={saldoPositivo ? TrendingUp : ArrowDownRight}
          onClick={() => setView('financeiro')}
        />
        <KpiCard
          title="Gestantes / Paridas"
          value={formatNumber(k.gestantes, 0)}
          subtitle={`${k.paridas} vacas paridas`}
          icon={Baby}
          onClick={() => setView('reproducao')}
        />
      </div>

      {/* Alertas */}
      {(k.vacinasVencendo > 0 || data.proximosPartos.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {k.vacinasVencendo > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Vacinas Vencendo
                  <Badge variant="secondary" className="ml-auto">{data.alertasVacinas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {data.alertasVacinas.slice(0, 3).map(v => {
                  const dias = daysUntil(v.proximaDose)
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0 border-amber-200/50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{v.animal} · {v.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {dias < 0 ? `Vencida há ${Math.abs(dias)}d` : `Em ${dias}d`}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {data.alertasVacinas.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setView('saude')}>
                    Ver todas
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {data.proximosPartos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Próximos Partos
                  <Badge variant="secondary" className="ml-auto">{data.proximosPartos.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {data.proximosPartos.slice(0, 3).map(p => {
                  const dias = daysUntil(p.dataPrevista)
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.femea}</p>
                        <p className="text-xs text-muted-foreground">
                          Previsto: {formatDate(p.dataPrevista)} · {dias < 0 ? `Atrasado ${Math.abs(dias)}d` : `Em ${dias}d`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">{p.tipo}</Badge>
                    </div>
                  )
                })}
                {data.proximosPartos.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setView('reproducao')}>
                    Ver todas
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Evolução financeira */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas x Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.evolucaoFinanceira}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receita" name="Receita" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução de peso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Peso Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.evolucaoPeso}>
                <defs>
                  <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                <Tooltip
                  formatter={(v: number) => `${formatNumber(v, 1)} kg`}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="media"
                  name="Peso Médio"
                  stroke="var(--chart-1)"
                  fill="url(#pesoGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribuições */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(data.porCategoria).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(e: any) => `${e.value}`}
                  labelLine={false}
                >
                  {Object.entries(data.porCategoria).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Raça</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(data.porRaca).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(e: any) => `${e.value}`}
                  labelLine={false}
                >
                  {Object.entries(data.porRaca).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[(i + 1) % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(data.despesasPorCategoria).map(([name, value]) => ({ name, value }))}
                layout="vertical"
              >
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(k.receitas)}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(k.despesas)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-lg font-bold ${saldoPositivo ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(k.saldo)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Custo Alim. Mensal</p>
              <p className="text-lg font-bold">{formatCurrency(k.custoAlimentacaoMensal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string
  value: string
  subtitle?: string
  icon: typeof Beef
  onClick?: () => void
}) {
  return (
    <div
      className="bg-white p-5 md:p-6 rounded-[28px] border border-[#F0EBE0] shadow-sm hover:border-[#D9D1C2] hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[#8B5E3C] text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#3D2C1D]">{value}</h3>
          {subtitle && <p className="text-xs text-[#5C4D3E] font-medium mt-1.5">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F1EB] text-[#3D5A40] group-hover:bg-[#3D5A40] group-hover:text-white transition-colors shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
