'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately
      router.replace('/dashboard');
  }, [router]);

    return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
