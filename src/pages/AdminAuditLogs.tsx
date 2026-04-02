import { useState } from 'react'
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
  TextField,
  Button,
  CircularProgress,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

type AuditRow = {
  id: string
  timestamp: string
  actor_user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
}

export default function AdminAuditLogs() {
  const { t } = useTranslation()
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit', action, resourceType],
    queryFn: async () => {
      const { data: rows } = await api.get<AuditRow[]>('/admin/audit-logs', {
        params: {
          limit: 150,
          ...(action.trim() ? { action: action.trim() } : {}),
          ...(resourceType.trim() ? { resource_type: resourceType.trim() } : {}),
        },
      })
      return rows
    },
  })

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t('adminAudit.title')}
      </Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          label={t('adminAudit.filterAction')}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <TextField
          size="small"
          label={t('adminAudit.filterResource')}
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        />
        <Button variant="contained" onClick={() => refetch()}>
          {t('common.apply')}
        </Button>
      </Paper>
      <TableContainer component={Paper}>
        {isLoading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('adminAudit.colTime')}</TableCell>
                <TableCell>{t('adminAudit.colAction')}</TableCell>
                <TableCell>{t('adminAudit.colResource')}</TableCell>
                <TableCell>{t('adminAudit.colActor')}</TableCell>
                <TableCell>{t('adminAudit.colIp')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>
                    {row.resource_type}
                    {row.resource_id ? ` / ${row.resource_id}` : ''}
                  </TableCell>
                  <TableCell>{row.actor_user_id ?? '—'}</TableCell>
                  <TableCell>{row.ip_address ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  )
}
