import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  User, 
  CheckCircle2, 
  Copy, 
  Download, 
  Shield, 
  Clock,
  ArrowRight
} from 'lucide-react';

const VerificationTab = () => {
  return (
    <div className="flex flex-col gap-6 w-full text-left font-sans animate-in fade-in duration-300">
      
      {/* SECTION 1: Per-Exam Identity Verification */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-white shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-[#5D5FEF]" />
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">Per-Exam Identity Verification</h3>
        </div>
        <p className="text-gray-400 font-medium mb-8">
          For security, you must verify your identity separately for each exam you enroll in
        </p>

        {/* Enhanced Security Alert */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 mb-8">
          <ShieldCheck className="w-6 h-6 text-[#5D5FEF] mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-black text-[#5D5FEF] uppercase tracking-wide">Enhanced Security</h4>
            <p className="text-sm text-indigo-900/70 font-medium mt-1">
              Each exam requires a fresh identity verification to ensure the highest level of security and prevent impersonation.
            </p>
          </div>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#F3F6FF] rounded-[24px] p-6 flex flex-col items-center text-center">
            <div className="bg-blue-100 p-4 rounded-2xl mb-4 text-blue-500">
              <FileText size={24} />
            </div>
            <h4 className="font-black text-gray-800 text-lg">Upload ID</h4>
            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">Submit your National ID or passport</p>
          </div>
          <div className="bg-[#F3F6FF] rounded-[24px] p-6 flex flex-col items-center text-center">
            <div className="bg-purple-100 p-4 rounded-2xl mb-4 text-purple-500">
              <User size={24} />
            </div>
            <h4 className="font-black text-gray-800 text-lg">Live Selfie</h4>
            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">Take a photo using your webcam</p>
          </div>
          <div className="bg-[#F3F6FF] rounded-[24px] p-6 flex flex-col items-center text-center">
            <div className="bg-emerald-100 p-4 rounded-2xl mb-4 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-black text-gray-800 text-lg">Get Verified</h4>
            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">AI verification in seconds</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Active Identity Verified Status */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-emerald-100 shadow-sm relative overflow-hidden">
        {/* Top Green Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-400"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Identity Verified</h3>
              <p className="text-gray-400 font-medium mt-1">Your identity has been successfully verified</p>
            </div>
          </div>
          <span className="bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Face Match Score */}
          <div className="bg-[#F3F6FF] p-6 rounded-[24px]">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Face Match Score</span>
              <span className="text-2xl font-black text-[#5D5FEF] leading-none">96%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
              <div className="bg-[#5D5FEF] h-2.5 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>

          {/* Liveness Detection */}
          <div className="bg-[#F3F6FF] p-6 rounded-[24px] flex flex-col justify-center items-start">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Liveness Detection</span>
            <span className="bg-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
              PASSED
            </span>
          </div>

          {/* Dates */}
          <div className="bg-[#F3F6FF] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Verification Date</span>
            <div className="text-lg font-black text-gray-800">March 5, 2026</div>
          </div>
          <div className="bg-[#F3F6FF] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Valid Until</span>
            <div className="text-lg font-black text-gray-800">December 31, 2026</div>
          </div>
        </div>

        {/* Blockchain Hash */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blockchain Transaction Hash</span>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#5D5FEF] transition-colors text-xs font-bold uppercase">
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-xs font-medium text-gray-500 truncate border border-gray-100">
            0x7f8c9d2a3b4e5f6g7h8i9j0k1l2m3n4o
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-3">
            Your verification is permanently recorded on the blockchain
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-wide">
            <Download size={18} /> Download Certificate
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-wide">
            <Shield size={18} /> Verification Details
          </button>
        </div>
      </div>

      {/* SECTION 3: Verification History */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-white shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <FileText className="w-6 h-6 text-gray-400" />
          <div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Verification History</h3>
            <p className="text-gray-400 font-medium mt-1">Your exam-specific identity verifications</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Verified Item 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-emerald-50/50 border border-emerald-100 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-xl shrink-0 mt-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-800 leading-tight">Computer Science Midterm</h4>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-2">CS-302</div>
                <div className="text-xs font-bold text-emerald-600">Verified: March 5, 2026</div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                Verified
              </span>
            </div>
          </div>

          {/* Verified Item 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-emerald-50/50 border border-emerald-100 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-xl shrink-0 mt-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-800 leading-tight">Physics Lab Exam</h4>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-2">PHY-201</div>
                <div className="text-xs font-bold text-emerald-600">Verified: February 27, 2026</div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                Verified
              </span>
            </div>
          </div>

          {/* Pending Item */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-amber-50 border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-xl shrink-0 mt-1">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-800 leading-tight">Advanced Mathematics Final</h4>
                <div className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mt-1 mb-2">MATH-401</div>
                <button className="text-xs font-black text-[#5D5FEF] uppercase tracking-wide flex items-center gap-1 hover:underline">
                  Verify now <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                Pending
              </span>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default VerificationTab;