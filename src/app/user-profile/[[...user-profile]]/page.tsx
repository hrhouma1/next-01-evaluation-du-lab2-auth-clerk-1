import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion du Profil
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Modifiez vos informations personnelles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline">Aperçu Profil</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Accueil</Button>
            </Link>
          </div>
        </header>

        {/* UserProfile Component */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <UserProfile 
              appearance={{
                elements: {
                  card: 'shadow-none border-0',
                  navbar: 'bg-gray-50 dark:bg-gray-700',
                  navbarMobileMenuButton: 'text-gray-700 dark:text-gray-200',
                  headerTitle: 'text-xl font-semibold text-gray-900 dark:text-white',
                  headerSubtitle: 'text-gray-600 dark:text-gray-400',
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
