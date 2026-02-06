"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return (
      <Button onClick={() => signIn()}>
        Sign In
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span>Welcome, {session?.user?.name || session?.user?.email}</span>
      <Button variant="outline" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  )
}
