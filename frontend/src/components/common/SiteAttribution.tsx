import { Link, Typography, type TypographyProps } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

type SiteAttributionProps = {
  align?: TypographyProps['align']
  variant?: TypographyProps['variant']
  sx?: SxProps<Theme>
}

const SiteAttribution = ({
  align = 'center',
  variant = 'body2',
  sx,
}: SiteAttributionProps) => (
  <Typography
    variant={variant}
    color="text.secondary"
    textAlign={align}
    sx={{ lineHeight: 1.6, ...sx }}
  >
    Design &amp; Developed by{' '}
    <Link
      href="https://www.apexitsolutions.co/"
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
    >
      Apex IT Solutions
    </Link>{' '}
    &amp;{' '}
    <Link
      href="https://apexmarketings.com/"
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
    >
      Apex Marketings
    </Link>
  </Typography>
)

export default SiteAttribution


