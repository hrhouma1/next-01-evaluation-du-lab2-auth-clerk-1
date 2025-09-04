# Exemples d'Implémentation Pratique - Auth Methods

## Table des Matières

1. [NextAuth.js - Implémentation complète](#nextauthjs---implémentation-complète)
2. [Clerk - Modes standard et headless](#clerk---modes-standard-et-headless)
3. [JWT Maison - Architecture custom](#jwt-maison---architecture-custom)
4. [Comparaison des codes](#comparaison-des-codes)
5. [Intégrations marketing](#intégrations-marketing)
6. [Tests et debugging](#tests-et-debugging)

---

## NextAuth.js - Implémentation complète

### Configuration de base

#### 1. Installation et setup

```bash
npm install next-auth
npm install @next-auth/prisma-adapter prisma @prisma/client
```

#### 2. Configuration NextAuth (`pages/api/auth/[...nextauth].js`)

```javascript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma'

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Ajouter des données custom à la session
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  session: {
    strategy: 'database', // ou 'jwt'
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
})
```

#### 3. Schema Prisma (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("USER")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

#### 4. Composant de login custom

```tsx
// components/AuthButton.tsx
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Button disabled>Chargement...</Button>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <img 
          src={session.user?.image || ''} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full"
        />
        <span>Bonjour {session.user?.name}</span>
        <Button onClick={() => signOut()}>
          Se déconnecter
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => signIn('google')}>
        Login avec Google
      </Button>
      <Button onClick={() => signIn('github')} variant="outline">
        Login avec GitHub
      </Button>
    </div>
  )
}
```

#### 5. Protection de routes

```tsx
// components/ProtectedRoute.tsx
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Encore en chargement

    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div>Chargement...</div>
  }

  if (!session) {
    return <div>Redirection...</div>
  }

  return <>{children}</>
}
```

#### 6. Variables d'environnement

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

DATABASE_URL="postgresql://username:password@localhost:5432/nextauth"

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

---

## Clerk - Modes standard et headless

### Mode Standard (UI prête)

#### 1. Installation et setup

```bash
npm install @clerk/nextjs
```

#### 2. Configuration layout (`app/layout.tsx`)

```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

#### 3. Pages d'authentification

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
            card: 'shadow-xl'
          }
        }}
      />
    </div>
  )
}
```

#### 4. Utilisation dans les composants

```tsx
// components/UserStatus.tsx
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignInButton,
  useUser 
} from '@clerk/nextjs'

export function UserStatus() {
  const { user } = useUser()

  return (
    <div>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Se connecter
          </button>
        </SignInButton>
      </SignedOut>
      
      <SignedIn>
        <div className="flex items-center gap-4">
          <span>Bonjour {user?.firstName}!</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </div>
  )
}
```

### Mode Headless (UI custom)

#### 1. Login form custom

```tsx
// components/CustomSignIn.tsx
'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard'
      })
    } catch (err) {
      console.error('Erreur Google OAuth:', err)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <div className="mt-4">
        <Button 
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full"
        >
          Continuer avec Google
        </Button>
      </div>
    </div>
  )
}
```

#### 2. Gestion de l'inscription custom

```tsx
// components/CustomSignUp.tsx
'use client'

import { useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Code de vérification invalide')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Vérifiez votre email</h2>
        <p className="text-gray-600 mb-4">
          Un code de vérification a été envoyé à {email}
        </p>
        
        <form onSubmit={handleVerification} className="space-y-4">
          <Input
            type="text"
            placeholder="Code de vérification"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </Button>
      </form>
    </div>
  )
}
```

#### 3. Variables d'environnement Clerk

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## JWT Maison - Architecture custom

### Backend API (Express.js)

#### 1. Configuration JWT

```javascript
// lib/jwt.js
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')
const REFRESH_SECRET = process.env.REFRESH_SECRET || crypto.randomBytes(64).toString('hex')

class JWTManager {
  static generateTokens(payload) {
    const accessToken = jwt.sign(
      payload,
      JWT_SECRET,
      { 
        expiresIn: '15m',
        issuer: 'your-app',
        audience: 'your-app-users'
      }
    )

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      REFRESH_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'your-app'
      }
    )

    return { accessToken, refreshToken }
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, REFRESH_SECRET)
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  static refreshAccessToken(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken)
    
    // Vérifier que le refresh token est valide en DB
    const user = getUserById(decoded.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const newTokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return newTokens
  }
}

module.exports = JWTManager
```

#### 2. Routes d'authentification

```javascript
// routes/auth.js
const express = require('express')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const JWTManager = require('../lib/jwt')
const User = require('../models/User')

const router = express.Router()

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: 'Too many authentication attempts'
})

// Register
router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, firstName, lastName } = req.body

      // Vérifier si l'utilisateur existe
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' })
      }

      // Hasher le mot de passe
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER'
      })

      // Générer les tokens
      const { accessToken, refreshToken } = JWTManager.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      // Stocker le refresh token (sécurisé)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      })

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      // Trouver l'utilisateur
      const user = await User.findByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Générer les tokens
      const { accessToken, refreshToken } = JWTManager.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      // Stocker le refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    const newTokens = JWTManager.refreshAccessToken(refreshToken)

    // Mettre à jour le refresh token
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({ accessToken: newTokens.accessToken })
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out successfully' })
})

module.exports = router
```

#### 3. Middleware d'authentification

```javascript
// middleware/auth.js
const JWTManager = require('../lib/jwt')
const User = require('../models/User')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const decoded = JWTManager.verifyAccessToken(token)
    
    // Optionnel: vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

module.exports = { authenticateToken, requireRole }
```

### Frontend React/Next.js

#### 1. Context d'authentification

```tsx
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Vérifier le token au chargement
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('accessToken')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('accessToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const { user, accessToken } = await response.json()
    
    localStorage.setItem('accessToken', accessToken)
    setUser(user)
  }

  const register = async (userData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const { user, accessToken } = await response.json()
    
    localStorage.setItem('accessToken', accessToken)
    setUser(user)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### 2. Hook pour les appels API authentifiés

```tsx
// hooks/useAuthenticatedFetch.ts
import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthenticatedFetch() {
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    setLoading(true)
    
    const token = localStorage.getItem('accessToken')
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })

      // Si le token est expiré, essayer de le rafraîchir
      if (response.status === 401) {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        })

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json()
          localStorage.setItem('accessToken', accessToken)

          // Refaire la requête avec le nouveau token
          response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
          })
        } else {
          // Refresh failed, déconnecter l'utilisateur
          logout()
          throw new Error('Session expired')
        }
      }

      return response
    } finally {
      setLoading(false)
    }
  }, [logout])

  return { authenticatedFetch, loading }
}
```

---

## Comparaison des codes

### Complexité d'implémentation

| Aspect | NextAuth | Clerk | JWT Maison |
|--------|----------|-------|------------|
| **Lines of code** | ~100 lignes | ~50 lignes | ~500+ lignes |
| **Setup time** | 2-4 heures | 30 minutes | 1-2 semaines |
| **Files to create** | 5-7 fichiers | 3-4 fichiers | 15+ fichiers |
| **Dependencies** | 3-4 packages | 1 package | 10+ packages |

### Fonctionnalités incluses

```
✅ = Inclus    ⚠️ = Partiel    ❌ = À développer

                    NextAuth    Clerk    JWT Maison
