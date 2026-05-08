'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, FolderOpen, BarChart2 } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Today', icon: Clock },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex-col z-50">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
          <Clock className="w-6 h-6 text-amber-500" />
          <span className="text-xl font-bold text-white">TimerFM</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 mt-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive(href)
                  ? 'text-amber-500'
                  : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
