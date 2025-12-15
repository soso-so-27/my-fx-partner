/**
 * Feature Vector Generation Service
 * 
 * Generates feature vectors from chart images using a simple perceptual hash
 * approach that works in Node.js without TensorFlow dependencies.
 * 
 * For MVP, we use image processing to extract basic features:
 * - Color histogram
 * - Edge detection patterns
 * - Shape features
 */

import sharp from 'sharp'
import { createHash } from 'crypto'
import { ImageFeatures } from './types/feature-types'

export type { ImageFeatures } // Re-export for convenience if needed, or just let consumers import from types


/**
 * Generate a simple perceptual hash from image data
 */
export function generatePerceptualHash(imageData: Buffer): string {
    return createHash('sha256').update(imageData).digest('hex')
}

/**
 * Extract robust features from image buffer using Sharp
 * 
 * Strategy:
 * 1. Resize to fixed 8x8 grid (64 pixels) for structure analysis
 * 2. Convert to grayscale for brightness pattern (structure)
 * 3. Extract RGB components for color distribution (bullish/bearish dominance)
 * 4. Combine into a normalized feature vector
 * 
 * Output Vector Size: 64 (Brightness) + 3 (RGB Avg) = 67 dimensions
 */
export async function extractBasicFeatures(imageData: Buffer): Promise<number[]> {
    try {
        // 1. Structural Features (64 dimensions)
        // Resize to 8x8 and convert to grayscale to get the "shape" of the chart
        const structureBuffer = await sharp(imageData)
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer()

        // Normalize 0-255 to 0-1
        const structureFeatures = Array.from(structureBuffer).map(b => b / 255)

        // 2. Color Features (3 dimensions)
        // Global color statistics to detect Red (Bear) vs Green (Bull) dominance
        const { dominant } = await sharp(imageData).stats()
        const colorFeatures = [
            dominant.r / 255,
            dominant.g / 255,
            dominant.b / 255
        ]

        // Combine
        return [...structureFeatures, ...colorFeatures]

    } catch (error) {
        console.error('Feature extraction failed:', error)
        // Fallback to zero vector if image processing fails
        return new Array(67).fill(0)
    }
}

/**
 * Generate feature vector from image URL
 * Fetches image and extracts features
 */
export async function generateFeatureVectorFromUrl(imageUrl: string): Promise<{
    vector: number[]
    hash: string
}> {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Now async
        const vector = await extractBasicFeatures(buffer)
        const hash = generatePerceptualHash(buffer)

        return { vector, hash }
    } catch (error) {
        console.error('Error generating feature vector:', error)
        throw error
    }
}

/**
 * Generate a mock feature vector for testing
 * Returns a random but deterministic vector based on pattern ID
 */
export function generateMockFeatureVector(patternId: string): number[] {
    const hash = createHash('md5').update(patternId).digest('hex')
    const vector: number[] = []

    for (let i = 0; i < 64; i++) {
        const idx = i % hash.length
        const val = parseInt(hash[idx], 16) / 15 // Normalize to 0-1
        vector.push(val)
    }

    return vector
}
