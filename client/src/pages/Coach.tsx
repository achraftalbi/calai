import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { CoachTodayResponse, ManualActivityRequest, ManualStepsRequest } from "@shared/schema";
import { 
  Heart, 
  Target, 
  TrendingUp, 
  Lightbulb,
  Calendar,
  Award,
  Flame,
  Plus,
  Activity,
  Footprints,
  Dumbbell,
  Clock,
  Zap
} from "lucide-react";

export default function CoachNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  
  // Form states
  const [activityForm, setActivityForm] = useState({
    type: 'walk',
    duration: '',
    calories: '',
  });
  
  const [stepsForm, setStepsForm] = useState({
    steps: '',
  });

  // Fetch today's coach data
  const { data: coachData, isLoading } = useQuery({
    queryKey: ['/api/coach/today'],
    enabled: !!user,
  });

  // Manual activity mutation
  const addActivityMutation = useMutation({
    mutationFn: (data: ManualActivityRequest) => 
      apiRequest('POST', '/api/manual/activity', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/today'] });
      setShowActivityDialog(false);
      setActivityForm({ type: 'walk', duration: '', calories: '' });
      toast({
        title: "Activity Added",
        description: "Your workout has been logged successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual steps mutation
  const addStepsMutation = useMutation({
    mutationFn: (data: ManualStepsRequest) => 
      apiRequest('POST', '/api/manual/steps', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/today'] });
      setShowStepsDialog(false);
      setStepsForm({ steps: '' });
      toast({
        title: "Steps Added",
        description: "Your steps have been logged successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add steps. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-calai-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const data = coachData as CoachTodayResponse;
  
  // Calculate net calories color
  const getNetCaloriesColor = (netKcal: number) => {
    if (netKcal <= 0) return 'text-green-600';
    if (netKcal <= 200) return 'text-amber-600';
    return 'text-red-600';
  };

  const getNetCaloriesBgColor = (netKcal: number) => {
    if (netKcal <= 0) return 'bg-green-100';
    if (netKcal <= 200) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const handleAddActivity = () => {
    const duration = parseInt(activityForm.duration);
    const calories = activityForm.calories ? parseInt(activityForm.calories) : undefined;
    
    if (!duration || duration <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid duration.",
        variant: "destructive",
      });
      return;
    }

    addActivityMutation.mutate({
      type: activityForm.type,
      duration,
      calories,
    });
  };

  const handleAddSteps = () => {
    const steps = parseInt(stepsForm.steps);
    
    if (!steps || steps <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of steps.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    addStepsMutation.mutate({
      date: today,
      steps,
    });
  };

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-calai-primary to-calai-secondary rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800" data-testid="text-coach-title">
              Energy Coach
            </h1>
            <p className="text-slate-600">Your daily energy balance</p>
          </div>
        </div>

        {/* Energy Balance Overview */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Today's Energy Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Energy Meters */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-calai-primary">{data?.intakeKcal || 0}</div>
                <div className="text-xs text-slate-600">Eaten</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-calai-accent">{(data?.bmrKcal || 0) + (data?.activeKcal || 0)}</div>
                <div className="text-xs text-slate-600">Burned</div>
              </div>
              <div className={`${getNetCaloriesBgColor(data?.netKcal || 0)} rounded-lg p-2`}>
                <div className={`text-2xl font-bold ${getNetCaloriesColor(data?.netKcal || 0)}`}>
                  {data?.netKcal > 0 ? '+' : ''}{data?.netKcal || 0}
                </div>
                <div className="text-xs text-slate-600">Net</div>
              </div>
            </div>

            <Separator />

            {/* Burn Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>BMR (Base Metabolism)</span>
                <span>{data?.bmrKcal || 0} kcal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Calories</span>
                <span>{data?.activeKcal || 0} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Steps Card */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5" />
                Steps
              </div>
              {data?.sources?.includes('manual') && (
                <Badge variant="outline" className="text-xs">Manual</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">{(data?.steps || 0).toLocaleString()}</div>
                <div className="text-sm text-slate-600">steps today</div>
              </div>
              <Dialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Steps
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Steps</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="steps">Number of Steps</Label>
                      <Input
                        id="steps"
                        type="number"
                        placeholder="e.g. 5000"
                        value={stepsForm.steps}
                        onChange={(e) => setStepsForm({ steps: e.target.value })}
                      />
                    </div>
                    <Button 
                      onClick={handleAddSteps} 
                      disabled={addStepsMutation.isPending}
                      className="w-full"
                    >
                      {addStepsMutation.isPending ? 'Adding...' : 'Add Steps'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activities
              </div>
              <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Workout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Workout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="activity-type">Activity Type</Label>
                      <Select value={activityForm.type} onValueChange={(value) => setActivityForm({...activityForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk">Walking</SelectItem>
                          <SelectItem value="run">Running</SelectItem>
                          <SelectItem value="cycle">Cycling</SelectItem>
                          <SelectItem value="swim">Swimming</SelectItem>
                          <SelectItem value="strength">Strength Training</SelectItem>
                          <SelectItem value="yoga">Yoga</SelectItem>
                          <SelectItem value="dance">Dancing</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="e.g. 30"
                        value={activityForm.duration}
                        onChange={(e) => setActivityForm({...activityForm, duration: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="calories">Calories (optional)</Label>
                      <Input
                        id="calories"
                        type="number"
                        placeholder="Leave empty for estimate"
                        value={activityForm.calories}
                        onChange={(e) => setActivityForm({...activityForm, calories: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleAddActivity} 
                      disabled={addActivityMutation.isPending}
                      className="w-full"
                    >
                      {addActivityMutation.isPending ? 'Adding...' : 'Add Activity'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.activities && data.activities.length > 0 ? (
              <div className="space-y-3">
                {data.activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 bg-calai-accent/10 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-calai-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">{activity.type}</span>
                        <Badge variant="outline" className="text-xs">{activity.source}</Badge>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        {activity.calories && <span>{activity.calories} kcal</span>}
                        {activity.start && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activities logged today</p>
                <p className="text-xs">Add activities to track your energy burn</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Drivers */}
      {data?.topDrivers && (
        <div className="px-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Energy Burn</h4>
                <div className="space-y-2">
                  {data.topDrivers.burning.map((driver, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{driver.name}</span>
                      <span className="font-medium">{driver.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm mb-2">Energy Intake</h4>
                <div className="space-y-2">
                  {data.topDrivers.intake.map((driver, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{driver.name}</span>
                      <span className="font-medium">{driver.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!data?.intakeKcal && !data?.activeKcal && !data?.steps && (
        <div className="px-4 mb-6">
          <Card>
            <CardContent className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-medium text-slate-800 mb-2">Start Your Energy Journey</h3>
              <p className="text-sm text-slate-600 mb-4">
                Connect Google Fit or Strava, or add activities manually to see your energy balance.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  Connect Google Fit
                  <Badge className="ml-2 text-xs">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Connect Strava
                  <Badge className="ml-2 text-xs">Coming Soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}