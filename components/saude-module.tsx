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
import { HeartPulse, Plus, Trash2, Calendar, Pill, User, DollarSign, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { toast } from 'sonner'

const TIPOS_SAUDE = ['Vacina', 'Vermífugo', 'Tratamento', 'Exame', 'Cirurgia', 'Outro']

export function SaudeModule() {
  const { refreshKey, triggerRefresh, setSelectedAnimalId } = useApp()
  const [registros, setRegistros] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [filterTipo, setFilterTipo] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      const [rRes, aRes] = await Promise.all([
        fetch('/api/saude'),
        fetch('/api/animais'),
      ])
      const [r, a] = await Promise.all([rRes.json(), aRes.json()])
      setRegistros(Array.isArray(r) ? r : [])
      setAnimais(Array.isArray(a) ? a : [])
    } catch (e) {
      toast.error('Erro ao carregar registros')
      setRegistros([])
      setAnimais([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  const filtered = filterTipo === 'todos' ? registros : registros.filter(r => r.tipo === filterTipo)
  const now = new Date()
  const vacinasVencendo = registros.filter(r => r.proximaDose && daysUntil(r.proximaDose) <= 30)

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro de saúde?')) return
    try {
      await fetch(`/api/saude/${id}`, { method: 'DELETE' })
      toast.success('Registro excluído')
      triggerRefresh()
    } catch (e) {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Saúde do Rebanho</h2>
          <p className="text-sm text-muted-foreground">
            {registros.length} registros · {vacinasVencendo.length} vacinas vencendo
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Registro
        </Button>
      </div>

      {vacinasVencendo.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Atenção: {vacinasVencendo.length} vacina(s) precisam de reforço
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {vacinasVencendo.slice(0, 3).map(v => {
              const dias = daysUntil(v.proximaDose)
              return (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{v.animal.nome || v.animal.identificacao}</span>
                  <span className="text-muted-foreground">
                    {dias < 0 ? `Vencida há ${Math.abs(dias)}d` : `Em ${dias}d`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Filtro */}
      <Select value={filterTipo} onValueChange={setFilterTipo}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {TIPOS_SAUDE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <HeartPulse className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum registro de saúde encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline">{r.tipo}</Badge>
                      {r.animal ? (
                        <>
                          <button
                            className="font-medium text-sm hover:underline"
                            onClick={() => setSelectedAnimalId(r.animal.id)}
                          >
                            {r.animal.nome || r.animal.identificacao}
                          </button>
                          <span className="text-xs text-muted-foreground">· {r.animal.identificacao}</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">Animal removido</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-1">{r.descricao}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.dataAplicacao)}</span>
                      {r.produto && <span className="flex items-center gap-1"><Pill className="h-3 w-3" />{r.produto} · {r.dosagem}</span>}
                      {r.veterinario && <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.veterinario}</span>}
                      {r.custo && r.custo > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(r.custo)}</span>}
                      {r.proximaDose && (
                        <span className={`flex items-center gap-1 font-medium ${daysUntil(r.proximaDose) <= 30 ? 'text-amber-600' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          Próxima: {formatDate(r.proximaDose)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SaudeForm
        open={formOpen}
        animais={animais}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); triggerRefresh() }}
      />
    </div>
  )
}

function SaudeForm({ open, animais, onClose, onSaved }: { open: boolean; animais: any[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    animalId: '',
    tipo: 'Vacina',
    descricao: '',
    produto: '',
    dosagem: '',
    veterinario: '',
    custo: '',
    dataAplicacao: new Date().toISOString().split('T')[0],
    proximaDose: '',
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        animalId: animais[0]?.id || '',
        tipo: 'Vacina',
        descricao: '',
        produto: '',
        dosagem: '',
        veterinario: '',
        custo: '',
        dataAplicacao: new Date().toISOString().split('T')[0],
        proximaDose: '',
        observacoes: '',
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.animalId) { toast.error('Selecione um animal'); return }
    if (!form.descricao) { toast.error('Descrição é obrigatória'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/saude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Registro de saúde criado!')
        onSaved()
      } else {
        toast.error('Erro ao criar registro')
      }
    } catch (e) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Registro de Saúde</DialogTitle>
          <DialogDescription>Registre vacinas, tratamentos, exames ou cirurgias</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Animal *</Label>
            <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o animal" /></SelectTrigger>
              <SelectContent>
                {animais.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome || a.identificacao} ({a.identificacao})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SAUDE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataAplicacao">Data de Aplicação</Label>
              <Input id="dataAplicacao" type="date" value={form.dataAplicacao} onChange={(e) => setForm({ ...form, dataAplicacao: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Vacina contra aftosa" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="produto">Produto / Medicamento</Label>
              <Input id="produto" value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Aftosa Bovilis" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dosagem">Dosagem</Label>
              <Input id="dosagem" value={form.dosagem} onChange={(e) => setForm({ ...form, dosagem: e.target.value })} placeholder="5ml" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="veterinario">Veterinário</Label>
              <Input id="veterinario" value={form.veterinario} onChange={(e) => setForm({ ...form, veterinario: e.target.value })} placeholder="Dr. Silva" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custo">Custo (R$)</Label>
              <Input id="custo" type="number" step="0.01" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proximaDose">Próxima Dose (reforço)</Label>
            <Input id="proximaDose" type="date" value={form.proximaDose} onChange={(e) => setForm({ ...form, proximaDose: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
