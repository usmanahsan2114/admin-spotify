import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import MemoryIcon from '@mui/icons-material/Memory'
import SpeedIcon from '@mui/icons-material/Speed'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { fetchHealthStatus, type HealthStatus } from '../../services/healthService'
import { formatDuration } from '../../utils/dateUtils'

const SystemStatusCard = () => {
  const theme = useTheme()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const healthData = await fetchHealthStatus()
        setHealth(healthData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to fetch system status')
        setHealth(null)
      } finally {
        setLoading(false)
      }
    }

    loadHealth()
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error || !health) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={600}>
              System Status
            </Typography>
            <Chip
              icon={<ErrorIcon />}
              label="Unable to fetch status"
              color="error"
              size="small"
            />
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    if (health.status === 'ok') return 'success'
    if (health.status === 'degraded') return 'warning'
    return 'error'
  }

  const getStatusIcon = () => {
    if (health.status === 'ok') return <CheckCircleIcon />
    if (health.status === 'degraded') return <WarningIcon />
    return <ErrorIcon />
  }

  const getStatusLabel = () => {
    if (health.status === 'ok') return 'All Systems Operational'
    if (health.status === 'degraded') return 'Degraded Performance'
    return 'System Error'
  }

  const dbStatusColor = health.database.status === 'connected' ? 'success' : 'error'
  const dbLatencyColor =
    health.database.latency < 50 ? 'success' : health.database.latency < 200 ? 'warning' : 'error'

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography variant="h6" fontWeight={600}>
              System Status
            </Typography>
            <Chip
              icon={getStatusIcon()}
              label={getStatusLabel()}
              color={getStatusColor()}
              size="small"
            />
          </Box>

          {/* Status Grid */}
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            gap={2}
          >
            {/* Database Status */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Database
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={health.database.status === 'connected' ? 'Connected' : 'Disconnected'}
                    color={dbStatusColor}
                    size="small"
                    sx={{ minWidth: 90 }}
                  />
                  {health.database.latency !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {health.database.latency}ms
                    </Typography>
                  )}
                </Box>
                {health.database.error && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {health.database.error}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* API Latency */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  API Response
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon fontSize="small" color="action" />
                  <Chip
                    label={`${health.performance.apiLatency}ms`}
                    color={health.performance.apiLatency < 100 ? 'success' : health.performance.apiLatency < 300 ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>

            {/* Uptime */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Uptime
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500}>
                    {formatDuration(health.uptime)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Memory Usage */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Memory
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <MemoryIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500}>
                    {health.performance.memory.heapUsed}MB / {health.performance.memory.heapTotal}MB
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    borderRadius: 1,
                    bgcolor: theme.palette.mode === 'light' ? 'grey.300' : 'grey.700',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${(health.performance.memory.heapUsed / health.performance.memory.heapTotal) * 100}%`,
                      height: '100%',
                      bgcolor:
                        health.performance.memory.heapUsed / health.performance.memory.heapTotal > 0.9
                          ? 'error.main'
                          : health.performance.memory.heapUsed / health.performance.memory.heapTotal > 0.7
                          ? 'warning.main'
                          : 'success.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Environment */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Environment
                </Typography>
                <Chip
                  label={health.environment}
                  color={health.environment === 'production' ? 'primary' : 'default'}
                  size="small"
                />
              </Stack>
            </Box>

            {/* Version */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Version
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {health.version}
                </Typography>
              </Stack>
            </Box>
          </Box>

          {/* Last Updated */}
          <Typography variant="caption" color="text.secondary" textAlign="right">
            Last updated: {new Date(health.timestamp).toLocaleTimeString()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SystemStatusCard

