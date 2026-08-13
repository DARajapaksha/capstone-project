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

  // Step 3 liveness states
  // null = not started, 'checking' = recording, 'live' = passed, 'fake' = failed
  const [livenessStatus, setLivenessStatus] = useState(null);
  const [livenessFrameCount, setLivenessFrameCount] = useState(0);

  // Step 4 states
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Refs for Step 2 selfie camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Separate refs for Step 3 liveness camera
  const livenessVideoRef = useRef(null);
  const livenessCanvasRef = useRef(null);
  const livenessStreamRef = useRef(null);

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

  // ── STEP 3 liveness camera lifecycle ─────────────────────────────────
  useEffect(() => {
    if (currentStep === 3 && livenessStatus !== 'live') {
      startLivenessCamera();
    }
    if (currentStep !== 3) {
      stopLivenessCamera();
    }
    return () => stopLivenessCamera();
  }, [currentStep]);


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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width:  { ideal: 1280, min: 640 },
          height: { ideal: 720,  min: 480 },
        }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (fallbackErr) {
        setIsCameraOpen(false);
        alert("Could not access the camera. Please allow camera permissions.");
      }
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
  // STEP 3 — LIVENESS DETECTION
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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in (Token missing)');

      const response = await fetch(`http://${window.location.hostname}:5000/api/verification/liveness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ frames })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Liveness check failed (${response.status}): ${text.substring(0, 100)}`);
      }

      const result = await response.json();
      console.log('Liveness result:', result);

      const status = result.status || result.liveness_status || 'Fake';
      if (status === 'Live') {
        setLivenessStatus('live');
        stopLivenessCamera();
      } else {
        setLivenessStatus('fake');
      }
    } catch (err) {
      console.error('Liveness error:', err);
      alert(`Liveness check failed: ${err.message}\n\nMake sure:\n• Backend is running on port 5000\n• Flask AI service is running on port 5001`);
      setLivenessStatus(null);
    }
  };

  const retryLiveness = () => {
    setLivenessStatus(null);
    setLivenessFrameCount(0);
    startLivenessCamera();
  };

  // ════════════════════════════════════════════════════════════════════════
  // STEP 4 — AI FACE MATCH + RESULT SUBMISSION
  // ════════════════════════════════════════════════════════════════════════
  const handleVerify = async () => {
    setIsProcessing(true);
    setVerifyError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in (Token missing)');

      // Convert ID image file to base64
      const nicImageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(idFile);
      });
      const selfieImageBase64 = selfieImage;

      // Step 1: Upload images to backend for AI processing
      const formData = new FormData();
      formData.append('id_image', base64ToBlob(nicImageBase64, 'image/jpeg'), 'id.jpg');
      formData.append('selfie_image', base64ToBlob(selfieImageBase64, 'image/jpeg'), 'selfie.jpg');
      if (examId) formData.append('examId', examId);
      if (examCode) formData.append('examCode', examCode);

      const uploadRes = await fetch(`http://${window.location.hostname}:5000/api/verification/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Upload failed (${uploadRes.status}): ${text.substring(0, 100)}`);
      }

      const uploadData = await uploadRes.json();
      const reqId = uploadData.requestId || null;
      const aiData = uploadData.aiResults || {};

      console.log('AI Results:', aiData);

      // Step 2: Derive outcome from face score
      // The backend applies a +45 demo boost (capped at 95) before returning face_score.
      // Use the boosted score as-is — do NOT add more points here.
      const faceScore = Math.round((aiData.face_match?.face_score ?? 0) * 100);

      // ── Decision thresholds ───────────────────────────────────────────────
      // Score > 85  → Automatic Approval  (backend triggers blockchain)
      // Score 50-85 → Uncertainty Zone    (human review)
      // Score < 50  → Automatic Rejection
      let outcome;
      if (faceScore > 85) {
        outcome = 'success';
      } else if (faceScore >= 50) {
        outcome = 'review';  // Uncertainty zone — send to human verifier
      } else {
        outcome = 'failed';
      }

      // Step 3: Submit the result to the backend
      const resultRes = await fetch(`http://${window.location.hostname}:5000/api/verification/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: outcome,
          score: faceScore,
          examId: examId || null,
          examCode,
          requestId: reqId,
          idImage: outcome === 'review' ? nicImageBase64 : undefined,
          selfieImage: outcome === 'review' ? selfieImageBase64 : undefined
        })
      });

      const resultData = await resultRes.json();
      const hash          = resultData.blockchainTxHash || null;
      const polygonscanUrl = resultData.polygonscanUrl || (hash ? `https://amoy.polygonscan.com/tx/${hash}` : null);

      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setVerificationResult({ status: outcome, score: faceScore, date: `${dateString}, ${timeString}`, hash, polygonscanUrl });
      setCurrentStep(5);

    } catch (err) {
      console.error('Verification error:', err);
      setVerifyError(err.message || 'An unexpected error occurred. Make sure the Flask AI service is running on port 5001.');
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
    setLivenessStatus(null);
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

  let progressPercentage = 0;
  if (currentStep === 1) progressPercentage = selectedImage ? 20 : 0;
  else if (currentStep === 2) progressPercentage = selfieImage ? 40 : 20;
  else if (currentStep === 3) progressPercentage = 60;
  else if (currentStep === 4) progressPercentage = 80;
  else if (currentStep === 5) progressPercentage = 100;

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
          <div className="h-2 w-full bg-red-50 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-red-800 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
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
                    isActive ? 'border-red-100 bg-red-50/50' :
                    isComplete ? 'border-green-100 bg-green-50/50' :
                    'border-transparent bg-transparent opacity-60'
                  }`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors ${
                    isComplete ? 'bg-green-500 text-white shadow-sm' :
                    isActive ? 'bg-red-800 text-white shadow-sm' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete ? <Check className="w-6 h-6" strokeWidth={3} /> : <step.icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight px-1 ${
                    isActive ? 'text-red-950' : isComplete ? 'text-green-800' : 'text-slate-500'
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
            
            {/* Step Navigation Button */}
            {selectedImage && (
              <button onClick={nextStep} className="mt-4 w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
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
                  <button onClick={captureSelfie} className="w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <CameraIcon className="w-4 h-4" /> Capture Photo
                  </button>
                </>
              ) : (
                <>
                  <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black mb-4">
                    <img src={selfieImage} alt="Captured Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setSelfieImage(null); startCamera(); }} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm">
                      Retake Photo
                    </button>
                    <button onClick={nextStep} className="flex-1 py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
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
              {(livenessStatus === null || livenessStatus === 'checking') && (
                <div className="relative w-full aspect-[4/3] md:aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
                  <video 
                    ref={livenessVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  {livenessStatus === 'checking' && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-full font-medium tracking-wide shadow-md backdrop-blur-sm">
                        Recording... {livenessFrameCount}/15 frames
                      </div>
                    </div>
                  )}
                </div>
              )}

              {livenessStatus === null && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                      <Eye className="w-5 h-5 text-red-800 shrink-0" />
                      <p className="text-xs font-medium text-red-900">Blink your eyes naturally</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                      <ArrowRight className="w-5 h-5 text-red-800 shrink-0" />
                      <p className="text-xs font-medium text-red-900">Slowly turn your head</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLivenessCheck}
                    className="w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Start Liveness Check
                  </button>
                </>
              )}

              {livenessStatus === 'checking' && (
                <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex gap-1.5 justify-center">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          idx < livenessFrameCount ? 'bg-red-800 scale-110' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-red-800 animate-pulse mt-1">
                    Blink and turn your head now...
                  </p>
                </div>
              )}

              {livenessStatus === 'live' && (
                <div className="p-6 border border-green-100 rounded-xl bg-green-50/50 flex flex-col items-center text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                  <h3 className="text-sm font-semibold text-green-900">Liveness Verification Passed</h3>
                  <p className="text-xs text-green-600 mt-0.5 mb-4">Real-time presence confirmed successfully.</p>
                  <button onClick={() => { nextStep(); handleVerify(); }} className="w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                    Proceed to AI Processing <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}


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

              <canvas ref={livenessCanvasRef} className="hidden" />
            </div>
          </div>
        )}

        {/* ── STEP 4: AI PROCESSING ─────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            {verifyError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">AI Processing Failed</h2>
                <p className="text-red-800 text-sm font-semibold max-w-sm mb-2 break-words">{verifyError}</p>
                <p className="text-slate-500 text-sm font-medium max-w-sm mb-8">
                  Make sure: Backend is on port 5000 and Flask AI service is running on port 5001.
                </p>
                <button
                  onClick={() => { setVerifyError(null); handleVerify(); }}
                  className="px-6 py-2.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry AI Processing
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-16 h-16 text-red-800 animate-pulse mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing Verification Data</h2>
                <p className="text-slate-500 text-sm max-w-sm">
                  Our secure AI system is running cross-match facial checks and committing cryptographic ledger telemetry proofs.
                </p>
                <div className="mt-8 w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-800 animate-infinite-loading rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: VERIFICATION RESULT ────────────────────────────────────── */}
        {currentStep === 5 && verificationResult && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-8">
              {verificationResult.status === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Verification Successful</h2>
                  <p className="text-slate-500 text-sm mt-1">Your identity has been authenticated and secured on-chain.</p>
                </>
              ) : verificationResult.status === 'review' ? (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <Clock className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Under Manual Review</h2>
                  <p className="text-slate-500 text-sm mt-1">Your identity verification has been queued for human review. Please check back later.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Verification Refused</h2>
                  <p className="text-slate-500 text-sm mt-1">Facial parity criteria or data compliance check dropped below acceptable threshold margins.</p>
                </>
              )}
            </div>

            <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Exam Allocation</span>
                <span className="font-semibold text-slate-800 text-sm">{examCode}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Match Confidence Index</span>
                <span className={`font-bold text-sm ${
                  verificationResult.status === 'success' ? 'text-green-600' :
                  verificationResult.status === 'review' ? 'text-amber-500' :
                  'text-red-500'
                }`}>
                  {verificationResult.score}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Timestamp</span>
                <span className="text-slate-700 font-medium text-sm">{verificationResult.date}</span>
              </div>
            </div>

            {verificationResult.hash && (
              <div className={`flex flex-col p-4 rounded-xl border ${
                verificationResult.status === 'success' ? 'bg-slate-50 border-slate-100' :
                verificationResult.status === 'review'  ? 'bg-amber-50 border-amber-100' :
                'bg-red-50 border-red-100'
              }`}>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  <ShieldCheck className={`w-3.5 h-3.5 ${
                    verificationResult.status === 'success' ? 'text-red-800' :
                    verificationResult.status === 'review'  ? 'text-amber-500' :
                    'text-red-400'
                  }`} /> Blockchain Audit Record
                </div>
                <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                  <span className="font-mono text-xs text-slate-600 truncate selection:bg-red-100">
                    {verificationResult.hash}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigator.clipboard.writeText(verificationResult.hash)}
                      className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
                      title="Copy Tx Hash"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {verificationResult.polygonscanUrl && (
                      <a
                        href={verificationResult.polygonscanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          verificationResult.status === 'success' ? 'bg-red-50 hover:bg-red-100 text-red-800' :
                          verificationResult.status === 'review'  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' :
                          'bg-red-50 hover:bg-red-100 text-red-600'
                        }`}
                        title="View on Polygonscan"
                      >
                        View Proof ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              {verificationResult.status === 'success' ? (
                <>
                  <button onClick={downloadCertificate} className="flex-1 py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
                    <FileText className="w-4 h-4" /> Download Certificate Passport
                  </button>
                  <button onClick={() => navigate('/student')} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
                    <Home className="w-4 h-4" /> Dashboard Home
                  </button>
                </>
              ) : verificationResult.status === 'review' ? (
                <button onClick={() => navigate('/student')} className="w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
                  <Home className="w-4 h-4" /> Return to Dashboard
                </button>
              ) : (
                <button onClick={handleTryAgain} className="w-full py-3.5 bg-red-800 text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Restart Verification Pipeline
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
