import { Card, CardContent, Typography } from '@mui/material'

const UsersPage = () => (
  <Card>
    <CardContent>
      <Typography variant="h5" fontWeight={600}>
        Team Members
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Invite, promote, and deactivate dashboard users here. RBAC controls will be wired
        up in later steps.
      </Typography>
    </CardContent>
  </Card>
)

export default UsersPage

