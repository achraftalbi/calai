import { useState, useEffect } from 'react';
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
  Activity, 
  Smartphone, 
  Play, 
  Pause, 
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { deviceMotionService } from "@/services/deviceMotion";
import { useToast } from "@/hooks/use-toast";

interface DeviceMotionData {
  steps: number;
  isWalking: boolean;
  isRunning: boolean;
  lastActivity: Date | null;
}

export function DeviceMotionTracker() {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [motionData, setMotionData] = useState<DeviceMotionData>({
    steps: 0,
    isWalking: false,
    isRunning: false,
    lastActivity: null
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    // Check if device motion is supported
    setIsSupported(deviceMotionService.isSupported());

    // Check notification permission
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }

    // Set up motion data listener
    const handleMotionData = (data: DeviceMotionData) => {
      setMotionData(data);
    };

    deviceMotionService.addListener(handleMotionData);

    return () => {
      deviceMotionService.removeListener(handleMotionData);
    };
  }, []);

  const handleStartTracking = async () => {
    try {
      const success = await deviceMotionService.startTracking();
      if (success) {
        setIsTracking(true);
        toast({
          title: "Motion Tracking Started",
          description: "CalAI will now automatically detect your walking and running activities.",
        });
      } else {
        toast({
          title: "Permission Required",
          description: "Please allow motion and orientation access to enable automatic activity detection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Tracking Failed",
        description: "Failed to start motion tracking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopTracking = () => {
    deviceMotionService.stopTracking();
    setIsTracking(false);
    toast({
      title: "Motion Tracking Stopped",
      description: "Automatic activity detection has been paused.",
    });
  };

  const handleRequestNotifications = async () => {
    const granted = await deviceMotionService.requestNotificationPermission();
    setHasNotificationPermission(granted);
    
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive activity notifications when walking or running is detected.",
      });
    } else {
      toast({
        title: "Notifications Denied",
        description: "Enable notifications in your browser settings to receive activity alerts.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-slate-200">
        <CardContent className="text-center py-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-600">
            Device motion detection is not supported on this device or browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCurrentActivity = () => {
    if (motionData.isRunning) return { name: 'Running', color: 'bg-red-500' };
    if (motionData.isWalking) return { name: 'Walking', color: 'bg-blue-500' };
    return { name: 'Idle', color: 'bg-slate-400' };
  };

  const activity = getCurrentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Automatic Activity Detection
          {isTracking && <Badge className="bg-green-100 text-green-700">Active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isTracking ? (
          <>
            <div className="text-center py-4">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-medium text-slate-800 mb-2">Zero-Setup Activity Tracking</h3>
              <p className="text-sm text-slate-600 mb-4">
                Use your phone's built-in sensors to automatically detect walking and running activities - no external app setup required.
              </p>
              
              <div className="space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Automatic step counting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Walking & running detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Real-time activity notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Automatic activity logging</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleStartTracking}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Motion Tracking
            </Button>
            
            <p className="text-xs text-slate-500 text-center">
              Uses device sensors • No external apps needed • Works offline
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{motionData.steps}</div>
                <div className="text-xs text-slate-600">Steps Detected</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                  <span className="text-sm font-medium">{activity.name}</span>
                </div>
                <div className="text-xs text-slate-600">Current Activity</div>
              </div>
            </div>

            {motionData.lastActivity && (
              <div className="text-sm text-slate-600 text-center bg-green-50 p-2 rounded-lg">
                Activity started: {motionData.lastActivity.toLocaleTimeString()}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleStopTracking}
                variant="outline"
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Tracking
              </Button>

              <Button 
                onClick={handleRequestNotifications}
                variant="outline"
                disabled={hasNotificationPermission}
                className="flex-1"
              >
                {hasNotificationPermission ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications On
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Enable Alerts
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-slate-500 text-center space-y-1">
              <div>Activities of 2+ minutes will be automatically logged to your Coach dashboard</div>
              <div className="text-blue-600">💡 Zero setup required - works instantly</div>
              <div className="text-amber-600">Note: Web version pauses when screen locks. Native app tracks continuously.</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}