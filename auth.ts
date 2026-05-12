import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = typeof credentials?.username === 'string' ? credentials.username.trim() : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''

        if (!username || !password) return null

        const user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(password, user.hashedPassword)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
        session.user.role = typeof token.role === 'string' ? token.role : 'staff'
      }
      return session
    },
  },
})