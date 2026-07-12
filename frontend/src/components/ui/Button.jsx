// Shared Button — the ONLY button in the app.
// Use variant + size props. Never create page-specific buttons.
export default function Button({
  children,
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md',         // lg | md | sm
  block = false,
  type = 'button',
  ...rest
}) {
  const cls = [
    'btn',
    `btn-${size}`,
    `btn-${variant}`,
    block ? 'btn-block' : '',
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  )
}
