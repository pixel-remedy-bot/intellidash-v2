import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function seed() {
  const demoEmail = "demo@intellidash.com"
  
  // Check if demo user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  })

  if (existingUser) {
    console.log("Demo user already exists")
    return
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10)
  
  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      name: "Demo User",
      password: hashedPassword,
    },
  })

  console.log("Demo user created:", user.id)
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
