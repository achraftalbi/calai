import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/lib/supabase';

export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    // Mode natif : utiliser Custom Tab au lieu du navigateur externe
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'calai://auth',
        skipBrowserRedirect: true,
      },
    });
    
    if (error) throw error;

    // Ouvrir dans un Custom Tab (reste dans l'app)
    await Browser.open({ url: data.url! });
  } else {
    // Web : redirection normale vers callback
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
}

// Gérer le retour du deep link
export function attachAppUrlOpenListener(navigate: (path: string) => void) {
  App.addListener('appUrlOpen', async ({ url }) => {
    console.log('Deep link reçu:', url);
    
    // Exemple: calai://auth?code=... ou calai://auth#access_token=...
    if (url.startsWith('calai://auth')) {
      await Browser.close();

      const parsedUrl = new URL(url.replace('calai://auth', 'https://calai/auth'));
      const code = parsedUrl.searchParams.get('code');

      if (code) {
        // Flux PKCE/code
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          navigate('/');
          return;
        }
      }

      // Gestion du flux implicite (si jamais utilisé)
      const hash = new URLSearchParams(url.split('#')[1] || '');
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      
      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (!error) {
          navigate('/');
          return;
        }
      }
      
      // Retour à la connexion en cas d'erreur
      navigate('/login');
    }
  });
}