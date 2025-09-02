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
