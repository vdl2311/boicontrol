import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alimentacao
export async function GET(req: NextRequest) {
  try {
    const registros = await db.alimentacao.findMany({
      include: { animal: { select: { id: true, identificacao: true, nome: true } } },
      orderBy: { dataInicio: 'desc' },
    })
    return NextResponse.json(registros)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar alimentação' }, { status: 500 })
  }
}

// POST /api/alimentacao
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const registro = await db.alimentacao.create({
      data: {
        animalId: body.animalId || null,
        lote: body.lote || null,
        tipoRacao: body.tipoRacao,
        quantidade: Number(body.quantidade),
        custoUnitario: body.custoUnitario ? Number(body.custoUnitario) : null,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : new Date(),
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        observacoes: body.observacoes || null,
      },
    })

    // Registrar despesa financeira
    if (body.custoUnitario && Number(body.custoUnitario) > 0) {
      const fazenda = await db.fazenda.findFirst()
      if (fazenda) {
        const custoMensal = Number(body.quantidade) * Number(body.custoUnitario) * 30
        await db.transacao.create({
          data: {
            tipo: 'Despesa',
            categoria: 'Ração',
            descricao: `${body.tipoRacao} - ${body.lote || 'Geral'}`,
            valor: custoMensal,
            data: new Date(),
            animalId: body.animalId || null,
            fazendaId: fazenda.id,
          },
        })
      }
    }

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar alimentação:', error)
    return NextResponse.json({ error: 'Erro ao registrar alimentação' }, { status: 500 })
  }
}
