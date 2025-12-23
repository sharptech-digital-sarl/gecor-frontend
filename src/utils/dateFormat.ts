import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

/**
 * Format a date according to the selected language
 * @param date - Date string, Date object, or dayjs object
 * @param format - Format string (default: 'LL' for long date format)
 * @param locale - Language code ('en' or 'fr')
 */
export function formatDate(
  date: string | Date | dayjs.Dayjs | null | undefined,
  format: string = 'LL',
  locale: string = 'en'
): string {
  if (!date) return '-'
  
  dayjs.locale(locale)
  return dayjs(date).format(format)
}

/**
 * Format a time according to the selected language
 * @param date - Date string, Date object, or dayjs object
 * @param locale - Language code ('en' or 'fr')
 */
export function formatTime(
  date: string | Date | dayjs.Dayjs | null | undefined,
  locale: string = 'en'
): string {
  if (!date) return '-'
  
  dayjs.locale(locale)
  return dayjs(date).format('LT') // Localized time format
}

/**
 * Format a date and time according to the selected language
 * @param date - Date string, Date object, or dayjs object
 * @param locale - Language code ('en' or 'fr')
 */
export function formatDateTime(
  date: string | Date | dayjs.Dayjs | null | undefined,
  locale: string = 'en'
): string {
  if (!date) return '-'
  
  dayjs.locale(locale)
  return dayjs(date).format('LLL') // Localized date and time format
}

/**
 * Format a date range (start - end time)
 * @param startDate - Start date
 * @param endDate - End date
 * @param locale - Language code ('en' or 'fr')
 */
export function formatTimeRange(
  startDate: string | Date | dayjs.Dayjs | null | undefined,
  endDate: string | Date | dayjs.Dayjs | null | undefined,
  locale: string = 'en'
): string {
  if (!startDate || !endDate) return '-'
  
  dayjs.locale(locale)
  const start = dayjs(startDate).format('LT')
  const end = dayjs(endDate).format('LT')
  return `${start} - ${end}`
}

/**
 * Get current locale from i18n
 */
export function getCurrentLocale(): string {
  const stored = localStorage.getItem('i18nextLng')
  return stored || 'en'
}

