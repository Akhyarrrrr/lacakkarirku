import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Briefcase, FileText, Lightbulb } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "CV Saya", href: "/dashboard/cv", icon: FileText },
  { name: "Suggestions", href: "/dashboard/suggestions", icon: Lightbulb },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-navy flex flex-col justify-between p-6 shrink-0">
        <div>
          <Link href="/" className="text-2xl font-bold font-fraunces text-primary block mb-10">
            LacakKarirku
          </Link>
          
          <nav className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-white/5 hover:text-primary transition-all group"
              >
                <link.icon size={20} className="group-hover:text-primary" />
                <span className="font-semibold">{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 px-2">
          <UserButton />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-cream">Akun Saya</span>
            <span className="text-xs text-gray-500">Upgrade ke Pro</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
