import '@testing-library/jest-dom'

// Mock Next.js router
const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
}

// Mock Next.js navigation
const mockNavigation = {
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}

// Mock Next.js image
const mockImage = {
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return require('react').createElement('img', props)
  },
}

// Mock Prisma
const mockPrisma = {
  prisma: {
    user: {
      findMany: () => {},
      findUnique: () => {},
      create: () => {},
      update: () => {},
      delete: () => {},
    },
    post: {
      findMany: () => {},
      findUnique: () => {},
      create: () => {},
      update: () => {},
      delete: () => {},
    },
  },
}

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

global.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
}) as any

// Export mocks for use in tests
export { mockRouter, mockNavigation, mockImage, mockPrisma } 