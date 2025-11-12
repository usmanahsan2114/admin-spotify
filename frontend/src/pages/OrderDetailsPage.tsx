import { Card, CardContent, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>()

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={600}>
          Order Details
        </Typography>
        <Typography color="text.secondary" mt={1}>
          Detailed order view for <strong>{orderId}</strong> will appear here.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsPage

