// ALL routes declared here ONCE. Login is public; everything else is
// wrapped in the Layout and guarded by ProtectedRoute (auth + RBAC).
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Public
import Login from '../pages/auth/Login'

// Real pages
import Dashboard from '../pages/dashboard/Dashboard'
import Vehicles from '../pages/vehicles/Vehicles'
import Drivers from '../pages/drivers/Drivers'
import Trips from '../pages/trips/Trips'
import Maintenance from '../pages/maintenance/Maintenance'
import FuelExpense from '../pages/fuel-expense/FuelExpense'
import Reports from '../pages/reports/Reports'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute feature="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="vehicles" element={<ProtectedRoute feature="vehicles"><Vehicles /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute feature="drivers"><Drivers /></ProtectedRoute>} />
        <Route path="trips" element={<ProtectedRoute feature="trips"><Trips /></ProtectedRoute>} />

        {/* Later phases */}
        <Route path="maintenance" element={<ProtectedRoute feature="maintenance"><Maintenance /></ProtectedRoute>} />
        <Route path="fuel-expense" element={<ProtectedRoute feature="fuelExpense"><FuelExpense /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute feature="reports"><Reports /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
