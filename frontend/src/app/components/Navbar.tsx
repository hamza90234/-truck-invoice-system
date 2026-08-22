"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Building2, 
  Receipt,
  MoreHorizontal
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide nav on login and setup pages
  if (pathname === "/login" || pathname === "/setup" || pathname.startsWith("/i/")) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const desktopNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Vendors", href: "/vendors", icon: Building2 },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Settings", href: "/profile", icon: User },
  ];

  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Expenses", href: "/expenses", icon: Receipt },
  ];

  // Hide bottom nav on inner pages (forms, details) just like a native app
  const isRootTab = 
    pathname === "/dashboard" || 
    pathname === "/invoices" || 
    pathname === "/customers" || 
    pathname === "/inventory" || 
    pathname === "/vendors" || 
    pathname === "/expenses" || 
    pathname === "/profile";

  return (
    <>
      {/* Desktop Top Navbar (Hidden on Mobile) */}
      <nav className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              H
            </span>
            <span>Hussain Invoice</span>
          </Link>
          
          <div className="flex items-center gap-1 ml-4">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? "text-blue-600 bg-blue-50/80" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>

      {/* Mobile Bottom Tab Bar (Hidden on Desktop, and hidden on inner pages) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe ${isRootTab ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-blue-600" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link 
            href="/profile"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              pathname.startsWith("/profile") ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
