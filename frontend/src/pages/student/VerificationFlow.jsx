import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, UploadCloud, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const VerificationFlow = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const [step, setStep] = useState(1);
    const [nicImage, setNicImage] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Handle local NIC File Upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNicImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Capture Selfie from Webcam
    const captureSelfie = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setSelfieImage(imageSrc);
    }, [webcamRef]);

    // Submit and simulate processing transition
    const handleSubmit = () => {
        setIsProcessing(true);
        setStep(3); // Moving to Processing State

        // Simulate Backend/AI interaction delay
        setTimeout(() => {
            setIsProcessing(false);
            navigate('/status'); // Final redirect to receipt page
        }, 4500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-dark-900 pointer-events-auto overflow-hidden">

            {/* Premium Background Blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-2xl relative z-10 glass-panel p-8 md:p-12 animate-in fade-in slide-in-from-bottom-5 duration-700">

                {/* Header Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-brand-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
                    <p className="text-slate-400">Please provide your National ID and a live selfie</p>
                </div>

                {/* Step 1: NIC Upload */}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center mr-3 text-sm font-bold border border-brand-500/30">1</span>
                            Upload your NIC
                        </h2>

                        <div className="relative border-2 border-dashed border-dark-700 rounded-2xl p-8 hover:border-brand-500/50 transition-colors bg-dark-900/40 text-center">
                            {nicImage ? (
                                <div className="space-y-4">
                                    <img src={nicImage} alt="NIC Preview" className="max-h-48 mx-auto rounded-lg shadow-lg border border-dark-700" />
                                    <div className="flex justify-center flex-row gap-3">
                                        <button onClick={() => setNicImage(null)} className="text-sm px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors">Retake Output</button>
                                        <button onClick={() => setStep(2)} className="text-sm px-6 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-900 font-bold transition-all flex items-center shadow-lg shadow-brand-500/20">Continue <CheckCircle2 className="w-4 h-4 ml-2" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6">
                                    <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <p className="text-slate-300 mb-4">Click to browse or drag your ID photo here</p>
                                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-white font-medium transition-colors">
                                        <UploadCloud className="w-4 h-4 mr-2" /> Browse Files
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Live Selfie */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white flex items-center">
                                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center mr-3 text-sm font-bold border border-brand-500/30">2</span>
                                Live Liveness Selfie
                            </h2>
                            <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white transition-colors">← Back</button>
                        </div>

                        <div className="border border-dark-700 rounded-2xl p-4 bg-dark-900/40 relative overflow-hidden">
                            {selfieImage ? (
                                <div className="space-y-4 text-center pb-2">
                                    <img src={selfieImage} alt="Selfie Capture" className="w-full rounded-xl shadow-lg border border-dark-600 block mb-4" />
                                    <div className="flex justify-center flex-row gap-3">
                                        <button onClick={() => setSelfieImage(null)} className="text-sm px-4 py-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors font-semibold">Retake Selfie</button>
                                        <button onClick={handleSubmit} className="text-sm px-6 py-3 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-900 font-bold transition-all shadow-lg shadow-brand-500/20">Submit for AI Verification</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center group">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover p-1 rounded-xl"
                                    />
                                    {/* Visual Overlay guide */}
                                    <div className="absolute inset-0 border-[4px] border-brand-500/30 m-8 rounded-[40%] pointer-events-none opacity-50 group-hover:border-brand-500/80 transition-all"></div>

                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                        <button onClick={captureSelfie} className="bg-brand-500 hover:bg-brand-400 text-dark-900 rounded-full p-4 shadow-xl shadow-brand-500/30 transition-transform active:scale-95 border-4 border-white/20">
                                            <Camera className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Processing State */}
                {step === 3 && (
                    <div className="py-12 text-center animate-in zoom-in-95 duration-500">
                        <div className="inline-flex relative mb-6">
                            <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Loader2 className="w-16 h-16 text-brand-500 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Verification</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">Our DeepFace AI is actively scanning your physical NIC and confirming Liveness metrics...</p>

                        <div className="space-y-3 max-w-xs mx-auto text-left">
                            <div className="flex items-center text-sm font-medium text-brand-500"><CheckCircle2 className="w-4 h-4 mr-2" /> Image Quality Confirmed</div>
                            <div className="flex items-center text-sm font-medium text-brand-500"><CheckCircle2 className="w-4 h-4 mr-2" /> Extracting Face Geometry</div>
                            <div className="flex items-center text-sm font-medium text-slate-300 animate-pulse"><Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-500" /> Engaging Polygon Smart Contract...</div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerificationFlow;
