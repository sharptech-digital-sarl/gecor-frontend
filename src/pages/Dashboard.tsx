import { useQuery } from '@tanstack/react-query'
import { Typography, Box, Card, CardContent, Skeleton } from '@mui/material'
import {
  Mail as MailIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  EventAvailable as EventAvailableIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type StatCardConfig = {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  bgGradient: string
  isLoading: boolean
  path: string
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: mailStats, isLoading: isLoadingMail, error: mailError } = useQuery({
    queryKey: ['mail-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/mail/', { params: { limit: 1000 } })
        const documents = response.data || []
        return {
          total: documents.length,
          received: documents.filter((d: { status?: string }) => d.status === 'received').length,
          inReview: documents.filter((d: { status?: string }) => d.status === 'in_review').length,
          approved: documents.filter((d: { status?: string }) => d.status === 'approved').length,
          overdue: documents.filter((d: { is_overdue?: boolean }) => d.is_overdue).length,
        }
      } catch (error) {
        console.error('Error fetching mail stats:', error)
        return { total: 0, received: 0, inReview: 0, approved: 0, overdue: 0 }
      }
    },
  })

  const { data: appointmentStats, isLoading: isLoadingAppointments, error: appointmentError } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: async () => {
      try {
        const today = startOfDay(new Date())
        const horizon = new Date(today)
        horizon.setDate(horizon.getDate() + 60)
        horizon.setHours(23, 59, 59, 999)

        const response = await api.get('/appointments/', {
          params: {
            start_date: today.toISOString(),
            end_date: horizon.toISOString(),
            limit: 500,
          },
        })
        const list = (response.data || []) as Array<{ start_time: string; status: string }>
        const todayEnd = endOfDay(today)
        const weekLast = new Date(today)
        weekLast.setDate(weekLast.getDate() + 6)
        const weekEnd = endOfDay(weekLast)

        const inRange = (iso: string, from: Date, to: Date) => {
          const t0 = new Date(iso).getTime()
          return t0 >= from.getTime() && t0 <= to.getTime()
        }

        const todayCount = list.filter((a) => inRange(a.start_time, today, todayEnd)).length
        const weekCount = list.filter((a) => inRange(a.start_time, today, weekEnd)).length
        const confirmed = list.filter((a) => a.status === 'confirmed').length
        const pending = list.filter((a) => a.status === 'pending').length

        return { today: todayCount, week: weekCount, confirmed, pending, totalInHorizon: list.length }
      } catch (error) {
        console.error('Error fetching appointment stats:', error)
        return { today: 0, week: 0, confirmed: 0, pending: 0, totalInHorizon: 0 }
      }
    },
  })

  const mailCards: StatCardConfig[] = [
    {
      title: t('dashboard.mailTotal'),
      value: mailStats?.total ?? 0,
      icon: <MailIcon />,
      color: '#0066CC',
      bgGradient: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
      isLoading: isLoadingMail,
      path: '/mail',
    },
    {
      title: t('dashboard.mailReceived'),
      value: mailStats?.received ?? 0,
      icon: <HourglassEmptyIcon />,
      color: '#0ea5e9',
      bgGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      isLoading: isLoadingMail,
      path: '/mail',
    },
    {
      title: t('dashboard.mailInReview'),
      value: mailStats?.inReview ?? 0,
      icon: <AssignmentIcon />,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      isLoading: isLoadingMail,
      path: '/mail',
    },
    {
      title: t('dashboard.mailApproved'),
      value: mailStats?.approved ?? 0,
      icon: <CheckCircleIcon />,
      color: '#00A651',
      bgGradient: 'linear-gradient(135deg, #00A651 0%, #008542 100%)',
      isLoading: isLoadingMail,
      path: '/mail',
    },
    {
      title: t('dashboard.mailOverdue'),
      value: mailStats?.overdue ?? 0,
      icon: <WarningIcon />,
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      isLoading: isLoadingMail,
      path: '/mail',
    },
  ]

  const appointmentCards: StatCardConfig[] = [
    {
      title: t('dashboard.apptToday'),
      value: appointmentStats?.today ?? 0,
      icon: <CalendarIcon />,
      color: '#0066CC',
      bgGradient: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
      isLoading: isLoadingAppointments,
      path: '/appointments',
    },
    {
      title: t('dashboard.apptWeek'),
      value: appointmentStats?.week ?? 0,
      icon: <EventNoteIcon />,
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      isLoading: isLoadingAppointments,
      path: '/appointments',
    },
    {
      title: t('dashboard.apptConfirmed'),
      value: appointmentStats?.confirmed ?? 0,
      icon: <EventAvailableIcon />,
      color: '#00A651',
      bgGradient: 'linear-gradient(135deg, #00A651 0%, #008542 100%)',
      isLoading: isLoadingAppointments,
      path: '/appointments',
    },
    {
      title: t('dashboard.apptPending'),
      value: appointmentStats?.pending ?? 0,
      icon: <HourglassEmptyIcon />,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      isLoading: isLoadingAppointments,
      path: '/appointments',
    },
    {
      title: t('dashboard.apptUpcomingTotal'),
      value: appointmentStats?.totalInHorizon ?? 0,
      icon: <CalendarIcon />,
      color: '#0891b2',
      bgGradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
      isLoading: isLoadingAppointments,
      path: '/appointments',
    },
  ]

  const renderSection = (title: string, subtitle: string, cards: StatCardConfig[]) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {subtitle}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            md: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {cards.map((card, index) => (
          <Card
            key={`${title}-${index}`}
            onClick={() => navigate(card.path)}
            sx={{
              minWidth: 0,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              borderRadius: 1.5,
              transition: 'all 0.25s ease',
              borderTop: `3px solid ${card.color}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${card.color}35`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              {card.isLoading ? (
                <>
                  <Skeleton variant="circular" width={36} height={36} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="90%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="50%" height={28} />
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: card.bgGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 1,
                      '& svg': { fontSize: 20 },
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: 'block', lineHeight: 1.25, mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: card.color,
                      lineHeight: 1.1,
                      fontSize: { xs: '1.35rem', md: '1.5rem' },
                    }}
                  >
                    {card.value}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
            background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('common.subtitle')}
        </Typography>
      </Box>

      {(mailError || appointmentError) && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'error.contrastText' }}>
          <Typography variant="body2">{t('dashboard.loadError')}</Typography>
        </Box>
      )}

      {renderSection(t('dashboard.sectionMail'), t('dashboard.sectionMailHint'), mailCards)}
      {renderSection(t('dashboard.sectionAppointments'), t('dashboard.sectionAppointmentsHint'), appointmentCards)}
    </Box>
  )
}
