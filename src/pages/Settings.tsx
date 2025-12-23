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
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import MfaSetup from '../components/MfaSetup'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.language || 'en')

  useEffect(() => {
    setLanguage(i18n.language || 'en')
  }, [i18n.language])

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value
    setLanguage(newLanguage)
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('i18nextLng', newLanguage)
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

