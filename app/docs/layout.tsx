import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

const navTitle = (
  <span className="flex items-center gap-2">
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF3E7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    </span>
    <span className="font-serif italic">Send</span>
  </span>
);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} nav={{ title: navTitle, url: '/' }} disableThemeSwitch>
      {children}
    </DocsLayout>
  );
}
