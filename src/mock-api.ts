import { db } from '@/lib/db'

export function setupMockApi() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    
    // Only intercept requests starting with /api/
    if (!urlStr.includes('/api/')) {
      return originalFetch.apply(this, arguments as any)
    }

    const url = new URL(urlStr, window.location.origin)
    const pathname = url.pathname
    const searchParams = url.searchParams
    const method = init?.method?.toUpperCase() || 'GET'
    
    let body: any = null
    if (init?.body) {
      try {
        if (typeof init.body === 'string') {
          body = JSON.parse(init.body)
        }
      } catch (e) {
        // Ignorar falha no parse do body
      }
    }

    try {
      // 1. SEED ENDPOINT
      if (pathname === '/api/seed' && method === 'POST') {
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
          return d.toISOString()
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

        const pesagensData: { animalId: string; peso: number; data: string }[] = []
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

        return jsonResponse({ success: true, message: 'Banco populado com dados de demonstração' }, 200)
      }

      // 2. DASHBOARD ENDPOINT
      if (pathname === '/api/dashboard' && method === 'GET') {
        const fazenda = await db.fazenda.findFirst()
        if (!fazenda) {
          return jsonResponse({ error: 'Nenhuma fazenda encontrada. Execute o seed.' }, 404)
        }

        const [animais, saude, reproducao, transacoes, pesagens, alimentacao] = await Promise.all([
          db.animal.findMany(),
          db.saude.findMany(),
          db.reproducao.findMany(),
          db.transacao.findMany(),
          db.pesagem.findMany(),
          db.alimentacao.findMany(),
        ])

        const totalAnimais = animais.length
        const ativos = animais.filter((a: any) => a.status === 'Ativo').length
        const machos = animais.filter((a: any) => a.sexo === 'Macho').length
        const femeas = animais.filter((a: any) => a.sexo === 'Fêmea').length

        const porCategoria = animais.reduce((acc: any, a: any) => {
          acc[a.categoria] = (acc[a.categoria] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const porRaca = animais.reduce((acc: any, a: any) => {
          const r = a.raca || 'Não informada'
          acc[r] = (acc[r] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const pesoTotal = animais.reduce((sum: number, a: any) => sum + (Number(a.pesoAtual) || 0), 0)
        const pesoMedio = totalAnimais > 0 ? pesoTotal / totalAnimais : 0

        const receitas = transacoes.filter((t: any) => t.tipo === 'Receita').reduce((s: number, t: any) => s + Number(t.valor), 0)
        const despesas = transacoes.filter((t: any) => t.tipo === 'Despesa').reduce((s: number, t: any) => s + Number(t.valor), 0)
        const saldo = receitas - despesas

        const despesasPorCategoria = transacoes
          .filter((t: any) => t.tipo === 'Despesa')
          .reduce((acc: any, t: any) => {
            acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
            return acc
          }, {} as Record<string, number>)

        const now = new Date()
        const trintaDias = new Date(now)
        trintaDias.setDate(trintaDias.getDate() + 30)

        const vacinasVencendo = saude.filter((s: any) => s.proximaDose && new Date(s.proximaDose) <= trintaDias)
        const totalSaude = saude.length

        const gestantes = reproducao.filter((r: any) => r.status === 'Gestante').length
        const paridas = reproducao.filter((r: any) => r.status === 'Parida').length

        const reproducoesGestantes = reproducao.filter((r: any) => r.dataPrevistaParto && new Date(r.dataPrevistaParto) >= now && r.status === 'Gestante')
        
        const proximosPartos: any[] = []
        for (const p of reproducoesGestantes) {
          const femea = animais.find((a: any) => a.id === p.femeaId)
          if (femea) {
            proximosPartos.push({
              id: p.id,
              femea: femea.nome || femea.identificacao,
              identificacao: femea.identificacao,
              dataPrevista: p.dataPrevistaParto,
              tipo: p.tipo,
            })
          }
        }
        proximosPartos.sort((a, b) => new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime())
        const proximosPartosSliced = proximosPartos.slice(0, 5)

        const pesagensPorMes = new Map<string, { sum: number; count: number }>()
        pesagens.forEach((p: any) => {
          const pData = new Date(p.data)
          const key = `${pData.getFullYear()}-${String(pData.getMonth() + 1).padStart(2, '0')}`
          const cur = pesagensPorMes.get(key) || { sum: 0, count: 0 }
          cur.sum += Number(p.peso)
          cur.count += 1
          pesagensPorMes.set(key, cur)
        })
        const evolucaoPeso = Array.from(pesagensPorMes.entries())
          .sort()
          .slice(-6)
          .map(([mes, { sum, count }]) => ({ mes, media: Number((sum / count).toFixed(1)) }))

        const finMes = new Map<string, { receita: number; despesa: number }>()
        transacoes.forEach((t: any) => {
          const tData = new Date(t.data)
          const key = `${tData.getFullYear()}-${String(tData.getMonth() + 1).padStart(2, '0')}`
          const cur = finMes.get(key) || { receita: 0, despesa: 0 }
          if (t.tipo === 'Receita') cur.receita += Number(t.valor)
          else cur.despesa += Number(t.valor)
          finMes.set(key, cur)
        })
        const evolucaoFinanceira = Array.from(finMes.entries())
          .sort()
          .slice(-6)
          .map(([mes, v]) => ({ mes, ...v }))

        const custoAlimentacaoMensal = alimentacao.reduce((s: number, a: any) => s + (Number(a.quantidade) * (Number(a.custoUnitario) || 0) * 30), 0)

        const alertasVacinas: any[] = []
        for (const v of vacinasVencendo) {
          const animal = animais.find((a: any) => a.id === v.animalId)
          if (animal) {
            alertasVacinas.push({
              id: v.id,
              animal: animal.nome || animal.identificacao,
              identificacao: animal.identificacao,
              descricao: v.descricao,
              proximaDose: v.proximaDose,
            })
          }
        }
        const alertasVacinasSliced = alertasVacinas.slice(0, 5)

        const dashboardData = {
          fazenda,
          kpis: {
            totalAnimais,
            ativos,
            machos,
            femeas,
            pesoTotal: Number(pesoTotal.toFixed(1)),
            pesoMedio: Number(pesoMedio.toFixed(1)),
            receitas,
            despesas,
            saldo,
            gestantes,
            paridas,
            totalSaude,
            vacinasVencendo: vacinasVencendo.length,
            custoAlimentacaoMensal: Number(custoAlimentacaoMensal.toFixed(2)),
          },
          porCategoria,
          porRaca,
          despesasPorCategoria,
          proximosPartos: proximosPartosSliced,
          evolucaoPeso,
          evolucaoFinanceira,
          alertasVacinas: alertasVacinasSliced,
        }

        return jsonResponse(dashboardData, 200)
      }

      // 3. RELATORIOS ENDPOINT
      if (pathname === '/api/relatorios' && method === 'GET') {
        const [animais, transacoes, pesagens, reproducao, saude, alimentacao] = await Promise.all([
          db.animal.findMany(),
          db.transacao.findMany(),
          db.pesagem.findMany(),
          db.reproducao.findMany(),
          db.saude.findMany(),
          db.alimentacao.findMany(),
        ])

        const totalAnimais = animais.length
        const totalPesado = animais.reduce((s: number, a: any) => s + (Number(a.pesoAtual) || 0), 0)
        const pesoMedio = totalAnimais ? totalPesado / totalAnimais : 0

        const arrobasTotal = (totalPesado * 0.5) / 15
        const arrobasPorAnimal = pesoMedio ? (pesoMedio * 0.5) / 15 : 0

        const gmdPorAnimal = animais.map((animal: any) => {
          const pesos = pesagens.filter((p: any) => p.animalId === animal.id).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
          if (pesos.length < 2) return { animal: animal.nome || animal.identificacao, gmd: 0 }
          const primeiro = pesos[0]
          const ultimo = pesos[pesos.length - 1]
          const diffDays = (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / (1000 * 60 * 60 * 24)
          const gmd = diffDays > 0 ? (ultimo.peso - primeiro.peso) / diffDays : 0
          return { animal: animal.nome || animal.identificacao, gmd: Number(gmd.toFixed(3)) }
        }).filter((a: any) => a.gmd > 0)

        const receitas = transacoes.filter((t: any) => t.tipo === 'Receita').reduce((s: number, t: any) => s + Number(t.valor), 0)
        const despesas = transacoes.filter((t: any) => t.tipo === 'Despesa').reduce((s: number, t: any) => s + Number(t.valor), 0)
        const lucro = receitas - despesas
        const margem = receitas > 0 ? (lucro / receitas) * 100 : 0

        const despesasPorCategoria = transacoes
          .filter((t: any) => t.tipo === 'Despesa')
          .reduce((acc: any, t: any) => {
            acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
            return acc
          }, {} as Record<string, number>)

        const receitasPorCategoria = transacoes
          .filter((t: any) => t.tipo === 'Receita')
          .reduce((acc: any, t: any) => {
            acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
            return acc
          }, {} as Record<string, number>)

        const custoPorAnimal = totalAnimais ? despesas / totalAnimais : 0

        const femeas = animais.filter((a: any) => a.sexo === 'Fêmea')
        const totalMontas = reproducao.length
        const paridas = reproducao.filter((r: any) => r.status === 'Parida').length
        const gestantes = reproducao.filter((r: any) => r.status === 'Gestante').length
        const taxaPrenhez = totalMontas > 0 ? (paridas / totalMontas) * 100 : 0

        const custoSaudeTotal = saude.reduce((s: number, r: any) => s + (Number(r.custo) || 0), 0)
        const custoSaudePorAnimal = totalAnimais ? custoSaudeTotal / totalAnimais : 0

        const custoAlimentacaoMensal = alimentacao.reduce((s: number, a: any) => s + (Number(a.quantidade) * (Number(a.custoUnitario) || 0) * 30), 0)

        const reportData = {
          rebanho: {
            totalAnimais,
            pesoTotal: Number(totalPesado.toFixed(1)),
            pesoMedio: Number(pesoMedio.toFixed(1)),
            arrobasTotal: Number(arrobasTotal.toFixed(2)),
            arrobasPorAnimal: Number(arrobasPorAnimal.toFixed(2)),
            femeas: femeas.length,
            machos: totalAnimais - femeas.length,
          },
          desempenho: {
            gmdPorAnimal: gmdPorAnimal.sort((a: any, b: any) => b.gmd - a.gmd).slice(0, 10),
            gmdMedio: gmdPorAnimal.length > 0 ? Number((gmdPorAnimal.reduce((s: number, a: any) => s + a.gmd, 0) / gmdPorAnimal.length).toFixed(3)) : 0,
          },
          financeiro: {
            receitas,
            despesas,
            lucro,
            margem: Number(margem.toFixed(2)),
            custoPorAnimal: Number(custoPorAnimal.toFixed(2)),
            despesasPorCategoria,
            receitasPorCategoria,
          },
          reproducao: {
            totalMontas,
            paridas,
            gestantes,
            taxaPrenhez: Number(taxaPrenhez.toFixed(1)),
          },
          saude: {
            totalRegistros: saude.length,
            custoTotal: custoSaudeTotal,
            custoPorAnimal: Number(custoSaudePorAnimal.toFixed(2)),
          },
          alimentacao: {
            custoMensal: Number(custoAlimentacaoMensal.toFixed(2)),
            custoPorAnimalMes: totalAnimais ? Number((custoAlimentacaoMensal / totalAnimais).toFixed(2)) : 0,
          },
        }

        return jsonResponse(reportData, 200)
      }

      // 4. ANIMAIS LIST & CREATE
      if (pathname === '/api/animais' && method === 'GET') {
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const sexo = searchParams.get('sexo') || ''
        const categoria = searchParams.get('categoria') || ''

        const fazenda = await db.fazenda.findFirst()
        if (!fazenda) return jsonResponse([], 200)

        const allAnimais = await db.animal.findMany()
        let filtered = allAnimais.filter((a: any) => a.fazendaId === fazenda.id)

        if (search) {
          const s = search.toLowerCase()
          filtered = filtered.filter((a: any) => 
            String(a.identificacao || '').toLowerCase().includes(s) ||
            String(a.nome || '').toLowerCase().includes(s) ||
            String(a.raca || '').toLowerCase().includes(s)
          )
        }
        if (status && status !== 'todos') {
          filtered = filtered.filter((a: any) => a.status === status)
        }
        if (sexo && sexo !== 'todos') {
          filtered = filtered.filter((a: any) => a.sexo === sexo)
        }
        if (categoria && categoria !== 'todos') {
          filtered = filtered.filter((a: any) => a.categoria === categoria)
        }

        // Add count
        for (const a of filtered) {
          const saudesCount = await db.saude.count({ where: { animalId: a.id } })
          const pesagensCount = await db.pesagem.count({ where: { animalId: a.id } })
          a._count = { registrosSaude: saudesCount, registrosPeso: pesagensCount }
        }

        return jsonResponse(filtered, 200)
      }

      if (pathname === '/api/animais' && method === 'POST') {
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
            dataNascimento: body.dataNascimento || null,
            pesoInicial: body.pesoInicial ? Number(body.pesoInicial) : null,
            pesoAtual: body.pesoAtual ? Number(body.pesoAtual) : (body.pesoInicial ? Number(body.pesoInicial) : null),
            status: body.status || 'Ativo',
            cor: body.cor || null,
            origem: body.origem || null,
            fotoUrl: body.fotoUrl || null,
            observacoes: body.observacoes || null,
            fazendaId: fazenda.id,
          },
        })

        if (body.pesoInicial) {
          await db.pesagem.create({
            data: {
              animalId: animal.id,
              peso: Number(body.pesoInicial),
              data: body.dataNascimento || new Date().toISOString(),
            },
          })
        }

        return jsonResponse(animal, 201)
      }

      // 5. ANIMAIS INDIVIDUAL ENDPOINTS (GET, PUT, DELETE)
      const animalIdMatch = pathname.match(/^\/api\/animais\/([^/]+)$/)
      if (animalIdMatch) {
        const id = animalIdMatch[1]
        
        if (method === 'GET') {
          const animal = await db.animal.findUnique({ where: { id } })
          if (!animal) return jsonResponse({ error: 'Animal não encontrado' }, 404)

          const allAnimais = await db.animal.findMany()
          const pai = animal.paiId ? allAnimais.find((a: any) => a.id === animal.paiId) : null
          const mae = animal.maeId ? allAnimais.find((a: any) => a.id === animal.maeId) : null
          const filhosPai = allAnimais.filter((a: any) => a.paiId === id)
          const filhosMae = allAnimais.filter((a: any) => a.maeId === id)

          const registrosSaude = await db.saude.findMany({ where: { animalId: id } })
          registrosSaude.sort((a: any, b: any) => new Date(b.dataAplicacao).getTime() - new Date(a.dataAplicacao).getTime())

          const registrosPeso = await db.pesagem.findMany({ where: { animalId: id } })
          registrosPeso.sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())

          const registrosAlimentacao = await db.alimentacao.findMany({ where: { animalId: id } })
          registrosAlimentacao.sort((a: any, b: any) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())

          const montas = await db.reproducao.findMany({ where: { femeaId: id } })
          for (const m of montas) {
            if (m.touroId) {
              m.touro = allAnimais.find((a: any) => a.id === m.touroId) || null
            }
          }
          montas.sort((a: any, b: any) => new Date(b.dataMonta).getTime() - new Date(a.dataMonta).getTime())

          const coberturas = await db.reproducao.findMany({ where: { touroId: id } })
          for (const c of coberturas) {
            if (c.femeaId) {
              c.femea = allAnimais.find((a: any) => a.id === c.femeaId) || null
            }
          }
          coberturas.sort((a: any, b: any) => new Date(b.dataMonta).getTime() - new Date(a.dataMonta).getTime())

          const transacoes = await db.transacao.findMany({ where: { animalId: id } })
          transacoes.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())

          return jsonResponse({
            ...animal,
            pai,
            mae,
            filhosPai,
            filhosMae,
            registrosSaude,
            registrosPeso,
            registrosAlimentacao,
            montas,
            coberturas,
            transacoes,
          }, 200)
        }

        if (method === 'PUT') {
          const updated = await db.animal.update({
            where: { id },
            data: {
              identificacao: body.identificacao,
              nome: body.nome || null,
              raca: body.raca || null,
              sexo: body.sexo,
              categoria: body.categoria,
              dataNascimento: body.dataNascimento || null,
              pesoInicial: body.pesoInicial ? Number(body.pesoInicial) : null,
              pesoAtual: body.pesoAtual ? Number(body.pesoAtual) : null,
              status: body.status,
              cor: body.cor || null,
              origem: body.origem || null,
              fotoUrl: body.fotoUrl || null,
              observacoes: body.observacoes || null,
            },
          })
          return jsonResponse(updated, 200)
        }

        if (method === 'DELETE') {
          await db.animal.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // 6. SAUDE LIST & CREATE & INDIVIDUAL
      if (pathname === '/api/saude' && method === 'GET') {
        const animalId = searchParams.get('animalId')
        const where: any = {}
        if (animalId) where.animalId = animalId

        const registros = await db.saude.findMany({ where })
        for (const r of registros) {
          if (r.animalId) {
            r.animal = await db.animal.findUnique({ where: { id: r.animalId } })
          }
        }
        registros.sort((a: any, b: any) => new Date(b.dataAplicacao).getTime() - new Date(a.dataAplicacao).getTime())
        return jsonResponse(registros, 200)
      }

      if (pathname === '/api/saude' && method === 'POST') {
        const registro = await db.saude.create({
          data: {
            animalId: body.animalId,
            tipo: body.tipo,
            descricao: body.descricao,
            produto: body.produto || null,
            dosagem: body.dosagem || null,
            veterinario: body.veterinario || null,
            custo: body.custo ? Number(body.custo) : 0,
            dataAplicacao: body.dataAplicacao || new Date().toISOString(),
            proximaDose: body.proximaDose || null,
            observacoes: body.observacoes || null,
          },
        })

        if (body.custo && Number(body.custo) > 0) {
          const fazenda = await db.fazenda.findFirst()
          if (fazenda) {
            await db.transacao.create({
              data: {
                tipo: 'Despesa',
                categoria: 'Vacina',
                descricao: `${body.tipo}: ${body.descricao}`,
                valor: Number(body.custo),
                data: body.dataAplicacao || new Date().toISOString(),
                animalId: body.animalId,
                fazendaId: fazenda.id,
              },
            })
          }
        }

        return jsonResponse(registro, 201)
      }

      const saudeIdMatch = pathname.match(/^\/api\/saude\/([^/]+)$/)
      if (saudeIdMatch) {
        const id = saudeIdMatch[1]
        if (method === 'DELETE') {
          await db.saude.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // 7. PESAGEM LIST & CREATE & INDIVIDUAL
      if (pathname === '/api/pesagem' && method === 'GET') {
        const animalId = searchParams.get('animalId')
        const where: any = {}
        if (animalId) where.animalId = animalId

        const registros = await db.pesagem.findMany({ where })
        for (const r of registros) {
          if (r.animalId) {
            r.animal = await db.animal.findUnique({ where: { id: r.animalId } })
          }
        }
        registros.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        return jsonResponse(registros, 200)
      }

      if (pathname === '/api/pesagem' && method === 'POST') {
        const peso = Number(body.peso)
        const registro = await db.pesagem.create({
          data: {
            animalId: body.animalId,
            peso,
            data: body.data || new Date().toISOString(),
            observacoes: body.observacoes || null,
          },
        })

        await db.animal.update({
          where: { id: body.animalId },
          data: { pesoAtual: peso },
        })

        return jsonResponse(registro, 201)
      }

      const pesagemIdMatch = pathname.match(/^\/api\/pesagem\/([^/]+)$/)
      if (pesagemIdMatch) {
        const id = pesagemIdMatch[1]
        if (method === 'DELETE') {
          await db.pesagem.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // 8. ALIMENTACAO LIST & CREATE & INDIVIDUAL
      if (pathname === '/api/alimentacao' && method === 'GET') {
        const registros = await db.alimentacao.findMany()
        for (const r of registros) {
          if (r.animalId) {
            r.animal = await db.animal.findUnique({ where: { id: r.animalId } })
          }
        }
        registros.sort((a: any, b: any) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
        return jsonResponse(registros, 200)
      }

      if (pathname === '/api/alimentacao' && method === 'POST') {
        const registro = await db.alimentacao.create({
          data: {
            animalId: body.animalId || null,
            lote: body.lote || null,
            tipoRacao: body.tipoRacao,
            quantidade: Number(body.quantidade),
            custoUnitario: body.custoUnitario ? Number(body.custoUnitario) : null,
            dataInicio: body.dataInicio || new Date().toISOString(),
            dataFim: body.dataFim || null,
            observacoes: body.observacoes || null,
          },
        })

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
                data: new Date().toISOString(),
                animalId: body.animalId || null,
                fazendaId: fazenda.id,
              },
            })
          }
        }

        return jsonResponse(registro, 201)
      }

      const alimentacaoIdMatch = pathname.match(/^\/api\/alimentacao\/([^/]+)$/)
      if (alimentacaoIdMatch) {
        const id = alimentacaoIdMatch[1]
        if (method === 'DELETE') {
          await db.alimentacao.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // 9. REPRODUCAO LIST & CREATE & INDIVIDUAL
      if (pathname === '/api/reproducao' && method === 'GET') {
        const status = searchParams.get('status')
        const where: any = {}
        if (status && status !== 'todos') where.status = status

        const registros = await db.reproducao.findMany({ where })
        for (const r of registros) {
          if (r.femeaId) {
            r.femea = await db.animal.findUnique({ where: { id: r.femeaId } })
          }
          if (r.touroId) {
            r.touro = await db.animal.findUnique({ where: { id: r.touroId } })
          }
        }
        registros.sort((a: any, b: any) => new Date(b.dataMonta).getTime() - new Date(a.dataMonta).getTime())
        return jsonResponse(registros, 200)
      }

      if (pathname === '/api/reproducao' && method === 'POST') {
        const dataMonta = body.dataMonta || new Date().toISOString()
        
        const dataPrevistaPartoDate = new Date(dataMonta)
        dataPrevistaPartoDate.setDate(dataPrevistaPartoDate.getDate() + 285)
        const dataPrevistaParto = dataPrevistaPartoDate.toISOString()

        const registro = await db.reproducao.create({
          data: {
            femeaId: body.femeaId,
            touroId: body.touroId || null,
            tipo: body.tipo || 'Monta Natural',
            dataMonta,
            dataPrevistaParto: body.dataPrevistaParto || dataPrevistaParto,
            dataParto: body.dataParto || null,
            status: body.status || 'Gestante',
            resultado: body.resultado || null,
            observacoes: body.observacoes || null,
          },
        })

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

        return jsonResponse(registro, 201)
      }

      const reproducaoIdMatch = pathname.match(/^\/api\/reproducao\/([^/]+)$/)
      if (reproducaoIdMatch) {
        const id = reproducaoIdMatch[1]
        if (method === 'DELETE') {
          await db.reproducao.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // 10. TRANSACOES LIST & CREATE & INDIVIDUAL
      if (pathname === '/api/transacoes' && method === 'GET') {
        const tipo = searchParams.get('tipo')
        const where: any = {}
        if (tipo && tipo !== 'todos') where.tipo = tipo

        const transacoes = await db.transacao.findMany({ where })
        for (const t of transacoes) {
          if (t.animalId) {
            t.animal = await db.animal.findUnique({ where: { id: t.animalId } })
          }
        }
        transacoes.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        return jsonResponse(transacoes, 200)
      }

      if (pathname === '/api/transacoes' && method === 'POST') {
        const fazenda = await db.fazenda.findFirst()
        if (!fazenda) {
          return jsonResponse({ error: 'Nenhuma fazenda encontrada' }, 404)
        }

        const transacao = await db.transacao.create({
          data: {
            tipo: body.tipo,
            categoria: body.categoria,
            descricao: body.descricao,
            valor: Number(body.valor),
            data: body.data || new Date().toISOString(),
            animalId: body.animalId || null,
            fazendaId: fazenda.id,
            observacoes: body.observacoes || null,
          },
        })

        if (body.animalId) {
          if (body.tipo === 'Receita' && body.categoria === 'Venda de Animal') {
            await db.animal.update({
              where: { id: body.animalId },
              data: { status: 'Vendido' },
            })
          }
        }

        return jsonResponse(transacao, 201)
      }

      const transacaoIdMatch = pathname.match(/^\/api\/transacoes\/([^/]+)$/)
      if (transacaoIdMatch) {
        const id = transacaoIdMatch[1]
        if (method === 'DELETE') {
          await db.transacao.delete({ where: { id } })
          return jsonResponse({ success: true }, 200)
        }
      }

      // Fallback if URL is matched but doesn't have custom implementation
      return jsonResponse({ error: `Not Implemented in Mock API: ${pathname}` }, 404)
    } catch (err) {
      console.error('Mock API Error:', err)
      return jsonResponse({ error: 'Internal Server Error', detail: String(err) }, 500)
    }
  }

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
  })
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
