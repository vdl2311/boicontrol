import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/relatorios - Relatório consolidado de desempenho
export async function GET() {
  try {
    const [animais, transacoes, pesagens, reproducao, saude, alimentacao] = await Promise.all([
      db.animal.findMany(),
      db.transacao.findMany(),
      db.pesagem.findMany(),
      db.reproducao.findMany(),
      db.saude.findMany(),
      db.alimentacao.findMany(),
    ])

    // Resumo do rebanho
    const totalAnimais = animais.length
    const totalPesado = animais.reduce((s, a) => s + (a.pesoAtual || 0), 0)
    const pesoMedio = totalAnimais ? totalPesado / totalAnimais : 0

    // Arrobas estimadas (1 arroba = 15 kg, rendimento 50%)
    const arrobasTotal = (totalPesado * 0.5) / 15
    const arrobasPorAnimal = pesoMedio ? (pesoMedio * 0.5) / 15 : 0

    // GMD - Ganho Médio Diário por animal
    const gmdPorAnimal = animais.map(animal => {
      const pesos = pesagens.filter(p => p.animalId === animal.id).sort((a, b) => a.data.getTime() - b.data.getTime())
      if (pesos.length < 2) return { animal: animal.nome || animal.identificacao, gmd: 0 }
      const primeiro = pesos[0]
      const ultimo = pesos[pesos.length - 1]
      const diffDays = (ultimo.data.getTime() - primeiro.data.getTime()) / (1000 * 60 * 60 * 24)
      const gmd = diffDays > 0 ? (ultimo.peso - primeiro.peso) / diffDays : 0
      return { animal: animal.nome || animal.identificacao, gmd: Number(gmd.toFixed(3)) }
    }).filter(a => a.gmd > 0)

    // Financeiro
    const receitas = transacoes.filter(t => t.tipo === 'Receita').reduce((s, t) => s + t.valor, 0)
    const despesas = transacoes.filter(t => t.tipo === 'Despesa').reduce((s, t) => s + t.valor, 0)
    const lucro = receitas - despesas
    const margem = receitas > 0 ? (lucro / receitas) * 100 : 0

    // Despesas por categoria
    const despesasPorCategoria = transacoes
      .filter(t => t.tipo === 'Despesa')
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor
        return acc
      }, {} as Record<string, number>)

    // Receitas por categoria
    const receitasPorCategoria = transacoes
      .filter(t => t.tipo === 'Receita')
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor
        return acc
      }, {} as Record<string, number>)

    // Custo por animal
    const custoPorAnimal = totalAnimais ? despesas / totalAnimais : 0

    // Reprodução - taxa de prenhez
    const femeas = animais.filter(a => a.sexo === 'Fêmea')
    const totalMontas = reproducao.length
    const paridas = reproducao.filter(r => r.status === 'Parida').length
    const gestantes = reproducao.filter(r => r.status === 'Gestante').length
    const taxaPrenhez = totalMontas > 0 ? (paridas / totalMontas) * 100 : 0

    // Saúde
    const custoSaudeTotal = saude.reduce((s, r) => s + (r.custo || 0), 0)
    const custoSaudePorAnimal = totalAnimais ? custoSaudeTotal / totalAnimais : 0

    // Alimentação
    const custoAlimentacaoMensal = alimentacao.reduce((s, a) => s + (a.quantidade * (a.custoUnitario || 0) * 30), 0)

    return NextResponse.json({
      rebanho: {
        totalAnimais,
        pesoTotal: Number(totalPesado.toFixed(1)),
        pesoMedio: Number(pesoMedio.toFixed(1)),
        arrobasTotal: Number(arrobasTotal.toFixed(2)),
        arrobasPorAnimal: Number(arrobasPorAnimal.toFixed(2)),
        femeas: femeas.length,
        machos: totalAnimais - femeas.length,
      },
      desempenho: {
        gmdPorAnimal: gmdPorAnimal.sort((a, b) => b.gmd - a.gmd).slice(0, 10),
        gmdMedio: gmdPorAnimal.length > 0 ? Number((gmdPorAnimal.reduce((s, a) => s + a.gmd, 0) / gmdPorAnimal.length).toFixed(3)) : 0,
      },
      financeiro: {
        receitas,
        despesas,
        lucro,
        margem: Number(margem.toFixed(2)),
        custoPorAnimal: Number(custoPorAnimal.toFixed(2)),
        despesasPorCategoria,
        receitasPorCategoria,
      },
      reproducao: {
        totalMontas,
        paridas,
        gestantes,
        taxaPrenhez: Number(taxaPrenhez.toFixed(1)),
      },
      saude: {
        totalRegistros: saude.length,
        custoTotal: custoSaudeTotal,
        custoPorAnimal: Number(custoSaudePorAnimal.toFixed(2)),
      },
      alimentacao: {
        custoMensal: Number(custoAlimentacaoMensal.toFixed(2)),
        custoPorAnimalMes: totalAnimais ? Number((custoAlimentacaoMensal / totalAnimais).toFixed(2)) : 0,
      },
    })
  } catch (error) {
    console.error('Erro relatório:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
