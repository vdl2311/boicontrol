import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transacoes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')

    const where: any = {}
    if (tipo && tipo !== 'todos') where.tipo = tipo

    const transacoes = await db.transacao.findMany({
      where,
      include: { animal: { select: { id: true, identificacao: true, nome: true } } },
      orderBy: { data: 'desc' },
    })
    return NextResponse.json(transacoes)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar transações' }, { status: 500 })
  }
}

// POST /api/transacoes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fazenda = await db.fazenda.findFirst()
    if (!fazenda) {
      return NextResponse.json({ error: 'Nenhuma fazenda encontrada' }, { status: 404 })
    }

    const transacao = await db.transacao.create({
      data: {
        tipo: body.tipo,
        categoria: body.categoria,
        descricao: body.descricao,
        valor: Number(body.valor),
        data: body.data ? new Date(body.data) : new Date(),
        animalId: body.animalId || null,
        fazendaId: fazenda.id,
        observacoes: body.observacoes || null,
      },
    })

    // Se for venda/compra de animal, atualizar status
    if (body.animalId) {
      if (body.tipo === 'Receita' && body.categoria === 'Venda de Animal') {
        await db.animal.update({
          where: { id: body.animalId },
          data: { status: 'Vendido' },
        })
      }
    }

    return NextResponse.json(transacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 })
  }
}
