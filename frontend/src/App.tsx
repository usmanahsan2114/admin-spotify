import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import type { ReactElement } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useAuth } from './context/AuthContext'

// Lazy load pages for code splitting
const DashboardHome = lazy(() => import('./pages/DashboardHome'))
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage').then((m) => ({ default: m.default })))
const OrderTestForm = lazy(() => import('./pages/OrderTestForm').then((m) => ({ default: m.default })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.default })))
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((m) => ({ default: m.default })))
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage').then((m) => ({ default: m.default })))
const InventoryAlertsPage = lazy(() => import('./pages/InventoryAlertsPage').then((m) => ({ default: m.default })))
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then((m) => ({ default: m.default })))
const ReturnDetailPage = lazy(() => import('./pages/ReturnDetailPage').then((m) => ({ default: m.default })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.default })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.default })))
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.default })))
const StoresPage = lazy(() => import('./pages/StoresPage').then((m) => ({ default: m.default })))
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.default })))
const ChangePasswordPage = lazy(() => import('./pages/auth/ChangePasswordPage').then((m) => ({ default: m.default })))
const NotFoundPage = lazy(() => import('./pages/auth/NotFoundPage').then((m) => ({ default: m.default })))
// Signup page is hidden - not imported
const OrderTrackingPage = lazy(() => import('./pages/public/OrderTrackingPage').then((m) => ({ default: m.default })))
const StoreSelectionPage = lazy(() => import('./pages/public/StoreSelectionPage').then((m) => ({ default: m.default })))

const LoadingFallback = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="60vh"
    sx={{ width: '100%' }}
  >
    <CircularProgress />
  </Box>
)

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, needsPasswordChange, loading } = useAuth()

  if (loading) {
    return <LoadingFallback />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Force password change on first login
  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />
  }

  return children
}

import { NotificationProvider } from './providers/NotificationProvider'

const App = () => (
  <ErrorBoundary>
    <NotificationProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Store selection page */}
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <StoreSelectionPage />
              </Suspense>
            }
          />
          {/* Store-specific routes */}
          <Route
            path="/store/:storeId/track-order"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <OrderTrackingPage />
              </Suspense>
            }
          />
          <Route
            path="/store/:storeId/test-order"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <OrderTestForm />
              </Suspense>
            }
          />
          {/* Public routes - Track Order (for customers to track their orders without login) */}
          <Route
            path="/track-order"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <StoreSelectionPage />
              </Suspense>
            }
          />
          {/* Public routes - Test Order (for placing orders for any store) */}
          <Route
            path="/test-order"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <StoreSelectionPage />
              </Suspense>
            }
          />
          {/* Public routes - Login */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          {/* Signup page is hidden - redirect to 404 */}
          <Route
            path="/signup"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
          <Route
            path="/change-password"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ChangePasswordPage />
              </Suspense>
            }
          />
          <Route
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardHome />
                </Suspense>
              }
            />
            <Route
              path="orders"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <OrdersPage />
                </Suspense>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <OrderDetailsPage />
                </Suspense>
              }
            />
            <Route
              path="products"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ProductsPage />
                </Suspense>
              }
            />
            <Route
              path="customers"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CustomersPage />
                </Suspense>
              }
            />
            <Route
              path="customers/:customerId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerDetailPage />
                </Suspense>
              }
            />
            <Route
              path="inventory-alerts"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InventoryAlertsPage />
                </Suspense>
              }
            />
            <Route
              path="returns"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ReturnsPage />
                </Suspense>
              }
            />
            <Route
              path="returns/:returnId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ReturnDetailPage />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <UsersPage />
                </Suspense>
              }
            />
            <Route
              path="stores"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <StoresPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="*"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    </NotificationProvider>
  </ErrorBoundary>
)

export default App
