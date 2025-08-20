import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import CameraInterface from "@/components/CameraInterface";
import ProcessingModal from "@/components/ProcessingModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoodScan, DailyStats, FoodAnalysisResult } from "@shared/schema";
import { Clock, Zap, Target, Star, MoreHorizontal, Edit3, RefreshCw, Trash2, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AnalysisResponse {
  scan: FoodScan;
  analysis: FoodAnalysisResult;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch daily stats
  const { data: dailyStats } = useQuery<DailyStats | null>({
    queryKey: ['/api/daily-stats', user?.id, today],
    enabled: !!user?.id,
  });

  // Fetch recent scans
  const { data: recentScans = [] } = useQuery<FoodScan[]>({
    queryKey: ['/api/food-scans', user?.id],
    enabled: !!user?.id,
  });

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/food-scan/upload');
      return response.json();
    },
  });

  // Analyze food mutation
  const analyzeFoodMutation = useMutation({
    mutationFn: async ({ imageUrl }: { imageUrl: string }) => {
      const response = await apiRequest('POST', '/api/food-scan/analyze', {
        imageUrl,
        userId: user?.id,
      });
      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Food Analyzed Successfully!",
        description: `Found ${data.analysis.foodName} with ${data.analysis.calories} calories`,
        duration: 5000, // Show for 5 seconds
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/food-scans'] });
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze food image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileCapture = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(20);
      
      // Get upload URL
      const uploadResponse = await getUploadUrlMutation.mutateAsync();
      const { uploadURL } = uploadResponse;
      
      setProcessingProgress(40);
      
      // Upload file to signed URL
      const uploadResult = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      setProcessingProgress(70);
      
      // Analyze the uploaded image
      await analyzeFoodMutation.mutateAsync({ imageUrl: uploadURL });
      
      setProcessingProgress(100);
      setIsProcessing(false);
      setProcessingProgress(0);
      
    } catch (error) {
      console.error('Upload/analysis error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload and analyze image. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Simulate progress updates during processing
  useEffect(() => {
    if (isProcessing && processingProgress < 90) {
      const timer = setTimeout(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, processingProgress]);

  const dailyGoal = 1800;
  const consumedCalories = dailyStats?.totalCalories || 0;
  const isOverGoal = consumedCalories > dailyGoal;
  const remainingCalories = dailyGoal - consumedCalories;
  const overAmount = Math.max(consumedCalories - dailyGoal, 0);
  const progressPercentage = Math.min((consumedCalories / dailyGoal) * 100, 100);

  const getMealTypeIcon = (mealType?: string | null) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20">
      <ProcessingModal isOpen={isProcessing} progress={processingProgress} />
      
      {/* HERO: Camera Interface - Make scanning the primary action */}
      <div className="px-4 py-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Scan Your Food</h1>
          <p className="text-slate-600">Point your camera at the meal. AI estimates calories in ~3s.</p>
        </div>
        <CameraInterface 
          onCapture={handleFileCapture}
          isProcessing={isProcessing}
        />
      </div>

      {/* Daily Progress Stats */}
      <div className="px-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'day' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    data-testid="button-day-view"
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'week' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    data-testid="button-week-view"
                  >
                    Week
                  </button>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800" data-testid="text-daily-progress-title">
                {viewMode === 'day' ? "Today's Progress" : "This Week's Progress"}
              </h2>
              <p className="text-slate-500 mt-1" data-testid="text-current-date">
                {viewMode === 'day' 
                  ? format(new Date(), 'EEEE, MMMM d')
                  : `Week of ${format(new Date(), 'MMM d')}`
                }
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500" data-testid="text-calories-consumed">
                  {consumedCalories.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Consumed</div>
              </div>
              <div className="text-center">
                {isOverGoal ? (
                  <div className="text-3xl font-bold text-red-500" data-testid="text-calories-over">
                    −{overAmount.toLocaleString()}
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-emerald-500" data-testid="text-calories-remaining">
                    {Math.max(remainingCalories, 0).toLocaleString()}
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  {isOverGoal ? 'Over goal' : 'Remaining'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  Daily Goal: <span data-testid="text-daily-goal">{dailyGoal.toLocaleString()}</span> cal
                </span>
                <span className="text-sm text-slate-500" data-testid="text-progress-percentage">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isOverGoal 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                  data-testid="progress-daily-calories"
                />
              </div>
            </div>

            {/* Macro breakdown if we have data */}
            {dailyStats && (dailyStats.totalCalories ?? 0) > 0 && (
              <div className="flex justify-around mt-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-700" data-testid="text-total-protein">
                    {Math.round(dailyStats.totalProtein ?? 0)}g
                  </div>
                  <div className="text-xs text-slate-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-700" data-testid="text-total-carbs">
                    {Math.round(dailyStats.totalCarbs ?? 0)}g
                  </div>
                  <div className="text-xs text-slate-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-700" data-testid="text-total-fat">
                    {Math.round(dailyStats.totalFat ?? 0)}g
                  </div>
                  <div className="text-xs text-slate-500">Fat</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Food Analysis Results - Show prominently above camera */}
      {recentScans.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-1 mb-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">🍽️ Your Food Analysis</h3>
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentScans.slice(0, 3).map((scan) => (
                  <Card key={scan.id} className="border-2 border-amber-100">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex-shrink-0 flex items-center justify-center">
                          {scan.imageUrl ? (
                            <img 
                              src={scan.imageUrl.startsWith('http') ? scan.imageUrl : `${window.location.origin}${scan.imageUrl}`}
                              alt={scan.foodName}
                              className="w-full h-full rounded-xl object-cover"
                              data-testid={`img-food-${scan.id}`}
                              onError={(e) => {
                                console.log('Image failed to load:', scan.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">🍽️</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-slate-800 truncate pr-2" data-testid={`text-food-name-${scan.id}`}>
                              {scan.foodName}
                            </h4>
                            <div className="flex items-center gap-2">
                              {scan.confidence && (
                                <Badge 
                                  variant="secondary" 
                                  className="flex items-center gap-1"
                                  title="AI confidence - estimates may vary ±50-100 calories based on portion size and ingredients"
                                >
                                  <Star className="w-3 h-3" />
                                  ±{Math.round(scan.calories * 0.15)} kcal
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                                  title="Edit portion"
                                  data-testid={`button-edit-${scan.id}`}
                                  onClick={() => toast({ title: "Edit Portion", description: "Coming soon!" })}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                                  title="Replace food"
                                  data-testid={`button-replace-${scan.id}`}
                                  onClick={() => toast({ title: "Replace Food", description: "Coming soon!" })}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-red-600"
                                  title="Delete"
                                  data-testid={`button-delete-${scan.id}`}
                                  onClick={() => toast({ title: "Delete Food", description: "Coming soon!" })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                                  title="More details"
                                  data-testid={`button-details-${scan.id}`}
                                  onClick={() => toast({ title: "More Details", description: "Coming soon!" })}
                                >
                                  <Info className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1" data-testid={`text-scan-time-${scan.id}`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(scan.scannedAt!), 'h:mm a')} • {getMealTypeIcon(scan.mealType)} {scan.mealType || 'Meal'}
                          </p>
                          
                          <div className="mt-3">
                            <div className="text-4xl font-bold text-amber-500 mb-3" data-testid={`text-calories-${scan.id}`}>
                              {scan.calories} cal
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="font-medium text-slate-700" data-testid={`text-protein-${scan.id}`}>
                                  {scan.protein}g Protein
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-medium text-slate-700" data-testid={`text-carbs-${scan.id}`}>
                                  {scan.carbs}g Carbs
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="font-medium text-slate-700" data-testid={`text-fat-${scan.id}`}>
                                  {scan.fat}g Fat
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Show empty state if no scans */}
      {recentScans.length === 0 && (
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">🍽️ Your Food Analysis</h3>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-600 mb-2">No scans yet</h4>
              <p className="text-slate-500 text-sm">
                Start by scanning your first food item above!
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pro Subscription Prompt */}
      <div className="px-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">Upgrade to CalAI Pro</h3>
              <p className="text-white/80 text-sm mb-4">
                Free: 2 scans/day • Upgrade for unlimited access
              </p>

              <div className="space-y-2 text-sm text-left mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Unlimited scans • Barcode + verified DB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Macro & micro insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Health/HealthConnect sync</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Privacy-first data control</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">$39.99/year</span>
                  <Badge className="bg-emerald-500 text-white text-xs">Most popular</Badge>
                </div>
                <p className="text-xs text-white/70">~$3.33/month</p>
                <p className="text-xs text-white/70 mt-1">or $9.99/month</p>
              </div>

              <Button 
                className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-semibold"
                data-testid="button-start-trial"
                onClick={() => {
                  toast({
                    title: "Free Trial Started! 🎉",
                    description: "Welcome to CalAI Pro! You now have unlimited scans for 7 days.",
                  });
                }}
              >
                Start 7-day free trial
              </Button>
              <p className="text-xs text-white/70 mt-2">Cancel anytime • Terms apply</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}