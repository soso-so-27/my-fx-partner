import { UserProfile } from "@/types/user-profile"

const STORAGE_KEY = 'solo_user_profile'

class ProfileService {
    private getProfile(userId: string): UserProfile | null {
        if (typeof window === 'undefined') return null
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
        return stored ? JSON.parse(stored) : null
    }

    private saveProfile(profile: UserProfile): void {
        if (typeof window === 'undefined') return
        localStorage.setItem(`${STORAGE_KEY}_${profile.userId}`, JSON.stringify(profile))
    }

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        return this.getProfile(userId)
    }

    async updateProfile(
        userId: string,
        updates: Partial<Omit<UserProfile, 'userId'>>
    ): Promise<UserProfile> {
        const existing = this.getProfile(userId)
        const updated: UserProfile = {
            userId,
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        }
        this.saveProfile(updated)
        return updated
    }

    async uploadAvatar(file: File): Promise<string> {
        // For now, convert to base64 data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                resolve(reader.result as string)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }
}

export const profileService = new ProfileService()
