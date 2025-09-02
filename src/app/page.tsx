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
