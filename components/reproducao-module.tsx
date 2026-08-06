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
import { Baby, Plus, Trash2, Calendar, Heart } from 'lucide-react'
import { formatDate, daysUntil, statusColor } from '@/lib/utils'
import { toast } from 'sonner'

const TIPOS_REPRO = ['Monta Natural', 'Inseminação', 'Transferência de Embriões']
const STATUS_REPRO = ['Coberta', 'Gestante', 'Parida', 'Vazia', 'Diagnóstico']

export function ReproducaoModule() {
  const { refreshKey, triggerRefresh, setSelectedAnimalId } = useApp()
  const [registros, setRegistros] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      const [rRes, aRes] = await Promise.all([
        fetch('/api/reproducao'),
        fetch('/api/animais'),
      ])
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

  const femeas = animais.filter(a => a.sexo === 'Fêmea')
  const touros = animais.filter(a => a.sexo === 'Macho')
  const filtered = filterStatus === 'todos' ? registros : registros.filter(r => r.status === filterStatus)
  const gestantes = registros.filter(r => r.status === 'Gestante').length
  const paridas = registros.filter(r => r.status === 'Parida').length

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir registro de reprodução?')) return
    try {
      await fetch(`/api/reproducao/${id}`, { method: 'DELETE' })
      toast.success('Registro excluído')
      triggerRefresh()
    } catch (e) {
      toast.error('Erro')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Reprodução</h2>
          <p className="text-sm text-muted-foreground">
            {registros.length} registros · {gestantes} gestantes · {paridas} paridas
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={femeas.length === 0}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Monta
        </Button>
      </div>

      {femeas.length === 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            Cadastre fêmeas no módulo Animais para começar a registrar reprodução.
          </CardContent>
        </Card>
      )}

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos status</SelectItem>
          {STATUS_REPRO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Baby className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum registro de reprodução</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const diasParto = r.dataPrevistaParto ? daysUntil(r.dataPrevistaParto) : null
            return (
              <Card key={r.id}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline">{r.tipo}</Badge>
                        <Badge className={statusColor(r.status)}>{r.status}</Badge>
                        {r.femea ? (
                          <button
                            className="font-medium text-sm hover:underline"
                            onClick={() => setSelectedAnimalId(r.femea.id)}
                          >
                            ♀ {r.femea.nome || r.femea.identificacao}
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">♀ Animal removido</span>
                        )}
                        {r.touro && (
                          <span className="text-xs text-muted-foreground">
                            × ♂ {r.touro.nome || r.touro.identificacao}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Monta: {formatDate(r.dataMonta)}</span>
                        {r.dataPrevistaParto && (
                          <span className={`flex items-center gap-1 ${diasParto && diasParto <= 30 && r.status === 'Gestante' ? 'text-amber-600 font-medium' : ''}`}>
                            <Heart className="h-3 w-3" />
                            Parto previsto: {formatDate(r.dataPrevistaParto)}
                            {r.status === 'Gestante' && diasParto !== null && ` (${diasParto < 0 ? 'atrasado' : `${diasParto}d`})`}
                          </span>
                        )}
                        {r.dataParto && <span>Parto: {formatDate(r.dataParto)}</span>}
                      </div>
                      {r.resultado && <p className="text-xs text-green-600 mt-1">{r.resultado}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="shrink-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ReproForm
        open={formOpen}
        femeas={femeas}
        touros={touros}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); triggerRefresh() }}
      />
    </div>
  )
}

function ReproForm({ open, femeas, touros, onClose, onSaved }: { open: boolean; femeas: any[]; touros: any[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    femeaId: '',
    touroId: '',
    tipo: 'Monta Natural',
    dataMonta: new Date().toISOString().split('T')[0],
    dataPrevistaParto: '',
    dataParto: '',
    status: 'Gestante',
    resultado: '',
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        femeaId: femeas[0]?.id || '',
        touroId: touros[0]?.id || '',
        tipo: 'Monta Natural',
        dataMonta: new Date().toISOString().split('T')[0],
        dataPrevistaParto: '',
        dataParto: '',
        status: 'Gestante',
        resultado: '',
        observacoes: '',
      })
    }
  }, [open])

  // Auto-calcular data prevista de parto (285 dias)
  useEffect(() => {
    if (form.dataMonta && !form.dataPrevistaParto) {
      const d = new Date(form.dataMonta)
      d.setDate(d.getDate() + 285)
      setForm(f => ({ ...f, dataPrevistaParto: d.toISOString().split('T')[0] }))
    }
  }, [form.dataMonta])

  const handleSubmit = async () => {
    if (!form.femeaId) { toast.error('Selecione a fêmea'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/reproducao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Registro de reprodução criado!')
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Monta / Inseminação</DialogTitle>
          <DialogDescription>Registre o acasalamento. A data prevista de parto é calculada automaticamente (285 dias).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fêmea *</Label>
              <Select value={form.femeaId} onValueChange={(v) => setForm({ ...form, femeaId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a fêmea" /></SelectTrigger>
                <SelectContent>
                  {femeas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.identificacao} ({a.identificacao})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Touro</Label>
              <Select value={form.touroId} onValueChange={(v) => setForm({ ...form, touroId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o touro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não informado</SelectItem>
                  {touros.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.identificacao} ({a.identificacao})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_REPRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataMonta">Data da Monta</Label>
              <Input id="dataMonta" type="date" value={form.dataMonta} onChange={(e) => setForm({ ...form, dataMonta: e.target.value, dataPrevistaParto: '' })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dataPrevistaParto">Parto Previsto</Label>
              <Input id="dataPrevistaParto" type="date" value={form.dataPrevistaParto} onChange={(e) => setForm({ ...form, dataPrevistaParto: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataParto">Parto Realizado</Label>
              <Input id="dataParto" type="date" value={form.dataParto} onChange={(e) => setForm({ ...form, dataParto: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_REPRO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resultado">Resultado</Label>
              <Input id="resultado" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} placeholder="Sucesso - Bezerro saudável" />
            </div>
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
