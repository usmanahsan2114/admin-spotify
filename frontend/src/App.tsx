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
          <Route element={<DashboardLayout />}>
            <Route
              index
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <DashboardHome />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="orders"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <OrdersPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <OrderDetailsPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="products"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductsPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="customers"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <CustomersPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="customers/:customerId"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <CustomerDetailPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="inventory-alerts"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <InventoryAlertsPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="returns"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ReturnsPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="returns/:returnId"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ReturnDetailPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="users"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <UsersPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="stores"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <StoresPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PrivateRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <SettingsPage />
                  </Suspense>
                </PrivateRoute>
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
