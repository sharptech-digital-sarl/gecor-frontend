import { useState, useLayoutEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Mail as MailIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  Gavel as GavelIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Menu as MenuIcon,
  History as HistoryIcon,
  NotificationsActive as NotificationsActiveIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { isAdminUser } from '../utils/roles'
import { hasPermission } from '../utils/permissions'
import Settings from './Settings'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

const drawerWidth = 280
const drawerWidthMini = 72

export default function Layout() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const didMoveFocusToMain = useRef(false)
  const userMenuOpen = Boolean(userMenuAnchor)
  const displayName = user?.full_name?.trim() || user?.username || 'User'
  const displayInitial = (user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()

  // Après connexion, le focus peut rester sur le 1er item du menu alors qu’un Dialog fermé
  // laisse encore aria-hidden sur #root — déplacer le focus vers le contenu principal une fois.
  useLayoutEffect(() => {
    if (didMoveFocusToMain.current) return
    didMoveFocusToMain.current = true
    const el = document.getElementById('main-content')
    el?.focus({ preventScroll: true })
  }, [])

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/app' },
    { text: t('navigation.mailManagement'), icon: <MailIcon />, path: '/app/mail' },
    { text: t('navigation.appointments'), icon: <CalendarIcon />, path: '/app/appointments' },
    { text: t('navigation.reception'), icon: <PeopleIcon />, path: '/app/reception' },
    ...(hasPermission(user, 'deletion_requests.review')
      ? [{ text: t('navigation.deletionRequests'), icon: <GavelIcon />, path: '/app/deletion-requests' }]
      : []),
    ...(isAdminUser(user?.role)
      ? [{ text: t('navigation.users'), icon: <GroupsIcon />, path: '/app/users' }]
      : []),
    ...(hasPermission(user, 'admin.audit')
      ? [{ text: t('navigation.auditLog'), icon: <HistoryIcon />, path: '/app/admin/audit' }]
      : []),
    ...(hasPermission(user, 'admin.notifications')
      ? [
          {
            text: t('navigation.systemNotifications'),
            icon: <NotificationsActiveIcon />,
            path: '/app/admin/notifications',
          },
        ]
      : []),
    ...(hasPermission(user, 'content.public_posts')
      ? [{ text: t('navigation.publicPosts'), icon: <ArticleIcon />, path: '/app/admin/public-posts' }]
      : []),
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const drawerTransition = theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  })

  const drawerCurrentWidth = sidebarExpanded ? drawerWidth : drawerWidthMini

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerCurrentWidth}px)`,
          ml: `${drawerCurrentWidth}px`,
          transition: drawerTransition,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'primary.dark',
          boxShadow: '0 2px 8px rgba(13, 71, 161, 0.35)',
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              edge="start"
              aria-label={t('navigation.toggleSidebar')}
              aria-expanded={sidebarExpanded}
              onClick={() => setSidebarExpanded((v) => !v)}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)' },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Logo size="small" showText={true} variant="horizontal" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationBell />
            <Button
              id="user-menu-button"
              aria-controls={userMenuOpen ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                color: 'white',
                textTransform: 'none',
                borderRadius: 3,
                px: 1.5,
                py: 0.75,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
              startIcon={
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  {displayInitial}
                </Avatar>
              }
              endIcon={<KeyboardArrowDownIcon sx={{ color: 'white', opacity: 0.9 }} />}
            >
              <Box sx={{ textAlign: 'left', lineHeight: 1.25 }}>
                <Box component="span" sx={{ display: 'block', fontWeight: 600, fontSize: '0.95rem' }}>
                  {displayName}
                </Box>
                {user?.username && user?.full_name?.trim() && (
                  <Box
                    component="span"
                    sx={{ display: 'block', fontSize: '0.75rem', opacity: 0.85, fontWeight: 400 }}
                  >
                    @{user.username}
                  </Box>
                )}
              </Box>
            </Button>
            <Menu
              id="user-menu"
              anchorEl={userMenuAnchor}
              open={userMenuOpen}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: { mt: 1, minWidth: 220, borderRadius: 2 },
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null)
                  setSettingsOpen(true)
                }}
                sx={{ py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('navigation.settings')} primaryTypographyProps={{ fontWeight: 500 }} />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null)
                  handleLogout()
                }}
                sx={{ py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, color: 'error.main' }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('auth.logout')} primaryTypographyProps={{ fontWeight: 500 }} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerCurrentWidth,
          flexShrink: 0,
          transition: drawerTransition,
          overflow: 'hidden',
          '& .MuiDrawer-paper': {
            width: drawerCurrentWidth,
            transition: drawerTransition,
            overflowX: 'hidden',
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            background: '#ffffff',
            position: 'relative',
            zIndex: (theme) => theme.zIndex.drawer,
            whiteSpace: 'nowrap',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: sidebarExpanded ? 2 : 1 }}>
          <Box
            sx={{
              px: sidebarExpanded ? 2 : 0.5,
              mb: sidebarExpanded ? 3 : 2,
              display: 'flex',
              justifyContent: 'center',
              pt: 1,
              '& img': {
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                maxWidth: sidebarExpanded ? 'none' : 40,
              },
            }}
          >
            <Logo size="small" showText={false} />
          </Box>
          <List sx={{ px: sidebarExpanded ? 1.5 : 0.5 }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path
              const shift = sidebarExpanded ? '4px' : '0px'
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip
                    title={item.text}
                    placement="right"
                    arrow
                    enterDelay={400}
                    disableHoverListener={sidebarExpanded}
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        px: sidebarExpanded ? 2 : 1,
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          bgcolor: 'primary.main',
                          transform: isSelected ? 'scaleY(1)' : 'scaleY(0)',
                          transition: 'transform 0.2s ease',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(21, 101, 192, 0.08)',
                          color: 'primary.dark',
                          transform: sidebarExpanded ? `translateX(${shift})` : 'none',
                          '&:hover': {
                            bgcolor: 'rgba(21, 101, 192, 0.12)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                          },
                        },
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: sidebarExpanded ? `translateX(${shift})` : 'none',
                          '&::before': {
                            transform: 'scaleY(1)',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: sidebarExpanded ? 40 : 0,
                          mr: sidebarExpanded ? 0 : 0,
                          justifyContent: 'center',
                          color: isSelected ? 'primary.main' : 'text.secondary',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {sidebarExpanded ? (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 600 : 500,
                            fontSize: '0.95rem',
                          }}
                        />
                      ) : null}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Drawer>
      <Box
        id="main-content"
        component="main"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'auto',
          outline: 'none',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: { xs: 1.5, sm: 2, md: 2.5 },
            width: '100%',
            maxWidth: 'none',
            mx: 0,
            position: 'relative',
            zIndex: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      {settingsOpen ? (
        <Settings open onClose={() => setSettingsOpen(false)} />
      ) : null}
    </Box>
  )
}

