import { Box, Link } from '@mui/material'
import { TOUCH_TARGET_MIN_SIZE } from '../../constants'

/**
 * Skip link component for accessibility - allows keyboard users to skip to main content
 * 
 * @example
 * ```tsx
 * <SkipLink href="#main-content" />
 * ```
 */
export const SkipLink = ({ href = '#main-content' }: { href?: string }) => {
  return (
    <Link
      href={href}
      sx={{
        position: 'absolute',
        top: -40,
        left: 0,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        padding: 1.5,
        textDecoration: 'none',
        zIndex: 10000,
        minHeight: TOUCH_TARGET_MIN_SIZE,
        display: 'flex',
        alignItems: 'center',
        '&:focus': {
          top: 0,
        },
      }}
    >
      Skip to main content
    </Link>
  )
}

