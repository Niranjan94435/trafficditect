
import React, { useState, useRef, useEffect, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';
import StatsCard from './components/StatsCard';
import AnalyticsPanel from './components/AnalyticsPanel';
import MotionPanel from './components/MotionPanel';
import LoginPage from './components/LoginPage';
import { analyzeTrafficFrameYOLO } from './services/yoloVisionService';
import { motionDetector, MotionMetrics } from './services/motionDetectionService';
import { accidentDetector, AccidentMetrics } from './services/accidentDetectionService';
import { TrafficStats, PollutionMetrics, HistoricalData, DetectionResult, ObjectType } from './types';
import { EMISSION_FACTORS, CONGESTION_THRESHOLDS, ANALYSIS_INTERVAL_MS } from './constants';
import { onAuthStateChange, signOut } from './services/supabaseClient';
import { saveTrafficAnalysis, getOrCreateUserProfile } from './services/supabaseDatabaseService';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>({ id: 'demo-user', email: 'demo@example.com' });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('demo@example.com');
  const [currentUserName, setCurrentUserName] = useState<string>('Demo User');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('Never');
  const [currentDetections, setCurrentDetections] = useState<DetectionResult[]>([]);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [motionMetrics, setMotionMetrics] = useState<MotionMetrics>({
    motionDetected: false,
    motionIntensity: 0,
    motionAreas: [],
    timestamp: Date.now(),
  });
  const [accidentMetrics, setAccidentMetrics] = useState<AccidentMetrics>({
    accidentDetected: false,
    severity: 'none',
    confidence: 0,
    location: null,
    type: null,
    timestamp: Date.now(),
    objectsInvolved: 0,
  });

  const [stats, setStats] = useState<TrafficStats>({
    pedestrians: 0,
    cars: 0,
    buses: 0,
    trucks: 0,
    bikes: 0,
    animals: 0,
    crowds: 0,
    crowdPersonCount: 0,
    congestion: 'Low',
    density: 0
  });

  const [pollution, setPollution] = useState<PollutionMetrics>({
    co2: 0,
    nox: 0,
    pm25: 0
  });

  // Check auth state on component mount
  // Disabled for demo mode - always show dashboard
  useEffect(() => {
    // const unsubscribe = onAuthStateChange((user) => {
    //   if (user) {
    //     setCurrentUser(user);
    //     setCurrentUserEmail(user.email || '');
    //     setCurrentUserName(user.user_metadata?.full_name || user.email || '');
    //     setIsAuthenticated(true);
    //   } else {
    //     setCurrentUser(null);
    //     setCurrentUserEmail('');
    //     setCurrentUserName('');
    //     setIsAuthenticated(false);
    //   }
    // });

    // return unsubscribe;
  }, []);

  useEffect(() => {
    async function initializeVision() {
      try {
        // Initialize TensorFlow.js and COCO-SSD model
        console.log('Initializing YOLO v8 Vision Engine...');
        // Model will be loaded on first detection call
      } catch (error) {
        console.error('Vision initialization failed:', error);
      }
    }

    async function setupCamera() {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }
          }
        });
        console.log('Camera stream obtained:', stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready before starting analysis
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback');
            videoRef.current?.play().catch(err => console.error('Video play error:', err));
          };
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        const errorMessage = err?.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access.' 
          : err?.name === 'NotFoundError' 
          ? 'No camera device found.' 
          : 'Camera unavailable.';
        setHasCameraError(errorMessage);
      }
    }

    // Only initialize camera after authentication
    if (isAuthenticated) {
      initializeVision();
      setupCamera();
    }

    return () => {
      motionDetector.reset();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isAuthenticated]);

  const calculateMetrics = useCallback((detections: DetectionResult[]) => {
    const newStats: TrafficStats = {
      pedestrians: 0, cars: 0, buses: 0, trucks: 0, bikes: 0, animals: 0,
      crowds: 0, crowdPersonCount: 0,
      congestion: 'Low',
      density: 0
    };

    let currentCo2 = 0;
    let currentNox = 0;
    let currentPm25 = 0;

    detections.forEach(d => {
      const count = d.count;
      if (d.type === 'person') newStats.pedestrians += count;
      else if (d.type === 'car') newStats.cars += count;
      else if (d.type === 'bus') newStats.buses += count;
      else if (d.type === 'truck') newStats.trucks += count;
      else if (d.type === 'bike') newStats.bikes += count;
      else if (d.type === 'animal') newStats.animals += count;

      const factors = EMISSION_FACTORS[d.type as ObjectType] || EMISSION_FACTORS.car;
      currentCo2 += factors.co2 * count;
      currentNox += factors.nox * count;
      currentPm25 += factors.pm25 * count;
    });
    
    // Simple crowd detection: 5+ persons in view = crowd
    if (newStats.pedestrians >= 5) {
      newStats.crowds = 1;
      newStats.crowdPersonCount = newStats.pedestrians;
    }

    const totalVehicles = newStats.cars + newStats.buses + newStats.trucks + newStats.bikes;
    newStats.density = totalVehicles;

    if (totalVehicles >= CONGESTION_THRESHOLDS.HIGH) newStats.congestion = 'High';
    else if (totalVehicles >= CONGESTION_THRESHOLDS.MEDIUM) newStats.congestion = 'Medium';
    else newStats.congestion = 'Low';

    setStats(newStats);
    setPollution({ co2: currentCo2, nox: currentNox, pm25: currentPm25 });
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => {
      const newHistory = [...prev, { timestamp, co2: currentCo2, nox: currentNox, pm25: currentPm25, density: totalVehicles }];
      return newHistory.slice(-20);
    });

    // Save to Supabase
    if (currentUser?.id) {
      saveTrafficAnalysis(currentUser.id, newStats, { co2: currentCo2, nox: currentNox, pm25: currentPm25 });
    }
  }, [currentUser]);

  const runAnalysis = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    
    // Only run analysis if video is actually playing
    if (videoRef.current.paused || videoRef.current.ended) return;

    setIsAnalyzing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Optimized for speed: smaller resolution = faster detection
      const maxWidth = 416; // Reduced from 640 for faster inference
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Run YOLO v8 detection using TensorFlow.js (no delay - direct inference)
        const detections = await analyzeTrafficFrameYOLO(canvas);
        setCurrentDetections(detections);
        calculateMetrics(detections);
        setLastAnalysisTime(new Date().toLocaleTimeString());

        // Perform motion detection in parallel
        const motionData = motionDetector.analyzeMotion(video, video.videoWidth, video.videoHeight);
        setMotionMetrics(motionData);

        // Perform accident detection
        const accidentData = accidentDetector.detectAccident(
          detections,
          motionData.motionIntensity,
          stats.density,
          video.videoWidth,
          video.videoHeight
        );
        setAccidentMetrics(accidentData);
      }
    } catch (err) {
      console.error("YOLO Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, calculateMetrics]);

  useEffect(() => {
    const timer = setInterval(() => {
      runAnalysis();
    }, ANALYSIS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [runAnalysis]);

  const handleLogin = (userId: string, email: string, fullName: string) => {
    setCurrentUserEmail(email);
    setCurrentUserName(fullName);
    // The user state will be set via the auth listener
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentUserEmail('');
    setCurrentUserName('');
    setIsAuthenticated(false);
  };

  // Demo mode - always show dashboard
  // if (!isAuthenticated) {
  //   return <LoginPage onLogin={handleLogin} />;
  // }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader currentUser={currentUserName} onLogout={handleLogout} />

      {/* Accident Alert Banner */}
      {accidentMetrics.accidentDetected && (
        <div className={`animate-pulse border-b-2 ${
          accidentMetrics.severity === 'critical' ? 'bg-red-950 border-red-500' :
          accidentMetrics.severity === 'high' ? 'bg-orange-950 border-orange-500' :
          accidentMetrics.severity === 'medium' ? 'bg-yellow-950 border-yellow-500' :
          'bg-amber-950 border-amber-500'
        }`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`animate-pulse text-2xl ${
                  accidentMetrics.severity === 'critical' ? 'text-red-500' :
                  accidentMetrics.severity === 'high' ? 'text-orange-500' :
                  accidentMetrics.severity === 'medium' ? 'text-yellow-500' :
                  'text-amber-500'
                }`}>⚠️</div>
                <div>
                  <div className={`font-bold text-sm uppercase tracking-wider ${
                    accidentMetrics.severity === 'critical' ? 'text-red-400' :
                    accidentMetrics.severity === 'high' ? 'text-orange-400' :
                    accidentMetrics.severity === 'medium' ? 'text-yellow-400' :
                    'text-amber-400'
                  }`}>
                    {accidentMetrics.severity.toUpperCase()} SEVERITY - ACCIDENT DETECTED
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Type: {accidentMetrics.type ? accidentMetrics.type.toUpperCase() : 'UNKNOWN'} | 
                    Confidence: {accidentMetrics.confidence.toFixed(0)}% | 
                    Objects Involved: {accidentMetrics.objectsInvolved}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {new Date(accidentMetrics.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl group">
            {hasCameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 6v2" />
                </svg>
                <p className="text-sm text-red-400 font-semibold mb-2">Camera Error</p>
                <p className="text-xs text-slate-400">{hasCameraError}</p>
                <p className="text-xs text-slate-500 mt-4">Please check:</p>
                <ul className="text-xs text-slate-400 mt-2 space-y-1">
                  <li>• Browser has camera permission</li>
                  <li>• Camera is not in use by another app</li>
                  <li>• HTTPS is being used</li>
                </ul>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay={true}
                  playsInline={true}
                  muted={true}
                  style={{ transform: 'scaleX(-1)' }}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 pointer-events-none">
                  {currentDetections.map((det, idx) => {
                    if (!det.box_2d) return null;
                    const [ymin, xmin, ymax, xmax] = det.box_2d;
                    return (
                      <div 
                        key={idx}
                        className="absolute border-2 border-yellow-400/80 rounded shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all duration-300"
                        style={{
                          top: `${ymin / 10}%`,
                          left: `${xmin / 10}%`,
                          height: `${(ymax - ymin) / 10}%`,
                          width: `${(xmax - xmin) / 10}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 flex items-center gap-1">
                          <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase whitespace-nowrap">
                            {det.type}
                          </span>
                          {det.registrationNumber && (
                            <span className="bg-slate-950/90 text-yellow-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-400/50 shadow-lg whitespace-nowrap">
                              {det.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Motion Detection Overlays */}
                  {motionMetrics.motionAreas.map((area, idx) => (
                    <div
                      key={`motion-${idx}`}
                      className="absolute border-2 border-cyan-400/60 rounded animate-pulse"
                      style={{
                        left: `${(area.x / videoRef.current!.videoWidth) * 100}%`,
                        top: `${(area.y / videoRef.current!.videoHeight) * 100}%`,
                        width: `${(area.width / videoRef.current!.videoWidth) * 100}%`,
                        height: `${(area.height / videoRef.current!.videoHeight) * 100}%`,
                        backgroundColor: `rgba(34, 211, 238, ${area.intensity / 200})`,
                        boxShadow: `0 0 ${area.intensity / 10}px rgba(34, 211, 238, 0.6)`,
                      }}
                    />
                  ))}
                </div>

                <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
                  {isAnalyzing && (
                    <div className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter animate-pulse shadow-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-950 rounded-full animate-ping"></div>
                      Inference Engine Active
                    </div>
                  )}

                  {/* Accident Alert */}
                  {accidentMetrics.accidentDetected && (
                    <div className={`px-3 py-2 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-2 ${
                      accidentMetrics.severity === 'critical' ? 'bg-red-500 text-white animate-pulse' :
                      accidentMetrics.severity === 'high' ? 'bg-orange-500 text-white animate-pulse' :
                      accidentMetrics.severity === 'medium' ? 'bg-yellow-500 text-slate-950' :
                      'bg-amber-500 text-slate-950'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${accidentMetrics.severity === 'critical' || accidentMetrics.severity === 'high' ? 'animate-ping' : ''}`} 
                           style={{backgroundColor: 'inherit'}}></div>
                      🚨 ACCIDENT DETECTED
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">Ultra-Low Latency Feed</span>
                    </div>
                    <div className="h-3 w-px bg-slate-800"></div>
                    <span className="text-[9px] font-mono text-slate-500">Cycle: {ANALYSIS_INTERVAL_MS}ms</span>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">480p Downscaled Buffer</span>
                  </div>
                </div>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <StatsCard 
              label="Vehicles" 
              value={stats.cars + stats.buses + stats.trucks} 
              color="bg-emerald-500" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue={`${stats.cars} Units`}
            />
            <StatsCard 
              label="Person Count" 
              value={stats.pedestrians} 
              color="bg-blue-500" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue={`${stats.pedestrians} Count`}
            />
            <StatsCard 
              label="Crowds Detected" 
              value={stats.crowds} 
              color="bg-red-500" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM12.93 20H7a3 3 0 00-3 3v2h16v-2a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue={`${stats.crowdPersonCount} In Crowds`}
            />
             <StatsCard 
              label="Cargo Load" 
              value={stats.trucks + stats.buses} 
              color="bg-amber-500" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M3 14h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue="Heavy"
            />
            <StatsCard 
              label="Mobility" 
              value={stats.bikes} 
              color="bg-indigo-500" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue="Two-Wheeler"
            />
            <StatsCard
              label="Total Detection"
              value={stats.pedestrians + stats.cars + stats.buses + stats.trucks + stats.bikes}
              color="bg-purple-500"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue="Objects"
            />
            <StatsCard
              label="Accident Status"
              value={accidentMetrics.accidentDetected ? 1 : 0}
              color={accidentMetrics.severity === 'critical' ? 'bg-red-500' : accidentMetrics.severity === 'high' ? 'bg-orange-500' : 'bg-green-500'}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
              subValue={accidentMetrics.accidentDetected ? `${accidentMetrics.severity.toUpperCase()}` : 'CLEAR'}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Detection Vector Distribution</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Cars', val: stats.cars },
                { label: 'Buses', val: stats.buses },
                { label: 'Trucks', val: stats.trucks },
                { label: 'Bikes', val: stats.bikes },
                { label: 'Humans', val: stats.pedestrians }
              ].map(item => (
                <div key={item.label} className="bg-slate-950 rounded-xl p-3 border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">{item.label}</div>
                  <div className="text-xl font-bold text-slate-100">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
           <div className="sticky top-24 space-y-6">
              <MotionPanel motionMetrics={motionMetrics} />
              <AnalyticsPanel history={history} stats={stats} pollution={pollution} />
              
              <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-xl p-4">
                 <h5 className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider mb-2">YOLO v8 Vision Engine</h5>
                 <p className="text-[11px] text-slate-500 leading-relaxed">
                   Real-time object detection using YOLO v8 and OpenCV for precise classification of humans, vehicles, and motion tracking with spatial occupancy mapping.
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 uppercase">Engine Status</span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">YOLO v8 Active</span>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <footer className="p-6 text-center border-t border-slate-900 bg-slate-950 text-slate-600 text-[9px] font-mono tracking-widest uppercase mt-auto">
        &copy; 2024 VISION-X LABS • FAST INFERENCE TUNED
      </footer>
    </div>
  );
};

export default App;
