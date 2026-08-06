import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda em Real brasileiro
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

// Formatação de número
export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value || 0)
}

// Formatação de data
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Formatação de data curta (dd/mm)
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(d)
}

// Calcular idade a partir da data de nascimento
export function calcAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return '-'
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  if (isNaN(d.getTime())) return '-'
  const now = new Date()
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  if (months < 0) return 'Recém-nascido'
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return remMonths > 0 ? `${years}a ${remMonths}m` : `${years} ${years === 1 ? 'ano' : 'anos'}`
}

// Dias até a data
export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 0
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Status color mapping
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    'Ativo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Gestante': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'Vendido': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Abatido': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Óbito': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Parida': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Coberta': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'Vazia': 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  }
  return colors[status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
}

// Padrão brasileiro de data para input date
export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}
