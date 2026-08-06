import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.saude.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const registro = await db.saude.update({
      where: { id },
      data: {
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
    return NextResponse.json(registro)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 })
  }
}
