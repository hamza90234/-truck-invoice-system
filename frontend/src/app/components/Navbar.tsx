"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Users, FileText, Truck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide nav on login and setup pages
  if (pathname === "/login" || pathname === "/setup") return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Hide bottom nav on inner pages (forms, details) just like a native app
  const isRootTab = pathname === "/dashboard" || pathname === "/customers" || pathname === "/profile";

  return (
    <>
      {/* Desktop Top Navbar (Hidden on Mobile) */}
      <nav className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold text-slate-900 tracking-tight">Hussain Invoice</div>
          <div className="flex items-center gap-6 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
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
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>

      {/* Mobile Bottom Tab Bar (Hidden on Desktop, and hidden on inner pages) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe ${isRootTab ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-blue-600" : "text-slate-500"}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-blue-50 stroke-blue-600" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
