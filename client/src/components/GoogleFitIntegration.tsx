import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Smartphone, 
  Zap, 
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Unlink
} from "lucide-react";

interface GoogleFitStatus {
  connected: boolean;
  lastSync?: string;
  totalActivities?: number;
  todaySteps?: number;
}

export function GoogleFitIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check Google Fit connection status
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/google-fit/status'],
    enabled: true,
  });

  // Sync Google Fit data mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/google-fit/sync'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/google-fit/status'] });
      
      toast({
        title: "Sync Complete",
        description: `Imported ${data.activitiesImported} activities. ${data.stepsUpdated ? 'Steps updated.' : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync Google Fit data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disconnect Google Fit mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/google-fit/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-fit/status'] });
      toast({
        title: "Disconnected",
        description: "Google Fit has been disconnected from your account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Google Fit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest('GET', '/api/google-fit/auth');
      const data = await response.json();
      
      // Open Google Fit authorization in new window
      window.open(data.authUrl, '_self');
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to start Google Fit connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Fit? This will stop automatic activity syncing.')) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-calai-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.connected || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Google Fit Integration
          {isConnected && <Badge className="bg-green-100 text-green-700">Connected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="text-center py-4">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-medium text-slate-800 mb-2">Automatic Activity Tracking</h3>
              <p className="text-sm text-slate-600 mb-4">
                Connect Google Fit to automatically track walking, running, cycling, and other activities with real-time notifications.
              </p>
              
              <div className="space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Automatic activity detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Real-time step counting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Smart calorie calculations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Activity notifications</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Google Fit
                </>
              )}
            </Button>
            
            <p className="text-xs text-slate-500 text-center">
              Free integration • Your data stays private • Disconnect anytime
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status?.todaySteps || 0}</div>
                <div className="text-xs text-slate-600">Steps Today</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status?.totalActivities || 0}</div>
                <div className="text-xs text-slate-600">Activities Synced</div>
              </div>
            </div>
            
            {status?.lastSync && (
              <div className="text-sm text-slate-600 text-center">
                Last sync: {new Date(status.lastSync).toLocaleString()}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={syncMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
            
            <div className="p-3 bg-calai-bg rounded-lg">
              <p className="text-sm text-slate-600">
                Activities are automatically synced every hour. Manual sync available anytime.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}