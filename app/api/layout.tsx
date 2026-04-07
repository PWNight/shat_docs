import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - Shat Docs',
  description: 'API documentation moved to /wiki',
  robots: 'noindex,nofollow',
};

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