OAuth providers     ✅          ✅       ❌
Email/Password      ⚠️          ✅       ❌
MFA/2FA            ❌          ✅       ❌
Session management  ✅          ✅       ❌
User management UI  ❌          ✅       ❌
Rate limiting      ❌          ✅       ❌
Audit logs         ❌          ✅       ❌
Password reset     ⚠️          ✅       ❌
Email verification ⚠️          ✅       ❌
```

---

## Intégrations marketing

### Webhook Clerk → Mailchimp

```javascript
// api/webhooks/clerk-to-mailchimp.js
const crypto = require('crypto')
const mailchimp = require('@mailchimp/mailchimp_marketing')

// Configuration Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Vérifier la signature Clerk
  const signature = req.headers['svix-signature']
  const timestamp = req.headers['svix-timestamp']
  const payload = JSON.stringify(req.body)

  const expectedSignature = crypto
    .createHmac('sha256', process.env.CLERK_WEBHOOK_SECRET)
    .update(timestamp + '.' + payload)
    .digest('base64')

  if (signature !== `v1,${expectedSignature}`) {
    return res.status(401).json({ message: 'Invalid signature' })
  }

  const { type, data } = req.body

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
    }

    res.status(200).json({ message: 'Webhook processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function handleUserCreated(userData) {
  const email = userData.email_addresses[0]?.email_address
  
  if (!email) return

  // Ajouter à Mailchimp
  await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: userData.first_name || '',
      LNAME: userData.last_name || '',
    },
    tags: ['new-user', 'clerk-signup']
  })

  // Déclencher séquence de bienvenue
  await mailchimp.automations.trigger('welcome-sequence', {
    email_address: email
  })
}
```

### NextAuth → Customer.io

```javascript
// lib/customerio.js
import { TrackClient } from 'customerio-node'

