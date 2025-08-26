import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);

  // Replit Auth (existing)
  const { data: replitUser, isLoading: isReplitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Supabase Auth
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setIsSupabaseLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Return Supabase auth if available, otherwise Replit auth
  if (supabaseUser) {
    return {
      user: supabaseUser,
      isLoading: isSupabaseLoading,
      isAuthenticated: !!supabaseUser,
      authType: 'supabase' as const
    };
  }

  return {
    user: replitUser,
    isLoading: isReplitLoading,
    isAuthenticated: !!replitUser,
    authType: 'replit' as const
  };
}