'use client';

import { UserButton } from "@clerk/nextjs";
import {
  Briefcase,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Menu,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DashboardShellProps = {
  children: React.ReactNode;
};

type NavLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navLinks: NavLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Career Profile", href: "/dashboard/profile", icon: UserRound },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Applications", href: "/dashboard/applications", icon: ClipboardList },
  { name: "CV Saya", href: "/dashboard/cv", icon: FileText },
  { name: "Suggestions", href: "/dashboard/suggestions", icon: Lightbulb },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="space-y-2">
      {navLinks.map((link) => {
        const active = isActivePath(pathname, link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-navy ${
              active
                ? "bg-primary text-cream"
                : "text-gray-500 hover:bg-white/5 hover:text-primary"
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountBlock() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-3">
      <UserButton />
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-cream">Akun Saya</span>
        <span className="block text-xs text-gray-500">Career workspace</span>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage = useMemo(() => {
    return navLinks.find((link) => isActivePath(pathname, link.href))?.name || "Dashboard";
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-cream text-navy lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-navy p-6 lg:flex">
        <div>
          <Link
            href="/"
            className="mb-10 block text-2xl font-bold font-fraunces text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-navy"
          >
            LacakKarirku
          </Link>
          <NavItems />
        </div>
        <AccountBlock />
      </aside>

      <header className="sticky top-0 z-40 border-b border-gray-100 bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="block text-lg font-bold font-fraunces text-primary">
              LacakKarirku
            </Link>
            <p className="truncate text-xs font-semibold text-gray-500">{currentPage}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu dashboard"
            aria-expanded={menuOpen}
            aria-controls="mobile-dashboard-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-navy transition-all hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu dashboard"
            className="absolute inset-0 h-full w-full bg-navy/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="mobile-dashboard-menu"
            className="relative flex h-full w-[min(20rem,85vw)] flex-col justify-between bg-navy p-5 shadow-xl"
          >
            <div>
              <div className="mb-8 flex items-center justify-between gap-3">
                <Link href="/" className="text-xl font-bold font-fraunces text-primary">
                  LacakKarirku
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Tutup menu dashboard"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-cream transition-all hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-navy"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </div>
            <AccountBlock />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 md:p-8 lg:overflow-y-auto lg:p-12">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
