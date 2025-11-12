import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { Routes, Route, Link as RouterLink } from 'react-router-dom'
import OrderTestForm from './pages/OrderTestForm'

const HomePage = () => (
  <Container maxWidth="md" sx={{ py: { xs: 8, sm: 12 } }}>
    <Stack
      spacing={3}
      alignItems="center"
      textAlign="center"
      component="main"
    >
      <Typography variant="h3" component="h1">
        Dashboard App Initialized
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        The development environment is ready. Use the dummy order form to
        simulate incoming orders while building out the rest of the dashboard.
      </Typography>
      <Button
        component={RouterLink}
        to="/test-order"
        variant="contained"
        size="large"
      >
        Open Test Order Form
      </Button>
    </Stack>
  </Container>
)

const App = () => (
  <Box minHeight="100vh" bgcolor="background.default">
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/test-order" element={<OrderTestForm />} />
    </Routes>
  </Box>
)

export default App
