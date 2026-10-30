import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Stock = lazy(() => import('./pages/Stock'))
const Transfers = lazy(() => import('./pages/Transfers'))
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Orders = lazy(() => import('./pages/Orders'))
const CreditNotes = lazy(() => import('./pages/CreditNotes'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Users = lazy(() => import('./pages/Users'))
const Audit = lazy(() => import('./pages/Audit'))

export default function App() {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 24 }}>Chargement…</p>}>
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
            <Route path="invoices" element={<Invoices />} />
            <Route path="orders" element={<Orders />} />
            <Route path="credit-notes" element={<CreditNotes />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="users" element={<Users />} />
            <Route path="audit" element={<Audit />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}
