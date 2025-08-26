import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AuthModeSwitchProps {
  onSupabaseSelect: () => void
  onReplitSelect: () => void
}

export function AuthModeSwitch({ onSupabaseSelect, onReplitSelect }: AuthModeSwitchProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">CalAI</h1>
          <p className="text-slate-600">Choisissez votre mode de connexion</p>
        </div>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSupabaseSelect}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Email / Google</CardTitle>
              <Badge variant="secondary">Recommandé</Badge>
            </div>
            <CardDescription>
              Connexion avec votre email ou compte Google
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Authentification sécurisée</li>
              <li>• Support Google OAuth</li>
              <li>• Gestion des mots de passe</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onReplitSelect}>
          <CardHeader>
            <CardTitle className="text-xl">Replit Auth</CardTitle>
            <CardDescription>
              Connexion avec votre compte Replit existant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Accès rapide depuis Replit</li>
              <li>• Intégration développeur</li>
              <li>• Session partagée</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}