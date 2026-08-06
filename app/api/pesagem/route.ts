import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pesagem
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const animalId = searchParams.get('animalId')

    const where: any = {}
    if (animalId) where.animalId = animalId

    const registros = await db.pesagem.findMany({
      where,
      include: { animal: { select: { id: true, identificacao: true, nome: true } } },
      orderBy: { data: 'desc' },
    })
    return NextResponse.json(registros)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar pesagens' }, { status: 500 })
  }
}

// POST /api/pesagem
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const peso = Number(body.peso)

    const registro = await db.pesagem.create({
      data: {
        animalId: body.animalId,
        peso,
        data: body.data ? new Date(body.data) : new Date(),
        observacoes: body.observacoes || null,
      },
    })

    // Atualizar peso atual do animal
    await db.animal.update({
      where: { id: body.animalId },
      data: { pesoAtual: peso },
    })

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pesagem:', error)
    return NextResponse.json({ error: 'Erro ao registrar pesagem' }, { status: 500 })
  }
}
