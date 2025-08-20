import { useQuery } from "@tanstack/react-query";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Calendar, Zap, Star } from "lucide-react";
import type { FoodScan, DailyStats } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Analytics() {
  const { user } = useAuth();
  
  // Fetch food scans for the last 30 days
  const { data: foodScans = [] } = useQuery<FoodScan[]>({
    queryKey: ['/api/food-scans', user?.id],
    enabled: !!user?.id,
    select: (data) => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      return data.filter(scan => 
        new Date(scan.scannedAt!) >= thirtyDaysAgo
      );
    }
  });

  // Get today's stats
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayStats } = useQuery<DailyStats | null>({
    queryKey: ['/api/daily-stats', user?.id, today],
    enabled: !!user?.id,
  });

  // Calculate analytics
  const last7Days = foodScans.filter(scan => 
    new Date(scan.scannedAt!) >= subDays(new Date(), 7)
  );
  
  const last30Days = foodScans;

  // Daily averages
  const avgCaloriesLast7Days = last7Days.length > 0 
    ? Math.round(last7Days.reduce((sum, scan) => sum + scan.calories, 0) / 7)
    : 0;
  
  const avgCaloriesLast30Days = last30Days.length > 0 
    ? Math.round(last30Days.reduce((sum, scan) => sum + scan.calories, 0) / 30)
    : 0;

  // Macro averages (last 7 days)
  const avgProtein = last7Days.length > 0 
    ? last7Days.reduce((sum, scan) => sum + scan.protein, 0) / 7
    : 0;
  
  const avgCarbs = last7Days.length > 0 
    ? last7Days.reduce((sum, scan) => sum + scan.carbs, 0) / 7
    : 0;
  
  const avgFat = last7Days.length > 0 
    ? last7Days.reduce((sum, scan) => sum + scan.fat, 0) / 7
    : 0;

  // Most scanned foods
  const foodFrequency = last30Days.reduce((acc, scan) => {
    acc[scan.foodName] = (acc[scan.foodName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFoods = Object.entries(foodFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Scanning patterns
  const mealTypeFrequency = last30Days.reduce((acc, scan) => {
    const mealType = scan.mealType || 'unknown';
    acc[mealType] = (acc[mealType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Weekly trend
  const weeklyTrend = last7Days.reduce((sum, scan) => sum + scan.calories, 0);
  const previousWeek = foodScans.filter(scan => {
    const scanDate = new Date(scan.scannedAt!);
    return scanDate >= subDays(new Date(), 14) && scanDate < subDays(new Date(), 7);
  }).reduce((sum, scan) => sum + scan.calories, 0);

  const weeklyChange = previousWeek > 0 ? ((weeklyTrend - previousWeek) / previousWeek) * 100 : 0;

  // AI confidence stats
  const avgConfidence = last30Days.length > 0 
    ? last30Days.reduce((sum, scan) => sum + (scan.confidence || 0), 0) / last30Days.length 
    : 0;

  const highConfidenceScans = last30Days.filter(scan => (scan.confidence || 0) >= 0.8).length;
  const confidenceRate = last30Days.length > 0 ? (highConfidenceScans / last30Days.length) * 100 : 0;

  const dailyGoal = 1800; // Should come from user settings

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2" data-testid="text-analytics-title">
          Analytics
        </h1>
        <p className="text-slate-500" data-testid="text-analytics-subtitle">
          Insights from your food scanning habits
        </p>
      </div>

      {/* Today's Overview */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600" data-testid="text-today-scans">
                  {todayStats?.scansCount || 0}
                </div>
                <div className="text-sm text-slate-500">Scans Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600" data-testid="text-today-calories">
                  {todayStats?.totalCalories || 0}
                </div>
                <div className="text-sm text-slate-500">Calories</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Daily Goal Progress</span>
                <span className="text-sm font-medium" data-testid="text-goal-progress">
                  {Math.round(((todayStats?.totalCalories || 0) / dailyGoal) * 100)}%
                </span>
              </div>
              <Progress 
                value={((todayStats?.totalCalories || 0) / dailyGoal) * 100} 
                className="h-2"
                data-testid="progress-daily-goal"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-slate-800" data-testid="text-weekly-calories">
                  {weeklyTrend.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Calories this week</div>
              </div>
              <Badge 
                variant={weeklyChange >= 0 ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  weeklyChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
                data-testid="badge-weekly-change"
              >
                {weeklyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(weeklyChange).toFixed(1)}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-700" data-testid="text-avg-7-days">
                  {avgCaloriesLast7Days}
                </div>
                <div className="text-xs text-slate-500">Daily Avg (7d)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-700" data-testid="text-avg-30-days">
                  {avgCaloriesLast30Days}
                </div>
                <div className="text-xs text-slate-500">Daily Avg (30d)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macro Breakdown */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Average Daily Macros (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Protein</span>
                <span className="text-sm font-bold text-slate-800" data-testid="text-avg-protein">
                  {Math.round(avgProtein)}g
                </span>
              </div>
              <Progress 
                value={(avgProtein / 150) * 100} 
                className="h-2"
                data-testid="progress-protein"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Carbs</span>
                <span className="text-sm font-bold text-slate-800" data-testid="text-avg-carbs">
                  {Math.round(avgCarbs)}g
                </span>
              </div>
              <Progress 
                value={(avgCarbs / 225) * 100} 
                className="h-2"
                data-testid="progress-carbs"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Fat</span>
                <span className="text-sm font-bold text-slate-800" data-testid="text-avg-fat">
                  {Math.round(avgFat)}g
                </span>
              </div>
              <Progress 
                value={(avgFat / 65) * 100} 
                className="h-2"
                data-testid="progress-fat"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              AI Recognition Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-confidence-analytics">
                  {Math.round(avgConfidence * 100)}%
                </div>
                <div className="text-sm text-slate-500">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600" data-testid="text-high-confidence-rate">
                  {Math.round(confidenceRate)}%
                </div>
                <div className="text-sm text-slate-500">High Confidence</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Recognition Accuracy</span>
                <span className="text-sm font-medium">
                  {highConfidenceScans} / {last30Days.length} scans
                </span>
              </div>
              <Progress 
                value={confidenceRate} 
                className="h-2"
                data-testid="progress-confidence-rate"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Foods */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Most Scanned Foods (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFoods.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No data available. Start scanning foods to see analytics!
              </p>
            ) : (
              <div className="space-y-3">
                {topFoods.map(([food, count], index) => (
                  <div key={food} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate" data-testid={`text-top-food-${index}`}>
                        {food}
                      </span>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-food-count-${index}`}>
                      {count} scan{count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal Patterns */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Meal Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(mealTypeFrequency).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No meal data available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(mealTypeFrequency)
                  .sort(([, a], [, b]) => b - a)
                  .map(([mealType, count]) => (
                    <div key={mealType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {mealType === 'breakfast' && '🌅'}
                          {mealType === 'lunch' && '☀️'}
                          {mealType === 'dinner' && '🌙'}
                          {mealType === 'snack' && '🍎'}
                          {mealType === 'unknown' && '🍽️'}
                        </span>
                        <span className="text-sm font-medium text-slate-700 capitalize" data-testid={`text-meal-type-${mealType}`}>
                          {mealType}
                        </span>
                      </div>
                      <Badge variant="outline" data-testid={`badge-meal-count-${mealType}`}>
                        {count} scan{count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
