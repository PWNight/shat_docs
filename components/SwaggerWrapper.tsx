'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import Swagger UI
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      fontSize: '16px',
      color: '#666'
    }}>
      Загрузка документации API...
    </div>
  )
});

import 'swagger-ui-react/swagger-ui.css';

interface SwaggerWrapperProps {
  url: string;
  docExpansion?: 'none' | 'list' | 'full';
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  defaultModelRendering?: 'example' | 'model';
  displayRequestDuration?: boolean;
  tryItOutEnabled?: boolean;
  requestInterceptor?: (req: Record<string, unknown>) => Record<string, unknown>;
  responseInterceptor?: (res: Record<string, unknown>) => Record<string, unknown>;
}

export default function SwaggerWrapper(props: SwaggerWrapperProps) {
  const originalConsoleError = useRef<typeof console.error | null>(null);
  const originalConsoleWarn = useRef<typeof console.warn | null>(null);

  useEffect(() => {
    // Store original console methods
    originalConsoleError.current = console.error;
    originalConsoleWarn.current = console.warn;

    // Override console.error to filter out UNSAFE_componentWillReceiveProps warnings
    console.error = (...args: unknown[]) => {
      const message = args.join(' ');
      if (
        message.includes('UNSAFE_componentWillReceiveProps') ||
        message.includes('ModelCollapse') ||
        message.includes('unsafe-component-lifecycles')
      ) {
        // Suppress these specific warnings
        return;
      }
      // Call original console.error for other messages
      originalConsoleError.current?.(...args);
    };

    // Override console.warn to filter out related warnings
    console.warn = (...args: unknown[]) => {
      const message = args.join(' ');
      if (
        message.includes('UNSAFE_componentWillReceiveProps') ||
        message.includes('ModelCollapse') ||
        message.includes('unsafe-component-lifecycles')
      ) {
        // Suppress these specific warnings
        return;
      }
      // Call original console.warn for other messages
      originalConsoleWarn.current?.(...args);
    };

    // Cleanup function to restore original console methods
    return () => {
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current;
      }
      if (originalConsoleWarn.current) {
        console.warn = originalConsoleWarn.current;
      }
    };
  }, []);

  return (
    <div suppressHydrationWarning>
      <SwaggerUI {...props} />
    </div>
  );
}