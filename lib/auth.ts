import { createSupabaseClient } from "@/lib/supabase/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface Profile {
  id: string
  email: string
  name: string
  role: "teacher" | "student"
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Client-side profile operations
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    throw error
  }

  return data
}

export async function getCurrentUser() {
  const supabase = createSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const profile = await getProfile(user.id)

  return profile
}

// Server-side profile operations
export async function getServerProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching server profile:", error)
    return null
  }

  return data
}

export async function signOut() {
  const supabase = createSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error)
    throw error
  }
}
