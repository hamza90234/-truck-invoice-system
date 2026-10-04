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
