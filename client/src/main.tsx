import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/lib/supabase';

// Deep-link handler pour l'authentification mobile
CapacitorApp.addListener('appUrlOpen', async (event: { url: string }) => {
  if (event.url.includes('/auth/callback') || event.url.includes('supabase')) {
    // Rediriger vers la page de callback pour gérer l'authentification
    window.location.href = '/auth/callback' + window.location.search + window.location.hash;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
