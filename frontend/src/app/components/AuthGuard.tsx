"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Public routes that don't need login
    if (pathname === "/login" || pathname === "/setup" || pathname.startsWith("/i/")) {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setAuthorized(false);
      router.push("/login");
    } else {
      setAuthorized(true);
      
      // Global fetch interceptor to attach JWT token
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        // Don't intercept requests to third-party APIs
        if (typeof resource === 'string' && resource.includes('/api/')) {
          config = config || {};
          const headers = new Headers(config.headers);
          
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          config.headers = headers;
        }
        
        const response = await originalFetch(resource, config);
        
        // If token expires or server rejects it, force logout
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.fetch = originalFetch; // Restore original fetch
          router.push('/login');
        }
        
        return response;
      };
      
      // Cleanup function to restore original fetch when component unmounts or re-renders
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [pathname, router]);

  // Prevent rendering protected content while checking or redirecting
  if (!authorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
