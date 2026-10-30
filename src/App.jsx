import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Stock from './pages/Stock'
import Transfers from './pages/Transfers'
import PurchaseOrders from './pages/PurchaseOrders'
import Inventory from './pages/Inventory'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}