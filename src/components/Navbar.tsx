"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")
      ? "border-b-2 border-green-500 text-green-700 font-semibold"
      : "text-slate-600 hover:text-green-700";

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">TC</span>
          </div>
          <span className="font-bold text-slate-800 text-lg hidden sm:block">Crystal Tennis</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link href="/courts" className={`px-4 py-5 text-sm transition-colors ${isActive("/courts")}`}>
            Courts
          </Link>
          <Link href="/classes" className={`px-4 py-5 text-sm transition-colors ${isActive("/classes")}`}>
            Classes
          </Link>
          {session && (
            <Link href="/my-bookings" className={`px-4 py-5 text-sm transition-colors ${isActive("/my-bookings")}`}>
              My Bookings
            </Link>
          )}
          {(role === "COACH" || role === "ADMIN") && (
            <Link href="/dashboard" className={`px-4 py-5 text-sm transition-colors ${isActive("/dashboard")}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 hidden sm:block">
                {(session.user as any).firstName}
                {role === "COACH" && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Coach</span>
                )}
                {role === "ADMIN" && (
                  <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>
                )}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded border border-slate-200 hover:border-red-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm text-slate-600 hover:text-green-700 px-3 py-1.5 rounded border border-slate-200 hover:border-green-300 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
