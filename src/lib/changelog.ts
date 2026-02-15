/**
 * Changelog data and types.
 *
 * To add a new entry, prepend it to the `CHANGELOG_ENTRIES` array.
 * Use the `/update-changelog` Cursor command to automate this from git history.
 */

export type ChangeCategory = 'added' | 'improved' | 'fixed' | 'security' | 'infrastructure';

export interface ChangelogEntry {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** User-facing title for this change */
  title: string;
  /** Brief description of what changed and why it matters */
  description: string;
  /** Category of the change */
  category: ChangeCategory;
}

export interface ChangelogRelease {
  /** Display label for this release group, e.g. "February 2026" */
  label: string;
  /** ISO date string of the most recent change in this group */
  date: string;
  /** Individual changes in this release */
  entries: ChangelogEntry[];
}

export const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  added: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
  security: 'Security',
  infrastructure: 'Infrastructure',
};

/**
 * All changelog entries, newest first.
 *
 * When updating, add new entries to the TOP of this array.
 * Each entry should describe a user-facing change — not individual files or commits.
 */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // ── February 2026 ──────────────────────────────────────────────
  {
    date: '2026-02-14',
    title: 'ESLint 10, Node 22 LTS, and date utilities',
    description:
      'Upgraded to ESLint 10 with compatibility shims, moved to Node.js 22 LTS, and added date-fns helpers for common formatting tasks.',
    category: 'improved',
  },
  {
    date: '2026-02-14',
    title: 'New Cursor rules for pnpm and ESLint workflows',
    description:
      'Added always-on rules to enforce pnpm usage and an autofix-first ESLint workflow so mechanical fixes happen automatically.',
    category: 'added',
  },

  // ── January 2026 ──────────────────────────────────────────────
  {
    date: '2026-01-07',
    title: 'Major dependency upgrades',
    description:
      'Upgraded to Next.js 16, Prisma 7 (adapter-based config), Zod 4, Storybook 10, and Vitest 4. All dependency versions are now pinned for reproducible builds.',
    category: 'improved',
  },
  {
    date: '2026-01-07',
    title: 'Cursor commands for commits and PRs',
    description:
      'Added /commit and /create-pr commands to streamline the git workflow directly from Cursor.',
    category: 'added',
  },

  // ── December 2025 ─────────────────────────────────────────────
  {
    date: '2025-12-06',
    title: 'Scaffold protection',
    description:
      'Added a protection rule that warns before modifying scaffold/template files, preventing accidental changes to the base template.',
    category: 'added',
  },
  {
    date: '2025-12-06',
    title: '/help command and discoverability',
    description:
      'Added a /help command that lists all available Cursor commands with descriptions and suggested workflows.',
    category: 'added',
  },
  {
    date: '2025-12-06',
    title: 'Next.js security patches',
    description:
      'Updated Next.js to 15.5.7 to fix critical vulnerabilities including an RCE in the React flight protocol and SSRF via middleware redirects.',
    category: 'security',
  },
  {
    date: '2025-12-06',
    title: 'Project setup commands',
    description:
      'Added /setup, /start, and /new-project Cursor commands so non-technical users can get up and running quickly.',
    category: 'added',
  },

  // ── July 2025 ─────────────────────────────────────────────────
  {
    date: '2025-07-15',
    title: 'Storybook integration',
    description:
      'Added Storybook with Vite support for isolated component development and visual documentation.',
    category: 'added',
  },
  {
    date: '2025-07-15',
    title: 'Automatic Tailwind class sorting',
    description:
      'Integrated the Prettier Tailwind plugin so CSS classes are automatically sorted on save.',
    category: 'improved',
  },
  {
    date: '2025-07-13',
    title: 'CI/CD pipeline',
    description:
      'Set up GitHub Actions with separate build and E2E jobs, including linting, type checking, unit tests, and Cypress E2E tests.',
    category: 'infrastructure',
  },
  {
    date: '2025-07-11',
    title: 'Testing infrastructure',
    description:
      'Added Jest for unit testing, Cypress for E2E testing, and comprehensive Cursor rules for development workflows.',
    category: 'infrastructure',
  },
  {
    date: '2025-07-11',
    title: 'shadcn/ui, React Hook Form, and Zod',
    description:
      'Integrated shadcn/ui components (Button, Input, Label, Form), React Hook Form for type-safe forms, and Zod for validation.',
    category: 'added',
  },

  // ── April 2025 ────────────────────────────────────────────────
  {
    date: '2025-04-19',
    title: 'Initial project setup',
    description:
      'Created the scaffold with Next.js, React, TypeScript, Prisma, and Tailwind CSS.',
    category: 'infrastructure',
  },
];

/**
 * Group flat changelog entries into releases by month.
 * Returns newest months first.
 */
export function groupEntriesByMonth(entries: ChangelogEntry[]): ChangelogRelease[] {
  const groups = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const date = new Date(`${entry.date  }T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const releases: ChangelogRelease[] = [];

  for (const [key, groupEntries] of groups) {
    const [yearStr, monthStr] = key.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const label = `${months[monthIndex]} ${year}`;

    // Find the most recent date in the group
    const sortedDates = groupEntries.map((e) => e.date).sort((a, b) => b.localeCompare(a));
    const latestDate = sortedDates[0] ?? key;

    releases.push({ label, date: latestDate, entries: groupEntries });
  }

  // Sort releases newest first
  releases.sort((a, b) => b.date.localeCompare(a.date));

  return releases;
}
