import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Lightbulb,
  Calendar,
  Award,
  Flame
} from "lucide-react";

export default function Coach() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);

  const handleDailyCheckin = () => {
    if (!selectedMood || !selectedEnergy) {
      toast({
        title: "Complete Check-in",
        description: "Please select both mood and energy levels",
        variant: "destructive"
      });
      return;
    }

    setCheckedInToday(true);
    toast({
      title: "Check-in Complete! 🎉",
      description: `Great job! Your ${selectedMood} mood and ${selectedEnergy} energy are noted.`
    });
  };

  const dailyTips = [
    {
      icon: "🥗",
      title: "Portion Control Tip",
      content: "Use your palm size as a guide for protein portions - it's roughly 3-4 oz!"
    },
    {
      icon: "💧",
      title: "Hydration Hack",
      content: "Drink a glass of water before each meal to help with satiety and digestion."
    },
    {
      icon: "🍎",
      title: "Snack Smart",
      content: "Pair fruits with protein (apple + almond butter) for sustained energy."
    }
  ];

  const todaysTasks = [
    { id: 1, text: "Log your breakfast", completed: true },
    { id: 2, text: "Drink 8 glasses of water", completed: false },
    { id: 3, text: "Take a 15-min walk", completed: false },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-calai-secondary to-green-600 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Coach</h1>
          <p className="text-slate-600">Daily wellness check-in & tips</p>
        </div>
      </div>

      {/* Daily Check-in */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Check-in
            {checkedInToday && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!checkedInToday ? (
            <>
              <div>
                <p className="text-sm font-medium mb-2">How's your mood today?</p>
                <div className="flex gap-2">
                  {['Great', 'Good', 'Okay', 'Tired'].map((mood) => (
                    <Button
                      key={mood}
                      variant={selectedMood === mood ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMood(mood)}
                      data-testid={`button-mood-${mood.toLowerCase()}`}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Energy level?</p>
                <div className="flex gap-2">
                  {['High', 'Medium', 'Low'].map((energy) => (
                    <Button
                      key={energy}
                      variant={selectedEnergy === energy ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEnergy(energy)}
                      data-testid={`button-energy-${energy.toLowerCase()}`}
                    >
                      {energy}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleDailyCheckin}
                className="w-full bg-gradient-to-r from-calai-primary to-calai-secondary"
                data-testid="button-complete-checkin"
              >
                Complete Check-in
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-8 h-8 text-calai-secondary mx-auto mb-2" />
              <p className="text-slate-600">You've completed today's check-in!</p>
              <p className="text-sm text-slate-500">Come back tomorrow for another check-in.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Today's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaysTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <CheckCircle2 
                  className={`w-5 h-5 ${task.completed ? 'text-calai-secondary' : 'text-slate-300'}`}
                />
                <span className={task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm font-bold text-calai-secondary">
                1 of 3 complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-calai-secondary h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Tips */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Today's Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyTips.slice(0, 1).map((tip, index) => (
              <div key={index} className="flex gap-3 p-3 bg-amber-50 rounded-lg">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600">{tip.content}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Tips
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-calai-bg rounded-lg">
              <Flame className="w-6 h-6 text-calai-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-calai-secondary">5</div>
              <div className="text-sm text-slate-600">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <Award className="w-6 h-6 text-calai-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-calai-primary">12</div>
              <div className="text-sm text-slate-600">Goals Hit</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-2">Weekly Goal Progress</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Calorie Tracking</span>
                <span className="font-medium">5/7 days</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-calai-secondary h-2 rounded-full" style={{ width: '71%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}