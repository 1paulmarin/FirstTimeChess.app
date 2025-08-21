"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit2, Save, X, Mail, Calendar, AlertCircle, LogOut } from "lucide-react"
import { User } from "lucide-react" // Declared the User variable

interface UserProfileProps {
  user?: any
  onLogin?: (user: any) => void
  onUpdateUser?: (updatedUser: any) => void
  onClose?: () => void
  onSignOut?: () => void
}

export default function UserProfile({ user, onLogin, onUpdateUser, onClose, onSignOut }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({
    name: "",
    email: "",
    role: "student" as "teacher" | "student",
  })

  const [editedUser, setEditedUser] = useState(
    user
      ? {
          name: user.name,
          role: user.role,
        }
      : { name: "", role: "student" as "teacher" | "student" },
  )

  const handleLogin = () => {
    if (!loginForm.name.trim() || !loginForm.email.trim()) {
      setError("Name and email are required")
      return
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: loginForm.name,
      email: loginForm.email,
      role: loginForm.role,
      created_at: new Date().toISOString(),
    }

    onLogin?.(newUser)
  }

  const handleSave = async () => {
    if (!editedUser.name.trim()) {
      setError("Name cannot be empty")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updatedProfile = {
        ...user!,
        name: editedUser.name,
        role: editedUser.role,
      }

      onUpdateUser?.(updatedProfile)
      setIsEditing(false)
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setEditedUser({
        name: user.name,
        role: user.role,
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      onSignOut?.()
    } catch (error: any) {
      setError(error.message || "Failed to sign out")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Welcome to First Time Chess
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={loginForm.name}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={loginForm.role}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, role: e.target.value as "teacher" | "student" }))}
                className="w-full p-2 border border-slate-300 rounded-md"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <Button onClick={handleLogin} className="w-full">
              Start Learning Chess
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isModal = !!onClose

  const profileContent = (
    <Card className={isModal ? "w-full max-w-md" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          User Profile
        </CardTitle>
        {isModal && (
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
            ) : (
              <AvatarFallback className="text-lg font-bold">{getInitials(user.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <Badge variant={user.role === "teacher" ? "default" : "secondary"} className="mb-2">
              {user.role === "teacher" ? "Teacher" : "Student"}
            </Badge>
            <div className="text-sm text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Member since {formatDate(user.created_at)}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={editedUser.name}
                onChange={(e) => setEditedUser((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                disabled={loading}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{user.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{user.email}</span>
            </div>
            <p className="text-xs text-slate-500">Email cannot be changed</p>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={editedUser.role}
                onChange={(e) => setEditedUser((prev) => ({ ...prev, role: e.target.value as "teacher" | "student" }))}
                className="w-full p-2 border border-slate-300 rounded-md"
                disabled={loading}
              >
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex-1" disabled={loading}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            disabled={loading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {profileContent}
      </div>
    )
  }

  return profileContent
}
