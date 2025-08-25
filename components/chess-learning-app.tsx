"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
type PieceColor = "white" | "black"
type Square = { type: PieceType; color: PieceColor } | null

const PIECE_SYMBOLS = {
  white: { pawn: "♙", rook: "♖", knight: "♘", bishop: "♗", queen: "♕", king: "♔" },
  black: { pawn: "♟", rook: "♜", knight: "♞", bishop: "♝", queen: "♛", king: "♚" },
}

const BOARD_THEMES = {
  Classic: { light: "bg-amber-100", dark: "bg-amber-800", border: "border-amber-900" },
  Modern: { light: "bg-gray-100", dark: "bg-gray-600", border: "border-gray-700" },
  "Pink Girly": { light: "bg-pink-50", dark: "bg-pink-400", border: "border-pink-500" },
  "Classic Wooden": {
    light: "bg-gradient-to-br from-amber-50 to-amber-100",
    dark: "bg-gradient-to-br from-amber-700 to-amber-800",
    border: "border-amber-900",
  },
  "Blue & Gold": {
    light: "bg-gray-900 border border-cyan-400",
    dark: "bg-black border border-cyan-500 shadow-lg shadow-cyan-500/50",
    border: "border-cyan-400",
  },
  "Nature Green": {
    light: "bg-gradient-to-br from-green-100 to-green-200",
    dark: "bg-gradient-to-br from-green-700 to-green-800",
    border: "border-green-900",
  },
  "Sci-Fi Neon": {
    light: "bg-gray-900 border border-cyan-400",
    dark: "bg-black border border-cyan-500 shadow-lg shadow-cyan-500/50",
    border: "border-cyan-400",
  },
  "Modern Minimal": {
    light: "bg-gray-50",
    dark: "bg-gray-400",
    border: "border-gray-500",
  },
}

const createInitialBoard = (): Square[][] => {
  const board: Square[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))

  // White pieces
  board[7] = [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ]
  for (let i = 0; i < 8; i++) board[6][i] = { type: "pawn", color: "white" }

  // Black pieces
  board[0] = [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ]
  for (let i = 0; i < 8; i++) board[1][i] = { type: "pawn", color: "black" }

  return board
}

const isValidMove = (
  board: Square[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  allowKingCapture = false, // New parameter for check detection
  pieceMoved?: Set<string>, // Added for castling tracking
): boolean => {
  const piece = board[fromRow][fromCol]
  if (!piece) return false

  const targetPiece = board[toRow][toCol]
  if (targetPiece?.color === piece.color) return false
  if (targetPiece?.type === "king" && !allowKingCapture) return false

  const rowDiff = toRow - fromRow
  const colDiff = toCol - fromCol
  const absRowDiff = Math.abs(rowDiff)
  const absColDiff = Math.abs(colDiff)

  switch (piece.type) {
    case "pawn":
      const direction = piece.color === "white" ? -1 : 1
      const startRow = piece.color === "white" ? 6 : 1

      if (colDiff === 0) {
        if (rowDiff === direction && !targetPiece) return true
        if (fromRow === startRow && rowDiff === 2 * direction && !targetPiece && !board[fromRow + direction][fromCol])
          return true
      } else if (absColDiff === 1 && rowDiff === direction) {
        if (targetPiece) return true

        // En passant
        if (
          lastMove &&
          lastMove.piece?.type === "pawn" &&
          Math.abs(lastMove.to[0] - lastMove.from[0]) === 2 &&
          lastMove.to[0] === fromRow &&
          lastMove.to[1] === toCol
        ) {
          return true
        }
      }
      return false

    case "rook":
      if (rowDiff !== 0 && colDiff !== 0) return false
      break

    case "knight":
      if (!((absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2))) return false
      return true

    case "bishop":
      if (absRowDiff !== absColDiff) return false
      break

    case "queen":
      if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false
      break

    case "king":
      if (absRowDiff > 1 || absColDiff > 1) {
        // Check for castling
        if (absRowDiff === 0 && absColDiff === 2 && pieceMoved) {
          const kingKey = `${piece.color}-king`
          if (pieceMoved.has(kingKey)) return false // King has moved

          const isKingside = colDiff > 0
          const rookCol = isKingside ? 7 : 0
          const rookKey = `${piece.color}-rook-${rookCol}`

          if (pieceMoved.has(rookKey)) return false // Rook has moved
          if (!board[fromRow][rookCol] || board[fromRow][rookCol]?.type !== "rook") return false

          // Check path is clear
          const start = Math.min(fromCol, rookCol) + 1
          const end = Math.max(fromCol, rookCol)
          for (let col = start; col < end; col++) {
            if (board[fromRow][col]) return false
          }

          // King cannot be in check, pass through check, or end in check
          if (isInCheck(board, piece.color)) return false

          // Test intermediate square
          const testBoard1 = board.map((r) => [...r])
          testBoard1[fromRow][fromCol + (isKingside ? 1 : -1)] = piece
          testBoard1[fromRow][fromCol] = null
          if (isInCheck(testBoard1, piece.color)) return false

          // Test final square
          const testBoard2 = board.map((r) => [...r])
          testBoard2[toRow][toCol] = piece
          testBoard2[fromRow][fromCol] = null
          if (isInCheck(testBoard2, piece.color)) return false

          return true
        }
        return false
      }
      return true
  }

  // Check path for sliding pieces
  if (piece.type === "rook" || piece.type === "bishop" || piece.type === "queen") {
    const stepRow = rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1
    const stepCol = colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1
    let checkRow = fromRow + stepRow
    let checkCol = fromCol + stepCol

    while (checkRow !== toRow || checkCol !== toCol) {
      if (board[checkRow][checkCol]) return false
      checkRow += stepRow
      checkCol += stepCol
    }
  }

  return true
}

const findKing = (board: Square[][], color: PieceColor): [number, number] | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece?.type === "king" && piece.color === color) {
        return [row, col]
      }
    }
  }
  return null
}

