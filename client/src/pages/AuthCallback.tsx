import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Gestion du flux implicite (hash #access_token=...)
        const hash = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          // Nettoyer le hash pour éviter de relancer
          window.history.replaceState({}, '', window.location.pathname)
          
          if (!error) {
            setLocation('/')
            return
          }
        }

        // Gestion du flux PKCE (query ?code=...)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            setLocation('/')
            return
          }
        }

        // Aucun code valide trouvé, retour à la connexion
        setLocation('/login')
      } catch (error) {
        console.error('Erreur callback OAuth:', error)
        setLocation('/login')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-calai-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg font-medium text-calai-primary">Connexion en cours...</p>
        <p className="text-sm text-slate-600 mt-2">Veuillez patienter</p>
      </div>
    </div>
  )
}