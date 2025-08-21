"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Check your email</CardTitle>
          <p className="text-slate-600">
            We've sent you a confirmation link. Please check your email and click the link to activate your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-slate-500">
            <p>Didn't receive the email? Check your spam folder or try signing up again.</p>
          </div>

          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
