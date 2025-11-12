import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const OrdersPage = () => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Orders
        </Typography>
        <Button component={RouterLink} to="/test-order" variant="outlined">
          Submit test order
        </Button>
      </Box>
      <Typography color="text.secondary">
        Orders table coming soon. Use the navigation to explore other sections while we
        wire up the backend data.
      </Typography>
    </CardContent>
  </Card>
)

export default OrdersPage

