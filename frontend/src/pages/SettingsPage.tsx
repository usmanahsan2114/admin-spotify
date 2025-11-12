import { Card, CardContent, Typography } from '@mui/material'

const SettingsPage = () => (
  <Card>
    <CardContent>
      <Typography variant="h5" fontWeight={600}>
        Settings
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Configure store preferences, branding, and integrations once settings options are
        implemented.
      </Typography>
    </CardContent>
  </Card>
)

export default SettingsPage

