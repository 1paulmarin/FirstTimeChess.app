"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "access_denied":
        return "Access was denied. You may have cancelled the authentication process."
      case "server_error":
        return "A server error occurred. Please try again later."
      case "temporarily_unavailable":
        return "The service is temporarily unavailable. Please try again later."
      default:
        return errorDescription || "An authentication error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Authentication Error</CardTitle>
          <p className="text-slate-600">{getErrorMessage(error)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
