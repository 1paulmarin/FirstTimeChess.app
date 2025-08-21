import type { GameRoom } from "@/app/page"

export async function createRoom(name: string, teacherId: string, teacherName: string): Promise<GameRoom | null> {
  const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase()
  const roomId = crypto.randomUUID()

  const room: GameRoom = {
    id: roomId,
    name: name.trim(),
    teacher_id: teacherId,
    teacher_name: teacherName,
    invite_code: inviteCode,
    unique_link: `${window.location.origin}/room/${roomId}`,
    max_participants: 10,
    participants: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Store in localStorage
  const existingRooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  existingRooms.push(room)
  localStorage.setItem("game_rooms", JSON.stringify(existingRooms))

  return room
}

export async function getRoomByInviteCode(inviteCode: string): Promise<GameRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  return rooms.find((room: GameRoom) => room.invite_code === inviteCode.toUpperCase()) || null
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

export async function leaveRoom(roomId: string, userId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: GameRoom) => room.id === roomId)

  if (roomIndex === -1) return false

  rooms[roomIndex].participants = rooms[roomIndex].participants.filter((p: any) => p.id !== userId)
  localStorage.setItem("game_rooms", JSON.stringify(rooms))

  return true
}

export async function getUserRooms(userId: string): Promise<GameRoom[]> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")

  return rooms.filter(
    (room: GameRoom) => room.teacher_id === userId || room.participants.some((p: any) => p.id === userId),
  )
}

export async function deleteRoom(roomId: string, teacherId: string): Promise<boolean> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const filteredRooms = rooms.filter((room: GameRoom) => !(room.id === roomId && room.teacher_id === teacherId))

  localStorage.setItem("game_rooms", JSON.stringify(filteredRooms))
  return true
}

export async function updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom | null> {
  const rooms = JSON.parse(localStorage.getItem("game_rooms") || "[]")
  const roomIndex = rooms.findIndex((room: GameRoom) => room.id === roomId)

  if (roomIndex === -1) return null

  rooms[roomIndex] = {
    ...rooms[roomIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  localStorage.setItem("game_rooms", JSON.stringify(rooms))
  return rooms[roomIndex]
}
