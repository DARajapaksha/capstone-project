import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Camera as CameraIcon, Eye, Brain, ShieldCheck, ArrowRight, Check, CheckCircle, RefreshCw, XCircle, Clock, Copy, FileText, Home, AlertCircle } from 'lucide-react';
import packageInfo from '../../package.json';

export default function VerificationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  
  // Processing & Result States
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Refs for video, canvas, and auto-scrolling steps
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stepRefs = useRef({});

  // --- AUTO-SCROLL ACTIVE STEP INTO VIEW ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepRefs.current[currentStep]) {
        stepRefs.current[currentStep].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center' 
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // --- CAMERA LIFECYCLE (Auto-start) ---
  useEffect(() => {
    if (currentStep === 2 && !selfieImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentStep, selfieImage]);

  // --- STEP 1: ID UPLOAD LOGIC ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  // --- STEP 2: CAMERA LOGIC ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    setSelfieImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
      alert("Could not access the camera. Please allow camera permissions in your browser.");
    }
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageUrl = canvas.toDataURL('image/jpeg');
      setSelfieImage(imageUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraOpen(false);
    }
  };

  // --- NAVIGATION & PROCESSING LOGIC ---
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleVerify = () => {
    setIsProcessing(true);
    
    // Simulate a 3-second backend AI processing request
    setTimeout(() => {
      setIsProcessing(false);
      
      // Randomly pick an outcome to demonstrate the UI (Success, Failed, or Manual Review)
      const outcomes = ['success', 'failed', 'review'];
      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      // Generate a realistic score based on the outcome
      let score;
      if (randomOutcome === 'success') score = Math.floor(Math.random() * (99 - 85 + 1)) + 85;
      else if (randomOutcome === 'review') score = Math.floor(Math.random() * (84 - 60 + 1)) + 60;
      else score = Math.floor(Math.random() * (59 - 20 + 1)) + 20;

      // Get current formatted date/time
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setVerificationResult({
        status: randomOutcome,
        score: score,
        date: `${dateString}, ${timeString}`,
        hash: randomOutcome === 'success' ? '0x' + Math.random().toString(16).substr(2, 40) : null
      });

      nextStep(); // Move to Step 5
    }, 3000);
  };

  const handleTryAgain = () => {
    setCurrentStep(1);
    setSelectedImage(null);
    setSelfieImage(null);
    setVerificationResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER HELPERS ---
  let progressPercentage = 0;
  if (currentStep === 1) {
    progressPercentage = selectedImage ? 20 : 0;
  } else if (currentStep === 2) {
    progressPercentage = selfieImage ? 40 : 20;
  } else if (currentStep === 3) {
    progressPercentage = 60; 
  } else if (currentStep === 4) {
    progressPercentage = 80;
  } else if (currentStep === 5) {
    progressPercentage = 100;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center mb-8 gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 w-max shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
          <div className="md:ml-4">
            <h1 className="text-2xl font-bold text-slate-900">Identity Verification</h1>
            <p className="text-slate-500 text-sm">Verifying identity for exam: <span className="font-semibold text-slate-700">MATH-401</span></p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium text-sm">Step {currentStep} of 5</span>
            <span className="text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
              {progressPercentage}% Complete
            </span>
          </div>
          
          <div className="h-2 w-full bg-indigo-50 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {[
              { id: 1, name: 'Upload ID', icon: Upload },
              { id: 2, name: 'Capture Selfie', icon: CameraIcon },
              { id: 3, name: 'Liveness Detection', icon: Eye },
              { id: 4, name: 'AI Processing', icon: Brain },
              { id: 5, name: 'Verification Result', icon: ShieldCheck },
            ].map((step) => {
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;

              return (
                <div 
                  key={step.id} 
                  ref={(el) => (stepRefs.current[step.id] = el)} 
                  className={`flex flex-col items-center justify-start min-w-[100px] p-3 rounded-xl border transition-all duration-300 snap-center ${
                    isActive ? 'border-indigo-100 bg-indigo-50/50' : 
                    isComplete ? 'border-green-100 bg-green-50/50' :
                    'border-transparent bg-transparent opacity-60'
                  }`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors ${
                    isComplete ? 'bg-green-500 text-white shadow-sm' :
                    isActive ? 'bg-indigo-500 text-white shadow-sm' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete ? <Check className="w-6 h-6" strokeWidth={3} /> : <step.icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight px-1 ${
                    isActive ? 'text-indigo-900' : 
                    isComplete ? 'text-green-800' :
                    'text-slate-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 1: UPLOAD ID CARD */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Upload ID</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">Upload a clear photo of your National ID or passport</p>

            {!selectedImage ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-slate-400 mb-4" />
                  <p className="mb-2 text-sm font-semibold text-slate-700">Click to upload ID document</p>
                  <p className="text-xs text-slate-500">Supported formats: JPG, PNG (Max 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="flex flex-col items-center w-full border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="w-full max-w-sm h-48 rounded-lg overflow-hidden mb-4 shadow-sm border border-slate-200 bg-white flex items-center justify-center">
                  <img src={selectedImage} alt="Uploaded ID" className="w-full h-full object-contain" />
                </div>
                <label className="w-full">
                  <div className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors text-center cursor-pointer shadow-sm">
                    Upload Different Image
                  </div>
                  <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
                </label>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CAPTURE SELFIE CARD */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CameraIcon className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Capture Selfie</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">Take a live selfie using your webcam</p>

            <div className="flex flex-col w-full">
              {!selfieImage ? (
                <>
                  <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm bg-black flex items-center justify-center mb-4">
                    {!isCameraOpen && <p className="text-slate-400 text-sm">Starting camera...</p>}
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl bg-white mb-4">
                    <CameraIcon className="w-5 h-5 text-slate-700 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Position yourself</h3>
                      <p className="text-xs text-slate-500 mt-1">Make sure your face is clearly visible and well-lit</p>
                    </div>
                  </div>

                  <button 
                    onClick={captureSelfie} 
                    className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <CameraIcon className="w-4 h-4" /> Capture Photo
                  </button>
                </>
              ) : (
                <>
                  <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black flex items-center justify-center mb-4">
                    <img src={selfieImage} alt="Captured Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>

                  <button 
                    onClick={() => { setSelfieImage(null); startCamera(); }} 
                    className="w-full py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Retake Photo
                  </button>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}

        {/* STEP 3: LIVENESS DETECTION CARD */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Liveness Detection</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">Follow the instructions to prove you're a real person</p>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-green-800">Liveness Verified</h3>
                  <p className="text-xs text-green-700 mt-1">Liveness check automatically approved after selfie capture (testing mode)</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-green-500 text-white text-center shadow-sm">
                <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center mb-4 bg-green-500">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-bold mb-1">Liveness Check Complete</h3>
                <p className="text-green-50 text-sm">Ready to proceed with AI verification</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AI PROCESSING CARD */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">AI Processing</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">Our AI is analyzing your identity documents</p>

            <div className="flex flex-col gap-4">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white text-center shadow-md animate-pulse min-h-[180px]">
                  <h3 className="text-xl font-bold">Processing...</h3>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center shadow-md min-h-[180px]">
                  <Brain className="w-16 h-16 text-white mb-4" />
                  <h3 className="text-xl font-bold mb-1">Ready to Process</h3>
                  <p className="text-indigo-100 text-sm">Click below to start AI verification</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <Upload className="w-6 h-6 text-blue-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">ID Uploaded</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-fuchsia-100 bg-fuchsia-50/50">
                  <CameraIcon className="w-6 h-6 text-fuchsia-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Selfie Captured</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-green-100 bg-green-50/50">
                  <Eye className="w-6 h-6 text-green-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Liveness Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION RESULT CARD */}
        {currentStep === 5 && verificationResult && (
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 mb-6 flex flex-col items-center">
            
            {/* Dynamic Status Icon */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white ${
              verificationResult.status === 'success' ? 'bg-green-100 text-green-600' : 
              verificationResult.status === 'failed' ? 'bg-rose-100 text-rose-600' : 
              'bg-amber-100 text-amber-600'
            }`}>
              {verificationResult.status === 'success' && <CheckCircle className="w-10 h-10" />}
              {verificationResult.status === 'failed' && <XCircle className="w-10 h-10" />}
              {verificationResult.status === 'review' && <Clock className="w-10 h-10" />}
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              {verificationResult.status === 'success' && <>Identity Verified <Check className="w-5 h-5 text-slate-900" /></>}
              {verificationResult.status === 'failed' && 'Verification Failed'}
              {verificationResult.status === 'review' && 'Flagged for Manual Review'}
            </h2>
            
            <p className="text-slate-500 text-center max-w-md mb-8">
              {verificationResult.status === 'success' && `Your identity has been automatically verified for exam MATH-401. AI confidence score: ${verificationResult.score}%`}
              {verificationResult.status === 'failed' && `AI verification failed due to low confidence score (${verificationResult.score}%). Please ensure your ID and selfie are clear and try again.`}
              {verificationResult.status === 'review' && `AI detected some uncertainties (confidence: ${verificationResult.score}%). Your case has been flagged for manual review by our team. You'll be notified within 24 hours.`}
            </p>

            {/* Data Rows */}
            <div className="w-full max-w-md flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Face Match Score</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  verificationResult.status === 'success' ? 'bg-indigo-500 text-white' : 
                  verificationResult.status === 'failed' ? 'bg-rose-500 text-white' : 
                  'bg-slate-200 text-slate-700'
                }`}>{verificationResult.score}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Liveness Detection</span>
                <span className="px-2.5 py-1 text-xs font-bold bg-green-500 text-white rounded-lg">PASSED</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Verification Date</span>
                <span className="text-slate-900 font-medium text-sm text-right leading-tight max-w-[120px]">{verificationResult.date}</span>
              </div>
              
              {/* Blockchain Hash (Success Only) */}
              {verificationResult.status === 'success' && (
                <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">Blockchain Transaction Hash</span>
                    <button className="text-slate-400 hover:text-slate-600"><Copy className="w-4 h-4" /></button>
                  </div>
                  <span className="text-xs font-mono text-slate-500 break-all">{verificationResult.hash}</span>
                  <p className="text-[10px] text-slate-400 mt-3">Your verification has been recorded on the blockchain for permanent, tamper-proof validation</p>
                </div>
              )}
            </div>

            {/* Alert Box */}
            <div className={`w-full max-w-md flex items-start gap-3 p-4 rounded-xl border mb-8 ${
              verificationResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
              verificationResult.status === 'failed' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
              'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {verificationResult.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />}
              {verificationResult.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />}
              {verificationResult.status === 'review' && <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />}
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  {verificationResult.status === 'success' && 'Identity Verified'}
                  {verificationResult.status === 'failed' && 'Verification Failed'}
                  {verificationResult.status === 'review' && 'Pending Review'}
                </h3>
                <p className={`text-xs ${
                  verificationResult.status === 'success' ? 'text-green-700' : 
                  verificationResult.status === 'failed' ? 'text-rose-700' : 
                  'text-amber-700'
                }`}>
                  {verificationResult.status === 'success' && "You're now verified for exam MATH-401 and can proceed with taking the exam"}
                  {verificationResult.status === 'failed' && "The verification failed due to low match confidence. Please ensure good lighting and clear photos"}
                  {verificationResult.status === 'review' && "A verification specialist will review your submission. Check your email for updates"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md flex flex-col gap-3">
              {verificationResult.status === 'success' && (
                <>
                  <button className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Download Certificate
                  </button>
                  <button className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" /> Go to Profile
                  </button>
                </>
              )}
              {verificationResult.status === 'failed' && (
                <>
                  <button onClick={handleTryAgain} className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                  <button className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" /> Go to Profile
                  </button>
                </>
              )}
              {verificationResult.status === 'review' && (
                <button className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" /> Go to Profile
                </button>
              )}
            </div>

            {/* Next Steps Card */}
            <div className="w-full max-w-md mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Next Steps</h3>
              
              {verificationResult.status === 'success' && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Enroll in online exams</h4>
                      <p className="text-xs text-slate-500 mt-1">Use your verified identity to register for exams</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Access your dashboard</h4>
                      <p className="text-xs text-slate-500 mt-1">View your verification status and exam schedules</p>
                    </div>
                  </div>
                </div>
              )}

              {verificationResult.status === 'failed' && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Review the requirements</h4>
                      <p className="text-xs text-slate-500 mt-1">Ensure good lighting and clear photos</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Try verification again</h4>
                      <p className="text-xs text-slate-500 mt-1">Contact support if the issue persists</p>
                    </div>
                  </div>
                </div>
              )}

              {verificationResult.status === 'review' && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Wait for email notification</h4>
                      <p className="text-xs text-slate-500 mt-1">You'll receive an update within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Check your status</h4>
                      <p className="text-xs text-slate-500 mt-1">Log in to view your verification progress</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Bottom Navigation (Hidden on Step 5) */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center mt-8">
            <button 
              onClick={prevStep}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${currentStep === 1 ? 'invisible' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            
            <button 
              onClick={currentStep === 4 ? handleVerify : nextStep}
              disabled={(currentStep === 1 && !selectedImage) || (currentStep === 2 && !selfieImage) || isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
            >
              {isProcessing ? (
                <>Processing <RefreshCw className="w-4 h-4 animate-spin" /></>
              ) : currentStep === 4 ? (
                <>Verify Identity <ShieldCheck className="w-4 h-4" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

        {/* Version Display */}
        <div className="text-center mt-8 text-xs text-slate-400">
          v{packageInfo.version}
        </div>

      </div>
    </div>
  );
}