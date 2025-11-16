import { useAuth } from '../context/AuthContext'
import SuperAdminDashboard from './SuperAdminDashboard'
import RegularDashboard from './RegularDashboard'

const DashboardHome = () => {
  const { user } = useAuth()
  
  // Show superadmin dashboard for superadmin users
  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />
  }
  
  // Regular dashboard for admin/staff/demo users (with all features)
  return <RegularDashboard />
}

export default DashboardHome
