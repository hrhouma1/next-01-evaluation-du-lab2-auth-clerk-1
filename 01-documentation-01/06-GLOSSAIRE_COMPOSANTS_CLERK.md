# Glossaire des Composants Clerk - Guide Détaillé

## Introduction

Ce glossaire explique en détail tous les composants Clerk utilisés dans l'application, leur rôle, leur fonctionnement et leurs cas d'usage.

## Composants d'Interface Utilisateur

### SignIn

#### Définition
Le composant `<SignIn />` est une interface complète de connexion fournie par Clerk.

#### Ce que c'est
```tsx
import { SignIn } from '@clerk/nextjs';

<SignIn />
```

#### Ce qu'il fait
- Affiche un formulaire de connexion complet
- Gère la validation des champs (email/mot de passe)
- Affiche les messages d'erreur automatiquement
- Gère la soumission du formulaire
- Redirige l'utilisateur après connexion réussie
- Propose des options de connexion alternatives (Google, GitHub, etc.)

#### Fonctionnalités incluses
- Champ email avec validation
- Champ mot de passe avec masquage/affichage
- Bouton "Se souvenir de moi"
- Lien "Mot de passe oublié"
- Messages d'erreur contextuels
- Loading states pendant la connexion
- Responsive design automatique

#### Exemple d'utilisation
```tsx
<SignIn 
  appearance={{
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
      card: 'shadow-lg'
    }
  }}
  redirectUrl="/dashboard"
/>
```

#### Personnalisation possible
- Couleurs et styles via `appearance`
- URL de redirection après connexion
- Champs supplémentaires
- Logo personnalisé
- Textes personnalisés

### SignUp

#### Définition
Le composant `<SignUp />` est une interface complète d'inscription fournie par Clerk.

#### Ce que c'est
```tsx
import { SignUp } from '@clerk/nextjs';

<SignUp />
```

#### Ce qu'il fait
- Affiche un formulaire d'inscription complet
- Gère la création de nouveau compte
- Valide les données saisies (format email, force du mot de passe)
- Envoie les emails de vérification automatiquement
- Gère les étapes d'inscription (email → vérification → finalisation)
- Redirige après inscription réussie

#### Fonctionnalités incluses
- Champs obligatoires (email, mot de passe)
- Champs optionnels (prénom, nom, téléphone)
- Validation en temps réel
- Vérification d'email automatique
- Indicateur de force du mot de passe
- Gestion des doublons (email déjà utilisé)
- Processus en plusieurs étapes

#### Flux d'inscription typique
1. Utilisateur saisit email et mot de passe
2. Clerk vérifie la disponibilité de l'email
3. Envoi d'un code de vérification par email
4. Utilisateur saisit le code reçu
5. Finalisation du compte avec informations complémentaires
6. Redirection vers l'application

#### Exemple d'utilisation
```tsx
<SignUp 
  appearance={{
    elements: {
      formButtonPrimary: 'bg-green-600 hover:bg-green-700'
    }
  }}
  redirectUrl="/welcome"
/>
```

### UserButton

#### Définition
Le composant `<UserButton />` est un bouton de profil utilisateur avec menu déroulant.

#### Ce que c'est
```tsx
import { UserButton } from '@clerk/nextjs';

<UserButton />
```

#### Ce qu'il affiche
- Avatar de l'utilisateur (photo de profil ou initiales)
- Nom de l'utilisateur au survol
- Menu déroulant au clic

#### Contenu du menu déroulant
- Nom complet de l'utilisateur
- Adresse email principale
- Lien "Gérer le compte" → vers UserProfile
- Bouton "Se déconnecter"
- Liens personnalisés (optionnels)

