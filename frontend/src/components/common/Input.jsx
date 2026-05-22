import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  icon: Icon,
  className = '',
  error,
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
            <Icon />
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`form-input w-full ${Icon ? '!pl-10' : ''} ${
            error ? 'form-input-error' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="form-error-msg">{error}</p>}
    </div>
  );
}
