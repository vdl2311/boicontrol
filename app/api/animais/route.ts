import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/animais - Listar animais (com filtros)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sexo = searchParams.get('sexo') || ''
    const categoria = searchParams.get('categoria') || ''

    const fazenda = await db.fazenda.findFirst()
    if (!fazenda) return NextResponse.json([])

    const where: any = { fazendaId: fazenda.id }
    if (search) {
      where.OR = [
        { identificacao: { contains: search } },
        { nome: { contains: search } },
        { raca: { contains: search } },
      ]
    }
    if (status && status !== 'todos') where.status = status
    if (sexo && sexo !== 'todos') where.sexo = sexo
    if (categoria && categoria !== 'todos') where.categoria = categoria

    const animais = await db.animal.findMany({
      where,
      include: {
        _count: {
          select: { registrosSaude: true, registrosPeso: true },
        },
      },
      orderBy: { identificacao: 'asc' },
    })
    return NextResponse.json(animais)
  } catch (error) {
    console.error('Erro ao listar animais:', error)
    return NextResponse.json({ error: 'Erro ao listar animais' }, { status: 500 })
  }
}

// POST /api/animais - Criar animal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let fazenda = await db.fazenda.findFirst()
    if (!fazenda) {
      fazenda = await db.fazenda.create({ data: { nome: 'Minha Fazenda' } })
    }

    const animal = await db.animal.create({
      data: {
        identificacao: body.identificacao,
        nome: body.nome || null,
        raca: body.raca || null,
        sexo: body.sexo || 'Macho',
        categoria: body.categoria || 'Corte',
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        pesoInicial: body.pesoInicial ? Number(body.pesoInicial) : null,
        pesoAtual: body.pesoAtual ? Number(body.pesoAtual) : null,
        status: body.status || 'Ativo',
        cor: body.cor || null,
        origem: body.origem || null,
        fotoUrl: body.fotoUrl || null,
        observacoes: body.observacoes || null,
        fazendaId: fazenda.id,
      },
    })

    // Se informou peso, registrar pesagem inicial
    if (body.pesoInicial) {
      await db.pesagem.create({
        data: {
          animalId: animal.id,
          peso: Number(body.pesoInicial),
        },
      })
    }

    return NextResponse.json(animal, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar animal:', error)
    return NextResponse.json({ error: 'Erro ao criar animal', detail: String(error) }, { status: 500 })
  }
}
