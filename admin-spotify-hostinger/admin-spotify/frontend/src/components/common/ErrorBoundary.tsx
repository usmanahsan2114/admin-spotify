import { Component, type ReactNode } from 'react'
import { Alert, Button, Box, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { TOUCH_TARGET_MIN_SIZE } from '../../constants'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary component to catch React component errors and display a fallback UI.
 * Prevents the entire application from crashing when a component throws an error.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    // In production, you could send this to an error tracking service
    // e.g., Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
          }}
        >
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={this.handleReset}
                startIcon={<RefreshIcon />}
                sx={{ minHeight: TOUCH_TARGET_MIN_SIZE }}
              >
                Retry
              </Button>
            }
            sx={{ maxWidth: 600, width: '100%' }}
          >
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                Something went wrong
              </Typography>
              <Typography variant="body2">
                {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                If this problem persists, please refresh the page or contact support.
              </Typography>
            </Stack>
          </Alert>
        </Box>
      )
    }

    return this.props.children
  }
}

