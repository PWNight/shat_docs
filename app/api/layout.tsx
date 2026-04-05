import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - Shat Docs',
  description: 'Swagger UI Documentation for Shat Docs API',
  robots: 'noindex,nofollow',
};

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
