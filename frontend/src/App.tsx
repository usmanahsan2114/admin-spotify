import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import {
  DashboardHome,
  OrderDetailsPage,
  OrderTestForm,
  OrdersPage,
  ProductsPage,
  SettingsPage,
  UsersPage,
} from './pages'

const App = () => (
  <Routes>
    <Route path="/test-order" element={<OrderTestForm />} />
    <Route element={<DashboardLayout />}>
      <Route index element={<DashboardHome />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:orderId" element={<OrderDetailsPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Routes>
)

export default App
