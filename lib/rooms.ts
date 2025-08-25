import type { GameRoom } from "@/app/page"

export interface LessonParticipant {
  id: string
  name: string
  email: string
  role: "teacher" | "student"
  avatarUrl?: string
  status: "spectating" | "playing" | "invited"
  joinedAt: string
}

export interface LessonGame {
  id: string
  whitePlayerId: string
  blackPlayerId: string
  whitePlayerName: string
  blackPlayerName: string
  status: "active" | "completed" | "paused"
  createdAt: string
  updatedAt: string
}

export interface LessonRoom extends GameRoom {
  isLessonMode: boolean
  participants: LessonParticipant[]
  currentGame?: LessonGame | null
  maxParticipants: number
}

export async function createLessonRoom(name: string, teacherId: string, teacherName: string): Promise<LessonRoom | null> {
  const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase()
  const roomId = crypto.randomUUID()

  const room: LessonRoom = {
    id: roomId,
    name: name.trim(),
    teacherId: teacherId,
    teacherName: teacherName,
    inviteCode: inviteCode,
    uniqueLink: `${window.location.origin}/room/${roomId}`,
    maxParticipants: 10,
    participants: [
      {
        id: teacherId,
        name: teacherName,
        email: "", // Will be filled from user data
        role: "teacher",
        status: "spectating",
        joinedAt: new Date().toISOString(),
      }
    ],
    isLessonMode: true,
    currentGame: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Store in localStorage
  const existingRooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  existingRooms.push(room)
  localStorage.setItem("lesson_rooms", JSON.stringify(existingRooms))

  return room
}

export async function createRoom(name: string, teacherId: string, teacherName: string): Promise<GameRoom | null> {
  const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase()
  const roomId = crypto.randomUUID()

  const room: GameRoom = {
    id: roomId,
    name: name.trim(),
    teacherId: teacherId,
    teacherName: teacherName,
    inviteCode: inviteCode,
    uniqueLink: `${window.location.origin}/room/${roomId}`,
    maxParticipants: 10,
    participants: [],
    isLessonMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Store in localStorage
  const existingRooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  existingRooms.push(room)
  localStorage.setItem("game_rooms", JSON.stringify(existingRooms))

  return room
}

export async function getLessonRoomByInviteCode(inviteCode: string): Promise<LessonRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  return rooms.find((room: LessonRoom) => room.inviteCode === inviteCode.toUpperCase()) || null
}

export async function getRoomByInviteCode(inviteCode: string): Promise<GameRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  return rooms.find((room: GameRoom) => room.inviteCode === inviteCode.toUpperCase()) || null
}

export async function joinLessonRoom(roomId: string, userId: string, userName: string, userEmail: string, userRole: "teacher" | "student"): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  // Check if room is at capacity
  if (rooms[roomIndex].participants.length >= rooms[roomIndex].maxParticipants) {
    return false
  }

  // Check if user is already in the room
  const isAlreadyParticipant = rooms[roomIndex].participants.find((p: any) => p.id === userId)

  if (!isAlreadyParticipant) {
    const newParticipant: LessonParticipant = {
      id: userId,
      name: userName,
      email: userEmail,
      role: userRole,
      status: "spectating",
              joinedAt: new Date().toISOString(),
    }
    
    rooms[roomIndex].participants.push(newParticipant)
    localStorage.setItem("lesson_rooms", JSON.stringify(rooms))
  }

  return true
}

export async function joinRoom(roomId: string, userId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: GameRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const user = users.find((u: any) => u.id === userId)

  if (!user) return false

  if (!rooms[roomIndex].participants.find((p: any) => p.id === userId)) {
    rooms[roomIndex].participants.push(user)
    localStorage.setItem("game_rooms", JSON.stringify(rooms))
  }

  return true
}

export async function leaveLessonRoom(roomId: string, userId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  rooms[roomIndex].participants = rooms[roomIndex].participants.filter((p: any) => p.id !== userId)
  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))

  return true
}

export async function leaveRoom(roomId: string, userId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: GameRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  rooms[roomIndex].participants = rooms[roomIndex].participants.filter((p: any) => p.id !== userId)
  localStorage.setItem("game_rooms", JSON.stringify(rooms))

  return true
}

export async function inviteStudentToPlay(roomId: string, studentId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  const studentIndex = rooms[roomIndex].participants.findIndex((p: any) => p.id === studentId)
  if (studentIndex === -1) return false

  // Update student status to invited
  rooms[roomIndex].participants[studentIndex].status = "invited"
  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))

  return true
}

export async function acceptGameInvitation(roomId: string, studentId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  const studentIndex = rooms[roomIndex].participants.findIndex((p: any) => p.id === studentId)
  if (studentIndex === -1) return false

  // Update student status to playing
  rooms[roomIndex].participants[studentIndex].status = "playing"
  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))

  return true
}

export async function startLessonGame(roomId: string, whitePlayerId: string, blackPlayerId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  const whitePlayer = rooms[roomIndex].participants.find((p: any) => p.id === whitePlayerId)
  const blackPlayer = rooms[roomIndex].participants.find((p: any) => p.id === blackPlayerId)

  if (!whitePlayer || !blackPlayer) return false

  const newGame: LessonGame = {
    id: crypto.randomUUID(),
    whitePlayerId,
    blackPlayerId,
    whitePlayerName: whitePlayer.name,
    blackPlayerName: blackPlayer.name,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  rooms[roomIndex].currentGame = newGame
  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))

  return true
}

export async function endLessonGame(roomId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  // Reset all participants to spectating
  rooms[roomIndex].participants.forEach((p: any) => {
    p.status = "spectating"
  })

  // Clear current game
  rooms[roomIndex].currentGame = null
  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))

  return true
}

export async function getUserLessonRooms(userId: string): Promise<LessonRoom[]> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")

  return rooms.filter(
    (room: LessonRoom) => room.teacherId === userId || room.participants.some((p) => p.id === userId),
  )
}

export async function getUserRooms(userId: string): Promise<GameRoom[]> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")

  return rooms.filter(
    (room: GameRoom) => room.teacherId === userId || room.participants.some((p: any) => p.id === userId),
  )
}

export async function deleteLessonRoom(roomId: string, teacherId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const filteredRooms = rooms.filter((room: LessonRoom) => !(room.id === roomId && room.teacherId === teacherId))

  localStorage.setItem("lesson_rooms", JSON.stringify(filteredRooms))
  return true
}

export async function deleteRoom(roomId: string, teacherId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const filteredRooms = rooms.filter((room: GameRoom) => !(room.id === roomId && room.teacherId === teacherId))

  localStorage.setItem("game_rooms", JSON.stringify(filteredRooms))
  return true
}

export async function updateLessonRoom(roomId: string, updates: Partial<LessonRoom>): Promise<LessonRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("lesson_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: LessonRoom) => room.id === roomId)

  if (roomIndex === -1) return null

  rooms[roomIndex] = {
    ...rooms[roomIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("lesson_rooms", JSON.stringify(rooms))
  return rooms[roomIndex]
}

export async function updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: GameRoom) => room.id === roomId)

  if (roomIndex === -1) return null

  rooms[roomIndex] = {
    ...rooms[roomIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("game_rooms", JSON.stringify(rooms))
  return rooms[roomIndex]
}
