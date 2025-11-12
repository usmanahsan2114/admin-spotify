import { Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Box
      component="main"
      display="flex"
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      px={3}
    >
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Typography variant="h2" fontWeight={700}>
          404
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </Stack>
    </Box>
  )
}

export default NotFoundPage


