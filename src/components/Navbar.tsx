"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navLinks = [
    { href: "/courts", label: "Courts" },
    { href: "/classes", label: "Classes" },
    ...(session ? [{ href: "/my-bookings", label: "My Bookings" }] : []),
    ...((role === "COACH" || role === "ADMIN") ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">TC</span>
          </div>
          <span className="font-bold text-slate-800 text-base">Krystal Tennis</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${isActive(l.href) ? "text-green-700 font-semibold bg-green-50" : "text-slate-600 hover:bg-slate-50"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {(session.user as any).firstName}
                {role === "COACH" && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Coach</span>}
                {role === "ADMIN" && <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>}
              </span>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 rounded border border-slate-200 hover:border-red-200 transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-sm text-slate-600 hover:text-green-700 px-3 py-1.5 rounded border border-slate-200 hover:border-green-300 transition-colors">Sign In</Link>
              <Link href="/auth/register" className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile: Sign In button + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {!session && (
            <Link href="/auth/login" className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors">Sign In</Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Toggle menu">
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(l.href) ? "bg-green-50 text-green-700" : "text-slate-600 hover:bg-slate-50"}`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-1">
            {session ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-slate-700 font-medium">
                  {(session.user as any).firstName}
                  {role === "COACH" && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Coach</span>}
                  {role === "ADMIN" && <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>}
                </span>
                <button onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                  className="text-sm text-red-500 hover:text-red-700 font-medium">Sign Out</button>
              </div>
            ) : (
              <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                className="block text-center w-full bg-green-600 text-white text-sm font-semibold px-3 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Create Account
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
