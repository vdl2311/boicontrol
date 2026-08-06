import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reproducao
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'todos') where.status = status

    const registros = await db.reproducao.findMany({
      where,
      include: {
        femea: { select: { id: true, identificacao: true, nome: true, fotoUrl: true } },
        touro: { select: { id: true, identificacao: true, nome: true } },
      },
      orderBy: { dataMonta: 'desc' },
    })
    return NextResponse.json(registros)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar reprodução' }, { status: 500 })
  }
}

// POST /api/reproducao
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const dataMonta = body.dataMonta ? new Date(body.dataMonta) : new Date()

    // Calcular data prevista de parto (285 dias ≈ 9.5 meses)
    const dataPrevistaParto = new Date(dataMonta)
    dataPrevistaParto.setDate(dataPrevistaParto.getDate() + 285)

    const registro = await db.reproducao.create({
      data: {
        femeaId: body.femeaId,
        touroId: body.touroId || null,
        tipo: body.tipo || 'Monta Natural',
        dataMonta,
        dataPrevistaParto: body.dataPrevistaParto ? new Date(body.dataPrevistaParto) : dataPrevistaParto,
        dataParto: body.dataParto ? new Date(body.dataParto) : null,
        status: body.status || 'Gestante',
        resultado: body.resultado || null,
        observacoes: body.observacoes || null,
      },
    })

    // Se nasceu um bezerro, atualizar status da mãe
    if (body.status === 'Parida' && body.femeaId) {
      await db.animal.update({
        where: { id: body.femeaId },
        data: { status: 'Ativo' },
      })
    } else if (body.status === 'Gestante' && body.femeaId) {
      await db.animal.update({
        where: { id: body.femeaId },
        data: { status: 'Gestante' },
      })
    }

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar reprodução:', error)
    return NextResponse.json({ error: 'Erro ao criar registro de reprodução' }, { status: 500 })
  }
}
