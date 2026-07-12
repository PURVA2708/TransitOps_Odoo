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

// Not-yet-built modules (owner: Tirth/Parth — later phases)
import PagePlaceholder from '../components/ui/PagePlaceholder'

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

        {/* Later phases — placeholders */}
        <Route path="maintenance" element={<ProtectedRoute feature="maintenance"><PagePlaceholder title="Maintenance" owner="Tirth" phase="3 — Operations" /></ProtectedRoute>} />
        <Route path="fuel-expense" element={<ProtectedRoute feature="fuelExpense"><PagePlaceholder title="Fuel & Expense" owner="Parth" phase="4 — Money" /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute feature="reports"><PagePlaceholder title="Reports & Analytics" owner="Tirth" phase="4 — Insight" /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
