# Demo Authentification - Next.js + Clerk + ShadCN

Une demonstration d'authentification avec sessions utilisateur individuelles utilisant Next.js, Clerk et ShadCN UI.

## Fonctionnalites

- Authentification securisee avec Clerk
- Sessions utilisateur isolees
- Interface moderne avec ShadCN UI
- Dashboard personnalise pour chaque utilisateur
- Gestion de profil utilisateur
- Routes protegees
- Support du mode sombre

## Configuration

### 1. Installation des dependances

```bash
npm install
```

### 2. Configuration de Clerk

1. Creez un compte sur [Clerk](https://clerk.com)
2. Creez une nouvelle application
3. Copiez le fichier `env.example` vers `.env.local`
4. Remplacez les valeurs dans `.env.local` avec vos cles Clerk :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_votre_cle_publique_ici
CLERK_SECRET_KEY=sk_test_votre_cle_secrete_ici

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Lancement de l'application

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## Structure du projet

```
src/
├── app/
│   ├── dashboard/          # Dashboard utilisateur protege
│   ├── profile/            # Page de profil utilisateur
│   ├── sign-in/           # Page de connexion
│   ├── sign-up/           # Page d'inscription
│   ├── layout.tsx         # Layout principal avec ClerkProvider
│   └── page.tsx           # Page d'accueil
├── components/ui/         # Composants ShadCN UI
├── lib/                   # Utilitaires
└── middleware.ts          # Middleware de protection des routes
```

## Test des sessions multiples

Pour tester que chaque utilisateur a sa propre session :

1. **Session 1** : Connectez-vous avec un compte dans votre navigateur principal
2. **Session 2** : Ouvrez un navigateur prive/incognito
3. Creez un nouveau compte avec une adresse email differente
4. Connectez-vous avec ce nouveau compte
5. Comparez les dashboards - chaque utilisateur aura ses propres donnees

## Pages disponibles

- `/` - Page d'accueil avec authentification
- `/sign-in` - Page de connexion
- `/sign-up` - Page d'inscription
- `/dashboard` - Dashboard utilisateur (protege)
- `/profile` - Profil utilisateur (protege)

## Technologies utilisees

- **Next.js 15** - Framework React
- **TypeScript** - Typage statique
- **Clerk** - Service d'authentification
- **ShadCN UI** - Composants UI
- **Tailwind CSS** - Framework CSS
- **React** - Bibliotheque UI

## Securite

- Routes protegees par middleware
- Sessions utilisateur isolees
- Authentification securisee via Clerk
- Verification automatique des tokens
- Protection CSRF integree

## Personnalisation

L'application peut etre facilement personnalisee :

- Modifiez les composants dans `src/components/ui/`
- Ajustez le theme dans `src/app/globals.css`
- Configurez l'apparence de Clerk dans les composants
- Ajoutez de nouvelles routes protegees dans `src/middleware.ts`