import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import CameraInterface from "@/components/CameraInterface";
import ProcessingModal from "@/components/ProcessingModal";
// import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FoodScan, DailyStats, FoodAnalysisResult } from "@shared/schema";
import { Clock, Zap, Target, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AnalysisResponse {
  scan: FoodScan;
  analysis: FoodAnalysisResult;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
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
    onSettled: () => {
      setIsProcessing(false);
      setProcessingProgress(0);
    },
  });

  // Handle file upload and analysis
  const handleFileCapture = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(20);

    try {
      // Get upload URL
      const { uploadURL } = await getUploadUrlMutation.mutateAsync();
      setProcessingProgress(40);

      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setProcessingProgress(70);

      // Analyze the uploaded image
      await analyzeFoodMutation.mutateAsync({ imageUrl: uploadURL });
      
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

  const dailyGoal = 1800; // This should come from user settings
  const consumed = dailyStats?.totalCalories || 0;
  const remaining = Math.max(dailyGoal - consumed, 0);
  const progressPercentage = Math.min((consumed / dailyGoal) * 100, 100);

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
      
      {/* Daily Progress Stats */}
      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800" data-testid="text-daily-progress-title">
                Today's Progress
              </h2>
              <p className="text-slate-500 mt-1" data-testid="text-current-date">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500" data-testid="text-calories-consumed">
                  {consumed.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Consumed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500" data-testid="text-calories-remaining">
                  {remaining.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Remaining</div>
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
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
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

      {/* Camera Interface */}
      <div className="px-4 mb-6">
        <CameraInterface 
          onCapture={handleFileCapture}
          isProcessing={isProcessing}
        />
      </div>

      {/* Recent Scans */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Recent Scans</h3>
          <Button variant="ghost" size="sm" className="text-indigo-600">
            View All
          </Button>
        </div>

        {recentScans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-600 mb-2">No scans yet</h4>
              <p className="text-slate-500 text-sm">
                Start by scanning your first food item above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentScans.slice(0, 3).map((scan) => (
              <Card key={scan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {scan.imageUrl && (
                      <img 
                        src={`${window.location.origin}${scan.imageUrl}`}
                        alt={scan.foodName}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        data-testid={`img-food-${scan.id}`}
                        onError={(e) => {
                          console.log('Image failed to load:', scan.imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-slate-800 truncate pr-2" data-testid={`text-food-name-${scan.id}`}>
                          {scan.foodName}
                        </h4>
                        {scan.confidence && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {Math.round(scan.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1" data-testid={`text-scan-time-${scan.id}`}>
                        <Clock className="w-3 h-3" />
                        {format(new Date(scan.scannedAt!), 'h:mm a')} • {getMealTypeIcon(scan.mealType)} {scan.mealType || 'Meal'}
                      </p>
                      
                      <div className="mt-3">
                        <div className="text-3xl font-bold text-amber-500 mb-2" data-testid={`text-calories-${scan.id}`}>
                          {scan.calories} cal
                        </div>
                        <div className="flex space-x-6 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-slate-700" data-testid={`text-protein-${scan.id}`}>
                              {scan.protein}g Protein
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-slate-700" data-testid={`text-carbs-${scan.id}`}>
                              {scan.carbs}g Carbs
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
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
        )}
      </div>

      {/* Pro Subscription Prompt */}
      <div className="px-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">Upgrade to CalAI Pro</h3>
              <p className="text-white/90 text-sm mb-4">
                Unlimited AI food scanning & detailed nutritional insights
              </p>
              
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <div className="text-2xl font-bold mb-1">$9.99/month</div>
                <div className="text-sm text-white/80">3-day free trial</div>
              </div>

              <div className="space-y-2 text-sm text-left mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Unlimited food scans per day</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Detailed macro & micro nutrients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Meal history & analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Custom calorie goals</span>
                </div>
              </div>

              <Button 
                className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-semibold"
                data-testid="button-start-trial"
                onClick={() => {
                  toast({
                    title: "Free Trial Started! 🎉",
                    description: "Welcome to CalAI Pro! You now have unlimited scans for 3 days.",
                  });
                }}
              >
                Start Free Trial
              </Button>
              <p className="text-xs text-white/70 mt-2">Cancel anytime. Terms apply.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
