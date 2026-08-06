'use client'

import { useEffect, useState } from 'react'
import { useApp } from './app-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORIAS_RECEITA = ['Venda de Animal', 'Venda de Leite', 'Venda de Subproduto', 'Serviço', 'Outro']
const CATEGORIAS_DESPESA = ['Compra de Insumo', 'Vacina', 'Ração', 'Combustível', 'Manutenção', 'Salário', 'Veterinário', 'Imposto', 'Outro']

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function FinanceiroModule() {
  const { refreshKey, triggerRefresh } = useApp()
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [filterTipo, setFilterTipo] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      const [tRes, aRes] = await Promise.all([fetch('/api/transacoes'), fetch('/api/animais')])
      const [t, a] = await Promise.all([tRes.json(), aRes.json()])
      setTransacoes(Array.isArray(t) ? t : [])
      setAnimais(Array.isArray(a) ? a : [])
    } catch (e) {
      toast.error('Erro ao carregar')
      setTransacoes([])
      setAnimais([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  const filtered = filterTipo === 'todos' ? transacoes : transacoes.filter(t => t.tipo === filterTipo)
  const receitas = transacoes.filter(t => t.tipo === 'Receita').reduce((s, t) => s + t.valor, 0)
  const despesas = transacoes.filter(t => t.tipo === 'Despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = receitas - despesas

  // Por categoria
  const despesasPorCat = transacoes
    .filter(t => t.tipo === 'Despesa')
    .reduce((acc, t) => { acc[t.categoria] = (acc[t.categoria] || 0) + t.valor; return acc }, {} as Record<string, number>)

  const receitasPorCat = transacoes
    .filter(t => t.tipo === 'Receita')
    .reduce((acc, t) => { acc[t.categoria] = (acc[t.categoria] || 0) + t.valor; return acc }, {} as Record<string, number>)

  // Evolução mensal (últimos 6 meses)
  const finMes = new Map<string, { receita: number; despesa: number }>()
  transacoes.forEach(t => {
    const dataObj = typeof t.data === 'string' ? new Date(t.data) : t.data
    const key = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`
    const cur = finMes.get(key) || { receita: 0, despesa: 0 }
    if (t.tipo === 'Receita') cur.receita += t.valor
    else cur.despesa += t.valor
    finMes.set(key, cur)
  })
  const evolucao = Array.from(finMes.entries()).sort().slice(-6).map(([mes, v]) => ({ mes, ...v }))

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir transação?')) return
    try {
      await fetch(`/api/transacoes/${id}`, { method: 'DELETE' })
      toast.success('Transação excluída')
      triggerRefresh()
    } catch (e) {
      toast.error('Erro')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Controle Financeiro</h2>
          <p className="text-sm text-muted-foreground">{transacoes.length} transações registradas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Transação
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(receitas)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatCurrency(despesas)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-700 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={saldo >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(saldo)}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${saldo >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                {saldo >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="despGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="var(--chart-1)" fill="url(#recGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="var(--chart-3)" fill="url(#despGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(despesasPorCat).map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e: any) => `${(e.percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.entries(despesasPorCat).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Select value={filterTipo} onValueChange={setFilterTipo}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas transações</SelectItem>
          <SelectItem value="Receita">Apenas receitas</SelectItem>
          <SelectItem value="Despesa">Apenas despesas</SelectItem>
        </SelectContent>
      </Select>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma transação registrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Transações ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    t.tipo === 'Receita' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
                  }`}>
                    {t.tipo === 'Receita' ? <ArrowUpRight className="h-4 w-4 text-green-700 dark:text-green-400" /> : <ArrowDownRight className="h-4 w-4 text-red-700 dark:text-red-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs mr-1">{t.categoria}</Badge>
                      {formatDate(t.data)}
                      {t.animal && ` · ${t.animal.nome || t.animal.identificacao}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${t.tipo === 'Receita' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <TransacaoForm
        open={formOpen}
        animais={animais}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); triggerRefresh() }}
      />
    </div>
  )
}

function TransacaoForm({ open, animais, onClose, onSaved }: { open: boolean; animais: any[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    tipo: 'Despesa',
    categoria: 'Ração',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    animalId: '',
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        tipo: 'Despesa',
        categoria: 'Ração',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        animalId: '',
        observacoes: '',
      })
    }
  }, [open])

  const categorias = form.tipo === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  const handleSubmit = async () => {
    if (!form.descricao) { toast.error('Descrição é obrigatória'); return }
    if (!form.valor || Number(form.valor) <= 0) { toast.error('Valor inválido'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, animalId: form.animalId || null }),
      })
      if (res.ok) {
        toast.success('Transação registrada!')
        onSaved()
      } else {
        toast.error('Erro')
      }
    } catch (e) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>Registre receita ou despesa da fazenda</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={form.tipo === 'Receita' ? 'default' : 'outline'}
              onClick={() => setForm({ ...form, tipo: 'Receita', categoria: CATEGORIAS_RECEITA[0] })}
              className="h-12"
            >
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Receita
            </Button>
            <Button
              type="button"
              variant={form.tipo === 'Despesa' ? 'default' : 'outline'}
              onClick={() => setForm({ ...form, tipo: 'Despesa', categoria: CATEGORIAS_DESPESA[0] })}
              className="h-12"
            >
              <ArrowDownRight className="h-4 w-4 mr-1.5" />
              Despesa
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Compra de sal mineral" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Animal (opcional)</Label>
              <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.identificacao} ({a.identificacao})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
