"use client"

import { useState, useCallback, useMemo } from "react"

type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
type PieceColor = "white" | "black"
type Square = { type: PieceType; color: PieceColor } | null

const PIECE_SYMBOLS = {
  white: { pawn: "♙", rook: "♖", knight: "♘", bishop: "♗", queen: "♕", king: "♔" },
  black: { pawn: "♟", rook: "♜", knight: "♞", bishop: "♝", queen: "♛", king: "♚" },
}

const createInitialBoard = (): Square[][] => {
  const board: Square[][] = Array(8).fill(null).map(() => Array(8).fill(null))

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
): boolean => {
  const piece = board[fromRow][fromCol]
  if (!piece) return false

  const targetPiece = board[toRow][toCol]
  if (targetPiece?.color === piece.color) return false

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
        return !!targetPiece
      }
      return false

    case "rook":
      if (rowDiff !== 0 && colDiff !== 0) return false
      break

    case "knight":
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)

    case "bishop":
      if (absRowDiff !== absColDiff) return false
      break

    case "queen":
      if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false
      break

    case "king":
      return absRowDiff <= 1 && absColDiff <= 1
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
        if (isValidMove(board, row, col, kingRow, kingCol)) {
          return true
        }
      }
    }
  }
  return false
}

const getValidMoves = (board: Square[][], row: number, col: number): [number, number][] => {
  const piece = board[row][col]
  if (!piece) return []

  const moves: [number, number][] = []

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(board, row, col, toRow, toCol)) {
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

const getGameStatus = (board: Square[][], currentPlayer: PieceColor): string => {
  if (isInCheck(board, currentPlayer)) {
    const allMoves: [number, number][] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece?.color === currentPlayer) {
          allMoves.push(...getValidMoves(board, row, col))
        }
      }
    }
    
    if (allMoves.length === 0) {
      const winner = currentPlayer === "white" ? "Black" : "White"
      return `${winner} won by checkmate`
    }
    return `${currentPlayer === "white" ? "White" : "Black"} king is in check`
  }

  return `${currentPlayer === "white" ? "White" : "Black"} to move`
}

export default function ChessApp() {
  const [board, setBoard] = useState<Square[][]>(createInitialBoard)
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [validMoves, setValidMoves] = useState<[number, number][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [isFlipped, setIsFlipped] = useState(false)
  const [promotionDialog, setPromotionDialog] = useState<{ row: number; col: number } | null>(null)

  const gameStatus = useMemo(() => getGameStatus(board, currentPlayer), [board, currentPlayer])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (promotionDialog) return

    const piece = board[row][col]
    
    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare
      const movingPiece = board[fromRow][fromCol]

      if (movingPiece) {
        const canMove = validMoves.some(([r, c]) => r === row && c === col)

        if (canMove) {
          const newBoard = board.map((r) => [...r])
          newBoard[row][col] = movingPiece
          newBoard[fromRow][fromCol] = null

          // Check for pawn promotion
          if (movingPiece.type === "pawn" && (row === 0 || row === 7)) {
            setPromotionDialog({ row, col })
            setBoard(newBoard)
            setSelectedSquare(null)
            setValidMoves([])
            return
          }

          setBoard(newBoard)
          setCurrentPlayer(currentPlayer === "white" ? "black" : "white")
          setSelectedSquare(null)
          setValidMoves([])
          return
        }
      }
    }

    if (piece && piece.color === currentPlayer) {
      setSelectedSquare([row, col])
      setValidMoves(getValidMoves(board, row, col))
    } else {
      setSelectedSquare(null)
      setValidMoves([])
    }
  }, [board, selectedSquare, validMoves, currentPlayer, promotionDialog])

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionDialog) return

    const { row, col } = promotionDialog
    const newBoard = board.map((r) => [...r])
    const promotingPiece = newBoard[row][col]

    if (promotingPiece) {
      newBoard[row][col] = { type: pieceType, color: promotingPiece.color }
      setBoard(newBoard)
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white")
    }

    setPromotionDialog(null)
  }

  const resetBoard = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer("white")
    setSelectedSquare(null)
    setValidMoves([])
    setPromotionDialog(null)
  }

  const renderSquare = useCallback((row: number, col: number) => {
    const piece = board[row][col]
    const isLight = (row + col) % 2 === 0
    const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col
    const isValidMove = validMoves.some(([r, c]) => r === row && c === col)

    let squareClass = `w-full h-full flex items-center justify-center cursor-pointer border border-gray-600 relative`
    squareClass += isLight ? " bg-amber-100" : " bg-amber-800"

    if (isSelected) {
      squareClass += " bg-yellow-400"
    }

    return (
      <div key={`${row}-${col}`} className={squareClass} onClick={() => handleSquareClick(row, col)}>
        {piece && (
          <span
            className={`text-2xl sm:text-3xl md:text-4xl select-none font-bold ${
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
            <div className="w-3 h-3 bg-green-500 rounded-full opacity-80"></div>
          </div>
        )}
      </div>
    )
  }, [board, selectedSquare, validMoves, handleSquareClick])

  const renderBoard = () => {
    const squares = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRow = isFlipped ? 7 - row : row
        const displayCol = isFlipped ? 7 - col : col
        squares.push(renderSquare(displayRow, displayCol))
      }
    }
    return squares
  }

  return (
    <div className="min-h-screen bg-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Chess Game</h1>
          <p className="text-lg text-amber-700">{gameStatus}</p>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={resetBoard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Game
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Flip Board
          </button>
        </div>

        {/* Board Container */}
        <div className="flex justify-center">
          <div className="w-full max-w-md aspect-square border-4 border-gray-800 bg-gray-900 p-2 rounded-lg shadow-2xl">
            <div className="w-full h-full grid grid-cols-8 grid-rows-8">
              {renderBoard()}
            </div>
          </div>
        </div>

        {/* Promotion Dialog */}
        {promotionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4 text-center">Choose Promotion Piece</h3>
              <div className="grid grid-cols-4 gap-2">
                {(["queen", "rook", "bishop", "knight"] as PieceType[]).map((pieceType) => (
                  <button
                    key={pieceType}
                    className="aspect-square text-2xl border rounded hover:bg-gray-100"
                    onClick={() => handlePromotion(pieceType)}
                  >
                    {PIECE_SYMBOLS[currentPlayer === "white" ? "black" : "white"][pieceType]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
