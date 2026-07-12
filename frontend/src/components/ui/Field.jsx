// Shared form field: visible label (never placeholder-only), optional
// required marker, helper + error text below (skill: input-labels,
// error-placement, error-clarity). Supports input / select / textarea.
export function Field({ label, required, error, hint, htmlFor, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}{required && <span className="field-req" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error
        ? <div className="field-error" role="alert">{error}</div>
        : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

export function Input({ invalid, ...rest }) {
  return <input className={`input ${invalid ? 'input-invalid' : ''}`} {...rest} />
}

export function Select({ invalid, children, ...rest }) {
  return (
    <select className={`input ${invalid ? 'input-invalid' : ''}`} {...rest}>
      {children}
    </select>
  )
}
