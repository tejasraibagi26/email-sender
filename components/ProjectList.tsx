'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkline } from '@/components/Sparkline';

export type ProjectRow = {
  id: string;
  name: string;
  appName: string;
  trend: number[];
  sent30d: number;
  activeJobs: number;
  keys: number;
};

export function ProjectList({ projects }: { projects: ProjectRow[] }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? projects.filter((p) => p.name.toLowerCase().includes(needle) || p.appName.toLowerCase().includes(needle))
    : projects;

  return (
    <section className="min-w-0 flex-[999_1_520px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
          All projects
          <span className="ml-1.5 rounded-md bg-surface-alt px-2 py-0.5 font-mono text-xs font-normal text-mute">{projects.length}</span>
        </h2>
        <div className="flex w-[220px] max-w-full items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-[13.5px] text-mute focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20L16 16" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects"
            aria-label="Filter projects"
            className="min-w-0 flex-1 bg-transparent text-ink placeholder:text-mute focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
        <div className="min-w-[620px]">
          {visible.length === 0 && <div className="px-5 py-8 text-center text-sm text-mute">No projects match &quot;{query.trim()}&quot;.</div>}
          {visible.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="grid grid-cols-[2fr_96px_0.8fr_0.8fr_0.6fr_20px] items-center gap-3 border-b border-border px-5 py-[18px] last:border-b-0 hover:bg-surface-alt"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em]">{project.name}</span>
                <span className="mt-0.5 block truncate font-mono text-xs text-mute">sends as &quot;{project.appName}&quot;</span>
              </span>
              <Sparkline values={project.trend} />
              <Metric value={project.sent30d} label="sent (30d)" />
              <Metric value={project.activeJobs} label="active jobs" />
              <Metric value={project.keys} label="keys" />
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-mute">
                <path d="M9 18L15 12L9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <span className="block text-base font-semibold">{value.toLocaleString()}</span>
      <span className="text-xs text-mute">{label}</span>
    </span>
  );
}
