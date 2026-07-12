// User display preferences: distance unit + currency. Persisted to
// localStorage. Pages format numbers through the exposed helpers so a change
// in Settings is reflected everywhere at once.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

const KEY = 'transitops_prefs_v1'
const PrefsCtx = createContext(null)
export const usePrefs = () => useContext(PrefsCtx)

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', label: 'US Dollar ($)',     locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (€)',          locale: 'en-IE' },
}

export const DISTANCE_UNITS = {
  km: { code: 'km', label: 'Kilometres (km)', suffix: 'km', perKm: 1 },
  mi: { code: 'mi', label: 'Miles (mi)',      suffix: 'mi', perKm: 0.621371 },
}

const DEFAULTS = { currency: 'INR', distanceUnit: 'km' }

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULTS
}

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [prefs])

  const setCurrency = useCallback((currency) => setPrefs((p) => ({ ...p, currency })), [])
  const setDistanceUnit = useCallback((distanceUnit) => setPrefs((p) => ({ ...p, distanceUnit })), [])

  const cur = CURRENCIES[prefs.currency] || CURRENCIES.INR
  const unit = DISTANCE_UNITS[prefs.distanceUnit] || DISTANCE_UNITS.km

  // Format a nominal amount with the chosen currency symbol + grouping.
  const money = useCallback((amount, { decimals = 0 } = {}) => {
    const n = Number(amount) || 0
    const c = CURRENCIES[prefs.currency] || CURRENCIES.INR
    return `${c.symbol}${n.toLocaleString(c.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }, [prefs.currency])

  // Convert a value stored in km to the chosen unit and append the suffix.
  const dist = useCallback((valueInKm, { decimals = 0, withUnit = true } = {}) => {
    const u = DISTANCE_UNITS[prefs.distanceUnit] || DISTANCE_UNITS.km
    const v = (Number(valueInKm) || 0) * u.perKm
    const num = v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    return withUnit ? `${num} ${u.suffix}` : num
  }, [prefs.distanceUnit])

  const value = useMemo(() => ({
    ...prefs,
    currencyInfo: cur, distanceInfo: unit,
    currencySymbol: cur.symbol, distanceSuffix: unit.suffix,
    setCurrency, setDistanceUnit, money, dist,
  }), [prefs, cur, unit, setCurrency, setDistanceUnit, money, dist])

  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>
}
