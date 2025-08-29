import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  Crown, 
  Target, 
  Bell,
  Download,
  Trash2,
  ExternalLink,
  Shield,
  CreditCard,
  Heart,
  Scale,
  Ruler,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
    email: (user as any)?.email || '',
    dailyCalorieGoal: (user as any)?.dailyCalorieGoal || 2000
  });

  const [bmrData, setBmrData] = useState({
    weightKg: (user as any)?.weightKg || '',
    heightCm: (user as any)?.heightCm || '',
    age: (user as any)?.age || '',
    gender: (user as any)?.gender || '',
  });

  const [isEditingBMR, setIsEditingBMR] = useState(false);

  // Profile update mutation - MOVED BEFORE THE CONDITIONAL RETURN
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/auth/user/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // BMR update mutation
  const updateBMRMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/auth/user/profile-with-bmr', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/today'] });
      setIsEditingBMR(false);
      toast({
        title: "BMR Data Updated",
        description: "Your energy balance calculations have been updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update BMR data. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Early return AFTER all hooks are defined
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSaveBMR = () => {
    const weightKg = parseFloat(bmrData.weightKg);
    const heightCm = parseFloat(bmrData.heightCm);
    const age = parseInt(bmrData.age);

    if (!weightKg || !heightCm || !age || !bmrData.gender) {
      toast({
        title: "Invalid Data",
        description: "Please fill in all BMR fields with valid values.",
        variant: "destructive"
      });
      return;
    }

    updateBMRMutation.mutate({
      weightKg,
      heightCm,
      age,
      gender: bmrData.gender
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Requested",
      description: "Your data export will be emailed to you within 24 hours."
    });
  };

  const handleSignOut = async () => {
    try {
      // Déconnexion Supabase si connecté via Supabase
      await supabase.auth.signOut();
      
      // Déconnexion Replit (fallback)
      window.location.href = '/api/logout';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Fallback vers Replit logout
      window.location.href = '/api/logout';
    }
  };

  const subscriptionStatus = (user as any)?.subscriptionStatus || 'free';
  const isProUser = subscriptionStatus !== 'free';

  return (
    <div className="max-w-lg mx-auto pb-20 px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-calai-primary to-calai-secondary rounded-full flex items-center justify-center">
          {(user as any)?.profileImageUrl ? (
            <img
              src={(user as any).profileImageUrl}
              alt={(user as any)?.firstName || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">
            {(user as any)?.firstName} {(user as any)?.lastName}
          </h1>
          <p className="text-slate-600">{(user as any)?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {isProUser ? (
              <Badge className="bg-gradient-to-r from-calai-accent to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                CalAI Pro
              </Badge>
            ) : (
              <Badge variant="secondary">Free Plan</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProUser ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Plan</span>
                <Badge className="bg-gradient-to-r from-calai-secondary to-green-600 text-white">
                  Annual Pro - $39.99/year
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Next billing</span>
                <span className="font-medium">Dec 15, 2025</span>
              </div>
              <Link href="/subscribe">
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-gradient-to-br from-calai-bg to-cyan-50 rounded-lg">
                <Crown className="w-8 h-8 text-calai-primary mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 mb-1">Upgrade to Pro</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Unlimited scans, advanced analytics, and more
                </p>
                <div className="text-lg font-bold text-calai-primary mb-2">
                  $39.99/year (~$3.33/mo)
                </div>
              </div>
              <Link href="/subscribe">
                <Button className="w-full bg-gradient-to-r from-calai-primary to-calai-secondary">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                className="w-full mt-1 p-2 border border-slate-300 rounded-md disabled:bg-slate-100"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                className="w-full mt-1 p-2 border border-slate-300 rounded-md disabled:bg-slate-100"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full mt-1 p-2 border border-slate-300 rounded-md disabled:bg-slate-100"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <Button 
              onClick={handleSaveProfile} 
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* BMR Setup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              BMR Setup
            </div>
            {!isEditingBMR && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingBMR(true)}>
                {(user as any)?.weightKg ? 'Edit' : 'Set Up'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditingBMR ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Weight</span>
                <span className="font-medium">{(user as any)?.weightKg ? `${(user as any).weightKg} kg` : 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Height</span>
                <span className="font-medium">{(user as any)?.heightCm ? `${(user as any).heightCm} cm` : 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Age</span>
                <span className="font-medium">{(user as any)?.age ? `${(user as any).age} years` : 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Gender</span>
                <span className="font-medium capitalize">{(user as any)?.gender || 'Not set'}</span>
              </div>
              {!(user as any)?.weightKg && (
                <div className="p-3 bg-calai-bg rounded-lg">
                  <p className="text-sm text-slate-600">Set up your BMR data to enable energy balance calculations in the Coach feature.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={bmrData.weightKg}
                    onChange={(e) => setBmrData(prev => ({ ...prev, weightKg: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={bmrData.heightCm}
                    onChange={(e) => setBmrData(prev => ({ ...prev, heightCm: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    value={bmrData.age}
                    onChange={(e) => setBmrData(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={bmrData.gender} onValueChange={(value) => setBmrData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveBMR} 
                  disabled={updateBMRMutation.isPending}
                  className="flex-1"
                >
                  {updateBMRMutation.isPending ? 'Saving...' : 'Save BMR Data'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingBMR(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Goals & Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goals & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Daily Calorie Goal</span>
            <span className="font-semibold">{(user as any)?.dailyCalorieGoal || 2000} kcal</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Goal Type</span>
            <Badge variant="outline">{(user as any)?.goalType || 'Maintain Weight'}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Activity Level</span>
            <Badge variant="outline">{(user as any)?.activityLevel || 'Sedentary'}</Badge>
          </div>
          <Button variant="outline" className="w-full">
            Update Goals
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Meal Reminders</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Weekly Progress</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Achievement Notifications</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Manage Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export My Data
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ExternalLink className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ExternalLink className="w-4 h-4 mr-2" />
            Terms of Service
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}