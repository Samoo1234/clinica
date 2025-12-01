/**
 * Utilitários para manipulação de timezone no backend
 * O sistema usa timezone Brasil (America/Sao_Paulo - UTC-3)
 * 
 * IMPORTANTE: Todas as datas são armazenadas em UTC no banco de dados.
 * Este módulo garante conversões corretas entre UTC e horário local.
 */

// Timezone do Brasil (UTC-3)
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
export const BRAZIL_OFFSET_HOURS = -3

/**
 * Converte uma data YYYY-MM-DD para o início do dia no timezone Brasil (em UTC)
 * Ex: '2024-12-01' -> '2024-12-01T03:00:00.000Z' (meia-noite em SP = 03:00 UTC)
 */
export function startOfDayBrazil(dateStr: string): string {
  // Criar data no timezone local e converter para UTC
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return date.toISOString()
}

/**
 * Converte uma data YYYY-MM-DD para o fim do dia no timezone Brasil (em UTC)
 * Ex: '2024-12-01' -> '2024-12-02T02:59:59.999Z' (23:59 em SP = 02:59 UTC do dia seguinte)
 */
export function endOfDayBrazil(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 23, 59, 59, 999)
  return date.toISOString()
}

/**
 * Retorna a data atual no formato YYYY-MM-DD no timezone Brasil
 */
export function getTodayBrazil(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extrai a data (YYYY-MM-DD) de uma string ISO considerando timezone local
 */
export function extractDateFromISO(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extrai o horário (HH:mm) de uma string ISO considerando timezone local
 */
export function extractTimeFromISO(isoString: string): string {
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Formata data/hora para exibição no padrão brasileiro
 */
export function formatDateTimeBrazil(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formata apenas a data para exibição no padrão brasileiro
 */
export function formatDateBrazil(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata apenas o horário para exibição no padrão brasileiro
 */
export function formatTimeBrazil(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}
