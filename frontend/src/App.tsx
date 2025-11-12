import { Box, Container, Typography } from '@mui/material'

const App = () => {
  return (
    <Container maxWidth="md">
      <Box
        component="main"
        py={{ xs: 8, sm: 12 }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
        gap={2}
      >
        <Typography variant="h3" component="h1">
          Dashboard App Initialized
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Frontend scaffolding is ready. Continue with the workflow to build out
          the admin experience.
        </Typography>
      </Box>
    </Container>
  )
}

export default App
