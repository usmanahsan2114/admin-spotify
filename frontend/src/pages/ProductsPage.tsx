import { Card, CardContent, Typography } from '@mui/material'

const ProductsPage = () => (
  <Card>
    <CardContent>
      <Typography variant="h5" fontWeight={600}>
        Products
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Manage catalog listings, stock levels, and pricing from this screen once features
        are connected.
      </Typography>
    </CardContent>
  </Card>
)

export default ProductsPage

