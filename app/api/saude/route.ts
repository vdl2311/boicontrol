import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/saude - Listar registros de saúde
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const animalId = searchParams.get('animalId')

    const where: any = {}
    if (animalId) where.animalId = animalId

    const registros = await db.saude.findMany({
      where,
      include: { animal: { select: { id: true, identificacao: true, nome: true, fotoUrl: true } } },
      orderBy: { dataAplicacao: 'desc' },
    })
    return NextResponse.json(registros)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar saúde' }, { status: 500 })
  }
}

// POST /api/saude - Criar registro de saúde
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const registro = await db.saude.create({
      data: {
        animalId: body.animalId,
        tipo: body.tipo,
        descricao: body.descricao,
        produto: body.produto || null,
        dosagem: body.dosagem || null,
        veterinario: body.veterinario || null,
        custo: body.custo ? Number(body.custo) : 0,
        dataAplicacao: body.dataAplicacao ? new Date(body.dataAplicacao) : new Date(),
        proximaDose: body.proximaDose ? new Date(body.proximaDose) : null,
        observacoes: body.observacoes || null,
      },
    })

    // Se houver custo, registrar como despesa financeira
    if (body.custo && Number(body.custo) > 0) {
      const fazenda = await db.fazenda.findFirst()
      if (fazenda) {
        await db.transacao.create({
          data: {
            tipo: 'Despesa',
            categoria: 'Vacina',
            descricao: `${body.tipo}: ${body.descricao}`,
            valor: Number(body.custo),
            data: body.dataAplicacao ? new Date(body.dataAplicacao) : new Date(),
            animalId: body.animalId,
            fazendaId: fazenda.id,
          },
        })
      }
    }

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar saúde:', error)
    return NextResponse.json({ error: 'Erro ao criar registro de saúde' }, { status: 500 })
  }
}
