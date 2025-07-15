import { ExampleForm } from '@/components/ExampleForm';

export default function Home() {
  return (
    <div className='min-h-screen p-8 font-[family-name:var(--font-geist-sans)]'>
      <div className='mx-auto max-w-4xl space-y-12'>
        {/* Header Section */}
        <header className='space-y-4 text-center'>
          <h1 className='text-4xl font-bold'>Modern Full-Stack Scaffold</h1>
          <p className='text-muted-foreground text-xl'>
            Next.js 15 + React 19 + TypeScript + Prisma + Tailwind CSS + shadcn/ui
          </p>
        </header>

        {/* Features Grid */}
        <section className='grid gap-8 md:grid-cols-2'>
          <div className='space-y-4'>
            <h2 className='text-2xl font-semibold'>Built with Modern Tech</h2>
            <ul className='text-muted-foreground space-y-2'>
              <li>• Next.js 15 with App Router and Turbopack</li>
              <li>• React 19 with latest features</li>
              <li>• TypeScript with strict configuration</li>
              <li>• Prisma with PostgreSQL</li>
              <li>• Tailwind CSS v4 for styling</li>
              <li>• shadcn/ui with Radix components</li>
              <li>• React Hook Form with Zod validation</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h2 className='text-2xl font-semibold'>Development Tools</h2>
            <ul className='text-muted-foreground space-y-2'>
              <li>• ESLint with Next.js and TypeScript rules</li>
              <li>• Prettier for code formatting</li>
              <li>• Type-safe database access</li>
              <li>• Hot reload with Turbopack</li>
              <li>• Prisma Studio for database management</li>
            </ul>
          </div>
        </section>

        {/* Example Form Section */}
        <section className='flex justify-center'>
          <ExampleForm />
        </section>
      </div>
    </div>
  );
}
