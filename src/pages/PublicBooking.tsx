import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

export default function PublicBooking() {
  const { i18n } = useTranslation()
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [time, setTime] = useState<Dayjs | null>(dayjs().hour(10).minute(0))
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorCompany, setVisitorCompany] = useState('')

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/public/book-appointment', data)
      return response.data
    },
  })

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
    })
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Book an Appointment
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            FPI-CONNECT Appointment Booking System
          </Typography>

          {bookingMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Appointment request submitted successfully! You will receive a confirmation email.
            </Alert>
          )}

          {bookingMutation.isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {bookingMutation.error instanceof Error
                ? bookingMutation.error.message
                : 'Failed to book appointment'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Organizer Email"
              type="email"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Appointment Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale={i18n.language}
            >
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <DatePicker
                  label="Preferred Date"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
                <TimePicker
                  label="Preferred Time"
                  value={time}
                  onChange={(newValue) => setTime(newValue)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Box>
            </LocalizationProvider>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Your Name"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Your Email"
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Phone Number"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Company"
              value={visitorCompany}
              onChange={(e) => setVisitorCompany(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? 'Submitting...' : 'Book Appointment'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

