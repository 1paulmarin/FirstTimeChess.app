"use client"

import { useState, useEffect } from "react"
import ChessLearningApp from "@/components/chess-learning-app"
import LessonRoom from "@/components/lesson-room"
import RoomManager from "@/components/room-manager"
import UserProfile from "@/components/user-profile"

export interface User {
  id: string
  name: string
  email: string
  role: "teacher" | "student"
}

export interface GameRoom {
  id: string
  name: string
  teacherId: string
  teacherName: string
  inviteCode: string
  uniqueLink?: string
  maxParticipants?: number
  selectedPlayerId?: string | null
  participants: User[]
  isLessonMode?: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const handleJoinRoom = (room: GameRoom) => {
    setCurrentRoom(room)
    localStorage.setItem("currentRoom", JSON.stringify(room))
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    localStorage.removeItem("currentRoom")
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentRoom(null)
    localStorage.removeItem("user")
    localStorage.removeItem("currentRoom")
  }

  useEffect(() => {
    if (user && !currentRoom) {
      const savedRoom = localStorage.getItem("currentRoom")
      if (savedRoom) {
        try {
          const room = JSON.parse(savedRoom)
          setCurrentRoom(room)
        } catch (error) {
          console.error("Error parsing saved room:", error)
          localStorage.removeItem("currentRoom")
        }
      }
    }
  }, [user, currentRoom])

  if (!user) {
    return (
      <main className="min-h-screen bg-orange-100 flex items-center justify-center">
        <UserProfile onLogin={handleLogin} />
      </main>
    )
  }

  if (!currentRoom) {
    return (
      <main className="min-h-screen bg-orange-100">
        <RoomManager user={user} onJoinRoom={handleJoinRoom} onLogout={handleLogout} />
      </main>
    )
  }

  // Check if this is a lesson room
  if (currentRoom.isLessonMode) {
    return (
      <main className="min-h-screen bg-orange-100">
        <LessonRoom room={currentRoom} user={user} onLeaveRoom={handleLeaveRoom} onLogout={handleLogout} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-orange-100">
      <ChessLearningApp user={user} room={currentRoom} onLeaveRoom={handleLeaveRoom} onLogout={handleLogout} />
    </main>
  )
}
