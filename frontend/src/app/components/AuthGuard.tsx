"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Public routes that don't need login
    if (
      pathname === "/login" || 
      pathname === "/setup" || 
      pathname === "/onboard" || 
      pathname.startsWith("/onboard/") || 
      pathname.startsWith("/i/")
    ) {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      // If a customer was sent an internal invoice link like /invoices/:id without being logged in,
      // seamlessly redirect them to the public view /i/:id so they never see a login prompt!
      const invoiceMatch = pathname.match(/^\/invoices\/([^/]+)$/);
      if (invoiceMatch && invoiceMatch[1] !== "new") {
        router.replace(`/i/${invoiceMatch[1]}`);
        return;
      }

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
