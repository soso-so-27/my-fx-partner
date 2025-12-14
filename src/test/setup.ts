import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                email: 'test@example.com',
                name: 'Test User',
            },
        },
        status: 'authenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}))
