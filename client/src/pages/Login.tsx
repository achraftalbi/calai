import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { SupabaseAuth } from '@/components/SupabaseAuth'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [, setLocation] = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation('/')
    }
  }, [isAuthenticated, isLoading, setLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return <SupabaseAuth redirectTo={window.location.origin} />
}