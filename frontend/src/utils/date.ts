/**
 * Utilitários para manipulação de datas com fuso horário correto (Brasil - America/Sao_Paulo)
 * 
 * IMPORTANTE: O sistema usa timezone local do Brasil (UTC-3).
 * Todas as datas são armazenadas em UTC no banco, mas exibidas/manipuladas no horário local.
 */

// Timezone do Brasil
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna a data atual no formato YYYY-MM-DD no fuso horário local (Brasil)
 * Aceita uma data como parâmetro opcional
 */
export function getLocalDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extrai o horário local (HH:mm) de uma data
 */
export function extractLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Cria um objeto Date a partir de uma data (YYYY-MM-DD) e horário (HH:mm) locais
 * IMPORTANTE: NÃO usa 'Z' no final para evitar conversão UTC
 */
export function createLocalDateTime(dateStr: string, timeStr: string): string {
  // Criar a data no formato ISO sem o Z para manter timezone local
  const [hours, minutes] = timeStr.split(':')
  const localDate = new Date(`${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`)
  return localDate.toISOString()
}

/**
 * Converte uma string ISO UTC para Date no timezone local
 */
export function parseUTCtoLocal(isoString: string): Date {
  return new Date(isoString)
}

/**
 * Formata uma data UTC para exibição no horário local brasileiro
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
 * Retorna início do dia no timezone local
 */
export function startOfDayLocal(dateStr: string): string {
  return createLocalDateTime(dateStr, '00:00')
}

/**
 * Retorna fim do dia no timezone local
 */
export function endOfDayLocal(dateStr: string): string {
  return createLocalDateTime(dateStr, '23:59')
}

/**
 * Converte uma string de data do banco (YYYY-MM-DD) para o formato local
 * sem conversão de fuso horário (evita o problema de UTC)
 */
export function parseDateFromDB(dateString: string): string {
  // Se já está no formato YYYY-MM-DD, retorna direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // Se tem timestamp, extrai apenas a data
  if (dateString.includes('T')) {
    return dateString.split('T')[0]
  }
  
  return dateString
}

/**
 * Converte uma data UTC para o fuso horário local e retorna no formato YYYY-MM-DD
 */
export function utcToLocalDateString(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Compara se uma data é hoje (considera fuso horário local)
 */
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString()
}

/**
 * Compara se uma data é futura (considera fuso horário local)
 */
export function isFutureDate(dateString: string): boolean {
  return dateString > getLocalDateString()
}

/**
 * Compara se uma data é hoje ou futura (considera fuso horário local)
 */
export function isTodayOrFuture(dateString: string): boolean {
  return dateString >= getLocalDateString()
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDateBR(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formata data e hora para exibição (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeBR(dateTime: string | Date): string {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
