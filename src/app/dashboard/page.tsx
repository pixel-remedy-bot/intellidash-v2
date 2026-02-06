import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Auth disabled for demo - redirect to home
  redirect("/")
}
