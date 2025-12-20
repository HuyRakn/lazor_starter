'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@lazor-starter/core';

/**
 * Home page - redirects to dashboard
 *
 * All login functionality is now in dashboard page.
 */
export default function HomePage() {
  const router = useRouter();
  const { isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized) {
      router.replace('/dashboard');
    }
  }, [isInitialized, router]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
    </div>
  );
}
