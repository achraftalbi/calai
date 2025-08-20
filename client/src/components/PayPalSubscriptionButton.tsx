import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PayPalButton from "./PayPalButton";

interface PayPalSubscriptionButtonProps {
  planType: 'monthly' | 'yearly';
  amount: string;
  onSuccess?: () => void;
}

export default function PayPalSubscriptionButton({ 
  planType, 
  amount, 
  onSuccess 
}: PayPalSubscriptionButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/create', { planType });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful!",
        description: data.message || "Your subscription has been activated!",
        duration: 5000,
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Call optional success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Create a custom PayPal button component that activates subscription after payment
  const CustomPayPalButton = () => {
    return (
      <div className="relative">
        <PayPalButton 
          amount={amount}
          currency="USD"
          intent="CAPTURE"
        />
        
        {/* Overlay div to capture PayPal success events */}
        <div 
          id="paypal-success-handler"
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: -1 }}
          onLoad={() => {
            // Listen for PayPal success events
            window.addEventListener('paypalSuccess', () => {
              createSubscriptionMutation.mutate();
            });
          }}
        />
      </div>
    );
  };

  return <CustomPayPalButton />;
}