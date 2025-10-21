/**
 * Utilitários para manipulação de datas com fuso horário correto
 */

/**
 * Retorna a data atual no formato YYYY-MM-DD no fuso horário local (Brasil)
 */
export function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
