import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import MfaSetup from '../components/MfaSetup'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [language, setLanguage] = useState(i18n.language || 'en')
  const [calendarMessage, setCalendarMessage] = useState<null | { type: 'success' | 'error'; text: string }>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    setLanguage(i18n.language || 'en')
  }, [i18n.language])

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value
    setLanguage(newLanguage)
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('i18nextLng', newLanguage)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleStatus = params.get('google_calendar')
    if (!googleStatus) return
    if (googleStatus === 'connected') {
      setCalendarMessage({ type: 'success', text: 'Google Calendar connected successfully.' })
    } else {
      setCalendarMessage({ type: 'error', text: 'Could not connect Google Calendar.' })
    }
  }, [])

  const handleGoogleConnect = async () => {
    setCalendarLoading(true)
    try {
      const response = await api.get('/auth/google/start', { params: { next_path: '/settings' } })
      const url = response.data?.auth_url
      if (!url) throw new Error('Missing OAuth URL')
      window.location.href = url
    } catch (err: any) {
      setCalendarMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Google Calendar connection failed.',
      })
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    setCalendarLoading(true)
    try {
      await api.post('/auth/google/disconnect')
      setCalendarMessage({ type: 'success', text: 'Google Calendar disconnected.' })
      window.location.reload()
    } catch (err: any) {
      setCalendarMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'Google Calendar disconnection failed.',
      })
    } finally {
      setCalendarLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">{t('settings.title')}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.preferences')}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="language-select-label">
                  {t('settings.language')}
                </InputLabel>
                <Select
                  labelId="language-select-label"
                  id="language-select"
                  value={language}
                  label={t('settings.language')}
                  onChange={handleLanguageChange}
                >
                  <MenuItem value="en">
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>🇬🇧</span>
                      <span>{t('settings.english')}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="fr">
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>🇫🇷</span>
                      <span>{t('settings.french')}</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('settings.languageDescription')}
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ mt: 3 }}>
            <MfaSetup />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calendar integrations
              </Typography>
              <Divider sx={{ my: 2 }} />
              {calendarMessage && (
                <Alert severity={calendarMessage.type} sx={{ mb: 2 }} onClose={() => setCalendarMessage(null)}>
                  {calendarMessage.text}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Link your Google account to sync confirmed appointments to Google Calendar.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Connected Google account:{' '}
                <strong>{user?.google_account_email || 'Not connected'}</strong>
              </Typography>
              {!user?.google_account_email ? (
                <Button variant="contained" onClick={handleGoogleConnect} disabled={calendarLoading}>
                  Connect Google Calendar
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleGoogleDisconnect}
                  disabled={calendarLoading}
                >
                  Disconnect Google Calendar
                </Button>
              )}
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.general')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settings.languageDescription')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

