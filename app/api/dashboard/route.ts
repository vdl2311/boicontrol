import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - KPIs agregados para o dashboard
export async function GET() {
  try {
    const fazenda = await db.fazenda.findFirst()
    if (!fazenda) {
      return NextResponse.json({ error: 'Nenhuma fazenda encontrada. Execute o seed.' }, { status: 404 })
    }

    const [animais, saude, reproducao, transacoes, pesagens, alimentacao] = await Promise.all([
      db.animal.findMany({ include: { _count: { select: { registrosSaude: true, registrosPeso: true } } } }),
      db.saude.findMany({ include: { animal: true } }),
      db.reproducao.findMany({ include: { femea: true, touro: true } }),
      db.transacao.findMany(),
      db.pesagem.findMany(),
      db.alimentacao.findMany(),
    ])

    const totalAnimais = animais.length
    const ativos = animais.filter(a => a.status === 'Ativo').length
    const machos = animais.filter(a => a.sexo === 'Macho').length
    const femeas = animais.filter(a => a.sexo === 'Fêmea').length

    // por categoria
    const porCategoria = animais.reduce((acc, a) => {
      acc[a.categoria] = (acc[a.categoria] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // por raça
    const porRaca = animais.reduce((acc, a) => {
      const r = a.raca || 'Não informada'
      acc[r] = (acc[r] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // peso total e médio
    const pesoTotal = animais.reduce((sum, a) => sum + (a.pesoAtual || 0), 0)
    const pesoMedio = totalAnimais > 0 ? pesoTotal / totalAnimais : 0

    // Financeiro
    const receitas = transacoes.filter(t => t.tipo === 'Receita').reduce((s, t) => s + t.valor, 0)
    const despesas = transacoes.filter(t => t.tipo === 'Despesa').reduce((s, t) => s + t.valor, 0)
    const saldo = receitas - despesas

    // Despesas por categoria
    const despesasPorCategoria = transacoes
      .filter(t => t.tipo === 'Despesa')
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor
        return acc
      }, {} as Record<string, number>)

    // Saúde - alertas de vacinas vencendo (próximos 30 dias ou já vencidas)
    const now = new Date()
    const trintaDias = new Date(now)
    trintaDias.setDate(trintaDias.getDate() + 30)

    const vacinasVencendo = saude.filter(s => s.proximaDose && new Date(s.proximaDose) <= trintaDias)
    const totalSaude = saude.length

    // Reprodução
    const gestantes = reproducao.filter(r => r.status === 'Gestante').length
    const paridas = reproducao.filter(r => r.status === 'Parida').length
    const proximosPartos = reproducao
      .filter(r => r.dataPrevistaParto && r.dataPrevistaParto >= now && r.status === 'Gestante')
      .sort((a, b) => (a.dataPrevistaParto?.getTime() || 0) - (b.dataPrevistaParto?.getTime() || 0))
      .slice(0, 5)

    // Evolução de peso média por mês (média aritmética dos animais)
    const pesagensPorMes = new Map<string, { sum: number; count: number }>()
    pesagens.forEach(p => {
      const key = `${p.data.getFullYear()}-${String(p.data.getMonth() + 1).padStart(2, '0')}`
      const cur = pesagensPorMes.get(key) || { sum: 0, count: 0 }
      cur.sum += p.peso
      cur.count += 1
      pesagensPorMes.set(key, cur)
    })
    const evolucaoPeso = Array.from(pesagensPorMes.entries())
      .sort()
      .slice(-6)
      .map(([mes, { sum, count }]) => ({ mes, media: Number((sum / count).toFixed(1)) }))

    // Evolução financeira (últimos 6 meses)
    const finMes = new Map<string, { receita: number; despesa: number }>()
    transacoes.forEach(t => {
      const key = `${t.data.getFullYear()}-${String(t.data.getMonth() + 1).padStart(2, '0')}`
      const cur = finMes.get(key) || { receita: 0, despesa: 0 }
      if (t.tipo === 'Receita') cur.receita += t.valor
      else cur.despesa += t.valor
      finMes.set(key, cur)
    })
    const evolucaoFinanceira = Array.from(finMes.entries())
      .sort()
      .slice(-6)
      .map(([mes, v]) => ({ mes, ...v }))

    // Alimentação - custo total mensal estimado
    const custoAlimentacaoMensal = alimentacao.reduce((s, a) => s + (a.quantidade * (a.custoUnitario || 0) * 30), 0)

    return NextResponse.json({
      fazenda,
      kpis: {
        totalAnimais,
        ativos,
        machos,
        femeas,
        pesoTotal: Number(pesoTotal.toFixed(1)),
        pesoMedio: Number(pesoMedio.toFixed(1)),
        receitas,
        despesas,
        saldo,
        gestantes,
        paridas,
        totalSaude,
        vacinasVencendo: vacinasVencendo.length,
        custoAlimentacaoMensal: Number(custoAlimentacaoMensal.toFixed(2)),
      },
      porCategoria,
      porRaca,
      despesasPorCategoria,
      proximosPartos: proximosPartos.map(p => ({
        id: p.id,
        femea: p.femea.nome || p.femea.identificacao,
        identificacao: p.femea.identificacao,
        dataPrevista: p.dataPrevistaParto,
        tipo: p.tipo,
      })),
      evolucaoPeso,
      evolucaoFinanceira,
      alertasVacinas: vacinasVencendo.slice(0, 5).map(v => ({
        id: v.id,
        animal: v.animal.nome || v.animal.identificacao,
        identificacao: v.animal.identificacao,
        descricao: v.descricao,
        proximaDose: v.proximaDose,
      })),
    })
  } catch (error) {
    console.error('Erro dashboard:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados', detail: String(error) }, { status: 500 })
  }
}
