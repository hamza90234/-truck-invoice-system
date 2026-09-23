"use client";

import { useState } from "react";
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
  Landmark,
  BarChart3,
  MoreHorizontal,
  X,
  ChevronRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    { name: "Banking", href: "/banking", icon: Landmark },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/profile", icon: User },
  ];

  // Primary tabs shown in the bottom bar
  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Inventory", href: "/inventory", icon: Package },
  ];

  // Items inside the "More" drawer
  const moreMenuItems = [
    { name: "Expenses", href: "/expenses", icon: Receipt, desc: "Track overhead costs" },
    { name: "Vendors", href: "/vendors", icon: Building2, desc: "Parts suppliers & A/P" },
    { name: "Banking", href: "/banking", icon: Landmark, desc: "Import & match transactions" },
    { name: "Reports", href: "/reports", icon: BarChart3, desc: "P&L and financials" },
    { name: "Settings", href: "/profile", icon: User, desc: "Shop profile & config" },
  ];

  const isMoreActive = 
    pathname.startsWith("/expenses") || 
    pathname.startsWith("/vendors") || 
    pathname.startsWith("/banking") || 
    pathname.startsWith("/reports") || 
    pathname.startsWith("/profile");

  // Hide bottom nav on inner pages (forms, details) just like a native app
  const isRootTab = 
    pathname === "/dashboard" || 
    pathname === "/invoices" || 
    pathname === "/customers" || 
    pathname === "/inventory" || 
    pathname === "/vendors" || 
    pathname === "/expenses" || 
    pathname === "/banking" || 
    pathname === "/reports" || 
    pathname === "/profile";

  return (
    <>
      {/* Desktop Top Navbar (Hidden on Mobile, Hidden on Print) */}
      <nav className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 items-center justify-between sticky top-0 z-50 shadow-xs print:hidden">
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

      {/* Mobile Bottom Tab Bar (Hidden on Desktop, hidden on inner pages, hidden on Print) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe print:hidden ${isRootTab ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name}
                href={item.href}
                onClick={() => setShowMoreMenu(false)} 
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-blue-600" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              showMoreMenu || isMoreActive ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <MoreHorizontal className={`h-5 w-5 ${showMoreMenu || isMoreActive ? "stroke-blue-600" : ""}`} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Slide-Up Drawer */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-[60] print:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pb-safe animate-[slideUp_0.2s_ease-out]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="divide-y divide-slate-100 px-2 py-2">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-slate-700 active:bg-slate-50"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isActive ? "text-blue-600" : "text-slate-900"}`}>{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-300"}`} />
                  </Link>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={() => { setShowMoreMenu(false); handleLogout(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            </div>

            {/* Bottom spacer for the tab bar underneath */}
            <div className="h-16" />
          </div>
        </div>
      )}
    </>
  );
}
