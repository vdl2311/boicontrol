'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Beef, Scale, DollarSign, Baby, HeartPulse, Wheat, TrendingUp, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function RelatoriosModule() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/relatorios')
        if (!res.ok) throw new Error()
        const d = await res.json()
        setData(d)
      } catch (e) {
        toast.error('Erro ao gerar relatório')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return null

  const { rebanho, desempenho, financeiro, reproducao, saude, alimentacao } = data

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-lg font-bold">Relatórios de Desempenho</h2>
        <p className="text-sm text-muted-foreground">Análise consolidada da fazenda</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <Beef className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rebanho</span>
            </div>
            <p className="text-xl md:text-2xl font-bold">{rebanho.totalAnimais}</p>
            <p className="text-xs text-muted-foreground">{rebanho.machos}M · {rebanho.femeas}F</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <Scale className="h-4 w-4 text-accent-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Arrobas</span>
            </div>
            <p className="text-xl md:text-2xl font-bold">{formatNumber(rebanho.arrobasTotal, 1)}</p>
            <p className="text-xs text-muted-foreground">@ média: {formatNumber(rebanho.arrobasPorAnimal, 1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GMD Médio</span>
            </div>
            <p className="text-xl md:text-2xl font-bold">{formatNumber(desempenho.gmdMedio, 3)}</p>
            <p className="text-xs text-muted-foreground">kg/dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-4 w-4 text-accent-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Lucro</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${financeiro.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financeiro.lucro)}
            </p>
            <p className="text-xs text-muted-foreground">Margem: {financeiro.margem}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Desempenho do rebanho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Beef className="h-4 w-4" />
            Desempenho do Rebanho
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Peso Total</p>
            <p className="font-bold">{formatNumber(rebanho.pesoTotal, 0)} kg</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Peso Médio</p>
            <p className="font-bold">{formatNumber(rebanho.pesoMedio, 0)} kg</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Arrobas (@)</p>
            <p className="font-bold">{formatNumber(rebanho.arrobasTotal, 1)} @</p>
            <p className="text-[10px] text-muted-foreground">Rendimento 50%</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">@ por animal</p>
            <p className="font-bold">{formatNumber(rebanho.arrobasPorAnimal, 1)} @</p>
          </div>
        </CardContent>
      </Card>

      {/* Ranking GMD */}
      {desempenho.gmdPorAnimal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Top 10 - Maior Ganho de Peso Diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, desempenho.gmdPorAnimal.length * 30)}>
              <BarChart data={desempenho.gmdPorAnimal} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg/d" />
                <YAxis type="category" dataKey="animal" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => `${formatNumber(v, 3)} kg/dia`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="gmd" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Análise Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-bold text-green-700 dark:text-green-400">{formatCurrency(financeiro.receitas)}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="font-bold text-red-700 dark:text-red-400">{formatCurrency(financeiro.despesas)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Lucro</p>
              <p className={`font-bold ${financeiro.lucro >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(financeiro.lucro)}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Custo/Animal</p>
              <p className="font-bold">{formatCurrency(financeiro.custoPorAnimal)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Receitas por Categoria</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(financeiro.receitasPorCategoria).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(e: any) => `${(e.percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {Object.entries(financeiro.receitasPorCategoria).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Despesas por Categoria</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(financeiro.despesasPorCategoria).map(([name, value]) => ({ name, value }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo operacional */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="h-4 w-4 text-primary" />
              Reprodução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total de montas</span><span className="font-bold">{reproducao.totalMontas}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gestantes</span><span className="font-bold text-amber-600">{reproducao.gestantes}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paridas</span><span className="font-bold text-green-600">{reproducao.paridas}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Taxa de Prenhez</span><span className="font-bold text-primary">{reproducao.taxaPrenhez}%</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-primary" />
              Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total de registros</span><span className="font-bold">{saude.totalRegistros}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Custo total</span><span className="font-bold">{formatCurrency(saude.custoTotal)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Custo/animal</span><span className="font-bold text-primary">{formatCurrency(saude.custoPorAnimal)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wheat className="h-4 w-4 text-primary" />
              Alimentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Custo mensal</span><span className="font-bold">{formatCurrency(alimentacao.custoMensal)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Custo/animal/mês</span><span className="font-bold text-primary">{formatCurrency(alimentacao.custoPorAnimalMes)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
