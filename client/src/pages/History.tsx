import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Star, TrendingUp, Filter } from "lucide-react";
import type { FoodScan } from "@shared/schema";

// Mock user ID
const CURRENT_USER_ID = "demo-user-123";

export default function History() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  
  // Fetch food scans with different limits based on period
  const { data: foodScans = [], isLoading } = useQuery<FoodScan[]>({
    queryKey: ['/api/food-scans', CURRENT_USER_ID],
    select: (data) => {
      // Filter based on selected period
      const now = new Date();
      let cutoffDate: Date;
      
      switch (selectedPeriod) {
        case 'today':
          cutoffDate = startOfDay(now);
          break;
        case 'week':
          cutoffDate = subDays(now, 7);
          break;
        case 'month':
          cutoffDate = subDays(now, 30);
          break;
        default:
          cutoffDate = startOfDay(now);
      }
      
      return data.filter(scan => 
        new Date(scan.scannedAt!) >= cutoffDate
      );
    }
  });

  const getMealTypeIcon = (mealType?: string | null) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getConfidenceColor = (confidence?: number | null) => {
    if (!confidence) return 'bg-gray-100 text-gray-600';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Group scans by date
  const groupedScans = foodScans.reduce((groups, scan) => {
    const date = format(new Date(scan.scannedAt!), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scan);
    return groups;
  }, {} as Record<string, FoodScan[]>);

  // Calculate summary stats
  const totalScans = foodScans.length;
  const totalCalories = foodScans.reduce((sum, scan) => sum + scan.calories, 0);
  const avgCaloriesPerScan = totalScans > 0 ? Math.round(totalCalories / totalScans) : 0;
  const avgConfidence = foodScans.length > 0 
    ? foodScans.reduce((sum, scan) => sum + (scan.confidence || 0), 0) / foodScans.length 
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800" data-testid="text-history-title">
            Scan History
          </h1>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Period Tabs */}
        <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" data-testid="tab-today">Today</TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week">This Week</TabsTrigger>
            <TabsTrigger value="month" data-testid="tab-month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600" data-testid="text-total-scans">
                {totalScans}
              </div>
              <div className="text-sm text-slate-500">Total Scans</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600" data-testid="text-total-calories-history">
                {totalCalories.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total Calories</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600" data-testid="text-avg-calories">
                {avgCaloriesPerScan}
              </div>
              <div className="text-sm text-slate-500">Avg per Scan</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-confidence">
                {Math.round(avgConfidence * 100)}%
              </div>
              <div className="text-sm text-slate-500">Avg Confidence</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scan History */}
      <div className="px-4 mb-6">
        {Object.keys(groupedScans).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                No scans found
              </h3>
              <p className="text-slate-500 text-sm">
                No food scans found for the selected period. Start scanning to build your history!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedScans)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([date, scans]) => (
                <div key={date}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-700" data-testid={`text-date-${date}`}>
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="text-sm text-slate-500">
                      ({scans.length} scan{scans.length !== 1 ? 's' : ''})
                    </div>
                  </div>

                  <div className="space-y-3">
                    {scans.map((scan) => (
                      <Card key={scan.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            {scan.imageUrl && (
                              <img 
                                src={scan.imageUrl}
                                alt={scan.foodName}
                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                data-testid={`img-food-history-${scan.id}`}
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-slate-800 truncate pr-2" data-testid={`text-food-name-history-${scan.id}`}>
                                  {scan.foodName}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {scan.confidence && (
                                    <Badge 
                                      className={`text-xs ${getConfidenceColor(scan.confidence)}`}
                                      data-testid={`badge-confidence-${scan.id}`}
                                    >
                                      <Star className="w-3 h-3 mr-1" />
                                      {Math.round(scan.confidence * 100)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1" data-testid={`text-scan-time-history-${scan.id}`}>
                                <Clock className="w-3 h-3" />
                                {format(new Date(scan.scannedAt!), 'h:mm a')} • {getMealTypeIcon(scan.mealType)} {scan.mealType || 'Meal'}
                              </p>
                              
                              <div className="flex items-center justify-between mt-3">
                                <div className="text-2xl font-bold text-amber-500" data-testid={`text-calories-history-${scan.id}`}>
                                  {scan.calories} cal
                                </div>
                                <div className="flex space-x-4 text-xs">
                                  <div className="text-center">
                                    <div className="font-medium text-slate-700" data-testid={`text-protein-history-${scan.id}`}>
                                      {scan.protein}g
                                    </div>
                                    <div className="text-slate-500">Protein</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-slate-700" data-testid={`text-carbs-history-${scan.id}`}>
                                      {scan.carbs}g
                                    </div>
                                    <div className="text-slate-500">Carbs</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-slate-700" data-testid={`text-fat-history-${scan.id}`}>
                                      {scan.fat}g
                                    </div>
                                    <div className="text-slate-500">Fat</div>
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
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
