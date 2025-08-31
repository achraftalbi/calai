import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CameraInterface from "@/components/CameraInterface";
import ProcessingModal from "@/components/ProcessingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ScanLine, 
  BarChart3, 
  Search,
  Star,
  Plus,
  Minus
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalAILogo } from "@/components/CalAILogo";

interface FoodItem {
  id: string;
  name: string;
  kcal: number;
  confidence: number;
  portion: number; // percentage, 100 = normal portion
}

export default function Scan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([]);
  const [showPortionEditor, setShowPortionEditor] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const handleFileCapture = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      setProcessingProgress(20);
      
      // Get upload URL first
      const uploadResponse = await apiRequest('POST', '/api/food-scan/upload');
      const { uploadURL } = await uploadResponse.json();
      
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
        throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.statusText}`);
      }

      setProcessingProgress(70);
      
      // Analyze the uploaded image
      const response = await apiRequest('POST', '/api/food-scan/analyze', {
        imageUrl: uploadURL,
      });

      const result = await response.json();
      
      // Transform response to multiple food items
      const foods: FoodItem[] = result.items ? result.items.map((item: any, index: number) => ({
        id: `item-${index}`,
        name: item.name || result.analysis.foodName,
        kcal: item.kcal || Math.floor(result.analysis.calories * (item.portion || 1)),
        confidence: result.analysis.confidence || 0.8,
        portion: 100 // default normal portion
      })) : [{
        id: 'main-item',
        name: result.analysis.foodName,
        kcal: result.analysis.calories,
        confidence: result.analysis.confidence || 0.8,
        portion: 100
      }];

      setDetectedFoods(foods);
      setShowPortionEditor(true);
      setProcessingProgress(100);
      
    } catch (error: any) {
      console.error('Analysis failed:', error);
      let title = "Analysis Failed";
      let description = "Please try again with a clearer image";
      
      if (error.message?.includes('401')) {
        title = "Authentication Required";
        description = "Please log in to analyze food images";
      } else if (error.message?.includes('413')) {
        title = "Image Too Large";
        description = "Please use a smaller image (max 10MB)";
      } else if (error.message?.includes('415')) {
        title = "Invalid Image Format";
        description = "Please use JPG, PNG, or WebP format";
      } else if (error.message?.includes('Upload failed')) {
        title = "Upload Failed";
        description = `Upload error: ${error.message}`;
      }
      
      toast({
        title,
        description,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 500);
    }
  };

  const updatePortion = (itemId: string, newPortion: number) => {
    setDetectedFoods(foods => 
      foods.map(food => 
        food.id === itemId 
          ? { 
              ...food, 
              portion: newPortion,
              kcal: Math.floor((food.kcal / food.portion) * newPortion)
            }
          : food
      )
    );
  };

  const saveMeal = async () => {
    try {
      const totalKcal = detectedFoods.reduce((sum, food) => sum + food.kcal, 0);
      
      await apiRequest('POST', '/api/food-scans', {
        foodName: detectedFoods.map(f => f.name).join(', '),
        calories: totalKcal,
        protein: Math.floor(totalKcal * 0.15 / 4), // Rough estimate
        carbs: Math.floor(totalKcal * 0.5 / 4),
        fat: Math.floor(totalKcal * 0.35 / 9),
        confidence: Math.min(...detectedFoods.map(f => f.confidence)),
        mealType: 'meal'
      });

      queryClient.invalidateQueries({ queryKey: ['/api/food-scans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-stats'] });

      toast({
        title: "Meal Saved! 🍽️",
        description: `${totalKcal} calories added to your daily total`
      });

      setDetectedFoods([]);
      setShowPortionEditor(false);
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20 px-4 py-6">
      <ProcessingModal isOpen={isProcessing} progress={processingProgress} />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-calai-primary to-calai-secondary rounded-full flex items-center justify-center">
          <ScanLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Food Scanner</h1>
          <p className="text-slate-600">Point, scan, track your nutrition</p>
        </div>
      </div>

      {!showPortionEditor ? (
        <>
          {/* Camera Interface */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalAILogo size={20} />
                Scan Your Food
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CameraInterface 
                onCapture={handleFileCapture}
                isProcessing={isProcessing}
              />
              <p className="text-sm text-slate-500 text-center mt-4">
                Position your food in the frame and tap to scan. Works best with good lighting!
              </p>
            </CardContent>
          </Card>

          {/* Alternative Options */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 text-calai-primary mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 mb-1">Barcode</h3>
                <p className="text-xs text-slate-500">Scan product codes</p>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Search className="w-8 h-8 text-calai-secondary mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 mb-1">Search</h3>
                <p className="text-xs text-slate-500">Find foods manually</p>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Portion Editor */
        <Card>
          <CardHeader>
            <CardTitle>Adjust Your Portions</CardTitle>
            <p className="text-sm text-slate-600">
              Fine-tune the serving sizes for accurate nutrition tracking
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {detectedFoods.map((food) => (
              <div key={food.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-800">{food.name}</h4>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    ±{Math.round(food.kcal * 0.15)} kcal
                  </Badge>
                </div>
                
                <div className="text-2xl font-bold text-amber-600 mb-4">
                  {food.kcal} calories
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Portion Size</span>
                    <span className="text-sm text-slate-500">{food.portion}%</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => updatePortion(food.id, Math.max(25, food.portion - 25))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <input
                        type="range"
                        min="25"
                        max="200"
                        step="25"
                        value={food.portion}
                        onChange={(e) => updatePortion(food.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Quarter</span>
                        <span>Normal</span>
                        <span>Double</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => updatePortion(food.id, Math.min(200, food.portion + 25))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-slate-800">Total Calories</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {detectedFoods.reduce((sum, food) => sum + food.kcal, 0)}
                </span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetectedFoods([]);
                    setShowPortionEditor(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={saveMeal} className="flex-1">
                  Save Meal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}