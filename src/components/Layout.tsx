import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Mail as MailIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import Settings from './Settings'
import Logo from './Logo'

const drawerWidth = 280

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/' },
    { text: t('navigation.mailManagement'), icon: <MailIcon />, path: '/mail' },
    { text: t('navigation.appointments'), icon: <CalendarIcon />, path: '/appointments' },
    { text: t('navigation.reception'), icon: <PeopleIcon />, path: '/reception' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
          boxShadow: '0 8px 32px rgba(0, 102, 204, 0.3), 0 4px 16px rgba(0, 166, 81, 0.2)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            animation: 'shimmer 3s infinite',
            pointerEvents: 'none',
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Logo size="small" showText={true} variant="horizontal" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>{user?.full_name?.charAt(0) || 'U'}</Avatar>}
              label={user?.full_name || 'User'}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                '& .MuiChip-label': { fontWeight: 500 },
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            background: '#ffffff',
            position: 'relative',
            zIndex: (theme) => theme.zIndex.drawer,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <Box 
            sx={{ 
              px: 2, 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'center',
              pt: 1,
              '& img': {
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
              },
            }}
          >
            <Logo size="small" showText={false} />
          </Box>
          <List sx={{ px: 1.5 }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      py: 1.25,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
                        transform: isSelected ? 'scaleY(1)' : 'scaleY(0)',
                        transition: 'transform 0.3s ease',
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
                        transform: 'translateX(4px)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0052A3 0%, #008542 100%)',
                          boxShadow: '0 6px 16px rgba(0, 102, 204, 0.4)',
                          transform: 'translateX(4px) scale(1.02)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                      },
                      '&:hover': {
                        background: 'rgba(0, 102, 204, 0.08)',
                        transform: 'translateX(4px)',
                        '&::before': {
                          transform: 'scaleY(1)',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isSelected ? 'white' : 'text.secondary',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
          <Divider sx={{ my: 2, mx: 2 }} />
          <List sx={{ px: 1.5 }}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={t('navigation.settings')} placement="right">
                <ListItemButton
                  onClick={() => setSettingsOpen(true)}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    '&:hover': {
                      background: 'rgba(0, 102, 204, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('navigation.settings')}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip title={t('auth.logout')} placement="right">
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    color: 'error.main',
                    '&:hover': {
                      background: 'rgba(239, 68, 68, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('auth.logout')}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f5f7fa',
          minHeight: '100vh',
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '1600px',
            mx: 'auto',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  )
}

