import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from '@mui/material'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isBetween from 'dayjs/plugin/isBetween'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'
import duration from 'dayjs/plugin/duration'
import minMax from 'dayjs/plugin/minMax'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '../../hooks/useDateFormat'
import api from '../../services/api'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)
dayjs.extend(duration)
dayjs.extend(minMax)

/** Rendez-vous — bleu (aligné sur la charte FPI) */
const COLOR_APPOINTMENT = '#0066CC'
/** Courriers — orange distinct */
const COLOR_MAIL = '#e65100'

export type CalendarEventType = 'appointment' | 'mail'

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  eventType: CalendarEventType
  resource: any
}

function mailDocumentToEvent(doc: any): CalendarEvent {
  const anchor = doc.response_deadline ? new Date(doc.response_deadline) : new Date(doc.created_at)
  let end = dayjs(anchor).add(1, 'hour').toDate()
  if (end <= anchor) {
    end = dayjs(anchor).add(30, 'minute').toDate()
  }
  const label = doc.reference_number
    ? `${doc.reference_number} — ${doc.title || ''}`.trim().slice(0, 100)
    : doc.title || doc.reference_number || '—'
  return {
    id: `mail-${doc.id}`,
    title: label,
    start: anchor,
    end,
    eventType: 'mail',
    resource: { ...doc, eventType: 'mail' as const },
  }
}