const isInCheck = (board: Square[][], color: PieceColor): boolean => {
  const kingPos = findKing(board, color)
  if (!kingPos) return false

  const [kingRow, kingCol] = kingPos
  const opponentColor = color === "white" ? "black" : "white"

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece?.color === opponentColor) {
        if (isValidMove(board, row, col, kingRow, kingCol, undefined, true)) {
          return true
        }
      }
    }
  }
  return false
}

const getValidMoves = (
  board: Square[][],
  row: number,
  col: number,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  pieceMoved?: Set<string>, // Added for castling tracking
): [number, number][] => {
  const piece = board[row][col]
  if (!piece) return []

  const moves: [number, number][] = []

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(board, row, col, toRow, toCol, lastMove, false, pieceMoved)) {
        const testBoard = board.map((r) => [...r])
        testBoard[toRow][toCol] = testBoard[row][col]
        testBoard[row][col] = null

        if (!isInCheck(testBoard, piece.color)) {
          moves.push([toRow, toCol])
        }
      }
    }
  }

  return moves
}

const getAllLegalMoves = (
  board: Square[][],
  color: PieceColor,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  pieceMoved?: Set<string>, // Added for castling tracking
): [number, number][] => {
  const allMoves: [number, number][] = []

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece?.color === color) {
        const validMoves = getValidMoves(board, row, col, lastMove, pieceMoved)
        allMoves.push(...validMoves)
      }
    }
  }

  return allMoves
}

const isCheckmate = (
  board: Square[][],
  color: PieceColor,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  pieceMoved?: Set<string>, // Added for castling tracking
): boolean => {
  if (!isInCheck(board, color)) return false
  return getAllLegalMoves(board, color, lastMove, pieceMoved).length === 0
}

const isStalemate = (
  board: Square[][],
  color: PieceColor,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  pieceMoved?: Set<string>, // Added for castling tracking
): boolean => {
  if (isInCheck(board, color)) return false
  return getAllLegalMoves(board, color, lastMove, pieceMoved).length === 0
}

