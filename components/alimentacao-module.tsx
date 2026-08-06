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
import { Wheat, Plus, Trash2, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const TIPOS_RACAO = ['Sal Mineral', 'Concentrado', 'Silagem', 'Feno', 'Pasto', 'Ração Inicial', 'Ração de Engorda', 'Sal Proteinado']

export function AlimentacaoModule() {
  const { refreshKey, triggerRefresh } = useApp()
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/alimentacao')
      const data = await res.json()
      setRegistros(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error('Erro ao carregar')
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  const custoTotalMensal = registros.reduce((s, r) => s + (r.quantidade * (r.custoUnitario || 0) * 30), 0)

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir registro de alimentação?')) return
    try {
      await fetch(`/api/alimentacao/${id}`, { method: 'DELETE' })
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
          <h2 className="text-lg font-bold">Alimentação</h2>
          <p className="text-sm text-muted-foreground">
            {registros.length} planos alimentares · Custo mensal: {formatCurrency(custoTotalMensal)}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Plano
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : registros.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wheat className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum plano alimentar cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {registros.map(r => {
            const custoMensal = r.quantidade * (r.custoUnitario || 0) * 30
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.tipoRacao}</Badge>
                      {r.lote && <Badge variant="secondary">{r.lote}</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantidade diária</span>
                      <span className="font-medium">{formatNumber(r.quantidade, 0)} kg/dia</span>
                    </div>
                    {r.custoUnitario && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Custo unitário</span>
                        <span className="font-medium">{formatCurrency(r.custoUnitario)}/kg</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Custo mensal estimado</span>
                      <span className="font-bold text-primary">{formatCurrency(custoMensal)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
                      <Calendar className="h-3 w-3" />
                      Início: {formatDate(r.dataInicio)}
                      {r.dataFim && ` · Fim: ${formatDate(r.dataFim)}`}
                    </div>
                    {r.observacoes && <p className="text-xs text-muted-foreground italic">{r.observacoes}</p>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlimentacaoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); triggerRefresh() }}
      />
    </div>
  )
}

function AlimentacaoForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    lote: '',
    tipoRacao: 'Sal Mineral',
    quantidade: '',
    custoUnitario: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        lote: '',
        tipoRacao: 'Sal Mineral',
        quantidade: '',
        custoUnitario: '',
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: '',
        observacoes: '',
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.quantidade || Number(form.quantidade) <= 0) { toast.error('Quantidade inválida'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/alimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Plano alimentar cadastrado!')
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

  const custoMensalEstimado = Number(form.quantidade || 0) * Number(form.custoUnitario || 0) * 30

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Plano Alimentar</DialogTitle>
          <DialogDescription>Registre a alimentação de um lote ou animal</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lote">Lote / Grupo</Label>
              <Input id="lote" value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} placeholder="Lote Engorda" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Ração</Label>
              <Select value={form.tipoRacao} onValueChange={(v) => setForm({ ...form, tipoRacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_RACAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantidade">Quantidade diária (kg) *</Label>
              <Input id="quantidade" type="number" step="0.1" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custo">Custo unitário (R$/kg)</Label>
              <Input id="custo" type="number" step="0.01" value={form.custoUnitario} onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })} placeholder="4,50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input id="dataInicio" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
              <Input id="dataFim" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
            </div>
          </div>
          {custoMensalEstimado > 0 && (
            <div className="bg-secondary/50 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Custo mensal estimado:</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(custoMensalEstimado)}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
