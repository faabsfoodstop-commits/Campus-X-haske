import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  type = 'button',
  onClick = () => {},
  className = '',
  ...props
}) {
  const buttonClass = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full' : ''}
    ${loading ? 'btn-loading' : ''}
    ${disabled ? 'btn-disabled' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true"></span>
          <span className="btn-text">{children || 'Loading...'}</span>
        </>
      ) : (
        <span className="btn-text">{children}</span>
      )}
    </button>
  );
}
