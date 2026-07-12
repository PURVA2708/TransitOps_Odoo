// Shared Card / panel wrapper.
export default function Card({ children, hover = false, style, className = '', ...rest }) {
  const cls = ['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ')
  return (
    <div className={cls} style={style} {...rest}>
      {children}
    </div>
  )
}
