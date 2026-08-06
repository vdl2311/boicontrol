'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Beef, Calendar, Weight, HeartPulse, Baby, DollarSign, Pencil, User, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, formatNumber, formatDate, calcAge, statusColor } from '@/lib/utils'
import { toast } from 'sonner'

interface AnimalDetailData {
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
  pai?: { id: string; identificacao: string; nome?: string; raca?: string } | null
  mae?: { id: string; identificacao: string; nome?: string; raca?: string } | null
  filhosPai: Array<{ id: string; identificacao: string; nome?: string; dataNascimento: string }>
  filhosMae: Array<{ id: string; identificacao: string; nome?: string; dataNascimento: string }>
  registrosSaude: Array<any>
  registrosPeso: Array<any>
  registrosAlimentacao: Array<any>
  montas: Array<any>
  coberturas: Array<any>
  transacoes: Array<any>
}

export function AnimalDetail({ animalId, onBack }: { animalId: string; onBack: () => void }) {
  const [data, setData] = useState<AnimalDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/animais/${animalId}`)
        if (!res.ok) throw new Error()
        const d = await res.json()
        setData(d)
      } catch (e) {
        toast.error('Erro ao carregar animal')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [animalId])

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return null

  // GMD - ganho médio diário
  const pesos = data.registrosPeso.map((p: any) => ({
    data: formatDate(p.data),
    peso: p.peso,
    raw: p.data,
  })).sort((a: any, b: any) => new Date(a.raw).getTime() - new Date(b.raw).getTime())

  let gmd = 0
  if (pesos.length >= 2) {
    const primeiro = pesos[0]
    const ultimo = pesos[pesos.length - 1]
    const diffDays = (new Date(ultimo.raw).getTime() - new Date(primeiro.raw).getTime()) / (1000 * 60 * 60 * 24)
    gmd = diffDays > 0 ? (ultimo.peso - primeiro.peso) / diffDays : 0
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24 md:pb-6">
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar
      </Button>

      {/* Cabeçalho */}
      <Card className="overflow-hidden">
        <div className="aspect-[5/2] md:aspect-[5/1.5] bg-gradient-to-br from-secondary to-muted relative">
          {data.fotoUrl ? (
            <img src={data.fotoUrl} alt={data.nome || data.identificacao} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Beef className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{data.nome || data.identificacao}</h1>
                <Badge className={statusColor(data.status)}>{data.status}</Badge>
                <Badge variant="outline">{data.sexo}</Badge>
                <Badge variant="secondary">{data.categoria}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Brinco: <span className="font-medium text-foreground">{data.identificacao}</span>
                {data.raca && ` · Raça: ${data.raca}`}
                {data.cor && ` · Cor: ${data.cor}`}
              </p>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StatCard icon={Weight} label="Peso Atual" value={`${formatNumber(data.pesoAtual || 0, 0)} kg`} />
            <StatCard icon={Calendar} label="Idade" value={calcAge(data.dataNascimento)} />
            <StatCard icon={Beef} label="GMD" value={`${formatNumber(gmd, 3)} kg/d`} />
            <StatCard icon={DollarSign} label="Custos" value={formatCurrency(data.transacoes.reduce((s: number, t: any) => t.tipo === 'Despesa' ? s + t.valor : s, 0))} />
          </div>

          {data.observacoes && (
            <div className="mt-4 p-3 rounded-lg bg-secondary text-sm">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p>{data.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs com histórico */}
      <Tabs defaultValue="peso" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="peso" className="text-xs md:text-sm"><Weight className="h-3 w-3 md:mr-1" /><span className="hidden md:inline">Peso</span></TabsTrigger>
          <TabsTrigger value="saude" className="text-xs md:text-sm"><HeartPulse className="h-3 w-3 md:mr-1" /><span className="hidden md:inline">Saúde</span></TabsTrigger>
          <TabsTrigger value="reproducao" className="text-xs md:text-sm"><Baby className="h-3 w-3 md:mr-1" /><span className="hidden md:inline">Repro.</span></TabsTrigger>
          <TabsTrigger value="genealogia" className="text-xs md:text-sm"><Users className="h-3 w-3 md:mr-1" /><span className="hidden md:inline">Genealogia</span></TabsTrigger>
          <TabsTrigger value="alimentacao" className="text-xs md:text-sm"><span className="hidden md:inline">Alim.</span></TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs md:text-sm"><DollarSign className="h-3 w-3 md:mr-1" /><span className="hidden md:inline">Fin.</span></TabsTrigger>
        </TabsList>

        {/* Tab Peso */}
        <TabsContent value="peso" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução de Peso</CardTitle>
            </CardHeader>
            <CardContent>
              {pesos.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={pesos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                    <Tooltip formatter={(v: number) => `${formatNumber(v, 1)} kg`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="peso" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma pesagem registrada</p>
              )}
            </CardContent>
          </Card>
          {pesos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Pesagens ({pesos.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {pesos.slice().reverse().map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(p.peso, 1)} kg</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{p.data}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Saúde */}
        <TabsContent value="saude">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Médico ({data.registrosSaude.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.registrosSaude.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de saúde</p>
              ) : (
                <div className="space-y-3">
                  {data.registrosSaude.map((s: any) => (
                    <div key={s.id} className="border-l-2 border-primary/30 pl-3 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{s.tipo}</Badge>
                          <p className="font-medium text-sm">{s.descricao}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(s.dataAplicacao)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {s.produto && <p>Produto: {s.produto} · {s.dosagem}</p>}
                        {s.veterinario && <p>Veterinário: {s.veterinario}</p>}
                        {s.custo && s.custo > 0 && <p>Custo: {formatCurrency(s.custo)}</p>}
                        {s.proximaDose && <p className="text-amber-600">Próxima dose: {formatDate(s.proximaDose)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Reprodução */}
        <TabsContent value="reproducao">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.sexo === 'Fêmea' ? 'Histórico de Montas' : 'Coberturas Realizadas'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.sexo === 'Fêmea' ? data.montas : data.coberturas).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de reprodução</p>
              ) : (
                <div className="space-y-3">
                  {(data.sexo === 'Fêmea' ? data.montas : data.coberturas).map((r: any) => {
                    const parceiro = data.sexo === 'Fêmea' ? r.touro : r.femea
                    return (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline">{r.tipo}</Badge>
                          <Badge className={statusColor(r.status)}>{r.status}</Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {data.sexo === 'Fêmea' ? 'Touro' : 'Fêmea'}: {parceiro?.nome || parceiro?.identificacao || 'Não informado'}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <p>Monta: {formatDate(r.dataMonta)}</p>
                          {r.dataPrevistaParto && <p>Parto previsto: {formatDate(r.dataPrevistaParto)}</p>}
                          {r.dataParto && <p>Parto: {formatDate(r.dataParto)}</p>}
                          {r.resultado && <p className="text-green-600">Resultado: {r.resultado}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Genealogia */}
        <TabsContent value="genealogia">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genealogia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pai</p>
                  {data.pai ? (
                    <div className="border rounded-lg p-3">
                      <p className="font-medium">{data.pai.nome || data.pai.identificacao}</p>
                      <p className="text-xs text-muted-foreground">{data.pai.identificacao} · {data.pai.raca || 'Sem raça'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Não cadastrado</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mãe</p>
                  {data.mae ? (
                    <div className="border rounded-lg p-3">
                      <p className="font-medium">{data.mae.nome || data.mae.identificacao}</p>
                      <p className="text-xs text-muted-foreground">{data.mae.identificacao} · {data.mae.raca || 'Sem raça'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Não cadastrado</p>
                  )}
                </div>
              </div>

              {(data.filhosPai.length > 0 || data.filhosMae.length > 0) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Filhos ({data.filhosPai.length + data.filhosMae.length})</p>
                  <div className="space-y-2">
                    {[...data.filhosPai, ...data.filhosMae].map((f, i) => (
                      <div key={i} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                        <span className="font-medium">{f.nome || f.identificacao}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(f.dataNascimento)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alimentação */}
        <TabsContent value="alimentacao">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alimentação ({data.registrosAlimentacao.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.registrosAlimentacao.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de alimentação</p>
              ) : (
                <div className="space-y-2">
                  {data.registrosAlimentacao.map((a: any) => (
                    <div key={a.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{a.tipoRacao}</Badge>
                        <span className="text-xs text-muted-foreground">Início: {formatDate(a.dataInicio)}</span>
                      </div>
                      <p className="text-sm mt-1">{formatNumber(a.quantidade, 0)} kg/dia</p>
                      {a.custoUnitario && <p className="text-xs text-muted-foreground">Custo: {formatCurrency(a.custoUnitario)}/kg</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Financeiro */}
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transações ({data.transacoes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.transacoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação vinculada</p>
              ) : (
                <div className="space-y-2">
                  {data.transacoes.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={t.tipo === 'Receita' ? 'default' : 'secondary'}>{t.tipo}</Badge>
                          <p className="font-medium text-sm">{t.descricao}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.categoria} · {formatDate(t.data)}</p>
                      </div>
                      <p className={`font-bold ${t.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'Receita' ? '+' : '-'}{formatCurrency(t.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Weight; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-bold text-sm md:text-base">{value}</p>
    </div>
  )
}
