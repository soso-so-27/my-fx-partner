/**
 * Pattern Similarity Service
 * 
 * Uses MobileNet embeddings to generate feature vectors from chart images
 * and calculate similarity between patterns.
 */

// Note: TensorFlow.js runs in Node.js environment for API routes
// For browser, use @tensorflow/tfjs instead of @tensorflow/tfjs-node

export interface FeatureVector {
    vector: number[]
    dimensions: number
    modelVersion: string
}

/**
 * Calculate cosine similarity between two feature vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same dimensions')
    }

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i]
        magnitudeA += vecA[i] * vecA[i]
        magnitudeB += vecB[i] * vecB[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0
    }

    return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Convert cosine similarity (-1 to 1) to percentage (0 to 100)
 */
export function similarityToPercent(similarity: number): number {
    // Map -1...1 to 0...100
    return Math.round(((similarity + 1) / 2) * 100)
}

/**
 * Calculate Euclidean distance between two feature vectors
 * Lower distance = more similar
 */
export function calculateEuclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same dimensions')
    }

    let sum = 0
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i]
        sum += diff * diff
    }

    return Math.sqrt(sum)
}

/**
 * Normalize a feature vector to unit length
 */
export function normalizeVector(vec: number[]): number[] {
    const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0))
    if (magnitude === 0) return vec
    return vec.map(val => val / magnitude)
}

/**
 * Compare a pattern against multiple patterns and return similarity scores
 */
export function comparePatternToMultiple(
    targetVector: number[],
    patterns: { id: string; vector: number[] }[]
): { id: string; similarity: number; percent: number }[] {
    return patterns.map(pattern => {
        const similarity = calculateCosineSimilarity(targetVector, pattern.vector)
        return {
            id: pattern.id,
            similarity,
            percent: similarityToPercent(similarity)
        }
    }).sort((a, b) => b.percent - a.percent)
}

/**
 * Check if similarity meets threshold
 */
export function meetsThreshold(similarity: number, thresholdPercent: number): boolean {
    const percent = similarityToPercent(similarity)
    return percent >= thresholdPercent
}
