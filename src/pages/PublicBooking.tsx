import { useState, useRef, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Link,
} from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  ModalSectionHeader,
  ModalSectionBody,
  modalDialogFooterSx,
} from '../components/common/DetailModalLayout'

/** Détails d’erreur renvoyés par POST /public/book-appointment (API en anglais). */
const PUBLIC_BOOKING_API_ERROR_I18N: Record<string, string> = {
  'Organizer not found or not available for public bookings': 'publicBooking.errorOrganizerNotFound',
  'Selected time slot is not available. Please choose another time.': 'publicBooking.errorSlotUnavailable',
}

export default function PublicBooking() {
  const { t, i18n } = useTranslation()
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [time, setTime] = useState<Dayjs | null>(dayjs().hour(10).minute(0))
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorCompany, setVisitorCompany] = useState('')
  const [visitorIdDocumentDataUrl, setVisitorIdDocumentDataUrl] = useState<string | null>(null)
  const [idDocError, setIdDocError] = useState('')
  const [qrDownloadBusy, setQrDownloadBusy] = useState(false)
  const [qrDownloadError, setQrDownloadError] = useState('')
  const idDocInputRef = useRef<HTMLInputElement>(null)

  const bookingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/public/book-appointment', data)
      return response.data
    },
    onSuccess: () => {
      setVisitorIdDocumentDataUrl(null)
      if (idDocInputRef.current) idDocInputRef.current.value = ''
      setIdDocError('')
      setQrDownloadError('')
    },
  })

  const appointmentId = bookingMutation.data?.id as string | undefined
  const qrSrc =
    bookingMutation.isSuccess && appointmentId
      ? `${String(api.defaults.baseURL).replace(/\/+$/, '')}/public/appointments/${appointmentId}/visitor-qrcode`
      : null

  const handleDownloadQrPng = useCallback(async () => {
    if (!appointmentId) return
    setQrDownloadError('')
    setQrDownloadBusy(true)
    try {
      const res = await api.get(`/public/appointments/${appointmentId}/visitor-qrcode`, {
        responseType: 'blob',
      })
      const blob = res.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gecor-qr-rendez-vous-${appointmentId}.png`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setQrDownloadError(t('publicBooking.qrDownloadFailed'))
    } finally {
      setQrDownloadBusy(false)
    }
  }, [appointmentId, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) return
    const preferredDate = date.toDate()
    const preferredTime = time.format('HH:mm')
    bookingMutation.mutate({
      organizer_email: organizerEmail,
      title,
      description,
      preferred_date: preferredDate.toISOString(),
      preferred_time: preferredTime,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_phone: visitorPhone,
      visitor_company: visitorCompany,
      ...(visitorIdDocumentDataUrl ? { visitor_id_document_base64: visitorIdDocumentDataUrl } : {}),
    })
  }

  const onIdDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdDocError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setIdDocError(t('appointments.visitorPhotoInvalidType'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setIdDocError(t('appointments.visitorPhotoTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') setVisitorIdDocumentDataUrl(r)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <ModalSectionHeader>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
            {t('publicBooking.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('publicBooking.subtitle')}
          </Typography>
          <Link
            component={RouterLink}
            to="/"
            variant="body2"
            underline="hover"
            sx={{ mt: 1.5, display: 'inline-block', fontWeight: 600 }}
          >
            {t('auth.linkToPublicHome')}
          </Link>
        </ModalSectionHeader>

        <ModalSectionBody>
        {bookingMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} variant="outlined">
            {t('publicBooking.successMessage')}
          </Alert>
        )}

        {bookingMutation.isSuccess && qrSrc && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('publicBooking.qrTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('publicBooking.qrHint')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box
                component="img"
                src={qrSrc}
                alt={t('publicBooking.qrAlt')}
                sx={{ width: 240, height: 240, objectFit: 'contain' }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => void handleDownloadQrPng()}
                disabled={qrDownloadBusy}
              >
                {qrDownloadBusy ? t('publicBooking.qrDownloadBusy') : t('publicBooking.qrDownload')}
              </Button>
              {qrDownloadError ? (
                <Typography variant="caption" color="error" textAlign="center">
                  {qrDownloadError}
                </Typography>
              ) : null}
            </Box>
          </Box>
        )}

        {idDocError && (
          <Alert severity="warning" sx={{ mb: 2 }} variant="outlined" onClose={() => setIdDocError('')}>
            {idDocError}
          </Alert>
        )}

        {bookingMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
            {(() => {
              const err = bookingMutation.error
              const detail =
                typeof err === 'object' &&
                err !== null &&
                'response' in err &&
                typeof (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail ===
                  'string'
                  ? ((err as { response: { data: { detail: string } } }).response.data.detail)
                  : undefined
              if (detail && PUBLIC_BOOKING_API_ERROR_I18N[detail]) {
                return t(PUBLIC_BOOKING_API_ERROR_I18N[detail])
              }
              return detail || (err instanceof Error ? err.message : t('publicBooking.errorGeneric'))
            })()}
          </Alert>
        )}

        <Box component="form" id="public-booking-form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label={t('publicBooking.organizerEmail')}
            type="email"
            value={organizerEmail}
            onChange={(e) => setOrganizerEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label={t('publicBooking.appointmentTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label={t('publicBooking.description')}
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label={t('publicBooking.preferredDate')}
                value={date}
                onChange={(newValue) => setDate(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true, sx: { flex: '1 1 200px' } } }}
              />
              <TimePicker
                label={t('publicBooking.preferredTime')}
                value={time}
                onChange={(newValue) => setTime(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true, sx: { flex: '1 1 200px' } } }}
              />
            </Box>
          </LocalizationProvider>
          <TextField
            margin="normal"
            required
            fullWidth
            label={t('publicBooking.visitorName')}
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label={t('publicBooking.visitorEmail')}
            type="email"
            value={visitorEmail}
            onChange={(e) => setVisitorEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label={t('publicBooking.visitorPhone')}
            value={visitorPhone}
            onChange={(e) => setVisitorPhone(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label={t('publicBooking.visitorCompany')}
            value={visitorCompany}
            onChange={(e) => setVisitorCompany(e.target.value)}
          />
          <input
            ref={idDocInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onIdDocumentSelected}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('publicBooking.visitorIdDocumentLabel')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {t('publicBooking.visitorIdDocumentHint')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Button variant="outlined" size="small" type="button" onClick={() => idDocInputRef.current?.click()}>
                {t('publicBooking.visitorIdDocumentChoose')}
              </Button>
              {visitorIdDocumentDataUrl && (
                <>
                  <Box
                    component="img"
                    src={visitorIdDocumentDataUrl}
                    alt=""
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
                  />
                  <Button
                    size="small"
                    type="button"
                    onClick={() => {
                      setVisitorIdDocumentDataUrl(null)
                      if (idDocInputRef.current) idDocInputRef.current.value = ''
                    }}
                  >
                    {t('publicBooking.visitorIdDocumentClear')}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
        </ModalSectionBody>

        <Box
          component="footer"
          sx={{
            ...modalDialogFooterSx,
            justifyContent: 'stretch',
          }}
        >
          <Button
            type="submit"
            form="public-booking-form"
            fullWidth
            variant="contained"
            color="primary"
            disabled={bookingMutation.isPending}
          >
            {bookingMutation.isPending ? t('publicBooking.submitting') : t('publicBooking.submit')}
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
