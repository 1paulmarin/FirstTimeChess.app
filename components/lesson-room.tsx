"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  LogOut, 
  Crown, 
  UserX, 
  Copy, 
  Link, 
  AlertCircle, 
  Play, 
  Eye, 
  Clock,
  Trophy,
  Gamepad2,
  MessageSquare,
  Settings
} from "lucide-react"
import type { LessonRoom, LessonParticipant, LessonGame } from "@/lib/rooms"
import type { User } from "@/app/page"
import ChessLearningApp from "./chess-learning-app"

interface LessonRoomProps {
  room: LessonRoom
  user: User
  onLeaveRoom: () => void
  onLogout: () => void
}

export default function LessonRoom({ room, user, onLeaveRoom, onLogout }: LessonRoomProps) {
  const [currentRoom, setCurrentRoom] = useState<LessonRoom>(room)
  const [showChessBoard, setShowChessBoard] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh room data every 5 seconds to keep participant list updated
  useEffect(() => {
    const interval = setInterval(() => {
      const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
      const updatedRoom = rooms.find((r: LessonRoom) => r.id === room.id)
      if (updatedRoom) {
        setCurrentRoom(updatedRoom)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [room.id])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert("Invite code copied to clipboard!")
  }

  const copyRoomLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert("Room link copied to clipboard!")
  }

  const handleInviteToPlay = async (studentId: string) => {
    setLoading(true)
    setError(null)

    try {
      // Import the function dynamically to avoid circular dependencies
      const { inviteStudentToPlay } = await import("@/lib/rooms")
      const success = await inviteStudentToPlay(room.id, studentId)
      
      if (success) {
        // Update local state
        const updatedRoom = { ...currentRoom }
        const participant = updatedRoom.participants.find(p => p.id === studentId)
        if (participant) {
          participant.status = "invited"
          setCurrentRoom(updatedRoom)
        }
      } else {
        setError("Failed to invite student to play")
      }
    } catch (error: any) {
      setError(error.message || "Failed to invite student")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!selectedPlayer) return

    setLoading(true)
    setError(null)

    try {
      const { acceptGameInvitation, startLessonGame } = await import("@/lib/rooms")
      
      // Accept the invitation
      const accepted = await acceptGameInvitation(room.id, selectedPlayer)
      if (!accepted) {
        setError("Failed to accept invitation")
        return
      }

      // Start the game
      const gameStarted = await startLessonGame(room.id, user.id, selectedPlayer)
      if (!gameStarted) {
        setError("Failed to start game")
        return
      }

      // Update local state
      const updatedRoom = { ...currentRoom }
      const player1 = updatedRoom.participants.find(p => p.id === user.id)
      const player2 = updatedRoom.participants.find(p => p.id === selectedPlayer)
      
      if (player1 && player2) {
        player1.status = "playing"
        player2.status = "playing"
        
        updatedRoom.currentGame = {
          id: crypto.randomUUID(),
          whitePlayerId: user.id,
          blackPlayerId: selectedPlayer,
          whitePlayerName: user.name,
          blackPlayerName: player2.name,
          status: "active",
          createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
        }
        
        setCurrentRoom(updatedRoom)
        setShowChessBoard(true)
      }
    } catch (error: any) {
      setError(error.message || "Failed to start game")
    } finally {
      setLoading(false)
    }
  }

  const handleEndGame = async () => {
    setLoading(true)
    setError(null)

    try {
      const { endLessonGame } = await import("@/lib/rooms")
      const success = await endLessonGame(room.id)
      
      if (success) {
        // Update local state
        const updatedRoom = { ...currentRoom }
        updatedRoom.participants.forEach(p => {
          p.status = "spectating"
        })
        updatedRoom.currentGame = null
        setCurrentRoom(updatedRoom)
        setShowChessBoard(false)
        setSelectedPlayer(null)
      } else {
        setError("Failed to end game")
      }
    } catch (error: any) {
      setError(error.message || "Failed to end game")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "playing":
        return "bg-green-100 text-green-800 border-green-300"
      case "invited":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "spectating":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "playing":
        return <Gamepad2 className="w-3 h-3" />
      case "invited":
        return <Clock className="w-3 h-3" />
      case "spectating":
        return <Eye className="w-3 h-3" />
      default:
        return <Eye className="w-3 h-3" />
    }
  }

  const isTeacher = user.id === room.teacherId
  const currentParticipant = currentRoom.participants.find(p => p.id === user.id)
  const isPlaying = currentParticipant?.status === "playing"
  const isInvited = currentParticipant?.status === "invited"

  // If showing chess board, render the chess game
  if (showChessBoard && isPlaying) {
    return (
      <div className="min-h-screen bg-orange-100">
        <div className="bg-amber-50 border-b-2 border-amber-800 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                              <img src="/images/first-time-chess-logo-app.svg" alt="First Time Chess app" className="h-12 w-auto" />
              <div className="h-8 w-px bg-amber-800"></div>
              <div>
                <h1 className="text-xl font-bold text-amber-900">{room.name} - Chess Game</h1>
                <p className="text-sm text-amber-700">Lesson Room</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Gamepad2 className="w-3 h-3 mr-1" />
                Playing
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleEndGame}
                className="border-amber-800 text-amber-800 hover:bg-amber-100"
                disabled={loading}
              >
                End Game
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowChessBoard(false)}
                className="border-green-600 text-green-600 hover:bg-green-100"
              >
                ← Back to Lesson Room
              </Button>
            </div>
          </div>
        </div>
        <ChessLearningApp user={user} room={room} onLeaveRoom={onLeaveRoom} onLogout={onLogout} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-amber-50 border-2 border-amber-800 rounded-lg shadow-lg mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                              <img src="/images/first-time-chess-logo-app.svg" alt="First Time Chess app" className="h-16 w-auto" />
              <div className="h-8 w-px bg-amber-800"></div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900">{room.name}</h1>
                <p className="text-amber-700">Lesson Room</p>
              </div>
              <Badge variant="outline" className="text-sm border-amber-800 text-amber-800 bg-amber-100">
                <Users className="w-3 h-3 mr-1" />
                {currentRoom.participants.length}/{room.maxParticipants}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onLeaveRoom}
                className="border-amber-800 text-amber-800 hover:bg-amber-100"
              >
                ← Back to Lobby
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
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

        {/* Game Status */}
        {currentRoom.currentGame && (
          <Card className="border-2 border-green-600 bg-green-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Trophy className="w-5 h-5" />
                Active Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm bg-white text-green-800">
                        {getInitials(currentRoom.currentGame.whitePlayerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{currentRoom.currentGame.whitePlayerName}</span>
                    <Badge variant="outline" className="bg-white text-green-800 border-green-600">
                      White
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold text-green-800">VS</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-black text-white border-black">
                      Black
                    </Badge>
                    <span className="font-medium">{currentRoom.currentGame.blackPlayerName}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm bg-black text-white">
                        {getInitials(currentRoom.currentGame.blackPlayerName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                {isTeacher && (
                  <Button
                    onClick={handleEndGame}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    disabled={loading}
                  >
                    End Game
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Invitation */}
        {isInvited && (
          <Card className="border-2 border-yellow-600 bg-yellow-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <Clock className="w-5 h-5" />
                Game Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-yellow-800">
                  You've been invited to play chess! Click "Accept & Play" to start the game.
                </p>
                <Button
                  onClick={handleAcceptInvitation}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Accept & Play
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Info */}
          <div className="space-y-4">
            <Card className="border-2 border-amber-800 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Settings className="w-5 h-5" />
                  Room Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                    <span className="text-sm text-amber-700">Invite Code:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                      {room.inviteCode}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyInviteCode(room.inviteCode)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                    <span className="text-sm text-amber-700">Room Link:</span>
                    <code className="bg-white px-2 py-1 rounded text-xs font-mono border flex-1 truncate">
                      {room.uniqueLink}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyRoomLink(room.uniqueLink || "")}>
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {isTeacher && !currentRoom.currentGame && (
              <Card className="border-2 border-amber-800 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Gamepad2 className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-700 mb-3">
                    Invite students to play chess while others spectate
                  </p>
                  <div className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Click on a student's name below to invite them to play
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Participants */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-amber-800 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Users className="w-5 h-5" />
                  Participants ({currentRoom.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentRoom.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                        participant.id === user.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-amber-200 bg-white hover:bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {participant.avatarUrl ? (
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                          ) : (
                            <AvatarFallback className="text-sm">
                              {getInitials(participant.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-amber-900">{participant.name}</span>
                            {participant.role === "teacher" && (
                              <Badge className="bg-amber-800 text-amber-50">
                                <Crown className="w-3 h-3 mr-1" />
                                Teacher
                              </Badge>
                            )}
                            <Badge variant="outline" className={getStatusColor(participant.status)}>
                              {getStatusIcon(participant.status)}
                              {participant.status === "playing" && " Playing"}
                              {participant.status === "invited" && " Invited"}
                              {participant.status === "spectating" && " Spectating"}
                            </Badge>
                          </div>
                          <p className="text-sm text-amber-600">
                            Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTeacher && 
                         participant.role === "student" && 
                         participant.status === "spectating" && 
                         !currentRoom.currentGame && (
                          <Button
                            onClick={() => handleInviteToPlay(participant.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={loading}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Invite to Play
                          </Button>
                        )}
                        
                        {isTeacher && 
                         participant.role === "student" && 
                         participant.status === "invited" && (
                          <Button
                            onClick={() => setSelectedPlayer(participant.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                          >
                            <Gamepad2 className="w-3 h-3 mr-1" />
                            Select as Opponent
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
