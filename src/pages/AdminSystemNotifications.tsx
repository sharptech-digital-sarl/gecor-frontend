import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

type InApp = {
  id: string
  user_id?: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

type EmailN = {
  id: string
  notification_type: string
  status: string
  subject: string | null
  message: string
  recipient_email: string | null
  created_at: string
}

type Overview = {
  in_app: InApp[]
  email_notifications: EmailN[]
}

export default function AdminSystemNotifications() {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications-overview'],
    queryFn: async () => {
      const { data: d } = await api.get<Overview>('/admin/notifications')
      return d
    },
  })

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t('adminNotifications.title')}
      </Typography>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('adminNotifications.tabInApp')} />
          <Tab label={t('adminNotifications.tabEmail')} />
        </Tabs>
      </Paper>
      {isLoading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('adminNotifications.colTime')}</TableCell>
                <TableCell>{t('adminNotifications.colUser')}</TableCell>
                <TableCell>{t('adminNotifications.colTitle')}</TableCell>
                <TableCell>{t('adminNotifications.colBody')}</TableCell>
                <TableCell>{t('adminNotifications.colRead')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.in_app ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{row.user_id ?? '—'}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{row.body}</TableCell>
                  <TableCell>{row.read_at ? t('common.yes') : t('common.no')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('adminNotifications.colTime')}</TableCell>
                <TableCell>{t('adminNotifications.colStatus')}</TableCell>
                <TableCell>{t('adminNotifications.colRecipient')}</TableCell>
                <TableCell>{t('adminNotifications.colSubject')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.email_notifications ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.recipient_email ?? '—'}</TableCell>
                  <TableCell>{row.subject ?? row.message.slice(0, 80)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
