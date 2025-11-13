import { memo } from 'react'
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'

type GrowthKPIProps = {
  label: string
  value: string | number
  growthPct?: number
  formatValue?: (value: string | number) => string
  size?: 'small' | 'medium' | 'large'
}

const GrowthKPI = memo(({ label, value, growthPct, formatValue, size = 'medium' }: GrowthKPIProps) => {
  const theme = useTheme()
  const isPositive = growthPct !== undefined && growthPct > 0
  const isNegative = growthPct !== undefined && growthPct < 0
  const isNeutral = growthPct === undefined || growthPct === 0

  const growthColor = isPositive
    ? theme.palette.success.main
    : isNegative
      ? theme.palette.error.main
      : theme.palette.text.secondary

  const displayValue = formatValue ? formatValue(value) : value.toString()

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography
          variant={size === 'large' ? 'h4' : size === 'small' ? 'h6' : 'h5'}
          fontWeight={600}
          sx={{ flexGrow: 1 }}
        >
          {displayValue}
        </Typography>
        {growthPct !== undefined && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {isPositive && <TrendingUpIcon sx={{ fontSize: 18, color: growthColor }} />}
            {isNegative && <TrendingDownIcon sx={{ fontSize: 18, color: growthColor }} />}
            {isNeutral && <RemoveIcon sx={{ fontSize: 18, color: growthColor }} />}
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: growthColor }}
            >
              {Math.abs(growthPct).toFixed(1)}%
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
})

GrowthKPI.displayName = 'GrowthKPI'

export default GrowthKPI

