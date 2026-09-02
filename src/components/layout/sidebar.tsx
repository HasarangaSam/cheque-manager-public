"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Menu,
  X,
  LogOut,
  Shield,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth-actions";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Cheques",
    href: "/cheques",
    icon: CreditCard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
];

interface SidebarProps {
  username?: string;
}

export default function Sidebar({ username }: SidebarProps = {}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 px-6 py-5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              CM
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">
                ChequeManager
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Financial Ledger
              </p>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-5 space-y-1.5">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Navigation
          </p>
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all ${active
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${active
                    ? "text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-300"
                    }`}
                />
                <span className="flex-1">{item.name}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {/* User Account & Logout Footer */}
        <div className="border-t border-slate-800/80 px-3 py-3 bg-slate-950/60 space-y-1.5">
          {/* Sign Out nav item */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-rose-400 transition-colors" />
              <span>Sign Out</span>
            </button>
          </form>

          {/* Admin badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-indigo-950 border border-indigo-800/40 text-indigo-400">
              <Shield className="h-3 w-3" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate capitalize">
                {username || "Admin"}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">Active Session</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs shadow-md shadow-indigo-600/30">
              CM
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              ChequeManager
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 bg-slate-950 lg:flex flex-col">
        {navContent}
      </aside>
    </>
  );
}

