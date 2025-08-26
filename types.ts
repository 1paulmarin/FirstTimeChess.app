export interface User {
  id: string
  name: string
  email: string
  role: "teacher" | "student"
  avatarUrl?: string
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
  isLessonMode: boolean
  createdAt: string
  updatedAt: string
}
