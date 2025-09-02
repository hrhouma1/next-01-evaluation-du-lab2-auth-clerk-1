import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SetupInstructions() {
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Configuration Requise</CardTitle>
        <CardDescription>
          Configurez Clerk pour activer l'authentification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Etapes de configuration :
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-700 dark:text-yellow-300 text-sm">
              <li>Creez un compte sur <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" className="underline">Clerk.com</a></li>
              <li>Creez une nouvelle application</li>
              <li>Copiez vos cles API</li>
              <li>Creez un fichier `.env.local` avec vos cles</li>
              <li>Redemarrez l'application</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Contenu du fichier .env.local :</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_votre_cle_ici
CLERK_SECRET_KEY=sk_test_votre_cle_ici

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`}
            </pre>
          </div>

          <div className="text-center">
            <Button asChild>
              <a href="https://clerk.com" target="_blank" rel="noopener noreferrer">
                Aller sur Clerk.com
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