#### Fonctionnalités automatiques
- Récupération automatique des données utilisateur
- Gestion de la déconnexion
- Redirection après déconnexion
- Responsive design
- Accessibilité (navigation clavier, lecteurs d'écran)

#### Exemple d'utilisation
```tsx
<UserButton 
  afterSignOutUrl="/"
  appearance={{
    elements: {
      avatarBox: 'w-10 h-10'
    }
  }}
/>
```

#### Options de configuration
- `afterSignOutUrl` : URL de redirection après déconnexion
- `showName` : Afficher le nom à côté de l'avatar
- `appearance` : Personnalisation visuelle
- Actions personnalisées dans le menu

### UserProfile

#### Définition
Le composant `<UserProfile />` est une interface complète de gestion du profil utilisateur.

#### Ce que c'est
```tsx
import { UserProfile } from '@clerk/nextjs';

<UserProfile />
```

#### Ce qu'il contient
Interface avec plusieurs onglets :

##### Onglet "Profil"
- Modification du prénom et nom
- Changement de la photo de profil
- Mise à jour du nom d'utilisateur
- Gestion des informations personnelles

##### Onglet "Compte"
- Gestion des adresses email
- Ajout/suppression d'emails secondaires
- Définition de l'email principal
- Vérification des emails

##### Onglet "Sécurité"
- Changement de mot de passe
- Configuration de l'authentification à deux facteurs (2FA)
- Gestion des méthodes de connexion
- Historique des connexions

##### Onglet "Sessions"
- Liste des sessions actives
- Informations sur les appareils connectés
- Déconnexion à distance
- Gestion des tokens d'accès

#### Pourquoi une route catch-all
Le composant UserProfile génère ses propres sous-routes :
- `/user-profile/` (page principale)
- `/user-profile/account` (gestion du compte)
- `/user-profile/security` (paramètres de sécurité)
- `/user-profile/sessions` (gestion des sessions)

C'est pourquoi il faut une route `[[...user-profile]]` pour capturer toutes ces sous-routes.

#### Exemple d'utilisation
```tsx
<UserProfile 
  appearance={{
    elements: {
      navbar: 'bg-gray-50',
      formButtonPrimary: 'bg-blue-600'
    }
  }}
/>
```

## Composants Conditionnels

### SignedIn

#### Définition
Le composant `<SignedIn>` affiche son contenu uniquement si l'utilisateur est connecté.

#### Ce que c'est
```tsx
import { SignedIn } from '@clerk/nextjs';

<SignedIn>
  <p>Contenu visible seulement si connecté</p>
</SignedIn>
```

#### Comment ça fonctionne
- Vérifie automatiquement l'état de connexion
- Affiche le contenu enfant si utilisateur authentifié
- Cache le contenu si utilisateur non connecté
- Réactif : se met à jour automatiquement lors des changements d'état

#### Cas d'usage typiques
- Navigation pour utilisateurs connectés
- Contenu protégé sur une page publique
- Boutons d'action réservés aux membres
- Informations personnalisées

#### Exemple pratique
```tsx
<header>
  <h1>Mon Site</h1>
  <SignedIn>
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/profile">Profil</Link>
      <UserButton />
    </nav>
  </SignedIn>
</header>
```

### SignedOut

#### Définition
Le composant `<SignedOut>` affiche son contenu uniquement si l'utilisateur n'est PAS connecté.

#### Ce que c'est
```tsx
import { SignedOut } from '@clerk/nextjs';

<SignedOut>
  <p>Contenu visible seulement si NON connecté</p>
</SignedOut>
```

#### Comment ça fonctionne
- Vérifie automatiquement l'état de connexion
- Affiche le contenu enfant si utilisateur NON authentifié
- Cache le contenu si utilisateur connecté
- Réactif : se met à jour automatiquement

#### Cas d'usage typiques
- Boutons de connexion/inscription
- Messages d'accueil pour visiteurs
- Appels à l'action pour s'inscrire
- Contenu marketing

#### Exemple pratique
```tsx
<header>
  <h1>Mon Site</h1>
  <SignedOut>
    <nav>
      <Link href="/sign-in">Se connecter</Link>
      <Link href="/sign-up">S'inscrire</Link>
    </nav>
  </SignedOut>
</header>
```

### Utilisation Combinée SignedIn / SignedOut

#### Exemple complet
```tsx
function Navigation() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Mon Application</h1>
      
      <SignedOut>
        <div className="space-x-4">
          <Link href="/sign-in">
            <Button variant="outline">Se connecter</Button>
          </Link>
          <Link href="/sign-up">
            <Button>S'inscrire</Button>
          </Link>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/profile">Profil</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </header>
  );
}
```

## Composants d'Action

### SignInButton

#### Définition
Le composant `<SignInButton>` est un bouton personnalisable qui déclenche la connexion.

#### Ce que c'est
```tsx
import { SignInButton } from '@clerk/nextjs';

<SignInButton>
  <button>Se connecter</button>
</SignInButton>
```

#### Modes de fonctionnement

##### Mode Modal (par défaut)
```tsx
<SignInButton mode="modal">
  <Button>Se connecter</Button>
</SignInButton>
```
- Ouvre une popup de connexion
- L'utilisateur reste sur la même page
- Fermeture automatique après connexion

##### Mode Redirect
```tsx
<SignInButton mode="redirect">
  <Button>Se connecter</Button>
</SignInButton>
```
- Redirige vers la page de connexion (/sign-in)
- Navigation complète
- URL change

#### Personnalisation
- Peut envelopper n'importe quel élément HTML
- Styles entièrement personnalisables
- Événements onClick gérés automatiquement

### SignUpButton

#### Définition
Le composant `<SignUpButton>` est un bouton personnalisable qui déclenche l'inscription.

#### Ce que c'est
```tsx
import { SignUpButton } from '@clerk/nextjs';

<SignUpButton>
  <button>S'inscrire</button>
</SignUpButton>
```

#### Fonctionnement identique à SignInButton
- Mode modal ou redirect
- Personnalisation complète
- Gestion automatique des événements

#### Exemple avec ShadCN
```tsx
<SignUpButton mode="modal">
  <Button size="lg" className="bg-green-600">
    Créer un compte gratuit
  </Button>
</SignUpButton>
```

## Hooks et Fonctions

### useUser (côté client)

#### Définition
Hook React qui fournit les informations de l'utilisateur côté client.

#### Ce que c'est
```tsx
import { useUser } from '@clerk/nextjs';

function MonComposant() {
  const { user, isLoaded, isSignedIn } = useUser();
}
```

#### Valeurs retournées
- `user` : Objet utilisateur complet (null si non connecté)
- `isLoaded` : Boolean indiquant si les données sont chargées
- `isSignedIn` : Boolean indiquant si l'utilisateur est connecté

#### États possibles
```tsx
if (!isLoaded) {
  return <div>Chargement...</div>;
}

if (!isSignedIn) {
  return <div>Non connecté</div>;
}

return <div>Bonjour {user.firstName}!</div>;
```

#### Données utilisateur disponibles
```tsx
const { user } = useUser();

// Informations de base
user.id                    // ID unique Clerk
user.firstName             // Prénom
user.lastName              // Nom
user.username              // Nom d'utilisateur
user.imageUrl              // URL de l'avatar

// Emails
user.emailAddresses[0].emailAddress  // Email principal
user.primaryEmailAddressId           // ID de l'email principal

// Métadonnées
user.publicMetadata        // Données publiques personnalisées
user.privateMetadata       // Données privées (lecture seule côté client)

// Dates
user.createdAt             // Date de création du compte
user.updatedAt             // Dernière mise à jour
user.lastSignInAt          // Dernière connexion
```

### currentUser (côté serveur)

#### Définition
Fonction serveur qui récupère l'utilisateur actuel dans les composants serveur.

#### Ce que c'est
```tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function MaPage() {
  const user = await currentUser();
}
```

#### Utilisation dans les composants serveur
```tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function Dashboard() {
  const user = await currentUser();
  
  if (!user) {
    return <div>Non connecté</div>;
  }
  
  return (
    <div>
      <h1>Bonjour {user.firstName}!</h1>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

#### Avantages côté serveur
- Pas de loading state nécessaire
- Données disponibles immédiatement au rendu
- Meilleur pour le SEO
- Performance optimisée

## Providers et Configuration

### ClerkProvider

#### Définition
Le composant `<ClerkProvider>` fournit le contexte Clerk à toute l'application.

#### Ce que c'est
```tsx
import { ClerkProvider } from '@clerk/nextjs';

<ClerkProvider>
  <App />
</ClerkProvider>
```

#### Où le placer
Dans le layout racine de l'application (`src/app/layout.tsx`) :

```tsx
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

#### Ce qu'il fait
- Initialise la connexion avec les serveurs Clerk
- Fournit l'état d'authentification à tous les composants enfants
- Gère les tokens et sessions automatiquement
- Permet l'utilisation des hooks comme useUser()

#### Configuration possible
```tsx
<ClerkProvider 
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  appearance={{
    baseTheme: 'dark',
    variables: {
      colorPrimary: '#3b82f6'
    }
  }}
>
  <App />
</ClerkProvider>
```

## Middleware et Protection

### clerkMiddleware

#### Définition
Fonction qui crée un middleware Next.js intégré avec Clerk pour protéger les routes.

#### Ce que c'est
```tsx
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((auth, req) => {
  // Logique de protection
});
```

#### Comment l'utiliser
```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### createRouteMatcher

#### Définition
Fonction utilitaire qui crée un matcher pour identifier les routes à protéger.

#### Ce que c'est
```tsx
import { createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',  // Protège /dashboard et toutes ses sous-routes
  '/admin(.*)',      // Protège /admin et toutes ses sous-routes
  '/profile'         // Protège exactement /profile
]);
```

#### Syntaxe des patterns
- `/dashboard` : Exactement cette route
- `/dashboard(.*)` : Cette route et toutes ses sous-routes
- `/api/(.*)` : Toutes les routes API
- `/(dashboard|profile)(.*)` : Plusieurs routes avec sous-routes

### auth.protect()

#### Définition
Méthode qui vérifie l'authentification et redirige si nécessaire.

#### Ce que c'est
```tsx
await auth.protect();
```

#### Ce qu'elle fait
1. Vérifie si l'utilisateur est connecté
2. Si oui : laisse continuer la requête
3. Si non : redirige automatiquement vers /sign-in
4. Gère les redirections de retour après connexion

#### Utilisation avancée avec conditions
```tsx
await auth.protect(async (has) => {
  return has({ role: 'admin' });
});
```

## Concepts Avancés

### Routes Catch-All

#### Pourquoi nécessaires
Certains composants Clerk (comme UserProfile) génèrent leurs propres sous-routes :
- `/user-profile/` (accueil)
- `/user-profile/account` (gestion compte)
- `/user-profile/security` (sécurité)

#### Syntaxe Next.js
- `[...param]` : Catch-all obligatoire (au moins un segment)
- `[[...param]]` : Catch-all optionnel (zéro ou plusieurs segments)

#### Exemple concret
```
/user-profile/[[...user-profile]]/page.tsx
```

Capture :
- `/user-profile` ✓
- `/user-profile/account` ✓
- `/user-profile/security` ✓
- `/user-profile/n/importe/quoi` ✓

### Sessions et Tokens

#### Comment ça fonctionne
1. Utilisateur se connecte via SignIn
2. Clerk génère un token JWT sécurisé
3. Token stocké dans les cookies du navigateur
4. Chaque requête inclut automatiquement ce token
5. Middleware vérifie la validité du token
6. Composants récupèrent les données utilisateur via ce token

#### Sécurité automatique
- Tokens avec expiration automatique
- Rotation des tokens transparente
- Chiffrement des données sensibles
- Protection contre les attaques CSRF

## Exemples d'Usage Complets

### Page d'Accueil avec Authentification
```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div>
      <header className="flex justify-between p-4">
        <h1>Mon Site</h1>
        
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Se connecter</Button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>
      
      <main>
        <SignedOut>
          <h2>Bienvenue visiteur!</h2>
          <p>Inscrivez-vous pour accéder à plus de fonctionnalités.</p>
        </SignedOut>
        
        <SignedIn>
          <h2>Bienvenue membre!</h2>
          <p>Accédez à votre dashboard personnalisé.</p>
        </SignedIn>
      </main>
    </div>
  );
}
```

### Dashboard Protégé
```tsx
import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Dashboard() {
  const user = await currentUser();
  
  // Le middleware garantit que user ne sera jamais null ici
  
  return (
    <div>
      <h1>Dashboard de {user.firstName}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Vos Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {user.emailAddresses[0].emailAddress}</p>
          <p>Membre depuis: {new Date(user.createdAt).toLocaleDateString()}</p>
          <p>Dernière connexion: {new Date(user.lastSignInAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Composant Client avec États
```tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function UserStatus() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) {
    return <div>Chargement des données utilisateur...</div>;
  }
  
  if (!isSignedIn) {
    return (
      <div>
        <p>Vous n'êtes pas connecté</p>
        <Button>Se connecter</Button>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Bonjour {user.firstName}!</h3>
      <p>Vous êtes connecté avec l'email: {user.emailAddresses[0].emailAddress}</p>
      <Button onClick={() => console.log('Action utilisateur')}>
        Action Personnalisée
      </Button>
    </div>
  );
}
```

Ce glossaire couvre tous les composants Clerk essentiels avec des explications détaillées, des exemples pratiques et les cas d'usage typiques pour aider les étudiants à comprendre chaque élément de l'écosystème Clerk.
