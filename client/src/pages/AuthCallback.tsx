import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CalAILogo } from '@/components/CalAILogo';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setErrorMessage(error.message);
          // Redirect to login after showing error
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          // Redirect to main app
          setTimeout(() => navigate('/'), 1500);
        } else {
          setStatus('error');
          setErrorMessage('Session non trouvée');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setStatus('error');
        setErrorMessage('Erreur lors de l\'authentification');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-calai-primary via-calai-primaryDark to-calai-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
        <div className="flex justify-center mb-6">
          <CalAILogo size={48} />
        </div>
        
        {status === 'loading' && (
          <>
            <div className="animate-spin w-8 h-8 border-4 border-calai-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
            <p className="text-gray-600">Vérification de votre authentification</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Connexion réussie !</h2>
            <p className="text-gray-600">Redirection vers l'application...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erreur d'authentification</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
          </>
        )}
      </div>
    </div>
  );
}