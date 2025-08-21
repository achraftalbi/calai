import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Badge 
} from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Activity, 
  ExternalLink, 
  RefreshCw, 
  MoreHorizontal,
  Unlink,
  Loader2,
  CheckCircle2,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function StravaIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check Strava connection status
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/strava/status'],
    enabled: true,
  });

  // Sync Strava data mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/strava/sync'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/strava/status'] });
      
      toast({
        title: "Strava Sync Complete",
        description: `Imported ${data.activitiesImported} activities from the last 30 days.`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync Strava data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disconnect Strava mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/strava/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strava/status'] });
      toast({
        title: "Disconnected",
        description: "Strava has been disconnected from your account.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Strava. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest('GET', '/api/strava/auth');
      const data = await response.json();
      
      // Open Strava authorization in new window
      window.open(data.authUrl, '_self');
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to start Strava connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Strava? This will stop automatic activity syncing.')) {
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

  const isConnected = (status as any)?.connected || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Strava Integration
          {isConnected && <Badge className="bg-orange-100 text-orange-700">Connected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="text-center py-4">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-medium text-slate-800 mb-2">Complete Activity Coverage</h3>
              <p className="text-sm text-slate-600 mb-4">
                Connect Strava to automatically import all your activities including swimming, cycling, and watch-based workouts.
              </p>
              
              <div className="space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>24/7 background activity tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Swimming, cycling, and all sports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Watch and fitness tracker sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Accurate measured data</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Strava
                </>
              )}
            </Button>
            
            <p className="text-xs text-slate-500 text-center">
              Read-only access • Your data stays private • Disconnect anytime
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{(status as any)?.totalActivities || 0}</div>
                <div className="text-xs text-slate-600">Activities Synced</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{(status as any)?.lastActivity ? '✓' : '—'}</div>
                <div className="text-xs text-slate-600">Recent Activity</div>
              </div>
            </div>

            {(status as any)?.lastSync && (
              <div className="text-sm text-slate-600 text-center">
                Last sync: {new Date((status as any).lastSync).toLocaleString()}
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
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Auto-syncs every 15 minutes • Includes all sports and watch data
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}