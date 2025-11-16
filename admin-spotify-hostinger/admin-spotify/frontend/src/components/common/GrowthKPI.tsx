import { memo } from 'react'
import { Box, Card, CardContent, Chip, Typography, useTheme, alpha } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'

type GrowthKPIProps = {
  label: string
  value: string | number
  growthPct?: number
  formatValue?: (value: string | number) => string
  size?: 'small' | 'medium' | 'large'
  icon?: React.ReactNode
  color?: string
}

const GrowthKPI = memo(({ label, value, growthPct, formatValue, size = 'medium', icon, color }: GrowthKPIProps) => {
  const theme = useTheme()
  
  const isPositive = growthPct !== undefined && growthPct > 0
  const isNegative = growthPct !== undefined && growthPct < 0

  const growthColor = isPositive
    ? theme.palette.success.main
    : isNegative
      ? theme.palette.error.main
      : theme.palette.text.secondary

  // Determine icon based on label if not provided
  const getIcon = () => {
    if (icon) return icon
    const labelLower = label.toLowerCase()
    if (labelLower.includes('sales') || labelLower.includes('revenue')) {
      return <AttachMoneyIcon />
    }
    if (labelLower.includes('order')) {
      return <ShoppingCartIcon />
    }
    if (labelLower.includes('avg') || labelLower.includes('average')) {
      return <AssessmentIcon />
    }
    if (labelLower.includes('return')) {
      return <AssignmentReturnIcon />
    }
    return <AssessmentIcon />
  }

  // Determine color based on label if not provided
  const getCardColor = () => {
    if (color) return color
    const labelLower = label.toLowerCase()
    if (labelLower.includes('sales') || labelLower.includes('revenue')) {
      return theme.palette.primary.main
    }
    if (labelLower.includes('order')) {
      return theme.palette.info.main
    }
    if (labelLower.includes('avg') || labelLower.includes('average')) {
      return theme.palette.warning.main
    }
    if (labelLower.includes('return')) {
      return theme.palette.error.main
    }
    return theme.palette.primary.main
  }

  const cardColor = getCardColor()
  const displayValue = value !== undefined && value !== null 
    ? (formatValue ? formatValue(value) : value.toString())
    : '—'

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: { xs: 120, sm: 140 },
        borderLeft: `4px solid ${cardColor}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: { xs: theme.shadows[2], sm: theme.shadows[4] },
        },
      }}
    >
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 1, sm: 1.5 },
          p: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        {/* Header with Icon */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            sx={{
              p: { xs: 0.75, sm: 1 },
              borderRadius: 1.5,
              backgroundColor: alpha(cardColor, 0.1),
              color: cardColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': {
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              },
            }}
          >
            {getIcon()}
          </Box>
          {growthPct !== undefined && (
            <Chip
              icon={
                isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                ) : isNegative ? (
                  <TrendingDownIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                ) : (
                  <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                )
              }
              label={`${isPositive ? '+' : ''}${growthPct.toFixed(1)}%`}
              size="small"
              sx={{
                height: { xs: 24, sm: 28 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 600,
                backgroundColor: alpha(growthColor, 0.1),
                color: growthColor,
                border: `1px solid ${alpha(growthColor, 0.3)}`,
                '& .MuiChip-icon': {
                  color: growthColor,
                  marginLeft: { xs: '4px', sm: '6px' },
                },
              }}
            />
          )}
        </Box>

        {/* Value */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant={size === 'large' ? 'h4' : size === 'small' ? 'h6' : 'h5'}
            fontWeight={700}
            sx={{ 
              fontSize: { 
                xs: size === 'large' ? '1.5rem' : size === 'small' ? '1.125rem' : '1.375rem',
                sm: size === 'large' ? '1.75rem' : size === 'small' ? '1.25rem' : '1.5rem',
                md: size === 'large' ? '2rem' : size === 'small' ? '1.375rem' : '1.75rem',
              },
              lineHeight: 1.2,
              wordBreak: 'break-word',
              color: 'text.primary',
            }}
          >
            {displayValue}
          </Typography>
        </Box>

        {/* Label */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontWeight={500}
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
})

GrowthKPI.displayName = 'GrowthKPI'

export default GrowthKPI