const getGameStatus = (
  board: Square[][],
  currentPlayer: PieceColor,
  lastMove?: { from: [number, number]; to: [number, number]; piece: Square },
  pieceMoved?: Set<string>, // Added for castling tracking
): string => {
  if (isCheckmate(board, currentPlayer, lastMove, pieceMoved)) {
    const winner = currentPlayer === "white" ? "Black" : "White"
    return `${winner} won by checkmate`
  }

  if (isStalemate(board, currentPlayer, lastMove, pieceMoved)) {
    return "Draw by stalemate"
  }

  if (isInCheck(board, currentPlayer)) {
    return `${currentPlayer === "white" ? "White" : "Black"} king is in check`
  }

  return `${currentPlayer === "white" ? "White" : "Black"} to move`
}

const createAudioContext = () => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)()
  } catch (e) {
    console.log("AudioContext not supported")
    return null
  }
}

const playMoveSound = () => {
  const audioContext = createAudioContext()
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()

  oscillator.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(120, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.15)

  filter.type = "lowpass"
  filter.frequency.setValueAtTime(800, audioContext.currentTime)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

const playCheckSound = () => {
  const audioContext = createAudioContext()
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()

  oscillator.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = "triangle"
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3)

  filter.type = "bandpass"
  filter.frequency.setValueAtTime(800, audioContext.currentTime)

  gainNode.gain.setValueAtTime(0.8, audioContext.currentTime) // Much louder
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

const playCheckmateSound = () => {
  const audioContext = createAudioContext()
  if (!audioContext) return

  const playGameOverSequence = () => {
    // First: Sharp dramatic impact (0.8 seconds)
    const impact = audioContext.createOscillator()
    const impactGain = audioContext.createGain()
    const impactFilter = audioContext.createBiquadFilter()

    impact.connect(impactFilter)
    impactFilter.connect(impactGain)
    impactGain.connect(audioContext.destination)

    impact.type = "square"
    impact.frequency.setValueAtTime(60, audioContext.currentTime)
    impact.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.8)

    impactFilter.type = "lowpass"
    impactFilter.frequency.setValueAtTime(400, audioContext.currentTime)

    impactGain.gain.setValueAtTime(1.0, audioContext.currentTime)
    impactGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

    impact.start(audioContext.currentTime)
    impact.stop(audioContext.currentTime + 0.8)

    // Second: Victory/defeat bell (1.2 seconds total)
    setTimeout(() => {
      const bell = audioContext.createOscillator()
      const bellGain = audioContext.createGain()

      bell.connect(bellGain)
      bellGain.connect(audioContext.destination)

      bell.type = "sine"
      bell.frequency.setValueAtTime(400, audioContext.currentTime)
      bell.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1.2)

      bellGain.gain.setValueAtTime(0.8, audioContext.currentTime)
      bellGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2)

      bell.start(audioContext.currentTime)
      bell.stop(audioContext.currentTime + 1.2)
    }, 400)
  }

  playGameOverSequence()
}

const TRANSLATIONS = {
  en: {
    gameStatus: "Game Status",
    piecePalette: "Piece Palette",
    whitePieces: "White Pieces",
    blackPieces: "Black Pieces",
    selected: "Selected",
    clearSelection: "Clear Selection",
    boardControls: "Board Controls",
    clearBoard: "Clear Board",
    resetToStart: "Reset to Start",
    undoLastMove: "Undo Last Move",
    flipBoard: "Flip Board",
    language: "Language",
    whiteWonByCheckmate: "White won by checkmate",
    blackWonByCheckmate: "Black won by checkmate",
    drawByStalemate: "Draw by stalemate",
    whiteKingInCheck: "White king is in check",
    blackKingInCheck: "Black king is in check",
    whiteToMove: "White to move",
    blackToMove: "Black to move",
    choosePromotionPiece: "Choose Promotion Piece",
  },
  ro: {
    gameStatus: "Starea Jocului",
    piecePalette: "Paleta de Piese",
    whitePieces: "Piese Albe",
    blackPieces: "Piese Negre",
    selected: "Selectat",
    clearSelection: "Șterge Selecția",
    boardControls: "Controale Tablă",
    clearBoard: "Șterge Tabla",
    resetToStart: "Resetează la Început",
    undoLastMove: "Anulează Ultima Mutare",
    flipBoard: "Întoarce Tabla",
    language: "Limba",
    whiteWonByCheckmate: "Albul a câștigat prin șah mat",
    blackWonByCheckmate: "Negrul a câștigat prin șah mat",
    drawByStalemate: "Remiză prin pat",
    whiteKingInCheck: "Regele alb este în șah",
    blackKingInCheck: "Regele negru este în șah",
    whiteToMove: "Albul la mutare",
    blackToMove: "Negrul la mutare",
    choosePromotionPiece: "Alege Piesa de Promovare",
  },
}

