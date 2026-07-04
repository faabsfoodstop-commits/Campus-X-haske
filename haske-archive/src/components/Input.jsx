import './Input.css';

export default function Input({
  label,
  type = 'text',
  placeholder = '',
  value = '',
  onChange = () => {},
  onBlur = () => {},
  error = '',
  hint = '',
  disabled = false,
  required = false,
  icon = null,
  state = null, // success, error, warning
  maxLength = null,
  autoComplete = 'off',
  className = '',
  ...props
}) {
  const hasError = error || state === 'error';
  const isSuccess = state === 'success';
  const isWarning = state === 'warning';

  const inputClass = `
    input-field
    ${hasError ? 'input-error' : ''}
    ${isSuccess ? 'input-success' : ''}
    ${isWarning ? 'input-warning' : ''}
    ${disabled ? 'input-disabled' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {icon && <span className="input-icon-left">{icon}</span>}
        <input
          type={type}
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={error || hint ? `${label}-hint` : undefined}
          {...props}
        />
        {isSuccess && <span className="input-icon-right">✓</span>}
        {hasError && <span className="input-icon-right">✕</span>}
      </div>

      {error && <p className="input-error-text">{error}</p>}
      {hint && !error && <p className="input-hint-text">{hint}</p>}
      {maxLength && (
        <p className="input-counter">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
