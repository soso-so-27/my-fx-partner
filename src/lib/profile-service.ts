import { supabase } from '@/lib/supabase/client'
import { UserProfile } from "@/types/user-profile"


class ProfileService {
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            // PGRST116: Not found - expected for new users
            // Empty error object: RLS restriction or no access
            const isExpectedError =
                error.code === 'PGRST116' ||
                !error.code ||
                Object.keys(error).length === 0

            if (!isExpectedError) {
                console.error('Error fetching profile:', error)
            }
            return null
        }

        return {
            userId: data.id,
            displayName: data.display_name,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            updatedAt: data.updated_at
        }
    }

    async updateProfile(
        userId: string,
        updates: Partial<Omit<UserProfile, 'userId'>>
    ): Promise<UserProfile | null> {
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        }
        if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl

        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...dbUpdates })
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return null
        }

        return {
            userId: data.id,
            displayName: data.display_name,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            updatedAt: data.updated_at
        }
    }

    async uploadAvatar(userId: string, file: File): Promise<string | null> {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError)
            return null
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        return data.publicUrl
    }
}

export const profileService = new ProfileService()
