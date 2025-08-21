"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { getCurrentUser, type Profile } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: Profile | null
  supabaseUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        setUser(null)
        setSupabaseUser(null)
        return
      }

      if (data.user) {
        setSupabaseUser(data.user)
        const profile = await getCurrentUser()
        setUser(profile)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      setUser(null)
      setSupabaseUser(null)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setSupabaseUser(session.user)
          const profile = await getCurrentUser()
          setUser(profile)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setSupabaseUser(null)
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session.user) {
          setSupabaseUser(session.user)
          try {
            const profile = await getCurrentUser()
            setUser(profile)
          } catch (error) {
            console.error("Error fetching profile after auth change:", error)
          }
        }
      }

      setLoading(false)
    })

    // Set up automatic session refresh
    const refreshInterval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0

        // Refresh if session expires in less than 5 minutes
        if (timeUntilExpiry < 300) {
          console.log("[v0] Refreshing session automatically")
          await refreshSession()
        }
      }
    }, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase.auth])

  const value = {
    user,
    supabaseUser,
    loading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
