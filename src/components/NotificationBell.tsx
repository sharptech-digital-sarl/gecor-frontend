import { useState, useEffect, useRef } from 'react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { subscribePushWithApi } from '../utils/webPush'

type InAppRow = {
  id: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const pushTried = useRef(false)

  const { data: items = [] } = useQuery({
    queryKey: ['in-app-notifications'],
    queryFn: async () => {
      const { data } = await api.get<InAppRow[]>('/notifications', { params: { limit: 40 } })
      return data
    },
    refetchInterval: 60_000,
  })

  const unread = items.filter((n) => !n.read_at).length

  const readOne = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['in-app-notifications'] }),
  })

  const readAll = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['in-app-notifications'] }),
  })

  useEffect(() => {
    if (pushTried.current) return
    pushTried.current = true
    void subscribePushWithApi(api).catch(() => undefined)
  }, [])

  return (
    <>
      <Tooltip title={t('notifications.tooltip')}>
        <IconButton color="inherit" onClick={() => setOpen(true)} aria-label={t('notifications.tooltip')}>
          <Badge badgeContent={unread} color="error" max={99} invisible={unread === 0}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Toolbar sx={{ px: 2, gap: 1, justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span">
            {t('notifications.title')}
          </Typography>
          <Button size="small" onClick={() => readAll.mutate()} disabled={readAll.isPending || unread === 0}>
            {t('notifications.markAllRead')}
          </Button>
        </Toolbar>
        <Divider />
        <Box sx={{ width: 360, maxWidth: '100vw' }}>
          <List dense>
            {items.length === 0 ? (
              <ListItemText sx={{ px: 2, py: 2 }} primary={t('notifications.empty')} />
            ) : (
              items.map((n) => (
                <ListItemButton
                  key={n.id}
                  selected={!n.read_at}
                  alignItems="flex-start"
                  onClick={() => {
                    if (!n.read_at) readOne.mutate(n.id)
                  }}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" display="block">
                          {n.body}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>
        </Box>
      </Drawer>
    </>
  )
}
