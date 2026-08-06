import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/animais/[id] - Detalhes do animal com histórico completo
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const animal = await db.animal.findUnique({
      where: { id },
      include: {
        pai: { select: { id: true, identificacao: true, nome: true, raca: true } },
        mae: { select: { id: true, identificacao: true, nome: true, raca: true } },
        filhosPai: { select: { id: true, identificacao: true, nome: true, dataNascimento: true } },
        filhosMae: { select: { id: true, identificacao: true, nome: true, dataNascimento: true } },
        registrosSaude: { orderBy: { dataAplicacao: 'desc' } },
        registrosPeso: { orderBy: { data: 'asc' } },
        registrosAlimentacao: { orderBy: { dataInicio: 'desc' } },
        montas: { include: { touro: { select: { identificacao: true, nome: true } } }, orderBy: { dataMonta: 'desc' } },
        coberturas: { include: { femea: { select: { identificacao: true, nome: true } } }, orderBy: { dataMonta: 'desc' } },
        transacoes: { orderBy: { data: 'desc' } },
      },
    })
    if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    return NextResponse.json(animal)
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json({ error: 'Erro ao buscar animal' }, { status: 500 })
  }
}

// PUT /api/animais/[id] - Atualizar animal
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const animal = await db.animal.update({
      where: { id },
      data: {
        identificacao: body.identificacao,
        nome: body.nome || null,
        raca: body.raca || null,
        sexo: body.sexo,
        categoria: body.categoria,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        pesoInicial: body.pesoInicial ? Number(body.pesoInicial) : null,
        pesoAtual: body.pesoAtual ? Number(body.pesoAtual) : null,
        status: body.status,
        cor: body.cor || null,
        origem: body.origem || null,
        fotoUrl: body.fotoUrl || null,
        observacoes: body.observacoes || null,
      },
    })
    return NextResponse.json(animal)
  } catch (error) {
    console.error('Erro ao atualizar animal:', error)
    return NextResponse.json({ error: 'Erro ao atualizar animal' }, { status: 500 })
  }
}

// DELETE /api/animais/[id] - Excluir animal
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.animal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir animal:', error)
    return NextResponse.json({ error: 'Erro ao excluir animal' }, { status: 500 })
  }
}
