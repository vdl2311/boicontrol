import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, collection, query, where } from 'firebase/firestore'
import firebaseConfig from '../firebase-applet-config.json'

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId)

class FirestoreCollectionAdapter<T> {
  constructor(private collectionName: string) {}

  private getCollection() {
    return collection(firestore, this.collectionName)
  }

  async findFirst(args?: any) {
    const items = await this.findMany(args)
    return items[0] || null
  }

  async findUnique(args: { where: { id: string }; include?: any }) {
    const id = args.where.id
    if (!id) return null
    const docRef = doc(firestore, this.collectionName, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = { id: docSnap.id, ...docSnap.data() } as any

    if (args.include) {
      await this.resolveIncludes(data, args.include)
    }
    return data
  }

  async findMany(args?: any) {
    const colRef = this.getCollection()
    const items: any[] = []
    const querySnapshot = await getDocs(colRef)
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() })
    })

    let filtered = [...items]

    if (args?.where) {
      const w = args.where
      filtered = filtered.filter(item => {
        for (const [key, value] of Object.entries(w)) {
          if (key === 'OR' && Array.isArray(value)) {
            const orMatch = value.some((cond: any) => {
              return Object.entries(cond).every(([ck, cv]: [string, any]) => {
                if (cv && typeof cv === 'object' && 'contains' in cv) {
                  const itemVal = String(item[ck] || '').toLowerCase()
                  return itemVal.includes(String(cv.contains).toLowerCase())
                }
                return item[ck] === cv
              })
            })
            if (!orMatch) return false
          } else if (value && typeof value === 'object' && 'contains' in value) {
            const itemVal = String(item[key] || '').toLowerCase()
            if (!itemVal.includes(String((value as any).contains).toLowerCase())) return false
          } else {
            if (item[key] !== value) return false
          }
        }
        return true
      })
    }

    if (args?.orderBy) {
      const [field, direction] = Object.entries(args.orderBy)[0] as [string, any]
      filtered.sort((a, b) => {
        const valA = a[field]
        const valB = b[field]
        if (valA === valB) return 0
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        
        const compareResult = valA < valB ? -1 : 1
        return direction === 'desc' ? -compareResult : compareResult
      })
    }

    if (args?.include) {
      for (const item of filtered) {
        await this.resolveIncludes(item, args.include)
      }
    }

    return filtered
  }

  async create(args: { data: any }) {
    const colRef = this.getCollection()
    const newDocRef = doc(colRef)
    const id = newDocRef.id
    const dataToSave = {
      ...args.data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    for (const [key, value] of Object.entries(dataToSave)) {
      if (value instanceof Date) {
        dataToSave[key] = value.toISOString()
      }
    }

    await setDoc(newDocRef, dataToSave)
    return dataToSave
  }

  async createMany(args: { data: any[] }) {
    const created: any[] = []
    for (const item of args.data) {
      const colRef = this.getCollection()
      const newDocRef = doc(colRef)
      const id = newDocRef.id
      const dataToSave = {
        ...item,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      for (const [key, value] of Object.entries(dataToSave)) {
        if (value instanceof Date) {
          dataToSave[key] = value.toISOString()
        }
      }

      await setDoc(newDocRef, dataToSave)
      created.push(dataToSave)
    }
    return created
  }

  async update(args: { where: { id: string }; data: any }) {
    const id = args.where.id
    const docRef = doc(firestore, this.collectionName, id)
    const dataToSave = {
      ...args.data,
      updatedAt: new Date().toISOString(),
    }

    for (const [key, value] of Object.entries(dataToSave)) {
      if (value instanceof Date) {
        dataToSave[key] = value.toISOString()
      } else if (value === undefined) {
        delete dataToSave[key]
      }
    }

    await updateDoc(docRef, dataToSave)
    
    const updatedSnap = await getDoc(docRef)
    return { id: updatedSnap.id, ...updatedSnap.data() }
  }

  async delete(args: { where: { id: string } }) {
    const id = args.where.id
    const docRef = doc(firestore, this.collectionName, id)
    await deleteDoc(docRef)
    return { id }
  }

  async deleteMany() {
    const colRef = this.getCollection()
    const querySnapshot = await getDocs(colRef)
    for (const d of querySnapshot.docs) {
      await deleteDoc(doc(firestore, this.collectionName, d.id))
    }
    return { count: querySnapshot.size }
  }

  async count(args?: any) {
    const items = await this.findMany(args)
    return items.length
  }

  async aggregate(args?: any) {
    const items = await this.findMany(args)
    let sumPeso = 0
    let countPeso = 0
    
    items.forEach(item => {
      if (item.pesoAtual) {
        sumPeso += Number(item.pesoAtual)
        countPeso++
      }
    })

    return {
      _sum: { pesoAtual: sumPeso },
      _avg: { pesoAtual: countPeso > 0 ? sumPeso / countPeso : 0 }
    }
  }

  private async resolveIncludes(item: any, include: any) {
    if (this.collectionName === 'animais') {
      if (include.pai) {
        if (item.paiId) {
          const docRef = doc(firestore, 'animais', item.paiId)
          const docSnap = await getDoc(docRef)
          item.pai = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
        } else {
          item.pai = null
        }
      }
      if (include.mae) {
        if (item.maeId) {
          const docRef = doc(firestore, 'animais', item.maeId)
          const docSnap = await getDoc(docRef)
          item.mae = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
        } else {
          item.mae = null
        }
      }
      if (include.filhosPai) {
        const colRef = collection(firestore, 'animais')
        const querySnapshot = await getDocs(colRef)
        const filhos: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.paiId === item.id) {
            filhos.push({ id: d.id, ...data })
          }
        })
        item.filhosPai = filhos
      }
      if (include.filhosMae) {
        const colRef = collection(firestore, 'animais')
        const querySnapshot = await getDocs(colRef)
        const filhos: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.maeId === item.id) {
            filhos.push({ id: d.id, ...data })
          }
        })
        item.filhosMae = filhos
      }
      if (include.registrosSaude) {
        const colRef = collection(firestore, 'saudes')
        const querySnapshot = await getDocs(colRef)
        const saudes: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.animalId === item.id) {
            saudes.push({ id: d.id, ...data })
          }
        })
        saudes.sort((a, b) => String(b.dataAplicacao || '').localeCompare(String(a.dataAplicacao || '')))
        item.registrosSaude = saudes
      }
      if (include.registrosPeso) {
        const colRef = collection(firestore, 'pesagens')
        const querySnapshot = await getDocs(colRef)
        const pesagens: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.animalId === item.id) {
            pesagens.push({ id: d.id, ...data })
          }
        })
        pesagens.sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')))
        item.registrosPeso = pesagens
      }
      if (include.registrosAlimentacao) {
        const colRef = collection(firestore, 'alimentacoes')
        const querySnapshot = await getDocs(colRef)
        const alimentacoes: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.animalId === item.id) {
            alimentacoes.push({ id: d.id, ...data })
          }
        })
        alimentacoes.sort((a, b) => String(b.dataInicio || '').localeCompare(String(a.dataInicio || '')))
        item.registrosAlimentacao = alimentacoes
      }
      if (include.montas) {
        const colRef = collection(firestore, 'reproducoes')
        const querySnapshot = await getDocs(colRef)
        const montas: any[] = []
        for (const d of querySnapshot.docs) {
          const data = d.data()
          if (data.femeaId === item.id) {
            const monta = { id: d.id, ...data } as any
            if (include.montas?.include?.touro && monta.touroId) {
              const touroSnap = await getDoc(doc(firestore, 'animais', monta.touroId))
              monta.touro = touroSnap.exists() ? { id: touroSnap.id, ...touroSnap.data() } : null
            }
            montas.push(monta)
          }
        }
        montas.sort((a, b) => String(b.dataMonta || '').localeCompare(String(a.dataMonta || '')))
        item.montas = montas
      }
      if (include.coberturas) {
        const colRef = collection(firestore, 'reproducoes')
        const querySnapshot = await getDocs(colRef)
        const coberturas: any[] = []
        for (const d of querySnapshot.docs) {
          const data = d.data()
          if (data.touroId === item.id) {
            const cobertura = { id: d.id, ...data } as any
            if (include.coberturas?.include?.femea && cobertura.femeaId) {
              const femeaSnap = await getDoc(doc(firestore, 'animais', cobertura.femeaId))
              cobertura.femea = femeaSnap.exists() ? { id: femeaSnap.id, ...femeaSnap.data() } : null
            }
            coberturas.push(cobertura)
          }
        }
        coberturas.sort((a, b) => String(b.dataMonta || '').localeCompare(String(a.dataMonta || '')))
        item.coberturas = coberturas
      }
      if (include.transacoes) {
        const colRef = collection(firestore, 'transacoes')
        const querySnapshot = await getDocs(colRef)
        const transacoes: any[] = []
        querySnapshot.forEach(d => {
          const data = d.data()
          if (data.animalId === item.id) {
            transacoes.push({ id: d.id, ...data })
          }
        })
        transacoes.sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))
        item.transacoes = transacoes
      }
      if (include._count) {
        const saudesCount = await new FirestoreCollectionAdapter('saudes').count({ where: { animalId: item.id } })
        const pesagensCount = await new FirestoreCollectionAdapter('pesagens').count({ where: { animalId: item.id } })
        item._count = { registrosSaude: saudesCount, registrosPeso: pesagensCount }
      }
    }
  }
}

export const db = {
  fazenda: new FirestoreCollectionAdapter<any>('fazendas'),
  animal: new FirestoreCollectionAdapter<any>('animais'),
  saude: new FirestoreCollectionAdapter<any>('saudes'),
  pesagem: new FirestoreCollectionAdapter<any>('pesagens'),
  alimentacao: new FirestoreCollectionAdapter<any>('alimentacoes'),
  reproducao: new FirestoreCollectionAdapter<any>('reproducoes'),
  transacao: new FirestoreCollectionAdapter<any>('transacoes'),
}
