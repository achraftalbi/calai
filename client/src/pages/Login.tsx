import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalAILogo } from '@/components/CalAILogo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Chrome, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { signInWithEmail, signInWithGoogle, loading, error } = useAuth();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signInWithEmail(email.trim());
    
    if (error) {
      toast({
        title: "Erreur d'authentification",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setIsEmailSent(true);
      toast({
        title: "Email envoyé !",
        description: "Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Erreur d'authentification",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calai-primary via-calai-primaryDark to-calai-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="flex justify-center mb-6">
              <CalAILogo size={48} />
            </div>
            <h2 className="text-xl font-semibold mb-4">Vérifiez votre email</h2>
            <p className="text-gray-600 mb-6">
              Nous avons envoyé un lien de connexion à <strong>{email}</strong>. 
              Cliquez sur le lien pour vous connecter automatiquement.
            </p>
            <Button 
              onClick={() => setIsEmailSent(false)} 
              variant="outline"
              className="w-full"
            >
              Utiliser une autre adresse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calai-primary via-calai-primaryDark to-calai-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CalAILogo size={48} />
          </div>
          <CardTitle className="text-2xl">Connexion à CalAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error.message}
            </div>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            variant="outline"
            data-testid="button-google-signin"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Chrome className="h-4 w-4 mr-2" />
            )}
            Continuer avec Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ou</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                data-testid="input-email"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full"
              data-testid="button-email-signin"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Connexion par email
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500 mt-6">
            En vous connectant, vous acceptez nos conditions d'utilisation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}