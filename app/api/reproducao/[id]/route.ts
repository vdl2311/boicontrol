import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.reproducao.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const registro = await db.reproducao.update({
      where: { id },
      data: {
        femeaId: body.femeaId,
        touroId: body.touroId || null,
        tipo: body.tipo,
        dataMonta: body.dataMonta ? new Date(body.dataMonta) : undefined,
        dataPrevistaParto: body.dataPrevistaParto ? new Date(body.dataPrevistaParto) : null,
        dataParto: body.dataParto ? new Date(body.dataParto) : null,
        status: body.status,
        resultado: body.resultado || null,
        observacoes: body.observacoes || null,
      },
    })
    return NextResponse.json(registro)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 })
  }
}
