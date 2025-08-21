import { useState } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  Smartphone, 
  Settings, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export function GoogleFitTroubleshooting() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          Google Fit Not Detecting Activities?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-700 mb-3">
          If your walking/running activities aren't appearing, your phone may not be sharing data with Google Fit.
        </p>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Show Setup Instructions</span>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Step 1: Enable Google Fit on Your Phone
                </h4>
                <ul className="text-sm text-amber-700 space-y-1 ml-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Download and open the <strong>Google Fit app</strong> from your app store</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Sign in with the same Google account you used for CalAI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Complete the setup and allow all permissions</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Step 2: Enable Activity Detection
                </h4>
                <ul className="text-sm text-amber-700 space-y-1 ml-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>In Google Fit, go to <strong>Profile → Settings</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Turn on <strong>"Track your activities"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Enable <strong>"Activity detection"</strong> for walking, running, cycling</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">📱 Step 3: Test Activity Detection</h4>
                <ul className="text-sm text-amber-700 space-y-1 ml-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Go for a <strong>15+ minute walk</strong> with your phone in your pocket</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Check Google Fit app after your walk - you should see the activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Return to CalAI and click <strong>"Sync Now"</strong></span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Google Fit may take 15-30 minutes to detect activities automatically. 
                  Manual activities work immediately in CalAI using the "Add Workout" feature.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}