import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Target, 
  Bell, 
  Smartphone, 
  Shield, 
  HelpCircle, 
  Star,
  LogOut,
  Crown,
  Camera,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [dailyGoal, setDailyGoal] = useState("1800");
  const [notifications, setNotifications] = useState(true);
  const [cameraQuality, setCameraQuality] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const { toast } = useToast();

  // Mock subscription status
  const isProUser = false;
  const remainingScans = 3;

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2" data-testid="text-settings-title">
          Settings
        </h1>
        <p className="text-slate-500" data-testid="text-settings-subtitle">
          Manage your account and app preferences
        </p>
      </div>

      {/* Subscription Status */}
      <div className="px-4 mb-6">
        <Card className={`${isProUser ? 'bg-gradient-to-br from-indigo-50 to-emerald-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {isProUser ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-slate-800" data-testid="text-subscription-status">
                    {isProUser ? "CalAI Pro" : "Free Plan"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isProUser 
                      ? "Unlimited scans & premium features" 
                      : `${remainingScans} scans remaining today`
                    }
                  </p>
                </div>
              </div>

              {!isProUser && (
                <Button 
                  size="sm" 
                  className="bg-gradient-to-br from-indigo-600 to-emerald-600"
                  data-testid="button-upgrade-subscription"
                  onClick={() => {
                    toast({
                      title: "Redirecting to Upgrade...",
                      description: "Taking you to the subscription page.",
                    });
                  }}
                >
                  Upgrade
                </Button>
              )}
            </div>

            {!isProUser && (
              <>
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-3">
                    Get unlimited AI food scanning with CalAI Pro
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-start-free-trial"
                    onClick={() => {
                      toast({
                        title: "Free Trial Started! 🎉",
                        description: "Welcome to CalAI Pro! You now have unlimited scans for 3 days.",
                      });
                    }}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Settings */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value="user@example.com" 
                disabled 
                data-testid="input-email"
              />
              <p className="text-xs text-slate-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value="foodie_user" 
                data-testid="input-username"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Settings */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Daily Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-calories">Daily Calorie Goal</Label>
              <Input 
                id="daily-calories"
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                data-testid="input-daily-calories"
              />
              <p className="text-xs text-slate-500">
                Recommended range: 1200-3000 calories per day
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-medium">Activity Level</Label>
                <p className="text-sm text-slate-500">Sedentary</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-update-activity">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Preferences */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-slate-500">
                  Daily reminders and meal tracking alerts
                </p>
              </div>
              <Switch 
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  High Quality Camera
                </Label>
                <p className="text-sm text-slate-500">
                  Better image quality for more accurate AI analysis
                </p>
              </div>
              <Switch 
                checked={cameraQuality}
                onCheckedChange={setCameraQuality}
                data-testid="switch-camera-quality"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Auto Data Sync
                </Label>
                <p className="text-sm text-slate-500">
                  Automatically sync your data when online
                </p>
              </div>
              <Switch 
                checked={dataSync}
                onCheckedChange={setDataSync}
                data-testid="switch-data-sync"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support & Information */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Support & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start" data-testid="button-faq">
              <HelpCircle className="w-4 h-4 mr-3" />
              FAQ & Help Center
            </Button>
            
            <Button variant="ghost" className="w-full justify-start" data-testid="button-contact-support">
              <Shield className="w-4 h-4 mr-3" />
              Contact Support
            </Button>
            
            <Button variant="ghost" className="w-full justify-start" data-testid="button-privacy-policy">
              <Shield className="w-4 h-4 mr-3" />
              Privacy Policy
            </Button>

            <Separator />

            <div className="py-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">App Version</span>
                <Badge variant="outline" data-testid="text-app-version">v1.0.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions */}
      <div className="px-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-slate-700"
                data-testid="button-export-data"
              >
                <Database className="w-4 h-4 mr-3" />
                Export My Data
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                data-testid="button-sign-out"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="px-4">
        <Button 
          className="w-full bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700"
          data-testid="button-save-settings"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
