# Architecture et Création de l'Application - Guide Complet

Ce document explique l'architecture complète de l'application d'authentification et détaille l'ordre exact de création de chaque fichier et dossier.

## Table des Matières

1. [Vue d'ensemble de l'Architecture](#vue-densemble-de-larchitecture)
2. [Structure des Dossiers](#structure-des-dossiers)
3. [Ordre de Création des Fichiers](#ordre-de-création-des-fichiers)
4. [Explication de Chaque Fichier](#explication-de-chaque-fichier)
5. [Commandes vs Création Manuelle](#commandes-vs-création-manuelle)

## Vue d'ensemble de l'Architecture

Cette application utilise l'architecture **App Router** de Next.js 13+, qui organise les routes basées sur la structure des dossiers dans le répertoire `src/app/`.

### Technologies Utilisées
- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS utilitaire
- **Clerk** : Service d'authentification
- **ShadCN UI** : Bibliothèque de composants
- **ESLint** : Linting du code

### Principe de Fonctionnement
```
Utilisateur non connecté → Page d'accueil → Inscription/Connexion → Dashboard personnalisé
                                     ↓
                              Middleware vérifie l'authentification
                                     ↓
                              Routes protégées (Dashboard, Profil)
```

## Structure des Dossiers

```
clerk-shadcn-1/                    # Racine du projet
├── .next/                         # Généré automatiquement par Next.js
├── node_modules/                  # Dépendances installées par npm
├── public/                        # Fichiers statiques (créé automatiquement)
├── src/                          # Code source principal
│   ├── app/                      # App Router de Next.js
│   │   ├── dashboard/            # Route protégée /dashboard
│   │   │   └── page.tsx          # Page du dashboard
│   │   ├── profile/              # Route protégée /profile
│   │   │   └── page.tsx          # Page de profil
│   │   ├── sign-in/              # Route d'authentification
│   │   │   └── [[...sign-in]]/   # Route dynamique Clerk
│   │   │       └── page.tsx      # Page de connexion
│   │   ├── sign-up/              # Route d'inscription
│   │   │   └── [[...sign-up]]/   # Route dynamique Clerk
│   │   │       └── page.tsx      # Page d'inscription
│   │   ├── error.tsx             # Page d'erreur globale
│   │   ├── globals.css           # Styles globaux
│   │   ├── layout.tsx            # Layout racine
│   │   └── page.tsx              # Page d'accueil
│   ├── components/               # Composants réutilisables
│   │   └── ui/                   # Composants UI ShadCN
│   │       ├── button.tsx        # Composant bouton
│   │       ├── card.tsx          # Composant carte
│   │       ├── input.tsx         # Composant input
│   │       └── label.tsx         # Composant label
│   ├── lib/                      # Utilitaires et helpers
│   │   └── utils.ts              # Fonctions utilitaires
│   └── middleware.ts             # Middleware de protection des routes
├── .env.local                    # Variables d'environnement (à créer)
├── .gitignore                    # Fichiers ignorés par Git
├── components.json               # Configuration ShadCN
├── env.example                   # Exemple de variables d'environnement
├── eslint.config.mjs             # Configuration ESLint
├── next-env.d.ts                 # Types TypeScript pour Next.js
├── next.config.ts                # Configuration Next.js
├── package-lock.json             # Verrous des dépendances
├── package.json                  # Métadonnées et dépendances du projet
├── postcss.config.mjs            # Configuration PostCSS
├── README.md                     # Documentation du projet
├── tailwind.config.ts            # Configuration Tailwind CSS
└── tsconfig.json                 # Configuration TypeScript
```

## Ordre de Création des Fichiers

### Phase 1 : Initialisation du Projet (Automatique)

**Commande :**
```bash
npx create-next-app@latest clerk-shadcn-1 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

**Fichiers créés automatiquement :**
1. `package.json`
2. `tsconfig.json`
3. `next.config.ts`
4. `tailwind.config.ts`
5. `postcss.config.mjs`
6. `eslint.config.mjs`
7. `.gitignore`
8. `next-env.d.ts`
9. `src/app/layout.tsx`
10. `src/app/page.tsx`
11. `src/app/globals.css`
12. `README.md`

### Phase 2 : Installation des Dépendances (Commandes)

**Commande 1 - Clerk :**
```bash
npm install @clerk/nextjs
```

**Commande 2 - ShadCN Init :**
```bash
npx shadcn@latest init --yes --defaults
```
**Fichiers créés :**
- `components.json`
- `src/lib/utils.ts`
- Modification de `src/app/globals.css`

**Commande 3 - Composants ShadCN :**
```bash
npx shadcn@latest add button card input label
```
**Fichiers créés :**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`

### Phase 3 : Configuration (Création Manuelle)

**Ordre de création :**

#### 1. `env.example` (Création manuelle)
**Pourquoi :** Documenter les variables d'environnement nécessaires
**Contenu :**
```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### 2. `.env.local` (Création manuelle - Non versionné)
**Pourquoi :** Stocker les vraies clés API de manière sécurisée
**Contenu :** Même que `env.example` mais avec les vraies clés Clerk

### Phase 4 : Modification des Fichiers Existants

#### 3. Modification de `src/app/layout.tsx`
**Pourquoi :** Intégrer Clerk dans l'application
**Contenu complet :**
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Demo Authentification - Clerk + ShadCN",
  description: "Demo d'authentification avec sessions utilisateur individuelles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

#### 4. Modification de `src/app/page.tsx`
**Pourquoi :** Créer la page d'accueil avec authentification
**Contenu complet :**
```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Demo Authentification
          </h1>
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline">Se connecter</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          <SignedOut>
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Bienvenue sur la Demo
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Une demonstration d'authentification avec Clerk et ShadCN UI
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                Chaque utilisateur a sa propre session securisee
              </p>
              <div className="flex justify-center gap-4">
                <SignInButton mode="modal">
                  <Button size="lg" className="px-8">
                    Se connecter
                  </Button>
                </SignInButton>
                <Link href="/sign-up">
                  <Button variant="outline" size="lg" className="px-8">
                    Creer un compte
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Sessions Securisees</CardTitle>
                  <CardDescription>
                    Chaque utilisateur a sa propre session isolee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Les sessions sont gerees de maniere securisee avec Clerk
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interface Moderne</CardTitle>
                  <CardDescription>
                    Interface utilisateur avec ShadCN UI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Composants modernes et accessibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Authentification Simple</CardTitle>
                  <CardDescription>
                    Connexion et inscription faciles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Processus d'authentification simplifie
                  </p>
                </CardContent>
              </Card>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Vous etes connecte !
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Explorez votre dashboard personnalise
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="px-8">
                    Aller au Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="lg" className="px-8">
                    Mon Profil
                  </Button>
                </Link>
              </div>
            </div>
          </SignedIn>
        </main>
      </div>
    </div>
  );
}
```

### Phase 5 : Création du Middleware (Création Manuelle)

#### 5. `src/middleware.ts`
**Pourquoi :** Protéger les routes sensibles
**Contenu complet :**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Phase 6 : Création des Pages d'Authentification (Création Manuelle)

#### 6. Créer le dossier `src/app/sign-in/[[...sign-in]]/`
**Commande :**
```bash
mkdir -p src/app/sign-in/[[...sign-in]]
```

#### 7. `src/app/sign-in/[[...sign-in]]/page.tsx`
**Pourquoi :** Page de connexion Clerk
**Contenu complet :**
```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Connexion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connectez-vous a votre compte
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-lg',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden'
            }
          }}
        />
      </div>
    </div>
  );
}
```

#### 8. Créer le dossier `src/app/sign-up/[[...sign-up]]/`
**Commande :**
```bash
mkdir -p src/app/sign-up/[[...sign-up]]
```

#### 9. `src/app/sign-up/[[...sign-up]]/page.tsx`
**Pourquoi :** Page d'inscription Clerk
**Contenu complet :**
```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Inscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Creez votre compte
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-lg',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden'
            }
          }}
        />
      </div>
    </div>
  );
}
```

### Phase 7 : Création des Pages Protégées (Création Manuelle)

#### 10. Créer le dossier `src/app/dashboard/`
**Commande :**
```bash
mkdir src/app/dashboard
```

#### 11. `src/app/dashboard/page.tsx`
**Pourquoi :** Dashboard personnalisé pour chaque utilisateur
**Contenu complet :**
```tsx
import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const userCreatedDate = new Date(user.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bienvenue, {user.firstName || user.emailAddresses[0].emailAddress}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Accueil</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* User Info Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations Utilisateur</CardTitle>
              <CardDescription>Vos informations de compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.emailAddresses[0].emailAddress}</p>
                <p><strong>Membre depuis:</strong> {userCreatedDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut de Session</CardTitle>
              <CardDescription>Informations sur votre session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Statut:</strong> <span className="text-green-600">Connecte</span></p>
                <p><strong>Session ID:</strong> {user.id.substring(0, 8)}...</p>
                <p><strong>Derniere connexion:</strong> {new Date(user.lastSignInAt || user.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
              <CardDescription>Raccourcis vers vos pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/profile" className="block">
                  <Button className="w-full">Mon Profil</Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">Accueil</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Demo de Session Personnalisee</CardTitle>
            <CardDescription>
              Cette section est unique a votre session utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Donnees Personnalisees
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Cette zone affiche des informations specifiques a votre session :
              </p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 text-sm mt-2 space-y-1">
                <li>Session unique : {user.id}</li>
                <li>Timestamp de connexion : {new Date().toISOString()}</li>
                <li>Nombre d'emails verifies : {user.emailAddresses.length}</li>
                <li>Type de compte : {user.publicMetadata?.role || 'Utilisateur standard'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Multiple Sessions Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test de Sessions Multiples</CardTitle>
            <CardDescription>
              Comment tester les sessions multiples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Pour tester les sessions multiples :
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Ouvrez un navigateur prive / incognito</li>
                <li>Creez un nouveau compte avec une adresse email differente</li>
                <li>Connectez-vous avec ce nouveau compte</li>
                <li>Comparez les dashboards - chaque utilisateur aura ses propres donnees</li>
              </ol>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mt-4">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Chaque session est completement isolee et securisee grace a Clerk !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### 12. Créer le dossier `src/app/profile/`
**Commande :**
```bash
mkdir src/app/profile
```

#### 13. `src/app/profile/page.tsx`
**Pourquoi :** Page de gestion du profil utilisateur
**Contenu complet :**
```tsx
import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserButton, UserProfile } from '@clerk/nextjs';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mon Profil
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerez vos informations personnelles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Accueil</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations du Profil</CardTitle>
              <CardDescription>
                Voici un apercu de vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations de Base</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID Utilisateur:</strong> {user.id}</p>
                    <p><strong>Prenom:</strong> {user.firstName || 'Non specifie'}</p>
                    <p><strong>Nom:</strong> {user.lastName || 'Non specifie'}</p>
                    <p><strong>Nom d'utilisateur:</strong> {user.username || 'Non specifie'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Contact</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email principal:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                    <p><strong>Email verifie:</strong> {user.emailAddresses[0]?.verification?.status === 'verified' ? 'Oui' : 'Non'}</p>
                    <p><strong>Telephone:</strong> {user.phoneNumbers[0]?.phoneNumber || 'Non specifie'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clerk UserProfile Component */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion du Profil</CardTitle>
              <CardDescription>
                Utilisez le panneau ci-dessous pour modifier vos informations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <UserProfile 
                  appearance={{
                    elements: {
                      card: 'shadow-none border-0',
                      navbar: 'hidden',
                      navbarMobileMenuButton: 'hidden',
                      headerTitle: 'text-xl font-semibold',
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case'
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Session Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Informations de Session</CardTitle>
              <CardDescription>
                Details sur votre session actuelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Cree le:</strong> {new Date(user.createdAt).toLocaleString('fr-FR')}</p>
                    <p><strong>Derniere mise a jour:</strong> {new Date(user.updatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <p><strong>Derniere connexion:</strong> {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('fr-FR') : 'Premiere connexion'}</p>
                    <p><strong>Statut:</strong> <span className="text-green-600 font-semibold">Actif</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### Phase 8 : Gestion des Erreurs (Création Manuelle)

#### 14. `src/app/error.tsx`
**Pourquoi :** Gérer les erreurs de configuration
**Contenu complet :**
```tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Erreur de Configuration
          </CardTitle>
          <CardDescription>
            Une erreur s'est produite lors du chargement de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {error.message.includes('Clerk') 
                  ? 'Clerk n\'est pas correctement configure. Veuillez verifier vos variables d\'environnement.'
                  : error.message
                }
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <Button onClick={reset} className="w-full">
                Reessayer
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/">Retour a l'accueil</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Explication de Chaque Fichier

### Fichiers de Configuration

#### `package.json`
- **Rôle :** Métadonnées du projet et gestion des dépendances
- **Création :** Automatique via create-next-app
- **Contient :** Scripts npm, dépendances, informations du projet

#### `tsconfig.json`
- **Rôle :** Configuration TypeScript
- **Création :** Automatique via create-next-app
- **Contient :** Règles de compilation TypeScript, chemins d'alias

#### `tailwind.config.ts`
- **Rôle :** Configuration Tailwind CSS
- **Création :** Automatique via create-next-app
- **Contient :** Thème, plugins, chemins de contenu

#### `components.json`
- **Rôle :** Configuration ShadCN UI
- **Création :** Automatique via shadcn init
- **Contient :** Paramètres des composants, chemins, style

### Fichiers d'Application

#### `src/app/layout.tsx`
- **Rôle :** Layout racine de l'application
- **Responsabilités :**
  - Envelopper l'app avec ClerkProvider
  - Définir les métadonnées
  - Charger les polices
  - Structurer le HTML de base

#### `src/app/page.tsx`
- **Rôle :** Page d'accueil
- **Responsabilités :**
  - Affichage conditionnel selon l'authentification
  - Interface de connexion/inscription
  - Présentation des fonctionnalités

#### `src/middleware.ts`
- **Rôle :** Middleware de protection des routes
- **Responsabilités :**
  - Vérifier l'authentification
  - Rediriger les utilisateurs non connectés
  - Protéger les routes sensibles

### Pages d'Authentification

#### `src/app/sign-in/[[...sign-in]]/page.tsx`
- **Rôle :** Page de connexion
- **Syntaxe `[[...sign-in]]` :** Route dynamique optionnelle pour Clerk
- **Responsabilités :** Afficher le formulaire de connexion Clerk

#### `src/app/sign-up/[[...sign-up]]/page.tsx`
- **Rôle :** Page d'inscription
- **Syntaxe `[[...sign-up]]` :** Route dynamique optionnelle pour Clerk
- **Responsabilités :** Afficher le formulaire d'inscription Clerk

### Pages Protégées

#### `src/app/dashboard/page.tsx`
- **Rôle :** Dashboard utilisateur personnalisé
- **Protection :** Via middleware
- **Responsabilités :**
  - Afficher les informations utilisateur
  - Démontrer l'isolation des sessions
  - Fournir la navigation

#### `src/app/profile/page.tsx`
- **Rôle :** Gestion du profil utilisateur
- **Protection :** Via middleware
- **Responsabilités :**
  - Afficher/modifier les informations de profil
  - Intégrer le composant UserProfile de Clerk

### Composants UI

#### `src/components/ui/*.tsx`
- **Rôle :** Composants d'interface réutilisables
- **Création :** Automatique via shadcn add
- **Responsabilités :** Fournir des composants stylés et accessibles

## Commandes vs Création Manuelle

### Commandes Automatiques
```bash
# Initialisation du projet
npx create-next-app@latest clerk-shadcn-1 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# Installation des dépendances
npm install @clerk/nextjs
npx shadcn@latest init --yes --defaults
npx shadcn@latest add button card input label

# Création de dossiers
mkdir -p src/app/sign-in/[[...sign-in]]
mkdir -p src/app/sign-up/[[...sign-up]]
mkdir src/app/dashboard
mkdir src/app/profile
```

### Création Manuelle Requise
- `env.example` et `.env.local`
- Tous les fichiers `.tsx` dans les dossiers de routes
- `src/middleware.ts`
- `src/app/error.tsx`
- Modifications des fichiers existants (`layout.tsx`, `page.tsx`)

### Ordre Critique de Création
1. **D'abord :** Configuration (env, layout)
2. **Ensuite :** Middleware (protection)
3. **Puis :** Pages d'authentification
4. **Enfin :** Pages protégées

Cette architecture garantit que chaque utilisateur a sa propre session sécurisée et isolée, avec une interface moderne et responsive.
