import React from 'react';
import { clsx } from 'clsx';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'btn-primary bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'btn-secondary bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus-visible:ring-secondary-500',
    outline: 'btn-outline border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'btn-ghost hover:bg-gray-100 focus-visible:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
  };

  const sizeClasses = {
    sm: 'btn-sm h-8 px-3 text-sm',
    md: 'btn-md h-10 px-4 text-sm',
    lg: 'btn-lg h-12 px-6 text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        'rounded-md',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;
