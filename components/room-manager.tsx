"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Plus, Users, LogOut, Clock, Settings, UserX, Crown, Link, AlertCircle } from "lucide-react"
import UserProfile from "./user-profile"
import type { GameRoom, User } from "../app/page"
import { createRoom, getRoomByInviteCode, joinRoom, leaveRoom, getUserRooms, deleteRoom } from "@/lib/rooms"

interface RoomManagerProps {
  user: User
  onJoinRoom: (room: GameRoom) => void
  onLogout: () => void
  onUpdateUser: (user: User) => void
}

export default function RoomManager({ user, onJoinRoom, onLogout, onUpdateUser }: RoomManagerProps) {
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    loadUserRooms()
  }, [user.id])

  const loadUserRooms = async () => {
    try {
      const userRooms = await getUserRooms(user.id)
      setRooms(userRooms)
    } catch (error) {
      console.error("Error loading rooms:", error)
      setError("Failed to load rooms")
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError("Please enter a room name")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newRoom = await createRoom(newRoomName.trim(), user.id, user.name)
      if (newRoom) {
        setRooms([...rooms, newRoom])
        setNewRoomName("")
        setIsCreatingRoom(false)
        onJoinRoom(newRoom)
      } else {
        setError("Failed to create room")
      }
    } catch (error: any) {
      setError(error.message || "Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoomByCode = async () => {
    if (!joinCode.trim()) {
      setError("Please enter an invite code")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const room = await getRoomByInviteCode(joinCode.trim())
      if (!room) {
        setError("Room not found. Please check the invite code.")
        return
      }

      // Check if room is at capacity
      const currentParticipants = (room.participants?.length || 0) + 1 // +1 for teacher
      if (currentParticipants >= (room.max_participants || 10)) {
        setError("This room is at full capacity (10 participants maximum).")
        return
      }

      // Check if user is already in the room
      const isAlreadyParticipant = room.participants?.some((p) => p.id === user.id) || room.teacher_id === user.id

      if (!isAlreadyParticipant) {
        const joined = await joinRoom(room.id, user.id)
        if (!joined) {
          setError("Failed to join room")
          return
        }
      }

      onJoinRoom(room)
      setJoinCode("")
    } catch (error: any) {
      setError(error.message || "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      const success = await deleteRoom(roomId, user.id)
      if (success) {
        setRooms(rooms.filter((r) => r.id !== roomId))
      } else {
        setError("Failed to delete room")
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete room")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (roomId: string, participantId: string) => {
    if (!confirm("Are you sure you want to remove this participant from the room?")) {
      return
    }

    setLoading(true)
    try {
      const success = await leaveRoom(roomId, participantId)
      if (success) {
        await loadUserRooms() // Reload rooms to get updated participant list
      } else {
        setError("Failed to remove participant")
      }
    } catch (error: any) {
      setError(error.message || "Failed to remove participant")
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here instead of alert
    alert("Invite code copied to clipboard!")
  }

  const copyRoomLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert("Room link copied to clipboard!")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-amber-50 border-2 border-amber-800 rounded-lg shadow-lg mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/images/first-time-chess-logo-new.png" alt="First Time Chess" className="h-16 w-auto" />
              <div className="h-8 w-px bg-amber-800"></div>
              <h1 className="text-2xl font-bold text-amber-900">First Time Chess Studio</h1>
              <Badge variant="outline" className="text-sm border-amber-800 text-amber-800 bg-amber-100">
                <Clock className="w-3 h-3 mr-1" />
                {user.name} ({user.role})
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                disabled={loading}
              >
                <Settings className="w-4 h-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                disabled={loading}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create/Join Room */}
          <div className="space-y-4">
            {user.role === "teacher" && (
              <Card className="border-2 border-amber-800 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Plus className="w-5 h-5" />
                    Create New Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCreatingRoom ? (
                    <Button
                      onClick={() => setIsCreatingRoom(true)}
                      className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Room
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomName" className="text-amber-800">
                          Room Name
                        </Label>
                        <Input
                          id="roomName"
                          placeholder="Enter room name (e.g., Chess Class 101)"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                          className="border-amber-800 focus:border-amber-900"
                          disabled={loading}
                        />
                      </div>
                      <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Room capacity: Up to 10 participants (1 teacher + 9 students)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateRoom}
                          className="flex-1 bg-amber-800 hover:bg-amber-900 text-amber-50"
                          disabled={loading}
                        >
                          {loading ? "Creating..." : "Create Room"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatingRoom(false)}
                          className="border-amber-800 text-amber-800 hover:bg-amber-100"
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-amber-800 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Users className="w-5 h-5" />
                  Join Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode" className="text-amber-800">
                    Invite Code
                  </Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter 6-character invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && handleJoinRoomByCode()}
                    maxLength={6}
                    className="border-amber-800 focus:border-amber-900"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleJoinRoomByCode}
                  className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50"
                  disabled={!joinCode.trim() || loading}
                >
                  {loading ? "Joining..." : "Join Room"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* My Rooms */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-amber-800 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-5 h-5" />
                  My Rooms ({rooms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-amber-700">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rooms yet</p>
                    <p className="text-sm">
                      {user.role === "teacher"
                        ? "Create a room to start teaching"
                        : "Ask your teacher for an invite code"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="border-2 border-amber-700 rounded-lg p-4 hover:bg-amber-100 transition-colors bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-amber-900">{room.name}</h3>
                            <Badge
                              variant={room.teacher_id === user.id ? "default" : "secondary"}
                              className="bg-amber-800 text-amber-50"
                            >
                              {room.teacher_id === user.id ? "Teacher" : "Student"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs border-amber-800 ${
                                ((room.participants?.length || 0) + 1) >= (room.max_participants || 10)
                                  ? "text-red-600 border-red-600"
                                  : "text-amber-800"
                              }`}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              {(room.participants?.length || 0) + 1}/{room.max_participants || 10}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Teacher Info */}
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{getInitials(room.teacher_name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-amber-700">
                              <Crown className="w-3 h-3 inline mr-1" />
                              {room.teacher_name}
                            </span>
                          </div>

                          {/* Participants */}
                          {room.participants && room.participants.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-amber-800">Students:</div>
                              <div className="flex flex-wrap gap-2">
                                {room.participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="flex items-center gap-2 bg-amber-100 rounded-full px-3 py-1"
                                  >
                                    <Avatar className="w-5 h-5">
                                      {participant.avatar_url ? (
                                        <AvatarImage
                                          src={participant.avatar_url || "/placeholder.svg"}
                                          alt={participant.name}
                                        />
                                      ) : (
                                        <AvatarFallback className="text-xs">
                                          {getInitials(participant.name)}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <span className="text-sm">{participant.name}</span>
                                    {room.teacher_id === user.id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveParticipant(room.id, participant.id)}
                                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                        disabled={loading}
                                      >
                                        <UserX className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {room.teacher_id === user.id && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                                <span className="text-sm text-amber-700">Invite Code:</span>
                                <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                                  {room.invite_code}
                                </code>
                                <Button variant="ghost" size="sm" onClick={() => copyInviteCode(room.invite_code)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                                <span className="text-sm text-amber-700">Room Link:</span>
                                <code className="bg-white px-2 py-1 rounded text-xs font-mono border flex-1 truncate">
                                  {room.unique_link}
                                </code>
                                <Button variant="ghost" size="sm" onClick={() => copyRoomLink(room.unique_link || "")}>
                                  <Link className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => onJoinRoom(room)}
                              size="sm"
                              className="flex-1 bg-amber-800 hover:bg-amber-900 text-amber-50"
                              disabled={loading}
                            >
                              Enter Room
                            </Button>
                            {room.teacher_id === user.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRoom(room.id)}
                                className="text-red-600 hover:text-red-700 border-red-600"
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Profile Modal */}
        {showProfile && (
          <UserProfile
            user={user}
            onUpdateUser={onUpdateUser}
            onClose={() => setShowProfile(false)}
            onSignOut={onLogout}
          />
        )}
      </div>
    </div>
  )
}
