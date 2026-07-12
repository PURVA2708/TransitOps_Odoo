// Sidebar navigation — ALL links listed here ONCE. Frozen after Phase 0.
// Nobody edits this file later; each module's page already has a route.
// `icon` = key into the shared <Icon> set (SVG, never emoji).
export const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',     path: '/dashboard',    icon: 'dashboard', feature: 'dashboard' },
  { key: 'vehicles',    label: 'Vehicles',      path: '/vehicles',     icon: 'truck',     feature: 'vehicles' },
  { key: 'drivers',     label: 'Drivers',       path: '/drivers',      icon: 'driver',    feature: 'drivers' },
  { key: 'trips',       label: 'Trips',         path: '/trips',        icon: 'route',     feature: 'trips' },
  { key: 'maintenance', label: 'Maintenance',   path: '/maintenance',  icon: 'wrench',    feature: 'maintenance' },
  { key: 'fuel',        label: 'Fuel & Expense',path: '/fuel-expense', icon: 'fuel',      feature: 'fuelExpense' },
  { key: 'reports',     label: 'Reports',       path: '/reports',      icon: 'chart',     feature: 'reports' },
]
