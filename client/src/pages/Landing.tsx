import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, BarChart3, Smartphone, Shield } from "lucide-react";
import { CalAILogo } from "@/components/CalAILogo";

export default function Landing() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gradient-to-br from-calai-primary via-calai-primaryDark to-calai-secondary">
      {/* Hero Section */}
      <div className="px-6 pt-12 pb-8 text-center text-white">
        <div className="flex justify-center mx-auto mb-6">
          <CalAILogo size={64} />
        </div>
        
        <h1 className="text-4xl font-bold mb-4" data-testid="text-hero-title">
          CalAI
        </h1>
        
        <p className="text-xl text-cyan-100 mb-8 leading-relaxed">
          AI-powered nutrition tracking. Just snap a photo of your food and get instant calorie and macro analysis.
        </p>
        
        <div className="space-y-3">
          <Button 
            className="w-full bg-white text-calai-primary hover:bg-cyan-50 font-semibold py-4 text-lg"
            onClick={() => window.location.href = "/login"}
            data-testid="button-login-supabase"
          >
            Email / Google - Get Started!
          </Button>
          
          <Button 
            variant="outline"
            className="w-full bg-transparent border-white text-white hover:bg-white hover:text-calai-primary font-semibold py-3"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login-replit"
          >
            Replit Developer Access
          </Button>
        </div>
        
        <p className="text-sm text-cyan-200 mt-3">
          3 free scans daily • No credit card required
        </p>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold mb-1">Instant AI Analysis</h3>
                <p className="text-sm text-cyan-100">
                  Get nutrition info in seconds, not minutes of manual entry
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold mb-1">Smart Goals</h3>
                <p className="text-sm text-cyan-100">
                  Personalized calorie and macro targets based on your goals
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold mb-1">Progress Tracking</h3>
                <p className="text-sm text-cyan-100">
                  Beautiful charts and insights to keep you motivated
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 pb-8 text-center">
        <p className="text-cyan-200 text-sm mb-4">
          Join thousands of users who've simplified their nutrition tracking
        </p>
        <div className="flex justify-center space-x-6 text-white/80">
          <div className="text-center">
            <div className="text-2xl font-bold">50K+</div>
            <div className="text-xs">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">1M+</div>
            <div className="text-xs">Foods Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">4.8★</div>
            <div className="text-xs">App Rating</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12">
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">
              Ready to transform your nutrition?
            </h3>
            <p className="text-cyan-100 text-sm mb-4">
              Start your free account and get 3 daily scans. Upgrade anytime for unlimited access.
            </p>
            <Button 
              className="w-full bg-calai-secondary hover:bg-green-600 text-white font-semibold"
              onClick={() => window.location.href = "/login"}
              data-testid="button-cta-login"
            >
              Start Free Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}