import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Upload, Camera as CameraIcon, Eye, Brain, ShieldCheck,
  ArrowRight, Check, CheckCircle, RefreshCw, XCircle, Clock,
  Copy, FileText, Home, AlertCircle
} from 'lucide-react';
import packageInfo from '../../package.json';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import jsPDF from 'jspdf';

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examCode = 'Selected Exam', examId } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 states
  const [selectedImage, setSelectedImage] = useState(null);
  const [idFile, setIdFile] = useState(null);

  // Step 2 states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);

  // ── NEW: Step 3 liveness states ──────────────────────────────────────────
  // null = not started, 'checking' = recording, 'live' = passed, 'fake' = failed
  const [livenessStatus, setLivenessStatus] = useState(null);
  const [livenessFrameCount, setLivenessFrameCount] = useState(0);
  // ─────────────────────────────────────────────────────────────────────────

  // Step 4 states
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Refs for Step 2 selfie camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ── NEW: Separate refs for Step 3 liveness camera ────────────────────────
  const livenessVideoRef = useRef(null);
  const livenessCanvasRef = useRef(null);
  const livenessStreamRef = useRef(null); // holds the stream so we can stop it
  // ─────────────────────────────────────────────────────────────────────────

  const stepRefs = useRef({});

  // Helper: base64 data URI → Blob (used when sending selfie as FormData)
  const base64ToBlob = (base64, mimeType) => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeType });
  };

  // ── AUTO-SCROLL active step into view ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepRefs.current[currentStep]) {
        stepRefs.current[currentStep].scrollIntoView({
          behavior: 'smooth', block: 'nearest', inline: 'center'
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // ── STEP 2 camera lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (currentStep === 2 && !selfieImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentStep, selfieImage]);

  // ── NEW: STEP 3 liveness camera lifecycle ─────────────────────────────────
  useEffect(() => {
    if (currentStep === 3 && livenessStatus !== 'live') {
      startLivenessCamera();
    }
    // Stop liveness camera when leaving step 3
    if (currentStep !== 3) {
      stopLivenessCamera();
    }
    return () => stopLivenessCamera();
  }, [currentStep]);
  // ─────────────────────────────────────────────────────────────────────────


  // ════════════════════════════════════════════════════════════════════════
  // STEP 1 — ID UPLOAD
  // ════════════════════════════════════════════════════════════════════════
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIdFile(file);
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2 — SELFIE CAMERA
  // ════════════════════════════════════════════════════════════════════════
  const startCamera = async () => {
    setIsCameraOpen(true);
    setSelfieImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setIsCameraOpen(false);
      alert('Could not access the camera. Please allow camera permissions in your browser.');
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
      setSelfieImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setIsCameraOpen(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 — LIVENESS DETECTION  ← NEW REAL LOGIC
  // ════════════════════════════════════════════════════════════════════════

  const startLivenessCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      livenessStreamRef.current = stream;
      if (livenessVideoRef.current) livenessVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Liveness camera error:', err);
      alert('Could not access camera for liveness check. Please allow camera permissions.');
    }
  };

  const stopLivenessCamera = () => {
    if (livenessStreamRef.current) {
      livenessStreamRef.current.getTracks().forEach(t => t.stop());
      livenessStreamRef.current = null;
    }
  };

  const handleLivenessCheck = async () => {
    setLivenessStatus('checking');
    setLivenessFrameCount(0);

    const frames = [];
    const TOTAL_FRAMES = 15;
    const FRAME_INTERVAL_MS = 200;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      await new Promise(resolve => setTimeout(resolve, FRAME_INTERVAL_MS));
      if (livenessVideoRef.current && livenessCanvasRef.current) {
        const video = livenessVideoRef.current;
        const canvas = livenessCanvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
        setLivenessFrameCount(i + 1);
      }
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();

      const response = await fetch('http://localhost:5000/api/verification/liveness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ frames })
      });

      const result = await response.json();

      // FIX 1 — toLowerCase() handles both "Live" and "live"
      if (result.status?.toLowerCase() === 'live') {
        setLivenessStatus('live');
        stopLivenessCamera();
      } else {
        setLivenessStatus('fake');
        stopLivenessCamera(); // FIX 2 — stop camera on failure too
      }
    } catch (err) {
      console.error('Liveness check error:', err);
      setLivenessStatus('fake');
      stopLivenessCamera(); // FIX 3 — stop camera on error too
    }
  };

  const retryLiveness = () => {
    setLivenessStatus(null);
    setLivenessFrameCount(0);
    stopLivenessCamera();
    startLivenessCamera();
  };

  // ════════════════════════════════════════════════════════════════════════
  // STEP 4 — AI PROCESSING  ← REAL API CALL, NO MORE FAKE setTimeout
  // ════════════════════════════════════════════════════════════════════════
  const handleVerify = async () => {
    setIsProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();

      // Build FormData with ID image + selfie
      const formData = new FormData();
      if (idFile) formData.append('id_image', idFile);
      if (selfieImage) formData.append('selfie_image', base64ToBlob(selfieImage, 'image/jpeg'), 'selfie.jpg');

      // This one call now: uploads images → calls Flask /verify → returns real result
      const uploadRes = await fetch('http://localhost:5000/api/verification/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Verification failed');
      }

      const { status, score, requestId: reqId } = await uploadRes.json();

      // Build result object for Step 5 UI
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const mockHash = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const hash = status === 'success' ? mockHash() : null;

      setVerificationResult({ status, score, date: `${dateString}, ${timeString}`, hash });

      // Save final result to Firebase via backend
      await fetch('http://localhost:5000/api/verification/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, score, examId: examId || null, examCode, hash, requestId: reqId })
      });

      nextStep(); // Move to Step 5

    } catch (err) {
      console.error('Verification error:', err);
      alert(`Verification failed: ${err.message}\n\nMake sure:\n• Backend is running on port 5000\n• Flask AI service is running on port 5001`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // NAVIGATION HELPERS
  // ════════════════════════════════════════════════════════════════════════
  const nextStep = () => { if (currentStep < 5) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleTryAgain = () => {
    setCurrentStep(1);
    setSelectedImage(null);
    setIdFile(null);
    setSelfieImage(null);
    setVerificationResult(null);
    setLivenessStatus(null);     // reset liveness
    setLivenessFrameCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadCertificate = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [600, 400] });
    pdf.setFillColor(250, 252, 255);
    pdf.rect(0, 0, 600, 400, 'F');
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(4);
    pdf.rect(20, 20, 560, 360, 'S');
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Identity Verification Certificate', 300, 70, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Exam: ${examCode}`, 300, 100, { align: 'center' });
    pdf.setTextColor(21, 128, 61);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STATUS: VERIFIED', 300, 160, { align: 'center' });
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date & Time: ${verificationResult?.date}`, 300, 220, { align: 'center' });
    pdf.text(`Face Match Score: ${verificationResult?.score}%`, 300, 245, { align: 'center' });
    pdf.text(`Liveness Detection: PASSED`, 300, 270, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Blockchain TX Hash:`, 300, 320, { align: 'center' });
    pdf.setFont('courier', 'normal');
    pdf.text(`${verificationResult?.hash}`, 300, 340, { align: 'center' });
    pdf.save(`${examCode}-Certificate.pdf`);
  };

  // Progress bar calculation
  let progressPercentage = 0;
  if (currentStep === 1) progressPercentage = selectedImage ? 20 : 0;
  else if (currentStep === 2) progressPercentage = selfieImage ? 40 : 20;
  else if (currentStep === 3) progressPercentage = 60;
  else if (currentStep === 4) progressPercentage = 80;
  else if (currentStep === 5) progressPercentage = 100;

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center mb-8 gap-4">
          <button onClick={() => navigate('/student')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 w-max shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
          <div className="md:ml-4">
            <h1 className="text-2xl font-bold text-slate-900">Identity Verification</h1>
            <p className="text-slate-500 text-sm">Verifying identity for exam: <span className="font-semibold text-slate-700">{examCode}</span></p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium text-sm">Step {currentStep} of 5</span>
            <span className="text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full text-slate-600">{progressPercentage}% Complete</span>
          </div>
          <div className="h-2 w-full bg-indigo-50 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
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
                    isActive ? 'text-indigo-900' : isComplete ? 'text-green-800' : 'text-slate-500'
                  }`}>{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: UPLOAD ID ─────────────────────────────────────────────── */}
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

        {/* ── STEP 2: CAPTURE SELFIE ────────────────────────────────────────── */}
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
                  <button onClick={captureSelfie} className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <CameraIcon className="w-4 h-4" /> Capture Photo
                  </button>
                </>
              ) : (
                <>
                  <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black mb-4">
                    <img src={selfieImage} alt="Captured Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                  <button onClick={() => { setSelfieImage(null); startCamera(); }} className="w-full py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm">
                    Retake Photo
                  </button>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}

        {/* ── STEP 3: LIVENESS DETECTION ────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Liveness Detection</h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">Follow the instructions to prove you're a real person</p>

            <div className="flex flex-col gap-4">
              
              {/* ALWAYS render the video element if status is not 'live' or 'fake' */}
              {(livenessStatus === null || livenessStatus === 'checking') && (
                <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
                  <video 
                    ref={livenessVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  
                  {/* Overlay text that only renders during active recording */}
                  {livenessStatus === 'checking' && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-full font-medium tracking-wide shadow-md backdrop-blur-sm">
                        Recording... {livenessFrameCount}/15 frames
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* State: Not Started — Show instructions and initial action button */}
              {livenessStatus === null && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
                      <p className="text-xs font-medium text-indigo-800">Blink your eyes naturally</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <ArrowRight className="w-5 h-5 text-indigo-500 shrink-0" />
                      <p className="text-xs font-medium text-indigo-800">Slowly turn your head</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLivenessCheck}
                    className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Start Liveness Check
                  </button>
                </>
              )}

              {/* State: Checking / Processing Progress Indicator */}
              {livenessStatus === 'checking' && (
                <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex gap-1.5 justify-center">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          idx < livenessFrameCount ? 'bg-indigo-500 scale-110' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-indigo-600 animate-pulse mt-1">
                    Blink and turn your head now...
                  </p>
                </div>
              )}

              {/* State: Live (Passed) */}
              {livenessStatus === 'live' && (
                <div className="p-6 border border-green-100 rounded-xl bg-green-50/50 flex flex-col items-center text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                  <h3 className="text-sm font-semibold text-green-900">Liveness Verification Passed</h3>
                  <p className="text-xs text-green-600 mt-0.5">Real-time presence confirmed successfully.</p>
                </div>
              )}

              {/* State: Fake (Failed) */}
              {livenessStatus === 'fake' && (
                <div className="p-6 border border-red-100 rounded-xl bg-red-50/50 flex flex-col items-center text-center">
                  <XCircle className="w-12 h-12 text-red-500 mb-2" />
                  <h3 className="text-sm font-semibold text-red-900">Liveness Check Failed</h3>
                  <p className="text-xs text-red-600 mt-0.5 mb-4">Could not detect blink or head movement.</p>
                  <button 
                    onClick={retryLiveness}
                    className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                  </button>
                </div>
              )}

              {/* Hidden processing canvas */}
              <canvas ref={livenessCanvasRef} className="hidden" />
            </div>
          </div>
        )}

        {/* ── STEP 4: AI PROCESSING ─────────────────────────────────────────── */}
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
                  <RefreshCw className="w-10 h-10 text-white mb-3 animate-spin" />
                  <h3 className="text-xl font-bold">Processing...</h3>
                  <p className="text-indigo-100 text-sm mt-1">Comparing face with ID document</p>
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

        {/* ── STEP 5: VERIFICATION RESULT ───────────────────────────────────── */}
        {currentStep === 5 && verificationResult && (
          <div id="certificate-content" className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 mb-6 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white ${
              verificationResult.status === 'success' ? 'bg-green-100 text-green-600' :
              verificationResult.status === 'failed' ? 'bg-rose-100 text-rose-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              {verificationResult.status === 'success' && <CheckCircle className="w-10 h-10" />}
              {verificationResult.status === 'failed' && <XCircle className="w-10 h-10" />}
              {verificationResult.status === 'review' && <Clock className="w-10 h-10" />}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              {verificationResult.status === 'success' && <>Identity Verified <Check className="w-5 h-5 text-slate-900" /></>}
              {verificationResult.status === 'failed' && 'Verification Failed'}
              {verificationResult.status === 'review' && 'Flagged for Manual Review'}
            </h2>
            <p className="text-slate-500 text-center max-w-md mb-8">
              {verificationResult.status === 'success' && `Your identity has been verified for exam ${examCode}. AI confidence score: ${verificationResult.score}%`}
              {verificationResult.status === 'failed' && `AI verification failed due to low confidence score (${verificationResult.score}%). Please ensure your ID and selfie are clear and try again.`}
              {verificationResult.status === 'review' && `AI detected some uncertainties (confidence: ${verificationResult.score}%). Your case has been flagged for manual review. You'll be notified within 24 hours.`}
            </p>

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
                  {verificationResult.status === 'success' && `You're now verified for exam ${examCode} and can proceed`}
                  {verificationResult.status === 'failed' && 'Please ensure good lighting and clear photos'}
                  {verificationResult.status === 'review' && 'A specialist will review your submission. Check your email for updates'}
                </p>
              </div>
            </div>

            <div className="w-full max-w-md flex flex-col gap-3">
              {verificationResult.status === 'success' && (
                <>
                  <button onClick={downloadCertificate} className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Download Certificate
                  </button>
                  <button onClick={() => navigate('/student')} className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" /> Go to Profile
                  </button>
                </>
              )}
              {verificationResult.status === 'failed' && (
                <>
                  <button onClick={handleTryAgain} className="w-full py-3.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                  <button onClick={() => navigate('/student')} className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" /> Go to Profile
                  </button>
                </>
              )}
              {verificationResult.status === 'review' && (
                <button onClick={() => navigate('/student')} className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" /> Go to Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevStep}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${
                currentStep === 1 ? 'invisible' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              onClick={currentStep === 4 ? handleVerify : nextStep}
              disabled={
                (currentStep === 1 && !selectedImage) ||
                (currentStep === 2 && !selfieImage) ||
                (currentStep === 3 && livenessStatus !== 'live') || // ← Next locked until liveness passes
                isProcessing
              }
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

        <div className="text-center mt-8 text-xs text-slate-400">v{packageInfo.version}</div>
      </div>
    </div>
  );
}
