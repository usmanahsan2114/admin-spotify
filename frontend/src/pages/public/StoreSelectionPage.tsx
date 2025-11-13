import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Divider,
} from '@mui/material'
import { apiFetch } from '../../services/apiClient'
import CustomerPortalHeader from '../../components/customer/CustomerPortalHeader'
import SiteAttribution from '../../components/common/SiteAttribution'

type Store = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
}

const StoreSelectionPage = () => {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true)
        const data = await apiFetch<Store[]>('/api/stores', { skipAuth: true })
        setStores(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stores')
      } finally {
        setLoading(false)
      }
    }
    loadStores()
  }, [])

  const handleStoreSelect = (storeId: string, action: 'track' | 'test' = 'track') => {
    if (action === 'track') {
      navigate(`/store/${storeId}/track-order`)
    } else {
      navigate(`/store/${storeId}/test-order`)
    }
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="background.default"
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f5f7fb 0%, #e8ecf1 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <CustomerPortalHeader />
      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700} textAlign="center" mb={4}>
          Select a Store
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
          Choose a store to track orders or submit a test order
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {stores.map((store) => (
              <Card
                key={store.id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom fontWeight={600}>
                    {store.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {store.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {store.domain}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 1.5, pt: 1, gap: 1, flexDirection: 'column' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleStoreSelect(store.id, 'track')}
                    size="small"
                  >
                    Track Orders
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleStoreSelect(store.id, 'test')}
                    size="small"
                  >
                    Test Order
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Container>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default StoreSelectionPage

