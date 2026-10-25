import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import { source } from '@/lib/source';

const navTitle = (
  <span className="flex items-center gap-2">
    <LogoMark size={26} />
    <span className="font-bold tracking-[-0.02em]">Send</span>
  </span>
);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} nav={{ title: navTitle, url: '/' }}>
      {children}
    </DocsLayout>
  );
}
