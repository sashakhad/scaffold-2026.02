import type { Metadata } from 'next';
import {
  CATEGORY_LABELS,
  CHANGELOG_ENTRIES,
  groupEntriesByMonth,
  type ChangeCategory,
} from '@/lib/changelog';
import { formatDate } from '@/lib/date';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'See what changed in the latest updates.',
};

const CATEGORY_STYLES: Record<ChangeCategory, string> = {
  added: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  improved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  fixed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  security: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  infrastructure: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function ChangelogPage() {
  const releases = groupEntriesByMonth(CHANGELOG_ENTRIES);

  return (
    <div className='min-h-screen p-8 font-[family-name:var(--font-geist-sans)]'>
      <div className='mx-auto max-w-2xl space-y-12'>
        {/* Header */}
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Changelog</h1>
          <p className='text-muted-foreground'>New features, improvements, and fixes.</p>
        </header>

        {/* Timeline */}
        <div className='space-y-10'>
          {releases.map((release) => (
            <section key={release.label}>
              {/* Month heading */}
              <h2 className='text-muted-foreground mb-4 text-sm font-semibold uppercase tracking-wider'>
                {release.label}
              </h2>

              {/* Entries */}
              <div className='border-border space-y-6 border-l-2 pl-6'>
                {release.entries.map((entry, index) => (
                  <article key={`${entry.date}-${index}`} className='relative'>
                    {/* Timeline dot */}
                    <div className='bg-border absolute -left-[31px] top-1.5 h-3 w-3 rounded-full' />

                    {/* Category badge + date */}
                    <div className='mb-1 flex items-center gap-2'>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[entry.category]}`}
                      >
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                      <time
                        dateTime={entry.date}
                        className='text-muted-foreground text-xs'
                      >
                        {formatDate(entry.date)}
                      </time>
                    </div>

                    {/* Title + description */}
                    <h3 className='text-base font-semibold'>{entry.title}</h3>
                    <p className='text-muted-foreground mt-0.5 text-sm leading-relaxed'>
                      {entry.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
