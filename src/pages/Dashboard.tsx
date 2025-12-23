import { useQuery } from '@tanstack/react-query'
import { Grid, Typography, Box, Card, CardContent, Skeleton } from '@mui/material'
import {
  Mail as MailIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: mailStats, isLoading: isLoadingMail, error: mailError } = useQuery({
    queryKey: ['mail-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/mail/', { params: { limit: 1000 } })
        const documents = response.data || []
        return {
          total: documents.length,
          pending: documents.filter((d: any) => d.status === 'received').length,
          overdue: documents.filter((d: any) => d.is_overdue).length,
        }
      } catch (error) {
        console.error('Error fetching mail stats:', error)
        // Return default values on error
        return {
          total: 0,
          pending: 0,
          overdue: 0,
        }
      }
    },
  })

  const { data: appointmentStats, isLoading: isLoadingAppointments, error: appointmentError } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const response = await api.get('/appointments/', {
          params: {
            start_date: today.toISOString(),
            end_date: tomorrow.toISOString(),
          },
        })
        return {
          today: response.data?.length || 0,
        }
      } catch (error) {
        console.error('Error fetching appointment stats:', error)
        // Return default values on error
        return {
          today: 0,
        }
      }
    },
  })

  const statCards = [
    {
      title: t('dashboard.totalDocuments'),
      value: mailStats?.total || 0,
      icon: <MailIcon />,
      color: '#0066CC',
      bgGradient: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
      isLoading: !mailStats,
    },
    {
      title: t('dashboard.pendingReview'),
      value: mailStats?.pending || 0,
      icon: <AssignmentIcon />,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      isLoading: !mailStats,
    },
    {
      title: t('dashboard.overdue'),
      value: mailStats?.overdue || 0,
      icon: <WarningIcon />,
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      isLoading: !mailStats,
    },
    {
      title: t('dashboard.todayAppointments'),
      value: appointmentStats?.today || 0,
      icon: <CalendarIcon />,
      color: '#00A651',
      bgGradient: 'linear-gradient(135deg, #00A651 0%, #008542 100%)',
      isLoading: !appointmentStats,
    },
  ]

  // Debug: Log data to console
  if (import.meta.env.DEV) {
    console.log('Dashboard render:', { mailStats, appointmentStats, isLoadingMail, isLoadingAppointments })
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
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
          <Typography variant="body2">
            {t('dashboard.loadError')}
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#ffffff',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                borderTop: `4px solid ${card.color}`,
                '&:hover': {
                  boxShadow: `0 8px 24px ${card.color}40`,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {card.isLoading ? (
                  <>
                    <Skeleton variant="circular" width={56} height={56} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" height={40} />
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          background: card.bgGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: `0 4px 12px ${card.color}40`,
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontWeight: 500,
                        fontSize: '0.875rem',
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: card.color,
                        lineHeight: 1.2,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      }}
                    >
                      {card.value}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

