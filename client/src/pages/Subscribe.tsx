import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import { 
  Crown, 
  Check, 
  Camera,
  Zap,
  Target,
  Star,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showPayment, setShowPayment] = useState(false);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planType: string) => {
      const response = await apiRequest('POST', '/api/subscription/create', { planType });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful!",
        description: data.message,
        duration: 5000,
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const isProUser = (user as any)?.subscriptionStatus === 'pro';
  const monthlyPrice = "9.99";
  const yearlyPrice = "39.99";
  const yearlyMonthlyPrice = "3.33";

  if (isProUser) {
    return (
      <div className="max-w-lg mx-auto pb-20 px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2" data-testid="text-subscription-title">You're a CalAI Pro!</h1>
          <p className="text-slate-600">You have access to all premium features</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-slate-700">Unlimited food scans</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-slate-700">Advanced nutrition analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-slate-700">Priority AI processing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/profile">
          <Button variant="outline" className="w-full" data-testid="button-manage-subscription">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
      </div>
    );
  }

  if (showPayment) {
    const amount = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;
    
    return (
      <div className="max-w-lg mx-auto pb-20 px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2" data-testid="text-payment-title">Complete Your Purchase</h1>
          <p className="text-slate-600">
            {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Plan - ${amount} USD
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <PayPalSubscriptionButton 
                planType={selectedPlan}
                amount={amount}
                onSuccess={() => {
                  // Redirect to profile or home after successful payment
                  setTimeout(() => {
                    window.location.href = '/profile';
                  }, 2000);
                }}
              />
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-slate-600 text-center mb-4">
                After payment completion, your subscription will be activated immediately.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowPayment(false)}
                data-testid="button-back-to-plans"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 px-4 py-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2" data-testid="text-upgrade-title">Upgrade to CalAI Pro</h1>
        <p className="text-slate-600">Get unlimited scans and premium features</p>
      </div>

      {/* Plan Selection */}
      <div className="space-y-4 mb-8">
        {/* Yearly Plan */}
        <Card 
          className={`cursor-pointer transition-all border-2 ${
            selectedPlan === 'yearly' 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setSelectedPlan('yearly')}
          data-testid="card-yearly-plan"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlan === 'yearly' 
                    ? 'bg-indigo-500 border-indigo-500' 
                    : 'border-slate-300'
                }`}>
                  {selectedPlan === 'yearly' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Yearly Plan</h3>
                  <p className="text-sm text-slate-600">${yearlyMonthlyPrice}/month billed yearly</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">${yearlyPrice}</div>
                <Badge className="bg-green-100 text-green-800 text-xs">Save 67%</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-600">Best value - Pay once for the whole year!</p>
          </CardContent>
        </Card>

        {/* Monthly Plan */}
        <Card 
          className={`cursor-pointer transition-all border-2 ${
            selectedPlan === 'monthly' 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setSelectedPlan('monthly')}
          data-testid="card-monthly-plan"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlan === 'monthly' 
                    ? 'bg-indigo-500 border-indigo-500' 
                    : 'border-slate-300'
                }`}>
                  {selectedPlan === 'monthly' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Monthly Plan</h3>
                  <p className="text-sm text-slate-600">Billed monthly</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">${monthlyPrice}</div>
                <div className="text-xs text-slate-500">per month</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">Flexible monthly billing</p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">What's included:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Unlimited Food Scans</p>
                <p className="text-sm text-slate-600">No daily limits, scan as much as you want</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Priority AI Processing</p>
                <p className="text-sm text-slate-600">Faster analysis with premium AI models</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Advanced Nutrition Tracking</p>
                <p className="text-sm text-slate-600">Detailed micronutrients and meal timing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Premium Support</p>
                <p className="text-sm text-slate-600">Priority customer support and updates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button 
        className="w-full h-12 text-lg" 
        onClick={() => setShowPayment(true)}
        data-testid="button-continue-to-payment"
      >
        Continue to Payment
      </Button>

      <p className="text-xs text-slate-500 text-center mt-4">
        Secure payment processing with PayPal. Cancel anytime from your profile.
      </p>
    </div>
  );
}