const cio = new TrackClient(
  process.env.CUSTOMERIO_SITE_ID,
  process.env.CUSTOMERIO_API_KEY
)

export async function syncUserToCustomerIO(user, event = 'user_created') {
  try {
    // Identifier l'utilisateur
    await cio.identify(user.id, {
      email: user.email,
      first_name: user.name?.split(' ')[0],
      last_name: user.name?.split(' ').slice(1).join(' '),
      created_at: Math.floor(Date.now() / 1000),
      plan: 'free'
    })

    // Déclencher un événement
    await cio.track(user.id, {
      name: event,
      data: {
        source: 'nextauth',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Customer.io sync error:', error)
  }
}

// Dans votre callback NextAuth
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    if (account.provider && user.email) {
      // Sync vers Customer.io lors de la première connexion
      await syncUserToCustomerIO(user, 'user_signed_in')
    }
    return true
  }
}
```

---

## Tests et debugging

### Tests NextAuth

```javascript
// __tests__/auth.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { AuthButton } from '@/components/AuthButton'

const mockSession = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg'
  }
}

jest.mock('next-auth/react')

describe('AuthButton', () => {
  it('shows login buttons when not authenticated', () => {
    require('next-auth/react').useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(
      <SessionProvider session={null}>
        <AuthButton />
      </SessionProvider>
    )

    expect(screen.getByText('Login avec Google')).toBeInTheDocument()
    expect(screen.getByText('Login avec GitHub')).toBeInTheDocument()
  })

  it('shows user info when authenticated', () => {
    require('next-auth/react').useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    })

    render(
      <SessionProvider session={mockSession}>
        <AuthButton />
      </SessionProvider>
    )

    expect(screen.getByText('Bonjour John Doe')).toBeInTheDocument()
    expect(screen.getByText('Se déconnecter')).toBeInTheDocument()
  })
})
```

### Tests Clerk

```javascript
// __tests__/clerk-auth.test.js
import { render, screen } from '@testing-library/react'
import { ClerkProvider } from '@clerk/nextjs'
import { UserStatus } from '@/components/UserStatus'

const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  emailAddresses: [{ emailAddress: 'john@example.com' }]
}

jest.mock('@clerk/nextjs', () => ({
  ...jest.requireActual('@clerk/nextjs'),
  useUser: jest.fn()
}))

describe('UserStatus with Clerk', () => {
  it('shows sign in button when not authenticated', () => {
    require('@clerk/nextjs').useUser.mockReturnValue({
      user: null,
      isLoaded: true,
      isSignedIn: false
    })

    render(
      <ClerkProvider>
        <UserStatus />
      </ClerkProvider>
    )

    expect(screen.getByText('Se connecter')).toBeInTheDocument()
  })

  it('shows user info when authenticated', () => {
    require('@clerk/nextjs').useUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true
    })

    render(
      <ClerkProvider>
        <UserStatus />
      </ClerkProvider>
    )

    expect(screen.getByText('Bonjour John!')).toBeInTheDocument()
  })
})
```

### Tests JWT Custom

```javascript
// __tests__/jwt-auth.test.js
import request from 'supertest'
import app from '../app'
import JWTManager from '../lib/jwt'

describe('JWT Authentication', () => {
  let accessToken
  let refreshToken

  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body.user.email).toBe(testUser.email)

      accessToken = response.body.accessToken
    })

    it('should not register user with existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('accessToken')
    })

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401)
    })
  })

  describe('JWT Token validation', () => {
    it('should verify valid access token', () => {
      const decoded = JWTManager.verifyAccessToken(accessToken)
      expect(decoded).toHaveProperty('userId')
      expect(decoded).toHaveProperty('email')
    })

    it('should reject invalid token', () => {
      expect(() => {
        JWTManager.verifyAccessToken('invalid-token')
      }).toThrow('Invalid access token')
    })
  })
})
```

### Debugging et monitoring

```javascript
// lib/auth-logger.js
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auth-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/auth-combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Middleware de logging pour les routes auth
const authLogger = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId || 'anonymous'
    }

    if (res.statusCode >= 400) {
      logger.error('Auth request failed', logData)
    } else {
      logger.info('Auth request completed', logData)
    }
  })

  next()
}

module.exports = { logger, authLogger }
```

Ce document fournit des exemples concrets et complets pour implémenter chacune des trois approches d'authentification, avec du code production-ready et des bonnes pratiques de sécurité.
