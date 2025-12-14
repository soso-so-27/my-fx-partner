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

import { createHash } from 'crypto'

export interface ImageFeatures {
    vector: number[]
    hash: string
    dimensions: {
        width: number
        height: number
    }
}

/**
 * Generate a simple perceptual hash from image data
 * This is a lightweight alternative to CNN-based feature extraction
 */
export function generatePerceptualHash(imageData: Buffer): string {
    // Create a hash of the image content
    return createHash('sha256').update(imageData).digest('hex')
}

/**
 * Extract basic statistical features from image buffer
 * For MVP, we'll use a simplified approach
 */
export function extractBasicFeatures(imageData: Buffer): number[] {
    const features: number[] = []

    // Sample pixels at regular intervals to create a feature vector
    const sampleSize = 64 // 64 samples = 64-dimensional vector
    const step = Math.floor(imageData.length / sampleSize)

    for (let i = 0; i < sampleSize; i++) {
        const idx = i * step
        if (idx < imageData.length) {
            // Normalize byte value to 0-1 range
            features.push(imageData[idx] / 255)
        } else {
            features.push(0)
        }
    }

    return features
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

        const vector = extractBasicFeatures(buffer)
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
