import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Fade,
  Stack,
} from '@mui/material'
import {
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { tokenService } from '../services/tokenService'
import Logo from '../components/Logo'

export default function Login() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requiresMFA, setRequiresMFA] = useState(false)
  const [mfaSessionId, setMfaSessionId] = useState<string | null>(null)
  const { login, verifyMFA, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && (isAuthenticated || tokenService.hasTokens())) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(username, password)
      
      // Check if MFA is required
      if (response.mfa_required && response.mfa_session_id) {
        setRequiresMFA(true)
        setMfaSessionId(response.mfa_session_id)
        setLoading(false)
      } else {
        // No MFA required, navigate to dashboard
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.loginFailed'))
      setLoading(false)
    }
  }

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Normalize the code: remove any whitespace
    const normalizedCode = mfaCode.replace(/\s/g, '').trim()
    
    // Validate MFA code format (6 digits)
    if (!normalizedCode || normalizedCode.length !== 6 || !/^\d{6}$/.test(normalizedCode)) {
      setError(t('auth.invalidMfaCode'))
      return
    }

    if (!mfaSessionId) {
      setError(t('auth.mfaSessionExpired'))
      return
    }

    setLoading(true)

    try {
      await verifyMFA(mfaSessionId, normalizedCode)
      navigate('/')
    } catch (err: any) {
      // Enhanced error handling with more specific messages
      const errorDetail = err.response?.data?.detail || err.response?.data?.message
      let errorMessage = t('auth.mfaVerificationFailed')
      
      if (errorDetail) {
        // Check for common error patterns
        if (errorDetail.toLowerCase().includes('invalid') || errorDetail.toLowerCase().includes('incorrect')) {
          errorMessage = t('auth.invalidMfaCode') + ' - ' + errorDetail
        } else if (errorDetail.toLowerCase().includes('expired') || errorDetail.toLowerCase().includes('timeout')) {
          errorMessage = t('auth.mfaSessionExpired') + ' - ' + errorDetail
        } else {
          errorMessage = errorDetail
        }
      }
      
      setError(errorMessage)
      setMfaCode('')
      
      // Log error in development
      if (import.meta.env.DEV) {
        console.error('MFA verification error:', {
          error: err,
          status: err.response?.status,
          detail: errorDetail,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRequiresMFA(false)
    setMfaSessionId(null)
    setMfaCode('')
    setError('')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(-45deg, #0066CC, #00A651, #3385D6, #33B873)',
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 15s ease infinite',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(79, 172, 254, 0.3) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'float 20s linear infinite',
        },
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Paper
            elevation={24}
            sx={{
              p: 5,
              width: '100%',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 102, 204, 0.3), 0 4px 16px rgba(0, 166, 81, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #0066CC, #00A651, #3385D6, #33B873)',
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 3s ease infinite',
              },
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 3,
                  '& img': {
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                  },
                }}
              >
                <Logo size="large" showText={false} />
              </Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {t('common.appName')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('common.subtitle')}
              </Typography>
            </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

            {!requiresMFA ? (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    required
                    fullWidth
                    label={t('auth.username')}
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </Box>
                      ),
                    }}
                  />
                  <TextField
                    required
                    fullWidth
                    label={t('auth.password')}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </Box>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 2,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                      },
                    }}
                    disabled={loading}
                  >
                    {loading ? t('auth.signingIn') : t('auth.login')}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleMFAVerify}>
                <Stack spacing={2.5}>
                  <Alert
                    severity="info"
                    icon={<SecurityIcon />}
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                      },
                    }}
                  >
                    {t('auth.mfaRequired')}
                  </Alert>
                  <TextField
                    required
                    fullWidth
                    label={t('auth.mfaCode')}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => {
                      // Only allow 6 digits, remove any whitespace
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setMfaCode(value)
                    }}
                    onPaste={(e) => {
                      // Handle paste: extract only digits
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6)
                      setMfaCode(digitsOnly)
                    }}
                    disabled={loading}
                    inputProps={{
                      maxLength: 6,
                      pattern: '[0-9]{6}',
                      inputMode: 'numeric',
                      autoComplete: 'one-time-code',
                    }}
                    helperText={t('auth.mfaCodeHelper')}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <SecurityIcon sx={{ color: 'text.secondary' }} />
                        </Box>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 1,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                      },
                    }}
                    disabled={loading || mfaCode.length !== 6}
                  >
                    {loading ? t('auth.verifying') : t('auth.verify')}
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    variant="outlined"
                    onClick={handleBackToLogin}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  )
}

