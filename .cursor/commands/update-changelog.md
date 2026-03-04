# Update Changelog

You are a changelog assistant. Read the git history on `main` since the last changelog entry, then write concise user-facing entries and add them to the changelog file. Execute everything without asking for confirmation.

## Steps

1. **Find the last entry date**

   Open `src/lib/changelog.ts` and read the `date` field of the first entry in `CHANGELOG_ENTRIES`. This is the cutoff date.

2. **Fetch new commits**

   ```bash
   git fetch origin main
   git log origin/main --format="---COMMIT---%n%H%n%ad%n%s%n%b" --date=short --since="<cutoff_date>"
   ```

   If there are no new commits, tell the user the changelog is already up to date and stop.

3. **Filter out noise**

   Ignore commits that are already represented by existing entries (compare titles/descriptions). Skip purely internal changes (renames, lockfile-only updates, reverts that cancel out) unless they affect users.

4. **Write entries**

   For each meaningful change, create a `ChangelogEntry`:

   ```typescript
   {
     date: 'YYYY-MM-DD',           // commit date
     title: 'Short user-facing title',
     description: 'One or two sentences explaining what changed and why it matters.',
     category: 'added',            // added | improved | fixed | security | infrastructure
   }
   ```

   **Rules:**
   - Describe what the *user* gets, not what files changed
   - Group related commits into a single entry
   - Keep descriptions to 1-2 sentences
   - Categories: `added` (new features), `improved` (enhancements, dep upgrades), `fixed` (bugs), `security` (patches), `infrastructure` (CI, tooling, build)

5. **Prepend entries to the array**

   Add new entries to the **top** of `CHANGELOG_ENTRIES` in `src/lib/changelog.ts`. Add a month-separator comment if the month is new:

   ```typescript
   // ── March 2026 ──────────────────────────────────────────────
   ```

6. **Verify**

   ```bash
   pnpm run lint:fix
   pnpm run lint
   pnpm run type-check
   ```

   Fix any errors before finishing.

7. **Show the user what was added**

   Print a summary of the new entries with their titles and categories.
