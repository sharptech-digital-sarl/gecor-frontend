import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  variant?: 'horizontal' | 'vertical'
}

export default function Logo({ size = 'medium', showText = true, variant = 'horizontal' }: LogoProps) {
  const { t } = useTranslation()
  
  const sizes = {
    small: { icon: 32, textSize: 14, spacing: 1 },
    medium: { icon: 48, textSize: 16, spacing: 1.5 },
    large: { icon: 80, textSize: 24, spacing: 2 },
  }
  
  const currentSize = sizes[size]
  
  // Try to load logo from public folder
  const logoSrc = '/logo.png'
  const logoSvg = '/logo.svg'
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: currentSize.spacing,
        flexDirection: variant === 'vertical' ? 'column' : 'row',
      }}
    >
      {/* Try to load logo image, fallback to styled text logo */}
      <Box
        component="img"
        src={logoSrc}
        alt="FPI-CONNECT Logo"
        onError={(e: any) => {
          // If PNG fails, try SVG
          if (e.target.src !== logoSvg && !e.target.dataset.triedSvg) {
            e.target.dataset.triedSvg = 'true'
            e.target.src = logoSvg
          } else {
            // If both fail, hide image and show text logo
            e.target.style.display = 'none'
            const parent = e.target.parentElement
            if (parent) {
              const textLogo = parent.querySelector('.text-logo') as HTMLElement
              if (textLogo) textLogo.style.display = 'flex'
            }
          }
        }}
        sx={{
          height: currentSize.icon,
          width: 'auto',
          maxWidth: currentSize.icon * 2,
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
        }}
      />
      {/* Fallback text logo */}
      <Box
        className="text-logo"
        sx={{
          display: 'none',
          width: currentSize.icon,
          height: currentSize.icon,
          borderRadius: 2,
          bgcolor: 'primary.dark',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
          },
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontWeight: 800,
            fontSize: currentSize.icon * 0.4,
            letterSpacing: '-0.02em',
          }}
        >
          FPI
        </Typography>
      </Box>
      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant={size === 'large' ? 'h5' : size === 'medium' ? 'h6' : 'body1'}
            sx={{
              fontWeight: 700,
              color: variant === 'horizontal' ? 'white' : 'text.primary',
              background: 'none',
              backgroundClip: 'unset',
              WebkitBackgroundClip: 'unset',
              WebkitTextFillColor: 'unset',
              lineHeight: 1.2,
              fontSize: `${currentSize.textSize}px`,
              textShadow: variant === 'horizontal' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            {t('common.appName')}
          </Typography>
          {variant === 'vertical' && size !== 'small' && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: `${currentSize.textSize * 0.7}px`,
                mt: 0.5,
              }}
            >
              {t('common.subtitle')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

