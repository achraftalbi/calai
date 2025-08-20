import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraInterfaceProps {
  onCapture: (file: File) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function CameraInterface({ onCapture, isProcessing, className }: CameraInterfaceProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported by this browser");
      }

      // Try with back camera first, fallback to any camera
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment' // Use back camera on mobile
          }
        });
      } catch (backCameraError) {
        console.log("Back camera not available, trying front camera...");
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      setStream(mediaStream);
      setIsActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video starts playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMessage = "Unable to access camera. ";
      
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please click 'Allow' when your browser asks for camera permission.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is already in use by another application.";
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += "Camera doesn't support the requested settings.";
      } else if (err.name === 'SecurityError') {
        errorMessage += "Camera access blocked due to security restrictions.";
      } else if (err.message === "Camera not supported by this browser") {
        errorMessage += "This browser doesn't support camera access.";
      } else {
        errorMessage += "Please check your camera permissions and try again.";
      }
      
      setError(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setError(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `food-scan-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [onCapture, stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onCapture(file);
    }
  }, [onCapture]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (!isActive) {
    return (
      <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-200", className)}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Scan Your Food</h3>
        
        <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl h-64 relative overflow-hidden mb-4 border-2 border-dashed border-slate-300 flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Camera preview will appear here</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Button 
            onClick={startCamera}
            disabled={isProcessing}
            className="bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700"
            data-testid="button-start-camera"
          >
            <Camera className="w-4 h-4 mr-2" />
            Open Camera
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            data-testid="button-upload-image"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="input-file-upload"
        />

        <div className="text-center mt-4">
          <p className="text-sm text-slate-500">Point camera at your food and tap to scan</p>
          <p className="text-xs text-slate-400 mt-1">AI analysis takes ~3 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-200", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Camera Active</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={stopCamera}
          data-testid="button-close-camera"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="relative rounded-2xl overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover bg-black"
          data-testid="video-camera-feed"
          onLoadedData={() => {
            console.log("Video loaded and ready");
          }}
          onError={(e) => {
            console.error("Video element error:", e);
          }}
        />
        
        {/* Scan line animation */}
        <div className="absolute inset-0 opacity-60">
          <div className="animate-pulse w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent absolute top-1/2 transform -translate-y-1/2" />
        </div>
        
        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-2 border-indigo-500 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={capturePhoto}
          disabled={isProcessing}
          className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 rounded-full p-0"
          data-testid="button-capture-photo"
        >
          <Camera className="w-8 h-8" />
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
