import { useState, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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
  Link,
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
      navigate('/app')
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
        navigate('/app')
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
      navigate('/app')
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
        bgcolor: 'background.default',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              width: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
              <Typography
                component="h1"
                sx={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.65rem', sm: '2rem' },
                  letterSpacing: '0.04em',
                  lineHeight: 1.15,
                  mb: 1,
                  color: 'primary.dark',
                }}
              >
                {t('auth.loginAppTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('common.subtitle')}
              </Typography>
              <Link
                component={RouterLink}
                to="/"
                variant="body2"
                underline="hover"
                sx={{ fontWeight: 600 }}
              >
                {t('auth.linkToPublicHome')}
              </Link>
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
                    color="primary"
                    size="large"
                    sx={{ mt: 2, py: 1.5 }}
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
                    color="primary"
                    size="large"
                    sx={{ mt: 1, py: 1.5 }}
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

