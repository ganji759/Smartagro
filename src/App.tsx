/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage, signIn, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addToQueue, getPendingJobs, removeJob, SyncJob } from './lib/offline';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Leaf, 
  History, 
  CloudOff, 
  Globe,
  X,
  Cloud,
  Mic,
  Menu
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="text-red-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            The application encountered an error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#5A5A40] text-white px-8 py-3 rounded-2xl font-semibold shadow-lg"
          >
            Refresh App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ShambaApp />
    </ErrorBoundary>
  );
}

function ShambaApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<SyncJob[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnose' | 'history' | 'weather'>('diagnose');
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Maize');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(loc);
          fetchWeather(loc);
        },
        (err) => console.error("Location error:", err)
      );
    }
  }, []);

  const fetchWeather = async (loc: { lat: number; lon: number }) => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey || apiKey === "YOUR_OPENWEATHER_API_KEY") return;

    setIsWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error("Weather fetch error:", err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const path = 'advisories';
      const q = query(
        collection(db, path),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAdvisories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return unsubscribe;
    }
  }, [user]);

  useEffect(() => {
    const checkPending = async () => {
      const jobs = await getPendingJobs();
      setPendingJobs(jobs);
    };
    checkPending();
  }, [isOnline]);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCapturing(false);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const job: SyncJob = {
            id: crypto.randomUUID(),
            imageBlob: blob,
            cropType: selectedCrop,
            timestamp: Date.now(),
            status: 'pending'
          };
          
          await addToQueue(job);
          setPendingJobs(prev => [...prev, job]);
          
          // Stop camera
          const stream = videoRef.current?.srcObject as MediaStream;
          stream?.getTracks().forEach(track => track.stop());
          setIsCapturing(false);

          if (isOnline) {
            handleSync(job);
          }
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleSync = async (job: SyncJob) => {
    if (!user) return;
    setIsDiagnosing(true);
    
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `diagnoses/${user.uid}/${job.id}.jpg`);
      const uploadResult = await uploadBytes(storageRef, job.imageBlob);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Convert blob to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(job.imageBlob);
      });
      const base64Data = await base64Promise;
      const base64Image = base64Data.split(',')[1];

      // 3. Call Gemini for instant plant identification and diagnosis
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: `You are an expert agricultural agronomist and pathologist. 
              First, identify the plant type in this image. 
              Then, diagnose any diseases, pests, or nutrient deficiencies.
              Provide: 
              1. Plant Type (Common name)
              2. Diagnosis (Disease/Pest Name)
              3. Confidence Score
              4. Immediate Action
              5. Long-term Prevention
              Keep it simple and actionable for a farmer.` },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ]
      });

      const result = response.text;
      
      // Try to extract plant type from text (simple heuristic)
      const plantTypeMatch = result.match(/Plant Type:?\s*([^\n\r]+)/i);
      const identifiedPlant = plantTypeMatch ? plantTypeMatch[1].trim() : job.cropType;

      setDiagnosisResult({
        crop: identifiedPlant,
        text: result,
        imageUrl: imageUrl,
        timestamp: new Date().toLocaleString()
      });

      // 4. Save to Firestore for history
      const path = 'advisories';
      try {
        await addDoc(collection(db, path), {
          uid: user.uid,
          cropType: identifiedPlant,
          diagnosis: result,
          imageUrl: imageUrl,
          createdAt: new Date().toISOString(),
          status: 'completed',
          urgency: 'medium',
          recommendation: result.substring(0, 150) + '...'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
      
      await removeJob(job.id);
      setPendingJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (err: any) {
      console.error("Sign in error:", err);
      setAuthError(err.message || "Failed to sign in. Please check your Firebase configuration.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 bg-[#5A5A40] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] mb-4">Shamba AI</h1>
          <p className="text-[#5A5A40] mb-8 text-lg">
            Professional agronomic advice in your pocket. Diagnose crop stress and pests instantly.
          </p>
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {authError}
            </div>
          )}
          <button 
            onClick={handleSignIn}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-[#4A4A30] transition-colors flex items-center justify-center gap-3"
          >
            <Globe className="w-5 h-5" />
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  const toggleVoice = () => {
    setIsListening(!isListening);
    // In a real app, use Web Speech API or Gemini Live
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        alert("Voice interface simulated: 'How can I help you with your Shamba today?'");
      }, 2000);
    }
  };

  const renderWeather = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold mb-4">Climate-Smart Planting</h2>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E5E5]">
        {isWeatherLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]" />
          </div>
        ) : weatherData ? (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Current Location</p>
              <p className="font-bold text-lg">{weatherData.name || 'Your Shamba'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{Math.round(weatherData.main.temp)}°C</p>
              <p className="text-sm text-[#5A5A40] capitalize">{weatherData.weather[0].description}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CloudOff className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Weather API key needed for real-time data.</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="p-4 bg-[#FDFCF8] rounded-2xl border border-[#E5E5E5]">
            <h4 className="font-bold text-[#5A5A40] mb-1">Planting Advisory</h4>
            <p className="text-sm text-gray-600">
              {weatherData 
                ? weatherData.main.temp > 25 
                  ? `High temperature detected (${Math.round(weatherData.main.temp)}°C). Ensure adequate irrigation for your ${selectedCrop}.`
                  : `Optimal conditions for ${selectedCrop} planting. Temperature is ${Math.round(weatherData.main.temp)}°C.`
                : "Connect your location to get personalized planting advice."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Humidity</p>
              <p className="font-bold">{weatherData ? `${weatherData.main.humidity}%` : '--'}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-[10px] uppercase font-bold text-green-600 mb-1">Wind Speed</p>
              <p className="font-bold">{weatherData ? `${weatherData.wind.speed} m/s` : '--'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg">Recommended Crops</h3>
        {['Sorghum', 'Beans'].map(crop => (
          <div key={crop} className="bg-white p-4 rounded-2xl border border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-[#5A5A40]" />
              </div>
              <span className="font-bold">{crop}</span>
            </div>
            <span className="text-xs font-bold text-green-600">95% Match</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="text-[#5A5A40] w-6 h-6" />
          <span className="font-serif font-bold text-xl text-[#1A1A1A]">Shamba AI</span>
        </div>
        <div className="flex items-center gap-4">
          {!isOnline && (
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CloudOff className="w-3 h-3" /> Offline
            </div>
          )}
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">Sign Out</button>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {activeTab === 'diagnose' ? (
          <div className="space-y-6">
            {diagnosisResult && !isCapturing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FDFCF8] rounded-3xl p-6 border-2 border-[#5A5A40] shadow-lg mb-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-[#5A5A40]">Agri-Expert Result</h3>
                  <button 
                    onClick={() => setDiagnosisResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {diagnosisResult.imageUrl && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border border-[#E5E5E5]">
                    <img 
                      src={diagnosisResult.imageUrl} 
                      alt="Diagnosed crop" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="font-bold mb-2">Crop: {diagnosisResult.crop}</p>
                  <div className="whitespace-pre-wrap">{diagnosisResult.text}</div>
                </div>
                <p className="text-[10px] text-gray-400 mt-4">Diagnosed at {diagnosisResult.timestamp}</p>
              </motion.div>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E5E5]">
              <h2 className="text-2xl font-serif font-bold mb-4">New Diagnosis</h2>
              
              {!isCapturing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Crop</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Maize', 'Cassava', 'Banana', 'Yam', 'Garlic', 'Beans', 'Others'].map(crop => (
                        <button
                          key={crop}
                          onClick={() => setSelectedCrop(crop)}
                          className={cn(
                            "py-2 px-4 rounded-xl text-sm font-medium border transition-all",
                            selectedCrop === crop 
                              ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#5A5A40]"
                          )}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={startCamera}
                    className="w-full aspect-video bg-[#F5F5F0] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:bg-[#EBEBE0] transition-colors"
                  >
                    <Camera className="w-10 h-10 text-gray-400" />
                    <span className="text-gray-500 font-medium">Capture Crop Image</span>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button 
                      onClick={() => setIsCapturing(false)}
                      className="bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={captureImage}
                      disabled={isDiagnosing}
                      className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                    >
                      {isDiagnosing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-4 border-black" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {pendingJobs.length > 0 && (
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-200 p-2 rounded-lg">
                    <Upload className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">{pendingJobs.length} Pending Uploads</p>
                    <p className="text-sm text-orange-700">Will sync automatically when online.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg">Recent Advisories</h3>
              {advisories.slice(0, 3).map((adv) => (
                <div key={adv.id} className="bg-white p-4 rounded-2xl border border-[#E5E5E5] flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    <img 
                      src={adv.imageUrl || 'https://picsum.photos/seed/crop/200'} 
                      alt="Crop" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-[#1A1A1A]">{adv.diagnosis || 'Processing...'}</h4>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded",
                        adv.urgency === 'high' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      )}>
                        {adv.urgency || 'Low'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{adv.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold mb-6">History</h2>
            {advisories.map((adv) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={adv.id} 
                className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono text-gray-400">{new Date(adv.createdAt).toLocaleDateString()}</span>
                  <span className="text-sm font-medium text-[#5A5A40]">{adv.cropType}</span>
                </div>
                
                {adv.imageUrl && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-[#F5F5F0]">
                    <img 
                      src={adv.imageUrl} 
                      alt={adv.cropType} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{adv.diagnosis?.split('\n')[0] || 'Diagnosis'}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{adv.recommendation}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-[#5A5A40]">
                  <CheckCircle className="w-4 h-4" />
                  Verified by AI Agronomist
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          renderWeather()
        )}
      </main>

      {/* Voice Trigger */}
      <div className="fixed bottom-28 right-6">
        <button 
          onClick={toggleVoice}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all",
            isListening ? "bg-red-500 scale-110" : "bg-[#5A5A40]"
          )}
        >
          {isListening ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white animate-pulse" />
              <div className="w-1 h-6 bg-white animate-pulse delay-75" />
              <div className="w-1 h-4 bg-white animate-pulse delay-150" />
            </div>
          ) : (
            <Globe className="text-white w-8 h-8" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] px-6 py-4 flex justify-around items-center z-20">
        <button 
          onClick={() => setActiveTab('diagnose')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'diagnose' ? "text-[#5A5A40]" : "text-gray-400"
          )}
        >
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Diagnose</span>
        </button>
        <button 
          onClick={() => setActiveTab('weather')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'weather' ? "text-[#5A5A40]" : "text-gray-400"
          )}
        >
          <Leaf className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Weather</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'history' ? "text-[#5A5A40]" : "text-gray-400"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}
