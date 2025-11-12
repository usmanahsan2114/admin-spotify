import { Card, CardContent, Stack, Typography } from '@mui/material'

const statCards = [
  { label: 'Pending Orders', value: '12' },
  { label: 'Active Products', value: '48' },
  { label: 'Monthly Revenue', value: '$24k' },
]

const DashboardHome = () => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={3}
    useFlexGap
    flexWrap="wrap"
  >
    {statCards.map((card) => (
      <Card key={card.label} sx={{ flex: '1 1 240px', minWidth: 240 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            {card.label}
          </Typography>
          <Typography variant="h4" mt={1}>
            {card.value}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </Stack>
)

export default DashboardHome

