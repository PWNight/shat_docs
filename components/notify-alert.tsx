"use client";
import React, { useEffect } from 'react';

interface ErrorMessageProps {
  message: string;
  type: string;
  onClose?: () => void;
}

function ErrorMessage({ message, type = 'error', onClose }: ErrorMessageProps) {
  const alertStyles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/80',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-100',
      iconBg: 'bg-red-100 dark:bg-red-800/50',
      closeHover: 'hover:bg-red-100 dark:hover:bg-red-800',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/80',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-100',
      iconBg: 'bg-yellow-100 dark:bg-yellow-800/50',
      closeHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-800',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/80',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-100',
      iconBg: 'bg-green-100 dark:bg-green-800/50',
      closeHover: 'hover:bg-green-100 dark:hover:bg-green-800',
    },
  };

  // @ts-ignore
  const style = alertStyles[type];

  useEffect(() => {
    if (!onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 ${style.bg} ${style.border} border shadow-lg rounded-xl p-5 transition-all duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${style.iconBg}`}>
          {type === 'error' && <ErrorIcon className="w-6 h-6" />}
          {type === 'warning' && <WarningIcon className="w-6 h-6" />}
          {type === 'success' && <SuccessIcon className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-lg ${style.text}`}>
            {type === 'error' ? 'Ой!' : type === 'warning' ? 'Предупреждение' : 'Успех'}
          </p>
          <p className={`text-base ${style.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            className={`p-2 rounded-full ${style.closeHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-300 dark:focus:ring-${type}-700 transition-colors`}
            onClick={onClose}
            type="button"
            aria-label="Закрыть"
          >
            <svg
              className={`w-6 h-6 ${style.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface IconProps {
  className?: string;
}

const ErrorIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v3m0 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const SuccessIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default ErrorMessage;