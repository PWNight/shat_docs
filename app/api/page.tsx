'use client';

import { useEffect, useState } from 'react';
import SwaggerWrapper from '@/components/SwaggerWrapper';

export default function ApiPage() {
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');
  const [specUrl, setSpecUrl] = useState('/api/swagger?version=v1');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSpecUrl(`/api/swagger?version=${version}`);
  }, [version]);

  // Server-side rendering fallback
  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#212529'
            }}>
              Shat Docs API
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              color: '#6c757d',
              fontSize: '16px'
            }}>
              Документация API для системы управления группами и студентами
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontWeight: '500', color: '#495057' }}>
              Версия API:
            </span>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as 'v1' | 'v2')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500,
                backgroundColor: '#ffffff',
                minWidth: '80px'
              }}
            >
              <option value="v1">v1</option>
              <option value="v2">v2</option>
            </select>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.3
            }}>
              📚
            </div>
            <h2 style={{
              margin: '0 0 16px 0',
              color: '#495057',
              fontSize: '24px'
            }}>
              Загрузка документации...
            </h2>
            <p style={{
              margin: 0,
              color: '#6c757d',
              fontSize: '16px'
            }}>
              Пожалуйста, подождите, пока загружается интерактивная документация API
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}
      suppressHydrationWarning
    >
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#212529'
          }}>
            Shat Docs API
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Документация API для системы управления группами и студентами
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span style={{ fontWeight: '500', color: '#495057' }}>
            Версия API:
          </span>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value as 'v1' | 'v2')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500,
              backgroundColor: '#ffffff',
              minWidth: '80px',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#ced4da';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="v1">v1</option>
            <option value="v2">v2</option>
          </select>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#ffffff'
        }}
        suppressHydrationWarning
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <SwaggerWrapper
            key={specUrl}
            url={specUrl}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            defaultModelRendering="model"
            displayRequestDuration={true}
            tryItOutEnabled={true}
            requestInterceptor={(req) => {
              // Add any custom request interceptors if needed
              return req;
            }}
            responseInterceptor={(res) => {
              // Add any custom response interceptors if needed
              return res;
            }}
          />
        </div>
      </div>
    </div>
  );
}
