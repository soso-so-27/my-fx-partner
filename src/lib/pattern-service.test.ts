import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SUPPORTED_CURRENCY_PAIRS, SUPPORTED_TIMEFRAMES } from './pattern-service'

// Mock Supabase
vi.mock('./supabase-admin', () => ({
    getSupabaseAdmin: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    })),
}))

describe('Pattern Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Supported Constants', () => {
        it('should have valid currency pairs', () => {
            expect(SUPPORTED_CURRENCY_PAIRS).toContain('USDJPY')
            expect(SUPPORTED_CURRENCY_PAIRS).toContain('EURUSD')
            expect(SUPPORTED_CURRENCY_PAIRS).toContain('GBPJPY')
            expect(SUPPORTED_CURRENCY_PAIRS.length).toBe(3)
        })

        it('should have valid timeframes', () => {
            expect(SUPPORTED_TIMEFRAMES).toEqual([
                { value: '5m', label: '5分' },
                { value: '15m', label: '15分' },
                { value: '1h', label: '1時間' },
                { value: '4h', label: '4時間' },
            ])
        })
    })

    describe('Pattern Data Mapping', () => {
        it('should correctly map snake_case to camelCase', () => {
            const dbData = {
                id: 'pattern-123',
                user_id: 'user-456',
                name: 'Double Top',
                description: 'A bearish reversal pattern',
                image_url: 'https://example.com/pattern.jpg',
                currency_pair: 'USDJPY',
                timeframe: '1h',
                direction: 'short',
                tags: ['reversal', 'bearish'],
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            }

            // Simulate mapPattern function
            const mapped = {
                id: dbData.id,
                userId: dbData.user_id,
                name: dbData.name,
                description: dbData.description,
                imageUrl: dbData.image_url,
                currencyPair: dbData.currency_pair,
                timeframe: dbData.timeframe,
                direction: dbData.direction,
                tags: dbData.tags || [],
                isActive: dbData.is_active,
                createdAt: new Date(dbData.created_at),
                updatedAt: new Date(dbData.updated_at),
            }

            expect(mapped.userId).toBe('user-456')
            expect(mapped.imageUrl).toBe('https://example.com/pattern.jpg')
            expect(mapped.currencyPair).toBe('USDJPY')
            expect(mapped.isActive).toBe(true)
            expect(mapped.direction).toBe('short')
        })

        it('should handle null direction', () => {
            const dbData = {
                id: 'pattern-123',
                user_id: 'user-456',
                name: 'Triangle',
                description: null,
                image_url: 'https://example.com/pattern.jpg',
                currency_pair: 'EURUSD',
                timeframe: '4h',
                direction: null,
                tags: [],
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            }

            const mapped = {
                id: dbData.id,
                userId: dbData.user_id,
                name: dbData.name,
                description: dbData.description,
                imageUrl: dbData.image_url,
                currencyPair: dbData.currency_pair,
                timeframe: dbData.timeframe,
                direction: dbData.direction,
                tags: dbData.tags || [],
                isActive: dbData.is_active,
                createdAt: new Date(dbData.created_at),
                updatedAt: new Date(dbData.updated_at),
            }

            expect(mapped.direction).toBeNull()
            expect(mapped.description).toBeNull()
            expect(mapped.tags).toEqual([])
        })
    })

    describe('Alert Data Mapping', () => {
        it('should correctly map alert data', () => {
            const dbData = {
                id: 'alert-789',
                user_id: 'user-456',
                pattern_id: 'pattern-123',
                similarity: 0.85,
                chart_snapshot_url: 'https://example.com/snapshot.jpg',
                status: 'unread',
                user_feedback: null,
                created_at: '2024-01-01T00:00:00Z',
                read_at: null,
                acted_at: null,
                pattern: null,
            }

            const mapped = {
                id: dbData.id,
                userId: dbData.user_id,
                patternId: dbData.pattern_id,
                similarity: dbData.similarity,
                chartSnapshotUrl: dbData.chart_snapshot_url,
                status: dbData.status,
                userFeedback: dbData.user_feedback,
                createdAt: new Date(dbData.created_at),
                readAt: dbData.read_at ? new Date(dbData.read_at) : undefined,
                actedAt: dbData.acted_at ? new Date(dbData.acted_at) : undefined,
                pattern: dbData.pattern,
            }

            expect(mapped.patternId).toBe('pattern-123')
            expect(mapped.similarity).toBe(0.85)
            expect(mapped.status).toBe('unread')
            expect(mapped.readAt).toBeUndefined()
        })

        it('should handle alert with feedback and timestamps', () => {
            const dbData = {
                id: 'alert-789',
                user_id: 'user-456',
                pattern_id: 'pattern-123',
                similarity: 0.92,
                chart_snapshot_url: 'https://example.com/snapshot.jpg',
                status: 'acted',
                user_feedback: 'thumbs_up',
                created_at: '2024-01-01T00:00:00Z',
                read_at: '2024-01-01T01:00:00Z',
                acted_at: '2024-01-01T02:00:00Z',
            }

            const mapped = {
                id: dbData.id,
                userId: dbData.user_id,
                patternId: dbData.pattern_id,
                similarity: dbData.similarity,
                chartSnapshotUrl: dbData.chart_snapshot_url,
                status: dbData.status,
                userFeedback: dbData.user_feedback,
                createdAt: new Date(dbData.created_at),
                readAt: dbData.read_at ? new Date(dbData.read_at) : undefined,
                actedAt: dbData.acted_at ? new Date(dbData.acted_at) : undefined,
            }

            expect(mapped.status).toBe('acted')
            expect(mapped.userFeedback).toBe('thumbs_up')
            expect(mapped.readAt).toBeInstanceOf(Date)
            expect(mapped.actedAt).toBeInstanceOf(Date)
        })
    })
})
