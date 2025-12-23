import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/config'

interface SettingsProps {
  open: boolean
  onClose: () => void
}

export default function Settings({ open, onClose }: SettingsProps) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState(i18n.language || 'en')

  // Sync language state with i18n
  useEffect(() => {
    setLanguage(i18n.language || 'en')
  }, [i18n.language])

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('i18nextLng', newLanguage)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('settings.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="language-select-label">
              {t('settings.language')}
            </InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={language}
              label={t('settings.language')}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <MenuItem value="en">{t('settings.english')}</MenuItem>
              <MenuItem value="fr">{t('settings.french')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

