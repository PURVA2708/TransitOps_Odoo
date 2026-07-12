// RBAC roles — TransitOps has exactly 4 roles.
export const ROLES = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

export const ALL_ROLES = Object.values(ROLES)

// Which roles may access each feature/route (from the RBAC matrix).
export const PERMISSIONS = {
  vehicles:    [ROLES.FLEET_MANAGER],
  drivers:     [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  trips:       [ROLES.FLEET_MANAGER, ROLES.DRIVER],
  maintenance: [ROLES.FLEET_MANAGER],
  fuelExpense: [ROLES.FLEET_MANAGER, ROLES.DRIVER, ROLES.FINANCIAL_ANALYST],
  reports:     [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  dashboard:   ALL_ROLES, // everyone sees the dashboard
}

export function can(role, feature) {
  const allowed = PERMISSIONS[feature]
  return !allowed || allowed.includes(role)
}
