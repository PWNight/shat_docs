"use client";
import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react"; // Используем lucide для единообразия с вашим кодом
interface ErrorMessageProps {
  message: string;
  type: string;
  onClose: () => void;
}

function ErrorMessage({ message, type, onClose }: ErrorMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose, message]);

  if (!message) return null;

  const alertStyles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/80',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-100',
      iconBg: 'bg-red-100 dark:bg-red-800/50',
      closeHover: 'hover:bg-red-100 dark:hover:bg-red-800',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Ошибка'
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/80',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-100',
      iconBg: 'bg-orange-100 dark:bg-orange-800/50',
      closeHover: 'hover:bg-orange-100 dark:hover:bg-orange-800',
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Внимание'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/80',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-100',
      iconBg: 'bg-green-100 dark:bg-green-800/50',
      closeHover: 'hover:bg-green-100 dark:hover:bg-green-800',
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Успешно'
    },
  };

  const currentType = (type && alertStyles[type as keyof typeof alertStyles])
      ? (type as keyof typeof alertStyles)
      : 'error';

  const style = alertStyles[currentType];

  return (
      <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg z-100 ${style.bg} ${style.border} border shadow-2xl rounded-2xl p-4 transition-all duration-500 animate-in fade-in slide-in-from-top-4`}
          role="alert"
      >
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-xl ${style.iconBg} ${style.text}`}>
            {style.icon}
          </div>
          <div className="flex-1 pt-1">
            <p className={`font-bold text-base leading-none mb-1 ${style.text}`}>
              {style.title}
            </p>
            <p className={`text-sm opacity-90 ${style.text}`}>{message}</p>
          </div>
          <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${style.closeHover} ${style.text}`}
              type="button"
              aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
  );
}

export default ErrorMessage;