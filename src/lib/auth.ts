// Auth disabled for demo - app works without database
export const auth = () => Promise.resolve(null)
export const handlers = { GET: () => new Response("Auth disabled"), POST: () => new Response("Auth disabled") }
export const signIn = () => Promise.resolve()
export const signOut = () => Promise.resolve()
