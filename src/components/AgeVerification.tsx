import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Button from './Button';
import Card from './Card';
import { AGE_THRESHOLD } from '../constants';

interface AgeVerificationProps {
  onVerified: (age: number, imageData: string) => void;
  onRejected: (age: number) => void;
}

const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerified, onRejected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    if (isCameraActive) return;
    
    try {
      setError(null);
      setIsCameraLoading(true);
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      // First set camera active so the video element is rendered
      setIsCameraActive(true);
      
      // Use a small timeout or wait for the next tick to ensure the ref is populated
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video stream...');
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            setIsCameraLoading(false);
            videoRef.current?.play().catch(e => {
              console.error('Video play error:', e);
              setIsCameraLoading(false);
            });
          };
          
          // Fallback if onloadedmetadata doesn't fire quickly
          setTimeout(() => {
            if (isCameraLoading) {
              console.log('Metadata load fallback triggered');
              setIsCameraLoading(false);
              videoRef.current?.play().catch(e => console.error('Video play fallback error:', e));
            }
          }, 2000);
        } else {
          console.error('Video ref still null after setting isCameraActive');
          setError('Failed to initialize camera view. Please try again.');
          setIsCameraLoading(false);
        }
      }, 100);
    } catch (err) {
      setError('Could not access camera. Please ensure you have granted permission.');
      console.error('Camera error:', err);
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const [showFlash, setShowFlash] = useState(false);

  const captureImage = () => {
    console.log('Attempting to capture image...');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Video stream not ready. Please wait a moment and try again.');
        return;
      }

      const context = canvas.getContext('2d');
      if (context) {
        // Resize image to a smaller size for faster processing (e.g., max 640px width)
        const maxWidth = 640;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8); // Slightly lower quality for speed
        console.log('Image captured and resized successfully. Data length:', imageData.length);
        
        // Flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);
        
        setCapturedImage(imageData);
        stopCamera();
      } else {
        console.error('Could not get canvas context');
        setError('Failed to capture image. Please try again.');
      }
    } else {
      console.error('Video or Canvas ref missing', { video: !!videoRef.current, canvas: !!canvasRef.current });
      setError('Camera error. Please refresh and try again.');
    }
  };

  const verifyAge = async () => {
    if (!capturedImage) return;

    setIsVerifying(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please add it to the Secrets panel.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64Data = capturedImage.split(',')[1];

      console.log('Starting fast age verification with Gemini...');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: `Estimate the age of the person. Return JSON: {"age": number | null}. Example: {"age": 25}. If no face, {"age": null}.` },
              { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW
          }
        }
      });

      console.log('Gemini response received:', response.text);

      let result;
      try {
        // Clean the response text in case it has markdown backticks
        const cleanedText = response.text?.replace(/```json|```/g, '').trim() || '{}';
        result = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response:', response.text);
        throw new Error('Failed to understand AI response. Please try again.');
      }

      const age = result.age;

      if (age === null || age === undefined) {
        setError('No face detected or age could not be estimated. Please try again with a clearer photo.');
        setCapturedImage(null);
        startCamera();
      } else if (typeof age !== 'number') {
        setError('Invalid response from AI. Please try again.');
      } else if (age >= AGE_THRESHOLD) {
        console.log('Age verified:', age);
        onVerified(age, capturedImage);
      } else {
        console.log('Age rejected:', age);
        onRejected(age);
      }
    } catch (err: any) {
      setError(err.message || 'Age verification failed. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">AI Age Verification</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure & Private
          </div>
        </div>

        <p className="text-sm text-gray-500">
          We use AI to verify your age. Your photo is processed securely and is not stored on our servers.
        </p>

        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 border-2 border-dashed border-gray-300">
          {!isCameraActive && !capturedImage && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Camera className="h-12 w-12 text-gray-400" />
              <Button onClick={startCamera}>Start Camera</Button>
            </div>
          )}

          {isCameraActive && (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {isCameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-30">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  <p className="mt-2 text-sm font-medium text-gray-600">Starting camera...</p>
                </div>
              )}
              {showFlash && (
                <div className="absolute inset-0 bg-white animate-pulse z-20" />
              )}
              {!isCameraLoading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <Button onClick={captureImage} className="rounded-full h-14 w-14 p-0 shadow-lg hover:scale-110 transition-transform">
                    <div className="h-10 w-10 rounded-full border-4 border-white bg-red-500" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="relative h-full w-full">
              <img
                src={capturedImage}
                alt="Captured"
                className="h-full w-full object-cover"
              />
              {isVerifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-sm">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                  <p className="mt-4 font-medium">AI is estimating your age...</p>
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {capturedImage && !isVerifying && (
          <div className="flex gap-3">
            <Button onClick={verifyAge} className="flex-1">
              Verify Age
            </Button>
            <Button variant="outline" onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span>Age threshold: {AGE_THRESHOLD}+ years</span>
        </div>
      </div>
    </Card>
  );
};

export default AgeVerification;
