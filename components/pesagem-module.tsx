'use client'

import { useEffect, useState } from 'react'
import { useApp } from './app-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Scale, Plus, Trash2, TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import { formatNumber, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export function PesagemModule() {
  const { refreshKey, triggerRefresh, setSelectedAnimalId } = useApp()
  const [registros, setRegistros] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      const [rRes, aRes] = await Promise.all([fetch('/api/pesagem'), fetch('/api/animais')])
      const [r, a] = await Promise.all([rRes.json(), aRes.json()])
      setRegistros(Array.isArray(r) ? r : [])
      setAnimais(Array.isArray(a) ? a : [])
    } catch (e) {
      toast.error('Erro ao carregar')
      setRegistros([])
      setAnimais([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  const filtered = filterAnimal === 'todos' ? registros : registros.filter(r => r.animalId === filterAnimal)

  // Calcular GMD por animal
  const gmdPorAnimal = animais.map(animal => {
    const pesos = registros
      .filter(p => p.animalId === animal.id)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    if (pesos.length < 2) return null
    const primeiro = pesos[0]
    const ultimo = pesos[pesos.length - 1]
    const diffDays = (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / (1000 * 60 * 60 * 24)
    const gmd = diffDays > 0 ? (ultimo.peso - primeiro.peso) / diffDays : 0
    return {
      animal,
      gmd: Number(gmd.toFixed(3)),
      primeiro: primeiro.peso,
      ultimo: ultimo.peso,
      diff: ultimo.peso - primeiro.peso,
    }
  }).filter(Boolean).sort((a: any, b: any) => b.gmd - a.gmd)

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir pesagem?')) return
    try {
      await fetch(`/api/pesagem/${id}`, { method: 'DELETE' })
      toast.success('Pesagem excluída')
      triggerRefresh()
    } catch (e) {
      toast.error('Erro')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Pesagem e GMD</h2>
          <p className="text-sm text-muted-foreground">
            {registros.length} registros · {animais.length} animais
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={animais.length === 0}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Pesagem
        </Button>
      </div>

      {/* GMD ranking */}
      {gmdPorAnimal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ranking de Ganho Médio Diário (GMD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, gmdPorAnimal.length * 35)}>
              <BarChart data={gmdPorAnimal.map((g: any) => ({ nome: g.animal.nome || g.animal.identificacao, gmd: g.gmd }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg/d" />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => `${formatNumber(v, 3)} kg/dia`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="gmd" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Select value={filterAnimal} onValueChange={setFilterAnimal}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Filtrar por animal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos animais</SelectItem>
          {animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.identificacao} ({a.identificacao})</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Scale className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma pesagem registrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Pesagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    {p.animal ? (
                      <button
                        className="font-medium text-sm hover:underline truncate block"
                        onClick={() => setSelectedAnimalId(p.animal.id)}
                      >
                        {p.animal.nome || p.animal.identificacao}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">Animal removido</span>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(p.data)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm font-bold">{formatNumber(p.peso, 1)} kg</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <PesagemForm
        open={formOpen}
        animais={animais}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); triggerRefresh() }}
      />
    </div>
  )
}

function PesagemForm({ open, animais, onClose, onSaved }: { open: boolean; animais: any[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    animalId: '',
    peso: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        animalId: animais[0]?.id || '',
        peso: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: '',
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.animalId) { toast.error('Selecione um animal'); return }
    if (!form.peso || Number(form.peso) <= 0) { toast.error('Peso inválido'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/pesagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Pesagem registrada!')
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Pesagem</DialogTitle>
          <DialogDescription>O peso atual do animal será atualizado automaticamente</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Animal *</Label>
            <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o animal" /></SelectTrigger>
              <SelectContent>
                {animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.identificacao} ({a.identificacao})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="peso">Peso (kg) *</Label>
              <Input id="peso" type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="450" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Input id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Condição corporal, lote, etc." />
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
