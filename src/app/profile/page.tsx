import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

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

          {/* Lien vers la gestion du profil */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion du Profil</CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Utilisez la page dédiée pour modifier vos informations de profil
                </p>
                <Link href="/user-profile">
                  <Button className="w-full">
                    Modifier mon profil
                  </Button>
                </Link>
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
