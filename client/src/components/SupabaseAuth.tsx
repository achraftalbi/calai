import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SupabaseAuthProps {
  redirectTo?: string
}

export function SupabaseAuth({ redirectTo }: SupabaseAuthProps) {
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
        <CardContent>
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
                  social_provider_text: 'Se connecter avec {{provider}}',
                  link_text: 'Vous n\'avez pas de compte ? Inscrivez-vous',
                  confirmation_text: 'Vérifiez votre email pour le lien de confirmation'
                },
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion...',
                  social_provider_text: 'Se connecter avec {{provider}}',
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
            providers={['google']}
            redirectTo={redirectTo}
            showLinks={true}
            magicLink={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}