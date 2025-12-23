import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isBetween from 'dayjs/plugin/isBetween'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'
import duration from 'dayjs/plugin/duration'
import minMax from 'dayjs/plugin/minMax'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '../hooks/useDateFormat'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

// Extend dayjs with required plugins for react-big-calendar
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)
dayjs.extend(duration)
dayjs.extend(minMax)

export default function Appointments() {
  const { t, i18n } = useTranslation()
  const { formatDateTime } = useDateFormat()
  const { user } = useAuth()
  
  // Update dayjs locale when language changes and recreate localizer
  useEffect(() => {
    dayjs.locale(i18n.language)
  }, [i18n.language])
  
  const localizer = useMemo(() => {
    dayjs.locale(i18n.language)
    return momentLocalizer(dayjs)
  }, [i18n.language])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs().add(1, 'hour'))
  const [endTime, setEndTime] = useState<Dayjs | null>(dayjs().add(2, 'hour'))
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorCompany, setVisitorCompany] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  // Automatically update end time when start time changes (only when dialog is open)
  useEffect(() => {
    if (startTime && createOpen) {
      const newEndTime = startTime.add(1, 'hour')
      // Only update if endTime is not manually set or if it's before the new calculated end time
      if (!endTime || endTime.isBefore(newEndTime) || endTime.isSame(startTime)) {
        setEndTime(newEndTime)
      }
    }
  }, [startTime, createOpen])

  const { data: appointments, isLoading, error: queryError } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        const response = await api.get('/appointments/')
        return response.data.map((apt: any) => ({
          id: apt.id,
          title: apt.title,
          start: new Date(apt.start_time),
          end: new Date(apt.end_time),
          resource: apt,
        }))
      } catch (err: any) {
        throw new Error(err.response?.data?.detail || 'Failed to load appointments')
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/appointments/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      handleCloseCreate()
    },
    onError: (err: any) => {
      const errorData = err.response?.data
      if (errorData?.detail) {
        // Handle validation errors (422)
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((e: any) => {
            const field = e.loc?.join('.') || e.loc?.[e.loc.length - 1] || 'field'
            return `${field}: ${e.msg}`
          }).join(', ')
          setError(errorMessages)
        } else {
          setError(errorData.detail)
        }
      } else {
        setError(t('appointments.createFailed'))
      }
    },
  })

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setTitle('')
    setDescription('')
    setStartTime(dayjs().add(1, 'hour'))
    setEndTime(dayjs().add(2, 'hour'))
    setVisitorName('')
    setVisitorEmail('')
    setVisitorPhone('')
    setVisitorCompany('')
    setError('')
  }

  const handleCreate = () => {
    if (!startTime || !endTime) {
      setError(t('appointments.selectTimes'))
      return
    }

    if (endTime.isBefore(startTime)) {
      setError(t('appointments.endBeforeStart'))
      return
    }

    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    createMutation.mutate({
      title,
      description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      organizer_id: user.id,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_phone: visitorPhone,
      visitor_company: visitorCompany,
    })
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource)
    setViewOpen(true)
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('appointments.title')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ minWidth: 180 }}
        >
          {t('appointments.newAppointment')}
        </Button>
      </Box>

      {error && createMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {queryError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {queryError instanceof Error
            ? queryError.message
            : t('appointments.loadFailed')}
        </Alert>
      )}

      <Paper sx={{ p: 2, minHeight: '600px' }}>
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              {t('appointments.loadingAppointments')}
            </Typography>
          </Box>
        ) : queryError ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={2}
          >
            <Typography color="error" variant="h6">
              {t('appointments.loadFailed')}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {queryError instanceof Error ? queryError.message : ''}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ height: '100%', width: '100%' }}>
              <Calendar
                localizer={localizer}
                events={appointments || []}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '550px' }}
                onSelectEvent={handleSelectEvent}
                defaultView="month"
                views={['month', 'week', 'day', 'agenda']}
                popup
                eventPropGetter={() => {
                  return {
                    style: {
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: '4px',
                      border: 'none',
                    },
                  }
                }}
              />
            </Box>
            {(!appointments || appointments.length === 0) && (
              <Box
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  py: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('appointments.noAppointments')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('appointments.createTitle')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Create Appointment Dialog */}
      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>{t('appointments.createTitle')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale={i18n.language}
          >
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('appointments.titleLabel')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('appointments.descriptionLabel')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label={t('appointments.startTime')}
                  value={startTime}
                  onChange={(newValue) => {
                    setStartTime(newValue)
                    // Automatically set end time to 1 hour after start time
                    if (newValue) {
                      setEndTime(newValue.add(1, 'hour'))
                    } else {
                      setEndTime(null)
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label={t('appointments.endTime')}
                  value={endTime}
                  onChange={(newValue) => setEndTime(newValue)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  minDateTime={startTime || undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.visitorName')}
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.visitorEmail')}
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.visitorPhone')}
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.visitorCompany')}
                  value={visitorCompany}
                  onChange={(e) => setVisitorCompany(e.target.value)}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending
              ? t('appointments.creating')
              : t('appointments.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('appointments.appointmentDetails')}</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedEvent.title}
              </Typography>
              {selectedEvent.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedEvent.description}
                </Typography>
              )}
              <Typography variant="body2" paragraph>
                <strong>{t('appointments.start')}:</strong>{' '}
                {formatDateTime(selectedEvent.start_time)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('appointments.end')}:</strong>{' '}
                {formatDateTime(selectedEvent.end_time)}
              </Typography>
              {selectedEvent.visitor_name && (
                <>
                  <Typography variant="body2" paragraph>
                    <strong>{t('appointments.visitor')}:</strong>{' '}
                    {selectedEvent.visitor_name}
                  </Typography>
                  {selectedEvent.visitor_email && (
                    <Typography variant="body2" paragraph>
                      <strong>{t('appointments.email')}:</strong>{' '}
                      {selectedEvent.visitor_email}
                    </Typography>
                  )}
                  {selectedEvent.visitor_company && (
                    <Typography variant="body2" paragraph>
                      <strong>{t('appointments.company')}:</strong>{' '}
                      {selectedEvent.visitor_company}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

