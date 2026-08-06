import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - Popular banco com dados de demonstração
export async function POST(req: NextRequest) {
  try {
    await db.transacao.deleteMany()
    await db.reproducao.deleteMany()
    await db.alimentacao.deleteMany()
    await db.pesagem.deleteMany()
    await db.saude.deleteMany()
    await db.animal.deleteMany()
    await db.fazenda.deleteMany()

    const fazenda = await db.fazenda.create({
      data: {
        nome: 'Fazenda Boa Vista',
        cidade: 'Cuiabá',
        estado: 'MT',
        areaTotal: 1250.5,
      },
    })

    const now = new Date()
    const monthsAgo = (m: number) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - m)
      return d
    }

    const animaisData = [
      { identificacao: 'BR-001', nome: 'Estrela', raca: 'Nelore', sexo: 'Fêmea', categoria: 'Vaca', dataNascimento: monthsAgo(60), pesoInicial: 480, pesoAtual: 525, status: 'Ativo', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-002', nome: 'Trovão', raca: 'Nelore', sexo: 'Macho', categoria: 'Touro', dataNascimento: monthsAgo(48), pesoInicial: 620, pesoAtual: 780, status: 'Ativo', cor: 'Branco', origem: 'Compra externa' },
      { identificacao: 'BR-003', nome: 'Flor', raca: 'Nelore', sexo: 'Fêmea', categoria: 'Novilha', dataNascimento: monthsAgo(24), pesoInicial: 280, pesoAtual: 365, status: 'Ativo', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-004', nome: 'Coração', raca: 'Angus', sexo: 'Macho', categoria: 'Novilha', dataNascimento: monthsAgo(18), pesoInicial: 220, pesoAtual: 310, status: 'Ativo', cor: 'Preto', origem: 'Compra externa' },
      { identificacao: 'BR-005', nome: 'Esperança', raca: 'Girolanda', sexo: 'Fêmea', categoria: 'Vaca', dataNascimento: monthsAgo(72), pesoInicial: 450, pesoAtual: 498, status: 'Ativo', cor: 'Pintado', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-006', nome: 'Veloz', raca: 'Nelore', sexo: 'Macho', categoria: 'Novilha', dataNascimento: monthsAgo(20), pesoInicial: 240, pesoAtual: 342, status: 'Ativo', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-007', nome: 'Lua', raca: 'Nelore', sexo: 'Fêmea', categoria: 'Bezerra', dataNascimento: monthsAgo(8), pesoInicial: 32, pesoAtual: 145, status: 'Ativo', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-008', nome: 'Sol', raca: 'Nelore', sexo: 'Macho', categoria: 'Bezerro', dataNascimento: monthsAgo(6), pesoInicial: 35, pesoAtual: 138, status: 'Ativo', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-009', nome: 'Aurora', raca: 'Nelore', sexo: 'Fêmea', categoria: 'Vaca', dataNascimento: monthsAgo(84), pesoInicial: 470, pesoAtual: 512, status: 'Gestante', cor: 'Branco', origem: 'Nascimento na fazenda' },
      { identificacao: 'BR-010', nome: 'Brave', raca: 'Angus', sexo: 'Macho', categoria: 'Novilha', dataNascimento: monthsAgo(15), pesoInicial: 210, pesoAtual: 295, status: 'Ativo', cor: 'Preto', origem: 'Compra externa' },
    ]
    await db.animal.createMany({
      data: animaisData.map(a => ({ ...a, fazendaId: fazenda.id })),
    })

    const animaisList = await db.animal.findMany()
    const findAnimal = (id: string) => animaisList.find(a => a.identificacao === id)!

    await db.saude.createMany({
      data: [
        { animalId: findAnimal('BR-001').id, tipo: 'Vacina', descricao: 'Vacina contra Aftosa', produto: 'Aftosa Bovilis', dosagem: '5ml', custo: 12.5, dataAplicacao: monthsAgo(3), proximaDose: monthsAgo(-9) },
        { animalId: findAnimal('BR-001').id, tipo: 'Vermífugo', descricao: 'Vermífugo de amplo espectro', produto: 'Ivermectina', dosagem: '1ml/50kg', custo: 8.0, dataAplicacao: monthsAgo(1), proximaDose: monthsAgo(-5) },
        { animalId: findAnimal('BR-002').id, tipo: 'Exame', descricao: 'Exame andrológico', veterinario: 'Dr. Silva', custo: 150.0, dataAplicacao: monthsAgo(2) },
        { animalId: findAnimal('BR-003').id, tipo: 'Vacina', descricao: 'Vacina contra Carbúnculo', produto: 'Carbúnculo Vac', dosagem: '2ml', custo: 18.0, dataAplicacao: monthsAgo(4), proximaDose: monthsAgo(-8) },
        { animalId: findAnimal('BR-005').id, tipo: 'Tratamento', descricao: 'Tratamento de mastite', produto: 'Penicilina', dosagem: '10ml', custo: 35.0, dataAplicacao: monthsAgo(1), veterinario: 'Dr. Silva' },
        { animalId: findAnimal('BR-009').id, tipo: 'Exame', descricao: 'Diagnóstico de gestação', veterinario: 'Dr. Silva', custo: 80.0, dataAplicacao: monthsAgo(2) },
      ],
    })

    const pesagensData: { animalId: string; peso: number; data: Date }[] = []
    animaisList.forEach(animal => {
      if (animal.pesoInicial && animal.pesoAtual) {
        const diff = animal.pesoAtual - animal.pesoInicial
        for (let i = 0; i < 5; i++) {
          pesagensData.push({
            animalId: animal.id,
            peso: Number((animal.pesoInicial + (diff * i) / 4).toFixed(1)),
            data: monthsAgo(6 - i * 1.5),
          })
        }
        pesagensData.push({ animalId: animal.id, peso: animal.pesoAtual, data: monthsAgo(0) })
      }
    })
    await db.pesagem.createMany({ data: pesagensData })

    await db.alimentacao.createMany({
      data: [
        { lote: 'Lote Reprodução', tipoRacao: 'Sal Mineral', quantidade: 80, custoUnitario: 4.5, dataInicio: monthsAgo(6) },
        { lote: 'Lote Engorda', tipoRacao: 'Concentrado', quantidade: 250, custoUnitario: 2.8, dataInicio: monthsAgo(3) },
        { lote: 'Lote Bezerros', tipoRacao: 'Ração Inicial', quantidade: 60, custoUnitario: 5.2, dataInicio: monthsAgo(2) },
      ],
    })

    await db.reproducao.createMany({
      data: [
        { femeaId: findAnimal('BR-001').id, touroId: findAnimal('BR-002').id, tipo: 'Monta Natural', dataMonta: monthsAgo(7), dataPrevistaParto: monthsAgo(-2), dataParto: monthsAgo(-2), status: 'Parida', resultado: 'Sucesso - Bezerro saudável' },
        { femeaId: findAnimal('BR-009').id, touroId: findAnimal('BR-002').id, tipo: 'Inseminação', dataMonta: monthsAgo(5), dataPrevistaParto: monthsAgo(-4), status: 'Gestante' },
        { femeaId: findAnimal('BR-003').id, touroId: findAnimal('BR-002').id, tipo: 'Monta Natural', dataMonta: monthsAgo(2), dataPrevistaParto: monthsAgo(-7), status: 'Gestante' },
        { femeaId: findAnimal('BR-005').id, touroId: findAnimal('BR-002').id, tipo: 'Monta Natural', dataMonta: monthsAgo(8), dataPrevistaParto: monthsAgo(-1), dataParto: monthsAgo(-1), status: 'Parida', resultado: 'Sucesso - Bezerra' },
      ],
    })

    await db.transacao.createMany({
      data: [
        { tipo: 'Despesa', categoria: 'Vacina', descricao: 'Compra de vacinas - lote reprodução', valor: 850, data: monthsAgo(3), fazendaId: fazenda.id },
        { tipo: 'Despesa', categoria: 'Ração', descricao: 'Compra de sal mineral', valor: 2400, data: monthsAgo(2), fazendaId: fazenda.id },
        { tipo: 'Despesa', categoria: 'Combustível', descricao: 'Diesel para trator', valor: 1850, data: monthsAgo(1), fazendaId: fazenda.id },
        { tipo: 'Receita', categoria: 'Venda de Animal', descricao: 'Venda de 3 bois gordos', valor: 15600, data: monthsAgo(2), fazendaId: fazenda.id },
        { tipo: 'Despesa', categoria: 'Manutenção', descricao: 'Manutenção de cerca', valor: 650, data: monthsAgo(1), fazendaId: fazenda.id },
        { tipo: 'Despesa', categoria: 'Salário', descricao: 'Salário peão de fazenda', valor: 2800, data: monthsAgo(0), fazendaId: fazenda.id },
        { tipo: 'Receita', categoria: 'Venda de Animal', descricao: 'Venda de 2 novilhas', valor: 8200, data: monthsAgo(0), fazendaId: fazenda.id },
        { tipo: 'Despesa', categoria: 'Compra de Insumo', descricao: 'Compra de 5 bezerros', valor: 12500, data: monthsAgo(4), fazendaId: fazenda.id },
      ],
    })

    return NextResponse.json({ success: true, message: 'Banco populado com dados de demonstração', counts: { animais: animaisList.length, fazendas: 1 } })
  } catch (error) {
    console.error('Erro no seed:', error)
    return NextResponse.json({ error: 'Erro ao popular banco de dados', detail: String(error) }, { status: 500 })
  }
}
