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
