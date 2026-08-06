'use client'

import { useEffect, useState } from 'react'
import { useApp } from './app-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Beef, Plus, Search, MapPin, Calendar, Weight, Filter, MoreVertical, Pencil, Trash2, ArrowLeft, Camera } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, calcAge, statusColor, toDateInput } from '@/lib/utils'
import { toast } from 'sonner'
import { AnimalDetail } from './animal-detail'

interface Animal {
  id: string
  identificacao: string
  nome?: string
  raca?: string
  sexo: string
  categoria: string
  dataNascimento?: string
  pesoInicial?: number
  pesoAtual?: number
  status: string
  cor?: string
  origem?: string
  fotoUrl?: string
  observacoes?: string
  _count?: { registrosSaude: number; registrosPeso: number }
}

const CATEGORIAS = ['Bezerro', 'Bezerra', 'Novilha', 'Garrote', 'Touro', 'Vaca', 'Boi', 'Corte']
const STATUSES = ['Ativo', 'Gestante', 'Vendido', 'Abatido', 'Óbito']

export function AnimaisModule() {
  const { selectedAnimalId, setSelectedAnimalId, refreshKey, triggerRefresh } = useApp()
  const [animais, setAnimais] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSexo, setFilterSexo] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Animal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterSexo !== 'todos') params.set('sexo', filterSexo)
      if (filterStatus !== 'todos') params.set('status', filterStatus)
      if (filterCategoria !== 'todos') params.set('categoria', filterCategoria)
      const res = await fetch(`/api/animais?${params}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAnimais(data)
      } else {
        setAnimais([])
        if (data && data.error) {
          toast.error(data.error)
        }
      }
    } catch (e) {
      toast.error('Erro ao carregar animais')
      setAnimais([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, filterSexo, filterStatus, filterCategoria, refreshKey])

  // Se houver um animal selecionado, mostra a ficha detalhada
  if (selectedAnimalId) {
    return <AnimalDetail animalId={selectedAnimalId} onBack={() => setSelectedAnimalId(null)} />
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/animais/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Animal excluído')
        setDeleteId(null)
        triggerRefresh()
      } else {
        toast.error('Erro ao excluir animal')
      }
    } catch (e) {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header com busca e botão */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Rebanho</h2>
          <p className="text-sm text-muted-foreground">
            {animais.length} {animais.length === 1 ? 'animal' : 'animais'} cadastrados
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Animal
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por brinco, nome ou raça..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={filterSexo} onValueChange={setFilterSexo}>
              <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos sexos</SelectItem>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de animais */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : animais.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Beef className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum animal encontrado</p>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4 mr-1.5" />
              Cadastrar primeiro animal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {animais.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onClick={() => setSelectedAnimalId(animal.id)}
              onEdit={() => { setEditing(animal); setFormOpen(true) }}
              onDelete={() => setDeleteId(animal.id)}
            />
          ))}
        </div>
      )}

      {/* Form */}
      <AnimalForm
        open={formOpen}
        animal={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          triggerRefresh()
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir animal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os registros de saúde, peso, reprodução e financeiros vinculados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AnimalCard({
  animal,
  onClick,
  onEdit,
  onDelete,
}: {
  animal: Animal
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <Card className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden" >
      <CardContent className="p-0" onClick={onClick}>
        {/* Foto/placeholder */}
        <div className="aspect-[5/3] bg-gradient-to-br from-secondary to-muted relative">
          {animal.fotoUrl ? (
            <img src={animal.fotoUrl} alt={animal.nome || animal.identificacao} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Beef className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={`${statusColor(animal.status)} border-0`}>{animal.status}</Badge>
          </div>
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-md z-10 w-32">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit() }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary text-destructive flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold truncate">{animal.nome || animal.identificacao}</p>
              <Badge variant="outline" className="text-xs shrink-0">{animal.sexo}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{animal.identificacao} · {animal.raca || 'Sem raça'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Weight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{formatNumber(animal.pesoAtual || 0, 0)} kg</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{calcAge(animal.dataNascimento)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t">
            <Badge variant="secondary" className="text-xs">{animal.categoria}</Badge>
            <span className="text-muted-foreground">
              {animal._count?.registrosSaude || 0} saúde · {animal._count?.registrosPeso || 0} pesos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnimalForm({
  open,
  animal,
  onClose,
  onSaved,
}: {
  open: boolean
  animal: Animal | null
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (animal) {
      setForm({
        identificacao: animal.identificacao,
        nome: animal.nome || '',
        raca: animal.raca || '',
        sexo: animal.sexo,
        categoria: animal.categoria,
        dataNascimento: toDateInput(animal.dataNascimento),
        pesoInicial: animal.pesoInicial || '',
        pesoAtual: animal.pesoAtual || '',
        status: animal.status,
        cor: animal.cor || '',
        origem: animal.origem || '',
        observacoes: animal.observacoes || '',
        fotoUrl: animal.fotoUrl || '',
      })
    } else {
      setForm({
        identificacao: '',
        nome: '',
        raca: 'Nelore',
        sexo: 'Macho',
        categoria: 'Corte',
        dataNascimento: '',
        pesoInicial: '',
        pesoAtual: '',
        status: 'Ativo',
        cor: '',
        origem: '',
        observacoes: '',
        fotoUrl: '',
      })
    }
  }, [animal, open])

  const handleSubmit = async () => {
    if (!form.identificacao) {
      toast.error('Identificação é obrigatória')
      return
    }
    setSaving(true)
    try {
      const url = animal ? `/api/animais/${animal.id}` : '/api/animais'
      const method = animal ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(animal ? 'Animal atualizado!' : 'Animal cadastrado!')
        onSaved()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao salvar')
      }
    } catch (e) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{animal ? 'Editar Animal' : 'Cadastrar Novo Animal'}</DialogTitle>
          <DialogDescription>
            Preencha as informações do animal. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="identificacao">Identificação / Brinco *</Label>
            <Input
              id="identificacao"
              value={form.identificacao || ''}
              onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
              placeholder="BR-001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome || ''}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Estrela"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="raca">Raça</Label>
            <Input
              id="raca"
              value={form.raca || ''}
              onChange={(e) => setForm({ ...form, raca: e.target.value })}
              placeholder="Nelore, Angus, Girolanda..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cor">Cor</Label>
            <Input
              id="cor"
              value={form.cor || ''}
              onChange={(e) => setForm({ ...form, cor: e.target.value })}
              placeholder="Branco, Preto, Pintado..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={form.dataNascimento || ''}
              onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pesoInicial">Peso Inicial (kg)</Label>
            <Input
              id="pesoInicial"
              type="number"
              step="0.1"
              value={form.pesoInicial || ''}
              onChange={(e) => setForm({ ...form, pesoInicial: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pesoAtual">Peso Atual (kg)</Label>
            <Input
              id="pesoAtual"
              type="number"
              step="0.1"
              value={form.pesoAtual || ''}
              onChange={(e) => setForm({ ...form, pesoAtual: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="origem">Origem</Label>
            <Input
              id="origem"
              value={form.origem || ''}
              onChange={(e) => setForm({ ...form, origem: e.target.value })}
              placeholder="Nascimento na fazenda, compra externa..."
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="fotoUrl">URL da Foto</Label>
            <Input
              id="fotoUrl"
              value={form.fotoUrl || ''}
              onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Em produção, integração com Firebase Storage para upload de fotos
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes || ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Anotações sobre o animal..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : (animal ? 'Salvar alterações' : 'Cadastrar animal')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
