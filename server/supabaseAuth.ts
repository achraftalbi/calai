import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found - Supabase auth disabled')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Middleware to verify Supabase JWT token
export async function verifySupabaseAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    return next() // Skip if Supabase not configured
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Attach user to request object
    ;(req as any).supabaseUser = user
    next()
  } catch (error) {
    console.error('Supabase auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Helper to get user from either Replit or Supabase auth
export function getAuthenticatedUser(req: any) {
  // Return Supabase user if available
  if (req.supabaseUser) {
    return {
      id: req.supabaseUser.id,
      email: req.supabaseUser.email,
      username: req.supabaseUser.email,
      authType: 'supabase' as const
    }
  }

  // Fall back to Replit user
  if (req.user?.claims) {
    return {
      id: req.user.claims.sub,
      email: req.user.claims.email,
      username: req.user.claims.username,
      authType: 'replit' as const
    }
  }

  return null
}