# Modern Full-Stack Scaffold

A clean, modern scaffold for full-stack web applications built with Next.js 15.5.5, React 19.2.0, TypeScript 5.9.3, Prisma 6.17.1, Tailwind CSS 4.1.14, and shadcn/ui.

## Features

- **Next.js 15.5.5** with App Router and Turbopack
- **React 19.2.0** with latest features
- **TypeScript 5.9.3** with strict configuration
- **Prisma 6.17.1** with PostgreSQL for database management
- **Tailwind CSS 4.1.14** for styling
- **shadcn/ui** with Radix UI components
- **React Hook Form** with Zod validation
- **ESLint** with Next.js and TypeScript rules
- **Prettier** for code formatting

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up your database:**

   ```bash
   # Add your DATABASE_URL to .env
   echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/dbname\"" > .env

   # Generate Prisma client
   pnpm run db:generate

   # Push schema to database
   pnpm run db:push
   ```

3. **Start development server:**
   ```bash
   pnpm run dev
   ```

## Available Scripts

- `pnpm run dev` - Start development server with Turbopack
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues
- `pnpm run format` - Format code with Prettier
- `pnpm run type-check` - Run TypeScript type checking
- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:migrate` - Create and apply migrations
- `pnpm run db:studio` - Open Prisma Studio
- `pnpm run test` - Run unit tests with Jest
- `pnpm run test:watch` - Run Jest in watch mode
- `pnpm run test:coverage` - Run Jest with coverage
- `pnpm run test:e2e` - Run Cypress E2E tests
- `pnpm run test:e2e:open` - Open Cypress interactive runner
- `pnpm run storybook` - Start Storybook for UI component development
- `pnpm run build-storybook` - Build Storybook static site

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── ExampleForm.tsx # Example form component
├── lib/               # Utility functions
│   └── utils.ts       # shadcn/ui utilities
└── types/             # TypeScript type definitions
```

## Database

The scaffold includes a basic User model in Prisma. You can extend it by:

1. Editing `prisma/schema.prisma`
2. Running `pnpm run db:push` to apply changes
3. Or `pnpm run db:migrate` for versioned migrations

## Styling & UI

Uses Tailwind CSS v4 with shadcn/ui components:

- Geist fonts (sans and mono)
- Dark mode support
- Responsive design utilities
- Radix UI primitives for accessibility
- Pre-built components: Button, Input, Label, Form

## Forms & Validation

- **React Hook Form** for form state management
- **Zod** for schema validation
- **@hookform/resolvers** for integration
- Type-safe form handling with TypeScript
- Example form component included

## Type Safety

- Strict TypeScript configuration
- Path aliases configured (`@/` points to `src/`)
- ESLint rules for TypeScript best practices
- Zod schemas for runtime type validation

## Development Workflow

1. Write code with full TypeScript support
2. ESLint catches issues automatically
3. Prettier formats code consistently
4. Prisma provides type-safe database access
5. Use shadcn/ui components for consistent UI
6. React Hook Form + Zod for type-safe forms

## Testing

- **Jest** for unit tests (`pnpm run test`, `pnpm run test:watch`, `pnpm run test:coverage`)
- **Cypress** for end-to-end (E2E) tests (`pnpm run test:e2e`, `pnpm run test:e2e:open`)
- **React Testing Library** for component tests
- Tests live alongside the code they test (e.g., `src/components/__tests__/`)
- Use descriptive test names and utility functions for assertions

## Adding More Components

To add more shadcn/ui components:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Available components: https://ui.shadcn.com/docs/components

This scaffold is designed to be minimal but complete, giving you a solid foundation to build upon without unnecessary complexity.