type Language = keyof typeof TRANSLATIONS

export default function ChessLearningApp({ user, room, onLeaveRoom, onLogout }: { user: any; room: any; onLeaveRoom: () => void; onLogout: () => void }) {
  const [board, setBoard] = useState<Square[][]>(createInitialBoard)
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [selectedPieceType, setSelectedPieceType] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<[number, number][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [boardTheme, setBoardTheme] = useState<keyof typeof BOARD_THEMES>("Classic")
  const [isFlipped, setIsFlipped] = useState(false)
  const [boardHistory, setBoardHistory] = useState<Square[][][]>([createInitialBoard()])
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number]; piece: Square } | null>(null)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [lastClickSquare, setLastClickSquare] = useState<[number, number] | null>(null)
  const [promotionDialog, setPromotionDialog] = useState<{ row: number; col: number } | null>(null)
  const [language, setLanguage] = useState<Language>("en")
  const [pieceMoved, setPieceMoved] = useState<Set<string>>(new Set())
  const [isDemoMode, setIsDemoMode] = useState(false)

  const whiteKingInCheck = useMemo(() => {
    const inCheck = isInCheck(board, "white")
    return inCheck
  }, [board])

  const blackKingInCheck = useMemo(() => {
    const inCheck = isInCheck(board, "black")
    return inCheck
  }, [board])

  const gameStatus = useMemo(
    () => {
      const status = getGameStatus(board, currentPlayer, lastMove || undefined, pieceMoved)
      const t = TRANSLATIONS[language]
      
      if (status.includes("White won by checkmate")) return t.whiteWonByCheckmate
      if (status.includes("Black won by checkmate")) return t.blackWonByCheckmate
      if (status.includes("Draw by stalemate")) return t.drawByStalemate
      if (status.includes("White king is in check")) return t.whiteKingInCheck
      if (status.includes("Black king is in check")) return t.blackKingInCheck
      if (status.includes("White to move")) return t.whiteToMove
      if (status.includes("Black to move")) return t.blackToMove
      
      return status
    },
    [board, currentPlayer, lastMove, pieceMoved, language],
  )

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (selectedPieceType) {
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = selectedPieceType // Place selected piece on clicked square
        setBoard(newBoard)
        setBoardHistory((prev) => [...prev, newBoard])
        playMoveSound()
        return // Exit early, no other logic needed for free placement
      }

      const piece = board[row][col]
      const currentTime = Date.now()
      const isDoubleClick =
        lastClickSquare && lastClickSquare[0] === row && lastClickSquare[1] === col && currentTime - lastClickTime < 500

      if (isDoubleClick && piece && isDemoMode) {
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = null // Remove the piece
        setBoard(newBoard)
        setBoardHistory((prev) => [...prev, newBoard])
        // Reset all click tracking and selection states
        setLastClickTime(0)
        setLastClickSquare(null)
        setValidMoves([])
        setSelectedSquare(null)
        setSelectedPieceType(null)
        playMoveSound()
        return
      }

      if (!isDemoMode) {
        const currentGameStatus = getGameStatus(board, currentPlayer, lastMove, pieceMoved)
        if (currentGameStatus.includes("checkmate") || currentGameStatus.includes("stalemate")) {
          return // No moves allowed when game is over
        }
      }

      if (selectedSquare) {
        const [fromRow, fromCol] = selectedSquare
        const movingPiece = board[fromRow][fromCol]

        if (movingPiece) {
          const canMove = validMoves.some(([r, c]) => r === row && c === col)

          if (canMove) {
            const capturedPiece = board[row][col]
            const newBoard = board.map((r) => [...r])

            const isCastling = movingPiece.type === "king" && Math.abs(col - fromCol) === 2
            if (isCastling) {
              const isKingside = col > fromCol
              const rookFromCol = isKingside ? 7 : 0
              const rookToCol = isKingside ? col - 1 : col + 1

              // Move king
              newBoard[row][col] = movingPiece
              newBoard[fromRow][fromCol] = null

              // Move rook
              newBoard[fromRow][rookToCol] = board[fromRow][rookFromCol]
              newBoard[fromRow][rookFromCol] = null
            } else {
              // Handle en passant
              if (movingPiece.type === "pawn" && !capturedPiece && Math.abs(col - fromCol) === 1) {
                newBoard[fromRow][col] = null // Remove captured pawn
              }

              newBoard[row][col] = movingPiece
              newBoard[fromRow][fromCol] = null

              // Check for pawn promotion
              if (movingPiece.type === "pawn" && (row === 0 || row === 7)) {
                setPromotionDialog({ row, col })
                setBoard(newBoard)
                setBoardHistory((prev) => [...prev, newBoard])
                setSelectedSquare(null)
                setValidMoves([])
                setLastClickTime(currentTime)
                setLastClickSquare([row, col])
                return // Don't continue with normal move processing
              }
            }

            const newPieceMoved = new Set(pieceMoved)
            if (movingPiece.type === "king") {
              newPieceMoved.add(`${movingPiece.color}-king`)
            } else if (movingPiece.type === "rook") {
              newPieceMoved.add(`${movingPiece.color}-rook-${fromCol}`)
            }
            setPieceMoved(newPieceMoved)

            const moveData = {
              from: [fromRow, fromCol] as [number, number],
              to: [row, col] as [number, number],
              piece: movingPiece,
            }
            setLastMove(moveData)

            const whiteInCheckAfterMove = isInCheck(newBoard, "white")
            const blackInCheckAfterMove = isInCheck(newBoard, "black")
            const whiteCheckmated = isCheckmate(newBoard, "white", moveData, newPieceMoved)
            const blackCheckmated = isCheckmate(newBoard, "black", moveData, newPieceMoved)

            if (whiteCheckmated || blackCheckmated) {
              playCheckmateSound() // Special dramatic sound for game over
            } else if (whiteInCheckAfterMove || blackInCheckAfterMove) {
              playCheckSound()
            } else {
              playMoveSound()
            }

            if (!isDemoMode) {
              const opponentColor = currentPlayer === "white" ? "black" : "white"
              setCurrentPlayer(opponentColor)
            }

            setBoard(newBoard)
            setBoardHistory((prev) => [...prev, newBoard])
            setSelectedSquare(null)
            setValidMoves([])
            setLastClickTime(currentTime)
            setLastClickSquare([row, col])
            return
          } else {
            setSelectedSquare(null)
            setValidMoves([])
          }
        }
      }

      if (piece) {
        setSelectedSquare([row, col])
        setValidMoves(getValidMoves(board, row, col, lastMove, pieceMoved))
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }

      setLastClickTime(currentTime)
      setLastClickSquare([row, col])
    }
  },
  [
    board,
    selectedSquare,
    validMoves,
    currentPlayer,
    lastMove,
    selectedPieceType,
    lastClickTime,
    lastClickSquare,
    pieceMoved,
    isDemoMode,
  ],
)

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionDialog) return

    const { row, col } = promotionDialog
    const newBoard = board.map((r) => [...r])
    const promotingPiece = newBoard[row][col]

    if (promotingPiece) {
      newBoard[row][col] = { type: pieceType, color: promotingPiece.color }
      setBoard(newBoard)
      setBoardHistory((prev) => [...prev, newBoard])
    }

    setPromotionDialog(null)
    playMoveSound()
  }

  const clearBoard = () => {
    const emptyBoard: Square[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))
    setBoard(emptyBoard)
    setBoardHistory([emptyBoard])
    setSelectedSquare(null)
    setValidMoves([])
    setSelectedPieceType(null)
    setPieceMoved(new Set())
    setIsDemoMode(true)
  }

  const resetBoard = () => {
    const initialBoard = createInitialBoard()
    setBoard(initialBoard)
    setBoardHistory([initialBoard])
    setCurrentPlayer("white")
    setSelectedSquare(null)
    setValidMoves([])
    setSelectedPieceType(null)
    setLastMove(null)
    setPieceMoved(new Set())
    setIsDemoMode(false)
  }

  const undoLastMove = () => {
    if (boardHistory.length <= 1) return
    const newHistory = [...boardHistory]
    newHistory.pop()
    const previousBoard = newHistory[newHistory.length - 1]
    setBoard(previousBoard)
    setBoardHistory(newHistory)
    setSelectedSquare(null)
    setValidMoves([])
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white")
    setPieceMoved(new Set())
  }

  const renderSquare = useCallback(
    (row: number, col: number) => {
      const piece = board[row][col]
      const isLight = (row + col) % 2 === 0
      const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col)

      const isKingInCheck =
        piece?.type === "king" &&
        ((piece.color === "white" && whiteKingInCheck) || (piece.color === "black" && blackKingInCheck))

      const theme = BOARD_THEMES[boardTheme]
      let squareClass = `w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer border ${theme.border} relative min-w-[32px] min-h-[32px] sm:min-w-[48px] sm:min-h-[48px] md:min-w-[64px] md:min-h-[64px]`

      if (isKingInCheck) {
        squareClass +=
          " !bg-red-500 !border-red-700 !border-4 shadow-2xl shadow-red-500/90 ring-4 ring-red-300 !important"
      } else if (isSelected) {
        squareClass += " bg-yellow-400"
      } else {
        squareClass += ` ${isLight ? theme.light : theme.dark}`
      }

      return (
        <div key={`${row}-${col}`} className={squareClass} onClick={() => handleSquareClick(row, col)}>
          {piece && (
            <span
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl select-none font-bold ${
                piece.color === "white"
                  ? "text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)]"
                  : "text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
              }`}
            >
              {PIECE_SYMBOLS[piece.color][piece.type]}
            </span>
          )}
          {isValidMove && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-green-500 rounded-full opacity-80"></div>
            </div>
          )}
          <div className="absolute bottom-0 right-0 text-[8px] sm:text-xs text-white font-bold pointer-events-none drop-shadow-[0_0_2px_rgba(0,0,0,1)]">
            {String.fromCharCode(97 + col)}
            {8 - row}
          </div>
        </div>
      )
    },
    [board, selectedSquare, validMoves, boardTheme, handleSquareClick, whiteKingInCheck, blackKingInCheck],
  )

  const renderBoard = () => {
    const rows = []
    for (let row = 0; row < 8; row++) {
      const cols = []
      for (let col = 0; col < 8; col++) {
        const displayRow = isFlipped ? 7 - row : row
        const displayCol = isFlipped ? 7 - col : col
        cols.push(renderSquare(displayRow, displayCol))
      }
      rows.push(
        <div key={row} className="flex">
          {cols}
        </div>,
      )
    }
    return rows
  }

  return (
    <div className="min-h-screen bg-orange-100">
      {/* Header with Navigation */}
      <div className="bg-amber-50 border-b-2 border-amber-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/images/first-time-chess-logo-new.png" alt="First Time Chess" className="h-8 sm:h-10 md:h-12 w-auto" />
              <div className="h-6 sm:h-8 w-px bg-amber-800 hidden sm:block"></div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-amber-900">Chess Game</h1>
                {room && <p className="text-xs sm:text-sm text-amber-700">{room.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ro">Română</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={onLeaveRoom}
                className="border-amber-800 text-amber-800 hover:bg-amber-100 text-sm sm:text-base px-2 sm:px-4"
              >
                ← Back to Lobby
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-amber-800 hover:text-amber-900 hover:bg-amber-100 text-sm sm:text-base px-2 sm:px-4"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Back to Lobby Button - Always Visible */}
          <div className="mb-4 flex justify-center lg:hidden">
            <Button
              variant="outline"
              onClick={onLeaveRoom}
              className="border-amber-800 text-amber-800 hover:bg-amber-100 px-6 py-2"
            >
              ← Back to Lobby
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            <div className="lg:col-span-1">
              <Card className="mb-2 sm:mb-4">
                <CardHeader>
                  <CardTitle>{TRANSLATIONS[language].gameStatus}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{gameStatus}</p>
                </CardContent>
              </Card>

            <Card className="mb-2 sm:mb-4">
              <CardHeader>
                <CardTitle>{TRANSLATIONS[language].piecePalette}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(["white", "black"] as PieceColor[]).map((color) => (
                    <div key={color} className="space-y-2">
                      <h4 className="font-semibold">
                        {color === "white" ? TRANSLATIONS[language].whitePieces : TRANSLATIONS[language].blackPieces}
                      </h4>
                      <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        {(["pawn", "rook", "knight", "bishop", "queen", "king"] as PieceType[]).map((type) => (
                          <Button
                            key={`${color}-${type}`}
                            variant="outline"
                            size="sm"
                            className={`aspect-square p-0 text-lg sm:text-xl font-bold ${
                              color === "white"
                                ? "bg-white hover:bg-gray-50 border-2 border-gray-600 shadow-md"
                                : "bg-gray-900 hover:bg-gray-800 text-white border-2 border-gray-400 shadow-md"
                            } ${
                              selectedPieceType?.type === type && selectedPieceType?.color === color
                                ? "ring-2 ring-blue-500"
                                : ""
                            }`}
                            onClick={() => {
                              if (selectedPieceType?.type === type && selectedPieceType?.color === color) {
                                setSelectedPieceType(null)
                              } else {
                                setSelectedPieceType({ type, color })
                              }
                            }}
                          >
                            {PIECE_SYMBOLS[color][type]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedPieceType && (
                  <div className="mt-4 p-2 bg-blue-100 rounded">
                    <p className="text-sm">
                      {TRANSLATIONS[language].selected}: {selectedPieceType.color} {selectedPieceType.type}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent"
                      onClick={() => setSelectedPieceType(null)}
                    >
                      {TRANSLATIONS[language].clearSelection}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{TRANSLATIONS[language].boardControls}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={clearBoard} className="w-full bg-red-600 hover:bg-red-700">
                  {TRANSLATIONS[language].clearBoard}
                </Button>
                <Button onClick={resetBoard} className="w-full bg-green-600 hover:bg-green-700">
                  {TRANSLATIONS[language].resetToStart}
                </Button>
                <Button onClick={undoLastMove} className="w-full bg-blue-600 hover:bg-blue-700">
                  {TRANSLATIONS[language].undoLastMove}
                </Button>
                <Button onClick={() => setIsFlipped(!isFlipped)} className="w-full bg-purple-600 hover:bg-purple-700">
                  {TRANSLATIONS[language].flipBoard}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col items-center justify-center px-2 sm:px-4">
            <div className="mb-4">
              <Select value={boardTheme} onValueChange={(value: keyof typeof BOARD_THEMES) => setBoardTheme(value)}>
                <SelectTrigger className="w-32 sm:w-40 md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(BOARD_THEMES).map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 sm:border-4 border-gray-800 bg-gray-900 p-1 sm:p-2 md:p-3 rounded-lg shadow-2xl max-w-full overflow-hidden">
              <div className="flex flex-col">{renderBoard()}</div>
            </div>

            {promotionDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="bg-white p-6">
                  <CardHeader>
                    <CardTitle>{TRANSLATIONS[language].choosePromotionPiece}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                      {(["queen", "rook", "bishop", "knight"] as PieceType[]).map((pieceType) => {
                        const promotingPiece = board[promotionDialog.row][promotionDialog.col]
                        return (
                          <Button
                            key={pieceType}
                            variant="outline"
                            size="lg"
                            className="aspect-square text-2xl sm:text-3xl md:text-4xl bg-transparent"
                            onClick={() => handlePromotion(pieceType)}
                          >
                            {promotingPiece && PIECE_SYMBOLS[promotingPiece.color][pieceType]}
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