export default function AppointmentCalendarPanel() {
  const { t, i18n } = useTranslation()
  const { formatDateTime } = useDateFormat()
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [visitorPhotoUrl, setVisitorPhotoUrl] = useState<string | null>(null)
  const visitorPhotoBlobRef = useRef<string | null>(null)
  const [openingMail, setOpeningMail] = useState(false)

  useEffect(() => {
    dayjs.locale(i18n.language)
  }, [i18n.language])

  const localizer = useMemo(() => {
    dayjs.locale(i18n.language)
    return momentLocalizer(dayjs)
  }, [i18n.language])

  const [appointmentsQuery, mailQuery] = useQueries({
    queries: [
      {
        queryKey: ['appointments'],
        queryFn: async () => {
          const response = await api.get('/appointments/')
          return response.data as any[]
        },
      },
      {
        queryKey: ['mail-documents'],
        queryFn: async () => {
          const response = await api.get('/mail/', { params: { limit: 500 } })
          return response.data as any[]
        },
      },
    ],
  })

  const events: CalendarEvent[] = useMemo(() => {
    const aptEvents: CalendarEvent[] = (appointmentsQuery.data || []).map((apt: any) => ({
      id: String(apt.id),
      title: apt.title,
      start: new Date(apt.start_time),
      end: new Date(apt.end_time),
      eventType: 'appointment' as const,
      resource: { ...apt, eventType: 'appointment' as const },
    }))
    const mailEvents: CalendarEvent[] = (mailQuery.data || []).map(mailDocumentToEvent)
    return [...aptEvents, ...mailEvents]
  }, [appointmentsQuery.data, mailQuery.data])

  const isLoading = appointmentsQuery.isLoading || mailQuery.isLoading
  const queryError = appointmentsQuery.error || mailQuery.error

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setViewOpen(true)
  }

  useEffect(() => {
    const revokeCurrent = () => {
      if (visitorPhotoBlobRef.current) {
        URL.revokeObjectURL(visitorPhotoBlobRef.current)
        visitorPhotoBlobRef.current = null
      }
      setVisitorPhotoUrl(null)
    }

    if (!viewOpen || selectedEvent?.eventType !== 'appointment') {
      revokeCurrent()
      return undefined
    }
    const apt = selectedEvent.resource
    if (!apt?.visitor?.visitor_photo_path || !apt?.id) {
      revokeCurrent()
      return undefined
    }
    let alive = true
    revokeCurrent()
    ;(async () => {
      try {
        const res = await api.get(`/appointments/${apt.id}/visitor/photo`, { responseType: 'blob' })
        if (!alive) return
        const url = URL.createObjectURL(res.data)
        if (!alive) {
          URL.revokeObjectURL(url)
          return
        }
        visitorPhotoBlobRef.current = url
        setVisitorPhotoUrl(url)
      } catch {
        if (alive) revokeCurrent()
      }
    })()
    return () => {
      alive = false
      revokeCurrent()
    }
  }, [viewOpen, selectedEvent])

  const openMailFile = useCallback(async () => {
    if (selectedEvent?.eventType !== 'mail' || !selectedEvent.resource?.id) return
    setOpeningMail(true)
    try {
      const res = await api.get(`/mail/${selectedEvent.resource.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
    } catch {
      /* ignore */
    } finally {
      setOpeningMail(false)
    }
  }, [selectedEvent])

  const eventPropGetter = (event: CalendarEvent) => {
    const isMail = event.eventType === 'mail'
    const bg = isMail ? COLOR_MAIL : COLOR_APPOINTMENT
    return {
      style: {
        backgroundColor: bg,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '0.8rem',
      },
    }
  }

  const mailStatusLabel = (status?: string) => {
    switch (status) {
      case 'received':
        return t('mail.statusReceived')
      case 'in_review':
        return t('mail.statusInReview')
      case 'approved':
        return t('mail.statusApproved')
      case 'rejected':
        return t('mail.statusRejected')
      case 'archived':
        return t('mail.statusArchived')
      default:
        return status || '—'
    }
  }

  return (
    <>
      <Paper sx={{ p: 2, minHeight: '600px' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('reception.calendarLegend')}
          </Typography>
          <Chip
            size="small"
            label={t('reception.legendAppointments')}
            sx={{ bgcolor: COLOR_APPOINTMENT, color: 'white', fontWeight: 600 }}
          />
          <Chip
            size="small"
            label={t('reception.legendMail')}
            sx={{ bgcolor: COLOR_MAIL, color: 'white', fontWeight: 600 }}
          />
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400} flexDirection="column" gap={2}>
            <CircularProgress />
            <Typography color="text.secondary">{t('appointments.loadingAppointments')}</Typography>
          </Box>
        ) : queryError ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400} flexDirection="column" gap={2}>
            <Typography color="error" variant="h6">
              {t('appointments.loadFailed')}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ height: '100%', width: '100%' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '550px' }}
                onSelectEvent={(ev) => handleSelectEvent(ev as CalendarEvent)}
                defaultView="month"
                views={['month', 'week', 'day', 'agenda']}
                popup
                eventPropGetter={(ev) => eventPropGetter(ev as CalendarEvent)}
              />
            </Box>
            {events.length === 0 && (
              <Box sx={{ mt: 2, textAlign: 'center', py: 2 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('reception.calendarEmpty')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {queryError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {queryError instanceof Error ? queryError.message : t('appointments.loadFailed')}
        </Alert>
      )}

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent?.eventType === 'mail'
            ? t('reception.mailDetails')
            : t('appointments.appointmentDetails')}
        </DialogTitle>
        <DialogContent>
          {selectedEvent?.eventType === 'appointment' && selectedEvent.resource && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar
                src={visitorPhotoUrl || undefined}
                alt={selectedEvent.resource.visitor_name || ''}
                sx={{ width: 96, height: 96, flexShrink: 0 }}
              >
                {(selectedEvent.resource.visitor_name || selectedEvent.resource.title || '?')
                  .toString()
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.resource.title}
                </Typography>
                {selectedEvent.resource.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedEvent.resource.description}
                  </Typography>
                )}
                <Typography variant="body2" paragraph>
                  <strong>{t('appointments.start')}:</strong> {formatDateTime(selectedEvent.resource.start_time)}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>{t('appointments.end')}:</strong> {formatDateTime(selectedEvent.resource.end_time)}
                </Typography>
                {selectedEvent.resource.visitor_name && (
                  <>
                    <Typography variant="body2" paragraph>
                      <strong>{t('appointments.visitor')}:</strong> {selectedEvent.resource.visitor_name}
                    </Typography>
                    {selectedEvent.resource.visitor_email && (
                      <Typography variant="body2" paragraph>
                        <strong>{t('appointments.email')}:</strong> {selectedEvent.resource.visitor_email}
                      </Typography>
                    )}
                    {selectedEvent.resource.visitor_company && (
                      <Typography variant="body2" paragraph>
                        <strong>{t('appointments.company')}:</strong> {selectedEvent.resource.visitor_company}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}
          {selectedEvent?.eventType === 'mail' && selectedEvent.resource && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedEvent.resource.title}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('mail.reference')}:</strong> {selectedEvent.resource.reference_number || '—'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('mail.status')}:</strong> {mailStatusLabel(selectedEvent.resource.status)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('mail.priority')}:</strong> {selectedEvent.resource.priority || '—'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('mail.created')}:</strong> {formatDateTime(selectedEvent.resource.created_at)}
              </Typography>
              {selectedEvent.resource.response_deadline && (
                <Typography variant="body2" paragraph>
                  <strong>{t('reception.mailDeadline')}:</strong>{' '}
                  {formatDateTime(selectedEvent.resource.response_deadline)}
                </Typography>
              )}
              {selectedEvent.resource.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedEvent.resource.description}
                </Typography>
              )}
              {selectedEvent.resource.is_overdue && (
                <Chip label={t('dashboard.mailOverdue')} color="error" size="small" sx={{ mt: 1 }} />
              )}
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                onClick={() => void openMailFile()}
                disabled={openingMail}
              >
                {openingMail ? t('common.loading') : t('reception.openMailDocument')}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
