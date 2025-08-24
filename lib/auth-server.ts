import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/auth"

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
