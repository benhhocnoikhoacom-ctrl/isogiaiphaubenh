"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Settings, UserCircle, LogOut, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Máy tính Y Khoa", href: "/calculators", icon: Calculator },
  { name: "Appointments", href: "/appointments", icon: Building2 },
  { name: "Patients", href: "/patients", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Filter navigation items based on user role
  const filteredNav = navigation.filter(item => {
    if (item.adminOnly && session?.user?.role !== "admin") return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 mx-auto">
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 text-primary font-bold">
            <Building2 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Medical App
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 flex items-center gap-2",
                    isActive ? "text-foreground font-semibold" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4 border-r pr-4 border-zinc-200 dark:border-zinc-800">
              <span className="hidden sm:inline-block">
                {status === "loading" ? "Loading..." : session?.user ? `Welcome, ${session.user.name}` : "Welcome, Guest"}
              </span>
              {session?.user?.role === "admin" && (
                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20">
                  Admin
                </span>
              )}
            </div>
            
            {session ? (
              <button
                onClick={() => signOut()}
                className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 shadow-sm transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 dark:bg-white dark:text-black px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Sign In via Google
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
