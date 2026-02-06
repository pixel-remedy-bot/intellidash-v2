import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login?callbackUrl=/dashboard")
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">
        Welcome, {session.user?.name || session.user?.email}!
      </p>
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Session Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}
