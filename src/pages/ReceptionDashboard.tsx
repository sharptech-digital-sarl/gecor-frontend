import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '../hooks/useDateFormat'
import api from '../services/api'

export default function ReceptionDashboard() {
  const { t } = useTranslation()
  const { formatDate, formatTimeRange, formatDateTime, formatTime } = useDateFormat()
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['reception-appointments'],
    queryFn: async () => {
      try {
        const response = await api.get('/appointments/reception/today')
        return response.data || []
      } catch (err: any) {
        // Handle CORS and server errors gracefully
        const isNetworkError = err.code === 'ERR_NETWORK' || err.code === 'ERR_FAILED'
        const isCorsError = 
          err.message?.includes('CORS') || 
          err.message?.includes('Access-Control-Allow-Origin') ||
          (isNetworkError && !err.response) // Network error without response usually means CORS
        
        if (err.response?.status === 500) {
          console.error('Server error fetching reception appointments:', err.response?.data)
          throw new Error(t('reception.serverError'))
        }
        
        if (isCorsError || isNetworkError) {
          console.error('Network/CORS error:', err)
          throw new Error(t('reception.networkError'))
        }
        
        // For other errors, throw with a generic message
        throw new Error(err.response?.data?.detail || err.message || t('reception.loadFailed'))
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on CORS/network errors as they won't resolve automatically
      const isNetworkError = error?.code === 'ERR_NETWORK' || error?.code === 'ERR_FAILED'
      const isCorsError = error?.message?.includes('CORS') || error?.message?.includes('Access-Control-Allow-Origin')
      if (isNetworkError || isCorsError) {
        return false
      }
      // Retry once for other errors
      return failureCount < 1
    },
    retryDelay: 1000,
  })

  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await api.post(`/appointments/${appointmentId}/check-in`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] })
    },
  })

  const handleView = (appointment: any) => {
    setSelectedAppointment(appointment)
    setViewOpen(true)
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {t('reception.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('reception.todaysVisitors')} - {formatDate(new Date(), 'LL')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error instanceof Error ? error.message : t('reception.loadFailed')}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 102, 204, 0.15), 0 4px 12px rgba(0, 166, 81, 0.1)',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.12) 0%, rgba(0, 166, 81, 0.12) 100%)',
                '& .MuiTableCell-head': {
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '0.5px',
                },
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>{t('reception.time')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reception.visitorName')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reception.company')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reception.organizer')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reception.status')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : !appointments || appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('reception.noAppointments')}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt: any) => (
                <TableRow
                  key={apt.id}
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 102, 204, 0.04)',
                      transform: 'scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <TableCell>
                    {formatTimeRange(apt.start_time, apt.end_time)}
                  </TableCell>
                  <TableCell>{apt.visitor_name || '-'}</TableCell>
                  <TableCell>{apt.visitor_company || '-'}</TableCell>
                  <TableCell>{apt.organizer?.full_name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        apt.visitor?.checked_in
                          ? t('reception.checkedIn')
                          : t('reception.pending')
                      }
                      color={apt.visitor?.checked_in ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleView(apt)}
                      >
                        {t('common.view')}
                      </Button>
                      {!apt.visitor?.checked_in && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => checkInMutation.mutate(apt.id)}
                          disabled={checkInMutation.isPending}
                        >
                          {t('reception.checkIn')}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Appointment Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('reception.appointmentDetails')}</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAppointment.title || 'Appointment'}
              </Typography>
              {selectedAppointment.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedAppointment.description}
                </Typography>
              )}
              <Typography variant="body2" paragraph>
                <strong>{t('reception.time')}:</strong>{' '}
                {formatDateTime(selectedAppointment.start_time)} -{' '}
                {formatTime(selectedAppointment.end_time)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reception.visitorName')}:</strong>{' '}
                {selectedAppointment.visitor_name || '-'}
              </Typography>
              {selectedAppointment.visitor_email && (
                <Typography variant="body2" paragraph>
                  <strong>{t('appointments.email')}:</strong>{' '}
                  {selectedAppointment.visitor_email}
                </Typography>
              )}
              {selectedAppointment.visitor_phone && (
                <Typography variant="body2" paragraph>
                  <strong>{t('appointments.phone')}:</strong>{' '}
                  {selectedAppointment.visitor_phone}
                </Typography>
              )}
              {selectedAppointment.visitor_company && (
                <Typography variant="body2" paragraph>
                  <strong>{t('reception.company')}:</strong>{' '}
                  {selectedAppointment.visitor_company}
                </Typography>
              )}
              <Typography variant="body2" paragraph>
                <strong>{t('reception.organizer')}:</strong>{' '}
                {selectedAppointment.organizer?.full_name || '-'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={
                    selectedAppointment.visitor?.checked_in
                      ? t('reception.checkedIn')
                      : t('reception.pendingCheckIn')
                  }
                  color={selectedAppointment.visitor?.checked_in ? 'success' : 'default'}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>{t('common.close')}</Button>
          {selectedAppointment && !selectedAppointment.visitor?.checked_in && (
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={() => {
                checkInMutation.mutate(selectedAppointment.id)
                setViewOpen(false)
              }}
              disabled={checkInMutation.isPending}
            >
              {t('reception.checkIn')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}


