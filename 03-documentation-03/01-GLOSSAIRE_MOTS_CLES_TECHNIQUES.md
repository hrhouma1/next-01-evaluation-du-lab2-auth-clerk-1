# Glossaire des Mots-Clés Techniques - Application Clerk + Next.js

## Table des Matières

1. [Fonctions et Hooks Clerk](#fonctions-et-hooks-clerk)
2. [Composants Clerk](#composants-clerk)
3. [Concepts Next.js](#concepts-nextjs)
4. [Middleware et Sécurité](#middleware-et-sécurité)
5. [ShadCN UI](#shadcn-ui)
6. [Types et Interfaces](#types-et-interfaces)
7. [Variables d'Environnement](#variables-denvironnement)
8. [Classes CSS Tailwind](#classes-css-tailwind)
9. [Concepts d'Authentification](#concepts-dauthentification)
10. [Performance et Optimisation](#performance-et-optimisation)

---

## Fonctions et Hooks Clerk

### currentUser()
**Type :** Fonction serveur asynchrone  
**Import :** `import { currentUser } from '@clerk/nextjs/server';`  
**Usage :** `const user = await currentUser();`

**Définition :**
Fonction côté serveur qui récupère les informations de l'utilisateur actuellement connecté.

**Fonctionnement :**
```tsx
export default async function Dashboard() {
  const user = await currentUser();
  // user contient toutes les données utilisateur
}
```

**Retourne :**
- `User | null` - Objet utilisateur complet ou null si non connecté
- Données incluses : id, firstName, lastName, emailAddresses, createdAt, etc.

**Utilisation :**
- Composants serveur uniquement
- Pas de loading state nécessaire
- Données disponibles immédiatement au rendu

**Exemple concret :**
```tsx
const user = await currentUser();
console.log(user?.id); // "user_2abcd1234efgh5678"
console.log(user?.firstName); // "John"
console.log(user?.emailAddresses[0].emailAddress); // "john@email.com"
```

### useUser()
**Type :** Hook React côté client  
**Import :** `import { useUser } from '@clerk/nextjs';`  
**Usage :** `const { user, isLoaded, isSignedIn } = useUser();`

**Définition :**
Hook React qui fournit les informations utilisateur et l'état de chargement côté client.

**Retourne un objet avec :**
- `user: User | null` - Données utilisateur
- `isLoaded: boolean` - Indique si les données sont chargées
- `isSignedIn: boolean` - Indique si l'utilisateur est connecté

**États possibles :**
```tsx
// État initial (chargement)
{ user: null, isLoaded: false, isSignedIn: false }

// Utilisateur non connecté (chargé)
{ user: null, isLoaded: true, isSignedIn: false }

// Utilisateur connecté (chargé)
{ user: UserObject, isLoaded: true, isSignedIn: true }
```

**Pattern d'utilisation :**
```tsx
const { user, isLoaded, isSignedIn } = useUser();

if (!isLoaded) {
  return <div>Chargement...</div>;
}

if (!isSignedIn) {
  return <div>Non connecté</div>;
}

return <div>Bonjour {user.firstName}!</div>;
```

### useAuth()
**Type :** Hook React côté client  
**Import :** `import { useAuth } from '@clerk/nextjs';`  
**Usage :** `const { userId, sessionId, getToken } = useAuth();`

**Définition :**
Hook qui fournit les informations d'authentification et les méthodes utilitaires.

**Retourne :**
- `userId: string | null` - ID de l'utilisateur connecté
- `sessionId: string | null` - ID de la session active
- `getToken: () => Promise<string | null>` - Fonction pour récupérer le JWT
- `signOut: () => Promise<void>` - Fonction de déconnexion

**Exemple :**
```tsx
const { userId, getToken, signOut } = useAuth();

const handleApiCall = async () => {
  const token = await getToken();
  // Utiliser le token pour les appels API
};
```

### clerkMiddleware()
**Type :** Fonction de création de middleware  
**Import :** `import { clerkMiddleware } from '@clerk/nextjs/server';`  
**Usage :** `export default clerkMiddleware((auth, req) => { ... });`

**Définition :**
Fonction qui crée un middleware Next.js intégré avec Clerk pour la protection des routes.

**Paramètres :**
- `auth` - Objet contenant les méthodes d'authentification
- `req` - Objet Request de Next.js

**Méthodes de l'objet auth :**
```tsx
auth.protect()              // Protège la route actuelle
auth.redirectToSignIn()     // Redirige vers la connexion
auth()                      // Récupère userId et sessionId
```

**Exemple :**
```tsx
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### createRouteMatcher()
**Type :** Fonction utilitaire  
**Import :** `import { createRouteMatcher } from '@clerk/nextjs/server';`  
**Usage :** `const isProtected = createRouteMatcher(['/dashboard(.*)']);`

**Définition :**
Crée une fonction qui vérifie si une route correspond aux patterns définis.

**Patterns supportés :**
```tsx
'/dashboard'          // Exactement /dashboard
'/dashboard(.*)'      // /dashboard et toutes ses sous-routes
'/api/(.*)'          // Toutes les routes /api/*
'/(dashboard|profile)(.*)' // Plusieurs routes avec sous-routes
```

**Retourne :**
Une fonction qui prend un objet Request et retourne un boolean.

**Exemple :**
```tsx
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)'
]);

// Usage
if (isProtectedRoute(req)) {
  // Route protégée
}
```

---

## Composants Clerk

### SignedIn
**Type :** Composant conditionnel  
**Import :** `import { SignedIn } from '@clerk/nextjs';`  
**Usage :** `<SignedIn>{children}</SignedIn>`

**Définition :**
Composant qui affiche son contenu seulement si l'utilisateur est connecté.

**Fonctionnement :**
- Vérifie automatiquement l'état d'authentification
- Réactif : se met à jour lors des changements d'état
- Pas de props requises

**Exemple :**
```tsx
<SignedIn>
  <p>Vous êtes connecté !</p>
  <UserButton />
</SignedIn>
```

### SignedOut
**Type :** Composant conditionnel  
**Import :** `import { SignedOut } from '@clerk/nextjs';`  
**Usage :** `<SignedOut>{children}</SignedOut>`

**Définition :**
Composant qui affiche son contenu seulement si l'utilisateur n'est PAS connecté.

**Utilisation typique :**
```tsx
<SignedOut>
  <p>Veuillez vous connecter</p>
  <SignInButton />
</SignedOut>
```

### SignIn
**Type :** Composant d'interface complet  
**Import :** `import { SignIn } from '@clerk/nextjs';`  
**Usage :** `<SignIn appearance={{ ... }} />`

**Définition :**
Interface complète de connexion avec formulaire, validation et gestion d'erreurs.

**Props principales :**
- `appearance` - Personnalisation de l'apparence
- `redirectUrl` - URL de redirection après connexion
- `signUpUrl` - URL vers la page d'inscription

**Fonctionnalités incluses :**
- Formulaire email/mot de passe
- OAuth providers (Google, GitHub, etc.)
- Validation en temps réel
- Gestion des erreurs
- 2FA support
- Responsive design

### SignUp
**Type :** Composant d'interface complet  
**Import :** `import { SignUp } from '@clerk/nextjs';`  
**Usage :** `<SignUp appearance={{ ... }} />`

**Définition :**
Interface complète d'inscription avec processus multi-étapes.

**Processus inclus :**
1. Saisie des informations (email, mot de passe, nom)
2. Validation des données
3. Envoi email de vérification
4. Saisie du code de vérification
5. Activation du compte

### UserButton
**Type :** Composant bouton avec menu  
**Import :** `import { UserButton } from '@clerk/nextjs';`  
**Usage :** `<UserButton afterSignOutUrl="/" />`

**Définition :**
Bouton de profil utilisateur avec avatar et menu déroulant.

**Props :**
- `afterSignOutUrl` - URL de redirection après déconnexion
- `showName` - Afficher le nom à côté de l'avatar
- `appearance` - Personnalisation de l'apparence

**Contenu du menu :**
- Nom et email de l'utilisateur
- Lien "Gérer le compte"
- Bouton "Se déconnecter"

### UserProfile
**Type :** Composant d'interface complet  
**Import :** `import { UserProfile } from '@clerk/nextjs';`  
**Usage :** `<UserProfile appearance={{ ... }} />`

**Définition :**
Interface complète de gestion du profil utilisateur avec plusieurs onglets.

**Onglets inclus :**
- Profil : Modification nom, prénom, photo
- Compte : Gestion des emails
- Sécurité : Mot de passe, 2FA
- Sessions : Gestion des sessions actives

**Exigence importante :**
Doit être placé dans une route catch-all : `[[...user-profile]]`

### SignInButton
**Type :** Composant bouton personnalisable  
**Import :** `import { SignInButton } from '@clerk/nextjs';`  
**Usage :** `<SignInButton mode="modal">{children}</SignInButton>`

**Définition :**
Bouton personnalisable qui déclenche le processus de connexion.

**Props :**
- `mode` - "modal" (popup) ou "redirect" (redirection)
- `redirectUrl` - URL après connexion
- `children` - Contenu du bouton

**Modes :**
```tsx
// Mode modal (popup)
<SignInButton mode="modal">
  <button>Se connecter</button>
</SignInButton>

// Mode redirect (redirection)
<SignInButton mode="redirect">
  <button>Se connecter</button>
</SignInButton>
```

---

## Concepts Next.js

### App Router
**Définition :**
Système de routage de Next.js 13+ basé sur la structure des fichiers dans le dossier `app/`.

**Structure :**
```
app/
├── page.tsx          # Route /
├── layout.tsx        # Layout pour toutes les routes
├── dashboard/
│   └── page.tsx      # Route /dashboard
└── profile/
    └── page.tsx      # Route /profile
```

**Fichiers spéciaux :**
- `page.tsx` - Page de la route
- `layout.tsx` - Layout partagé
- `error.tsx` - Page d'erreur
- `loading.tsx` - Page de chargement
- `not-found.tsx` - Page 404

### Route Catch-All
**Syntaxe :** `[[...param]]` ou `[...param]`  
**Définition :**
Route qui capture plusieurs segments d'URL.

**Différences :**
```tsx
[...param]     // Obligatoire : /user/123/edit
[[...param]]   // Optionnel : /user ET /user/123/edit
```

**Exemple avec Clerk :**
```
user-profile/[[...user-profile]]/page.tsx
```
Capture :
- `/user-profile`
- `/user-profile/account`
- `/user-profile/security`

### Composant Serveur
**Définition :**
Composant React qui s'exécute côté serveur, pas côté client.

**Caractéristiques :**
- Pas d'état React (useState, useEffect)
- Peut être async/await
- Accès direct aux APIs
- Rendu côté serveur

**Exemple :**
```tsx
// Composant serveur
export default async function Dashboard() {
  const user = await currentUser(); // OK
  return <div>{user?.firstName}</div>;
}
```

### Composant Client
**Syntaxe :** `'use client';`  
**Définition :**
Composant React qui s'exécute côté client (navigateur).

**Caractéristiques :**
- Peut utiliser les hooks React
- Interactivité (onClick, onChange)
- État local (useState)
- Effets (useEffect)

**Exemple :**
```tsx
'use client';

export default function InteractiveButton() {
  const [count, setCount] = useState(0); // OK
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Middleware Next.js
**Fichier :** `middleware.ts` (racine du projet)  
**Définition :**
Fonction qui s'exécute avant chaque requête pour modifier la réponse.

**Cas d'usage :**
- Authentification
- Redirections
- Réécriture d'URLs
- Ajout de headers

**Structure :**
```tsx
export function middleware(request: NextRequest) {
  // Logique du middleware
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

---

## Middleware et Sécurité

### auth.protect()
**Type :** Méthode asynchrone  
**Usage :** `await auth.protect();`  
**Définition :**
Vérifie l'authentification et redirige vers /sign-in si non connecté.

**Fonctionnement :**
1. Vérifie la présence d'un token JWT
2. Valide le token auprès de Clerk
3. Si valide : continue
4. Si invalide : redirige vers /sign-in

**Usage avancé :**
```tsx
// Protection simple
await auth.protect();

// Protection avec condition
await auth.protect(async (has) => {
  return has({ role: 'admin' });
});
```

### JWT (JSON Web Token)
**Définition :**
Token de sécurité qui contient les informations d'authentification.

**Structure :**
```
header.payload.signature
```

**Contenu typique :**
```json
{
  "sub": "user_2abcd1234efgh5678",
  "iat": 1640995200,
  "exp": 1640998800,
  "iss": "https://clerk.com"
}
```

**Usage dans l'application :**
- Stocké dans les cookies
- Vérifié automatiquement par Clerk
- Utilisé pour les appels API

### Session
**Définition :**
Période d'activité authentifiée d'un utilisateur.

**Propriétés :**
- ID unique de session
- Date de création
- Date d'expiration
- Statut (active, expired, revoked)

**Isolation :**
Chaque utilisateur a sa propre session complètement isolée.

---

## ShadCN UI

### cn()
**Import :** `import { cn } from '@/lib/utils';`  
**Usage :** `className={cn("base-class", condition && "conditional-class")}`

**Définition :**
Fonction utilitaire qui combine et optimise les classes CSS.

**Fonctionnement :**
```tsx
// Combine clsx et tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Exemple :**
```tsx
<div className={cn(
  "px-4 py-2",
  isActive && "bg-blue-500",
  className
)}>
```

### Button
**Import :** `import { Button } from '@/components/ui/button';`  
**Props :** `variant`, `size`, `className`, etc.

**Variants disponibles :**
- `default` - Bouton principal bleu
- `destructive` - Bouton rouge (danger)
- `outline` - Bouton avec bordure
- `secondary` - Bouton gris secondaire
- `ghost` - Bouton transparent
- `link` - Apparence de lien

**Sizes :**
- `default` - Taille standard
- `sm` - Petit
- `lg` - Grand
- `icon` - Carré pour icônes

### Card
**Import :** `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';`

**Hiérarchie :**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu principal
  </CardContent>
</Card>
```

---

## Types et Interfaces

### User (Type Clerk)
**Définition :**
Interface TypeScript représentant un utilisateur Clerk.

**Propriétés principales :**
```typescript
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: EmailAddress[];
  phoneNumbers: PhoneNumber[];
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number | null;
  publicMetadata: Record<string, any>;
  privateMetadata: Record<string, any>;
}
```

### EmailAddress
**Définition :**
Interface pour les adresses email d'un utilisateur.

```typescript
interface EmailAddress {
  id: string;
  emailAddress: string;
  verification: {
    status: 'verified' | 'unverified';
    strategy: string;
  };
}
```

### Metadata
**Types :**
- `publicMetadata` - Accessible côté client
- `privateMetadata` - Seulement côté serveur
- `unsafeMetadata` - Modifiable côté client

**Usage :**
```tsx
// Lecture
user.publicMetadata.role

// Écriture (côté serveur seulement)
await clerkClient.users.updateUser(userId, {
  publicMetadata: { role: 'admin' }
});
```

---

## Variables d'Environnement

### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
**Type :** Variable publique  
**Format :** `pk_test_...` ou `pk_live_...`  
**Usage :** Clé publique pour initialiser Clerk côté client

### CLERK_SECRET_KEY
**Type :** Variable privée  
**Format :** `sk_test_...` ou `sk_live_...`  
**Usage :** Clé secrète pour les opérations côté serveur

### NEXT_PUBLIC_CLERK_SIGN_IN_URL
**Valeur :** `/sign-in`  
**Usage :** URL de la page de connexion

### NEXT_PUBLIC_CLERK_SIGN_UP_URL
**Valeur :** `/sign-up`  
**Usage :** URL de la page d'inscription

### NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
**Valeur :** `/dashboard`  
**Usage :** URL de redirection après connexion réussie

### NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
**Valeur :** `/dashboard`  
**Usage :** URL de redirection après inscription réussie

---

## Classes CSS Tailwind

### Layout et Espacement

#### min-h-screen
**Définition :** `min-height: 100vh;`  
**Usage :** Hauteur minimum égale à la hauteur de l'écran

#### container
**Définition :** Largeur responsive avec marges automatiques  
**Breakpoints :**
- `sm` : max-width 640px
- `md` : max-width 768px
- `lg` : max-width 1024px
- `xl` : max-width 1280px

#### mx-auto
**Définition :** `margin-left: auto; margin-right: auto;`  
**Usage :** Centrage horizontal

#### px-4, py-8
**Définition :**
- `px-4` : padding horizontal 16px
- `py-8` : padding vertical 32px

#### gap-4, gap-6
**Définition :**
- `gap-4` : gap 16px (flexbox/grid)
- `gap-6` : gap 24px

### Flexbox

#### flex
**Définition :** `display: flex;`

#### justify-between
**Définition :** `justify-content: space-between;`  
**Usage :** Espacement maximum entre les éléments

#### justify-center
**Définition :** `justify-content: center;`  
**Usage :** Centrage horizontal des éléments flex

#### items-center
**Définition :** `align-items: center;`  
**Usage :** Centrage vertical des éléments flex

### Grid

#### grid
**Définition :** `display: grid;`

#### md:grid-cols-3
**Définition :** `grid-template-columns: repeat(3, minmax(0, 1fr));`  
**Usage :** 3 colonnes sur écrans moyens (≥768px)

#### lg:grid-cols-3
**Définition :** 3 colonnes sur écrans larges (≥1024px)

### Couleurs et Arrière-plans

#### bg-gradient-to-br
**Définition :** `background-image: linear-gradient(to bottom right, ...);`  
**Usage :** Dégradé diagonal

#### from-blue-50, to-indigo-100
**Définition :** Couleurs de début et fin du dégradé  
**Couleurs :**
- `blue-50` : #eff6ff
- `indigo-100` : #e0e7ff

#### dark:from-gray-900
**Définition :** Couleur en mode sombre  
**Usage :** `dark:` préfixe pour le thème sombre

### Texte

#### text-3xl
**Définition :** `font-size: 1.875rem; line-height: 2.25rem;` (30px)

#### text-5xl
**Définition :** `font-size: 3rem; line-height: 1;` (48px)

#### font-bold
**Définition :** `font-weight: 700;`

#### text-center
**Définition :** `text-align: center;`

#### text-gray-900
**Définition :** `color: #111827;`

#### dark:text-white
**Définition :** `color: #ffffff;` en mode sombre

### Responsive Design

#### Breakpoints Tailwind
```css
sm:   min-width: 640px
md:   min-width: 768px  
lg:   min-width: 1024px
xl:   min-width: 1280px
2xl:  min-width: 1536px
```

#### Usage
```tsx
className="grid md:grid-cols-2 lg:grid-cols-3"
// Mobile: 1 colonne
// Tablet: 2 colonnes  
// Desktop: 3 colonnes
```

---

## Concepts d'Authentification

### Authentification vs Autorisation
**Authentification :**
- "Qui êtes-vous ?" 
- Vérification de l'identité
- Login/password, OAuth, biométrie

**Autorisation :**
- "Que pouvez-vous faire ?"
- Vérification des permissions
- Rôles, permissions, ACL

### OAuth (Open Authorization)
**Définition :**
Protocole d'autorisation qui permet à une application d'accéder aux ressources d'un utilisateur sans connaître ses identifiants.

**Flux OAuth :**
1. Redirection vers le provider (Google, GitHub)
2. Authentification utilisateur
3. Autorisation d'accès
4. Retour avec code d'autorisation
5. Échange code contre token d'accès
6. Accès aux ressources

### 2FA (Two-Factor Authentication)
**Définition :**
Méthode d'authentification qui requiert deux facteurs différents.

**Facteurs :**
1. **Quelque chose que vous savez** (mot de passe)
2. **Quelque chose que vous avez** (téléphone, app)
3. **Quelque chose que vous êtes** (biométrie)

### CSRF (Cross-Site Request Forgery)
**Définition :**
Attaque qui force un utilisateur authentifié à exécuter des actions non désirées.

**Protection :**
- Tokens CSRF uniques
- Vérification de l'origine
- SameSite cookies

### XSS (Cross-Site Scripting)
**Définition :**
Injection de code JavaScript malveillant dans une application web.

**Types :**
- **Reflected XSS** : Script dans l'URL
- **Stored XSS** : Script stocké en base
- **DOM XSS** : Manipulation du DOM

**Protection :**
- Sanitisation des inputs
- Échappement des outputs
- Content Security Policy (CSP)

---

## Performance et Optimisation

### Server-Side Rendering (SSR)
**Définition :**
Rendu des pages côté serveur avant envoi au navigateur.

**Avantages :**
- SEO optimisé
- Chargement initial rapide
- Contenu visible immédiatement

**Dans Next.js :**
```tsx
// Composant serveur par défaut
export default async function Page() {
  const data = await fetchData(); // Exécuté côté serveur
  return <div>{data}</div>;
}
```

### Client-Side Rendering (CSR)
**Définition :**
Rendu des pages côté client (navigateur) avec JavaScript.

**Usage :**
```tsx
'use client';

export default function ClientComponent() {
  // Rendu côté client
}
```

### Hydration
**Définition :**
Processus où React "attache" les event listeners au HTML pré-rendu côté serveur.

**Flux :**
1. Serveur envoie HTML statique
2. Navigateur affiche le contenu
3. JavaScript se charge
4. React hydrate les composants
5. Interactivité devient disponible

### Core Web Vitals
**Métriques de performance :**

#### LCP (Largest Contentful Paint)
**Définition :** Temps de chargement du plus gros élément visible  
**Objectif :** < 2.5 secondes

#### FID (First Input Delay)
**Définition :** Délai avant la première interaction  
**Objectif :** < 100 millisecondes

#### CLS (Cumulative Layout Shift)
**Définition :** Stabilité visuelle de la page  
**Objectif :** < 0.1

### Lazy Loading
**Définition :**
Chargement différé des ressources jusqu'à ce qu'elles soient nécessaires.

**Exemples :**
```tsx
// Images
<img loading="lazy" src="image.jpg" />

// Composants
const LazyComponent = lazy(() => import('./Component'));
```

### Code Splitting
**Définition :**
Division du code en plusieurs bundles pour optimiser le chargement.

**Next.js automatique :**
- Chaque page = bundle séparé
- Chargement à la demande
- Pré-chargement intelligent

Ce glossaire couvre tous les termes techniques essentiels utilisés dans l'application d'authentification avec Clerk et Next.js.
