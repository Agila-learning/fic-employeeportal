import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
  capturedImage?: string | null;
}

const FaceCapture = ({ onCapture, disabled, capturedImage }: FaceCaptureProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isFrontCameraRef = useRef(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isFrontCameraRef.current = isFrontCamera;
  }, [isFrontCamera]);

  // CRITICAL: getUserMedia must be called directly from user gesture (click handler)
  const startCamera = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Camera] getUserMedia not available');
        setError('Camera not supported on this browser. Please use Chrome, Safari, or Firefox.');
        setIsLoading(false);
        return;
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Request camera access - MUST be direct from click, no setTimeout/useEffect
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFrontCameraRef.current ? 'user' : 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      console.log('[Camera] Requesting access with constraints:', JSON.stringify(constraints));
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera] Stream obtained:', stream.id, 'Tracks:', stream.getTracks().length);
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set up video element properly
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = async () => {
          console.log('[Camera] Video metadata loaded');
          try {
            await videoRef.current?.play();
            console.log('[Camera] Video playing successfully');
            setIsStreaming(true);
            setIsLoading(false);
          } catch (playErr: any) {
            console.error('[Camera] Play error:', playErr.name, playErr.message);
            setError('Failed to start video preview. Please try again.');
            setIsLoading(false);
          }
        };
        
        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error('[Camera] Video element error:', e);
          setError('Video playback error. Please try again.');
          setIsLoading(false);
        };
      } else {
        console.error('[Camera] videoRef.current is null');
        setError('Video element not ready. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Camera] Error:', err.name, err.message);
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please enable camera permissions in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another app. Please close other apps using the camera and try again.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        // Try again without facing mode constraint
        console.log('[Camera] Trying fallback without constraints');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setIsStreaming(true);
            console.log('[Camera] Fallback stream working');
          }
        } catch (fallbackErr: any) {
          console.error('[Camera] Fallback also failed:', fallbackErr);
          setError('Failed to access camera. Please try again.');
        }
      } else if (err.name === 'SecurityError') {
        setError('Camera access blocked by browser security. Please ensure you are using HTTPS.');
      } else if (err.name === 'AbortError') {
        setError('Camera access was aborted. Please try again.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Flip horizontally for front camera (mirror effect)
      if (isFrontCameraRef.current) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('[Camera] Photo captured');
      onCapture(imageData);
      stopCamera();
    }
  };

  const toggleCamera = async () => {
    const newFacingMode = !isFrontCamera;
    setIsFrontCamera(newFacingMode);
    isFrontCameraRef.current = newFacingMode;
    
    if (isStreaming) {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // CRITICAL: getUserMedia called directly in click handler - no setTimeout
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: newFacingMode ? 'user' : 'environment',
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
        }
      } catch (err: any) {
        console.error('[Camera] Toggle error:', err);
        setError('Failed to switch camera. Please try again.');
        setIsStreaming(false);
      }
    }
  };

  const retakePhoto = () => {
    onCapture('');
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        {/* Always render video element so ref is available, hide when not streaming */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className={cn(
            "w-full h-48 object-cover",
            isFrontCamera && "scale-x-[-1]",
            (!isStreaming || capturedImage) && "hidden"
          )}
        />
        
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
        ) : isStreaming ? null : isLoading ? (
          /* Show loading state */
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-10 w-10 mb-2 animate-spin text-primary" />
            <p className="text-sm">Opening camera...</p>
            <p className="text-xs opacity-70">Please allow camera access</p>
          </div>
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
            disabled={disabled || isLoading}
            className="flex-1"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <Camera className="h-3 w-3 mr-1" />
                Open Camera
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
