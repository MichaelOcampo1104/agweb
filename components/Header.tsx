"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  /** Returns true if the nav link's path matches the current route. */
  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white font-bold">
            S
          </span>
          <span className="hidden sm:inline font-semibold">Sourcify</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            href="/manufacturers"
            className={isActive("/manufacturers") ? "text-brand-700 font-semibold" : "hover:text-brand-700"}
          >
            Manufacturers
          </Link>
          <Link
            href="/certifiers"
            className={isActive("/certifiers") ? "text-brand-700 font-semibold" : "hover:text-brand-700"}
          >
            Certifiers
          </Link>
          <Link
            href="/infrastructure"
            className={isActive("/infrastructure") ? "text-blue-700 font-semibold" : "hover:text-blue-700"}
          >
            Infrastructure
          </Link>
          <Link
            href="/leads/new"
            className="rounded-lg bg-brand-600 px-3 py-2 text-white hover:bg-brand-700 font-semibold"
          >
            List your company
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none md:hidden"
          aria-label="Toggle Navigation"
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600">
            <Link
              href="/manufacturers"
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-3 py-2 ${isActive("/manufacturers") ? "bg-brand-50 text-brand-700 font-semibold" : "hover:bg-slate-50 hover:text-brand-700"}`}
            >
              Manufacturers
            </Link>
            <Link
              href="/certifiers"
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-3 py-2 ${isActive("/certifiers") ? "bg-brand-50 text-brand-700 font-semibold" : "hover:bg-slate-50 hover:text-brand-700"}`}
            >
              Certifiers
            </Link>
            <Link
              href="/infrastructure"
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-3 py-2 ${isActive("/infrastructure") ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50 hover:text-blue-700"}`}
            >
              Infrastructure
            </Link>
            <Link
              href="/leads/new"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-brand-600 px-3 py-2.5 text-center font-semibold text-white hover:bg-brand-700"
            >
              List your company
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
