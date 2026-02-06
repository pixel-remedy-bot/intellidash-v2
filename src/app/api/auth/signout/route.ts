import { signOut } from "@/lib/auth"

export async function GET() {
  await signOut()
  return Response.redirect("/login", 302)
}
