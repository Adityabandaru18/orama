"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield } from "lucide-react"
import Link from "next/link"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user" | "verifier"
  fallbackPath?: string
}

export function AuthGuard({ children, requiredRole, fallbackPath = "/auth" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = async () => {
      // In a real app, this would check JWT tokens, session storage, etc.
      const mockUser = {
        isAuthenticated: true,
        role: "admin", // This would come from your auth system
      }

      setTimeout(() => {
        setIsAuthenticated(mockUser.isAuthenticated)
        setUserRole(mockUser.role)
        setIsLoading(false)

        if (!mockUser.isAuthenticated) {
          router.push(fallbackPath)
        } else if (requiredRole && mockUser.role !== requiredRole) {
          // User doesn't have required role
          setIsAuthenticated(false)
        }
      }, 1000)
    }

    checkAuth()
  }, [router, requiredRole, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              {requiredRole
                ? `You need ${requiredRole} privileges to access this page.`
                : "You need to be signed in to access this page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href={fallbackPath}>Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
