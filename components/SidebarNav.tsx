'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    href: '/dashboard',
    label: 'Projects',
    match: (p: string) => p.startsWith('/dashboard'),
    icon: (
      <>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
      </>
    ),
  },
  {
    href: '/docs',
    label: 'Docs',
    match: (p: string) => p.startsWith('/docs'),
    icon: (
      <>
        <path d="M5 4H15L19 8V20H5Z" />
        <path d="M9 13H15M9 17H13" />
      </>
    ),
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[14.5px] ${
              active ? 'bg-accent-soft font-semibold text-accent-text' : 'font-medium text-mute hover:text-ink'
            }`}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
