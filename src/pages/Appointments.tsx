import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
  TextField,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteOutlineIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '../hooks/useDateFormat'
import { useAuth } from '../hooks/useAuth'
import { useTableSort } from '../hooks/useTableSort'
import { isSameLocalDay } from '../utils/dateCompare'
import api from '../services/api'
import CreateAppointmentDialog from '../components/appointments/CreateAppointmentDialog'
import { hasPermission } from '../utils/permissions'

type AptRow = {
  id: string
  title?: string
  description?: string
  start_time: string
  end_time: string
  visitor_name?: string
  visitor_email?: string
  visitor_phone?: string
  visitor_company?: string
  status?: string
  organizer?: { full_name?: string; role?: string }
  visitor?: { checked_in?: boolean }
  has_pending_deletion_request?: boolean
}

type SortKey = 'start_time' | 'visitor_name' | 'visitor_company' | 'organizer' | 'status'

export default function Appointments() {
  const { t } = useTranslation()
  const { formatDateTime, formatTime } = useDateFormat()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AptRow | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [requestCancelOpen, setRequestCancelOpen] = useState(false)
  const [requestCancelReason, setRequestCancelReason] = useState('')
  const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const { sortBy, sortDir, toggleSort, sortRows } = useTableSort<SortKey>('start_time', 'desc')

  const canCreate = hasPermission(user, 'appointments.create')
  const canCheckIn = hasPermission(user, 'reception.checkin')
  const canDeleteApt = hasPermission(user, 'appointments.delete')
  const canRequestCancel = hasPermission(user, 'appointments.request_delete')

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments-list'],
    queryFn: async () => {
      const response = await api.get('/appointments/', { params: { limit: 500 } })
      return (response.data || []) as AptRow[]
    },
  })

  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await api.post(`/appointments/${appointmentId}/check-in`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await api.delete(`/appointments/${appointmentId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] })
      setCancelConfirmOpen(false)
      setViewOpen(false)
      setSelectedAppointment(null)
      setActionMessage({ type: 'success', text: t('appointments.cancelledSuccess') })
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || t('appointments.cancelFailed'),
      })
    },
  })

  const requestCancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/appointments/${id}/deletion-request`, {
        reason: reason.trim() || null,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] })
      setRequestCancelOpen(false)
      setRequestCancelReason('')
      setViewOpen(false)
      setSelectedAppointment(null)
      setActionMessage({ type: 'success', text: t('appointments.cancellationRequestSent') })
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || t('appointments.cancellationRequestFailed'),
      })
    },
  })

  const sorted = appointments
    ? sortRows(appointments, (row, key) => {
        switch (key) {
          case 'start_time':
            return new Date(row.start_time).getTime()
          case 'visitor_name':
            return row.visitor_name || ''
          case 'visitor_company':
            return row.visitor_company || ''
          case 'organizer':
            return row.organizer?.full_name || ''
          case 'status':
            return row.status || ''
          default:
            return ''
        }
      })
    : []

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return t('appointments.statusPending')
      case 'confirmed':
        return t('appointments.statusConfirmed')
      case 'cancelled':
        return t('appointments.statusCancelled')
      case 'completed':
        return t('appointments.statusCompleted')
      case 'no_show':
        return t('appointments.statusNoShow')
      default:
        return status || '—'
    }
  }

  const receptionStatus = (apt: AptRow) =>
    apt.visitor?.checked_in ? t('reception.checkedIn') : t('reception.pending')

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('appointments.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('appointments.listSubtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ minWidth: 180, background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)' }}
          >
            {t('appointments.newAppointment')}
          </Button>
        )}
      </Box>

      {actionMessage && (
        <Alert
          severity={actionMessage.type}
          sx={{ mb: 2 }}
          onClose={() => setActionMessage(null)}
        >
          {actionMessage.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : t('appointments.loadFailed')}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.12) 0%, rgba(0, 166, 81, 0.12) 100%)',
                '& .MuiTableCell-head': { fontWeight: 700 },
              }}
            >
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'start_time'}
                  direction={sortBy === 'start_time' ? sortDir : 'asc'}
                  onClick={() => toggleSort('start_time')}
                >
                  {t('reception.time')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'visitor_name'}
                  direction={sortBy === 'visitor_name' ? sortDir : 'asc'}
                  onClick={() => toggleSort('visitor_name')}
                >
                  {t('reception.visitorName')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'visitor_company'}
                  direction={sortBy === 'visitor_company' ? sortDir : 'asc'}
                  onClick={() => toggleSort('visitor_company')}
                >
                  {t('reception.company')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'organizer'}
                  direction={sortBy === 'organizer' ? sortDir : 'asc'}
                  onClick={() => toggleSort('organizer')}
                >
                  {t('appointments.columnVisitHost')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortDir : 'asc'}
                  onClick={() => toggleSort('status')}
                >
                  {t('reception.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !sorted.length ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('appointments.noAppointments')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((apt) => {
                const showCheckIn = isSameLocalDay(apt.start_time) && !apt.visitor?.checked_in
                return (
                  <TableRow key={apt.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTime(apt.start_time)} – {formatTime(apt.end_time)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(apt.start_time)}
                      </Typography>
                    </TableCell>
                    <TableCell>{apt.visitor_name || '—'}</TableCell>
                    <TableCell>{apt.visitor_company || '—'}</TableCell>
                    <TableCell>
                      {apt.organizer?.full_name || '—'}
                      {apt.organizer?.role && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t(`usersAdmin.roleNames.${apt.organizer.role}`, { defaultValue: apt.organizer.role })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
                        <Chip label={statusLabel(apt.status)} size="small" variant="outlined" />
                        <Chip
                          label={receptionStatus(apt)}
                          color={apt.visitor?.checked_in ? 'success' : 'default'}
                          size="small"
                        />
                        {apt.has_pending_deletion_request && (
                          <Chip label={t('appointments.pendingCancellationBadge')} size="small" color="warning" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => {
                            setSelectedAppointment(apt)
                            setViewOpen(true)
                          }}
                        >
                          {t('common.view')}
                        </Button>
                        {showCheckIn && canCheckIn && (
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
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {canCreate && (
        <CreateAppointmentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultHostUserId={user?.id != null ? String(user.id) : undefined}
        />
      )}

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('reception.appointmentDetails')}</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAppointment.title || '—'}
              </Typography>
              {selectedAppointment.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedAppointment.description}
                </Typography>
              )}
              <Typography variant="body2" paragraph>
                <strong>{t('reception.time')}:</strong> {formatDateTime(selectedAppointment.start_time)} —{' '}
                {formatTime(selectedAppointment.end_time)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reception.visitorName')}:</strong> {selectedAppointment.visitor_name || '—'}
              </Typography>
              {selectedAppointment.visitor_email && (
                <Typography variant="body2" paragraph>
                  <strong>{t('appointments.email')}:</strong> {selectedAppointment.visitor_email}
                </Typography>
              )}
              {selectedAppointment.visitor_company && (
                <Typography variant="body2" paragraph>
                  <strong>{t('reception.company')}:</strong> {selectedAppointment.visitor_company}
                </Typography>
              )}
              <Typography variant="body2" paragraph>
                <strong>{t('appointments.solicitedPersonLabel')}:</strong> {selectedAppointment.organizer?.full_name || '—'}
                {selectedAppointment.organizer?.role && (
                  <>
                    {' '}
                    <Typography component="span" variant="body2" color="text.secondary">
                      ({t('appointments.solicitedPersonFunction')}:{' '}
                      {t(`usersAdmin.roleNames.${selectedAppointment.organizer.role}`, {
                        defaultValue: selectedAppointment.organizer.role,
                      })}
                      )
                    </Typography>
                  </>
                )}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('appointments.appointmentStatus')}:</strong> {statusLabel(selectedAppointment.status)}
              </Typography>
              {selectedAppointment.has_pending_deletion_request && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {t('appointments.pendingCancellationNotice')}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setViewOpen(false)}>{t('common.close')}</Button>
          {selectedAppointment &&
            selectedAppointment.status !== 'cancelled' &&
            canDeleteApt && (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setCancelConfirmOpen(true)}
              >
                {t('appointments.cancelAppointment')}
              </Button>
            )}
          {selectedAppointment &&
            selectedAppointment.status !== 'cancelled' &&
            canRequestCancel &&
            !selectedAppointment.has_pending_deletion_request && (
              <Button
                color="warning"
                variant="outlined"
                startIcon={<EventBusyIcon />}
                onClick={() => setRequestCancelOpen(true)}
              >
                {t('appointments.requestCancellation')}
              </Button>
            )}
          {selectedAppointment &&
            isSameLocalDay(selectedAppointment.start_time) &&
            !selectedAppointment.visitor?.checked_in &&
            canCheckIn && (
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

      <Dialog open={cancelConfirmOpen} onClose={() => !cancelMutation.isPending && setCancelConfirmOpen(false)}>
        <DialogTitle>{t('appointments.confirmCancelTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t('appointments.confirmCancelBody')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOpen(false)} disabled={cancelMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending || !selectedAppointment}
            onClick={() => selectedAppointment && cancelMutation.mutate(selectedAppointment.id)}
          >
            {t('appointments.cancelAppointment')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={requestCancelOpen}
        onClose={() => !requestCancelMutation.isPending && setRequestCancelOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('appointments.requestCancellationTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('appointments.requestCancellationHint')}
          </Typography>
          <TextField
            label={t('appointments.requestCancellationReason')}
            value={requestCancelReason}
            onChange={(e) => setRequestCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={requestCancelMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestCancelOpen(false)} disabled={requestCancelMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={requestCancelMutation.isPending || !selectedAppointment}
            onClick={() =>
              selectedAppointment &&
              requestCancelMutation.mutate({
                id: selectedAppointment.id,
                reason: requestCancelReason,
              })
            }
          >
            {t('common.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
