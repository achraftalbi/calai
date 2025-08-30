import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { signInWithGoogle } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SupabaseAuthProps {
  redirectTo?: string
}

export function SupabaseAuth({ redirectTo }: SupabaseAuthProps) {
  // Utiliser l'URL Replit pour le callback au lieu de localhost
  const callbackUrl = `${window.location.origin}/auth/callback`

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Erreur connexion Google:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-700">
            Connexion à CalAI
          </CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à vos données nutritionnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bouton Google personnalisé pour mobile */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium py-3 flex items-center justify-center gap-3"
            data-testid="button-google-signin"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Se connecter avec Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* Formulaire email/mot de passe */}
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  background: '#16a34a',
                  color: 'white',
                  borderRadius: '8px',
                },
                anchor: {
                  color: '#16a34a',
                }
              }
            }}
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: "S'inscrire",
                  loading_button_label: 'Inscription...',
                  link_text: 'Vous n\'avez pas de compte ? Inscrivez-vous',
                  confirmation_text: 'Vérifiez votre email pour le lien de confirmation'
                },
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion...',
                  link_text: 'Vous avez déjà un compte ? Connectez-vous'
                },
                magic_link: {
                  email_input_label: 'Adresse email',
                  button_label: 'Envoyer le lien magique',
                  loading_button_label: 'Envoi du lien...',
                  link_text: 'Envoyer un lien magique par email',
                  confirmation_text: 'Vérifiez votre email pour le lien de connexion'
                },
                forgotten_password: {
                  email_label: 'Adresse email',
                  button_label: 'Envoyer les instructions',
                  loading_button_label: 'Envoi...',
                  link_text: 'Mot de passe oublié ?',
                  confirmation_text: 'Vérifiez votre email pour le lien de réinitialisation'
                }
              }
            }}
            theme="light"
            providers={[]} // Retirer Google d'ici car on a un bouton custom
            redirectTo={callbackUrl}
            showLinks={true}
            magicLink={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}