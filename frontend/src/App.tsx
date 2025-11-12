import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import type { ReactElement } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import {
  DashboardHome,
  OrderDetailsPage,
  OrderTestForm,
  OrdersPage,
  ProductsPage,
  SettingsPage,
  UsersPage,
  LoginPage,
  NotFoundPage,
} from './pages'
import { useAuth } from './context/AuthContext'

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => (
  <Routes>
    <Route path="/test-order" element={<OrderTestForm />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<DashboardLayout />}>
      <Route
        index
        element={
          <PrivateRoute>
            <DashboardHome />
          </PrivateRoute>
        }
      />
      <Route
        path="orders"
        element={
          <PrivateRoute>
            <OrdersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="orders/:orderId"
        element={
          <PrivateRoute>
            <OrderDetailsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="products"
        element={
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)

export default App
