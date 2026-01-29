import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
  capturedImage?: string | null;
}

const FaceCapture = ({ onCapture, disabled, capturedImage }: FaceCaptureProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  }, [isFrontCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Flip horizontally for front camera (mirror effect)
      if (isFrontCamera) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
      stopCamera();
    }
  }, [isFrontCamera, onCapture, stopCamera]);

  const toggleCamera = useCallback(() => {
    setIsFrontCamera(prev => !prev);
    if (isStreaming) {
      stopCamera();
      // Will restart with new facing mode
      setTimeout(() => startCamera(), 100);
    }
  }, [isStreaming, stopCamera, startCamera]);

  const retakePhoto = useCallback(() => {
    onCapture('');
    startCamera();
  }, [onCapture, startCamera]);

  // Cleanup on unmount
  const handleUnmount = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Face Photo</span>
        </div>
        {isStreaming && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleCamera}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Flip
          </Button>
        )}
      </div>

      <div className={cn(
        "relative rounded-lg overflow-hidden bg-muted border-2 border-dashed",
        capturedImage && "border-success/50 border-solid",
        error && "border-destructive/50"
      )}>
        {/* Show captured image */}
        {capturedImage ? (
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured face" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-success/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Captured
            </div>
          </div>
        ) : isStreaming ? (
          /* Show video stream */
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-48 object-cover",
              isFrontCamera && "scale-x-[-1]"
            )}
          />
        ) : (
          /* Show placeholder */
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Capture your face photo</p>
            <p className="text-xs opacity-70">Required for attendance</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {capturedImage ? (
          <Button
            type="button"
            variant="outline"
            onClick={retakePhoto}
            disabled={disabled}
            className="flex-1"
            size="sm"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retake Photo
          </Button>
        ) : isStreaming ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              disabled={disabled}
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={disabled}
              className="flex-1 bg-primary"
              size="sm"
            >
              <Camera className="h-3 w-3 mr-1" />
              Capture
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="flex-1"
            size="sm"
          >
            <Camera className="h-3 w-3 mr-1" />
            Open Camera
          </Button>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
