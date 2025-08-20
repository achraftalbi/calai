import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProcessingModalProps {
  isOpen: boolean;
  progress?: number;
}

export default function ProcessingModal({ isOpen, progress = 65 }: ProcessingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-sm" data-testid="modal-processing">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-800 mb-2" data-testid="text-processing-title">
            Analyzing Your Food
          </h3>
          
          <p className="text-slate-600 text-sm mb-4" data-testid="text-processing-description">
            Our AI is identifying ingredients and calculating nutritional values...
          </p>
          
          <Progress 
            value={progress} 
            className="w-full mb-2"
            data-testid="progress-analysis"
          />
          
          <p className="text-xs text-slate-500" data-testid="text-processing-status">
            Processing... (~2 seconds remaining)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
