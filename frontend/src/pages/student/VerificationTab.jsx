import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, User, CheckCircle, Copy, Download, ChevronRight, Clock } from 'lucide-react';

const VerificationTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      
      {/* Educational Block */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-indigo-500" size={24} />
          <h2 className="text-lg font-bold text-slate-900">Per-Exam Identity Verification</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">For security, you must verify your identity separately for each exam you enroll in</p>

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-slate-900">Enhanced Security</p>
            <p className="text-sm text-blue-600 mt-0.5">Each exam requires a fresh identity verification to ensure the highest level of security and prevent impersonation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-blue-500" size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Upload ID</h3>
            <p className="text-xs text-slate-500 mt-1">Submit your National ID or passport</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-purple-500" size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Live Selfie</h3>
            <p className="text-xs text-slate-500 mt-1">Take a photo using your webcam</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-500" size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Get Verified</h3>
            <p className="text-xs text-slate-500 mt-1">AI verification in seconds</p>
          </div>
        </div>
      </div>

      {/* Active Verification Block */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Identity Verified</h3>
              <p className="text-sm text-slate-500">Your identity has been successfully verified</p>
            </div>
          </div>
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-2">Face Match Score</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '96%' }}></div>
              </div>
              <span className="font-bold text-emerald-600">96%</span>
            </div>
          </div>
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-2">Liveness Detection</p>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              PASSED
            </span>
          </div>
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-1">Verification Date</p>
            <p className="font-medium text-slate-900">March 5, 2026</p>
          </div>
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-1">Valid Until</p>
            <p className="font-medium text-slate-900">December 31, 2026</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <p className="text-xs text-slate-500">Blockchain Transaction Hash</p>
            <button className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono text-slate-600">
            0x7f8c9c2a3b4e5f6g7h8i9j0k1l2m3n4o
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Your verification is permanently recorded on the blockchain</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={16} /> Download Certificate
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Shield size={16} /> Verification Details
          </button>
        </div>
      </div>

      {/* Verification History */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <FileText className="text-slate-500" size={20} />
          <div>
            <h3 className="font-bold text-slate-900">Verification History</h3>
            <p className="text-xs text-slate-500">Your exam-specific identity verifications</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Item 1 */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Computer Science Midterm</p>
                <p className="text-xs text-slate-500">CS-302</p>
                <p className="text-[10px] font-medium text-emerald-600 mt-0.5">Verified: March 5, 2026</p>
              </div>
            </div>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Verified
            </span>
          </div>

          {/* Item 2 */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Physics Lab Exam</p>
                <p className="text-xs text-slate-500">PHY-201</p>
                <p className="text-[10px] font-medium text-emerald-600 mt-0.5">Verified: February 27, 2026</p>
              </div>
            </div>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Verified
            </span>
          </div>

          {/* Item 3 */}
          <div className="bg-[#fffdf0] border border-[#ffec99] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center">
                <Clock className="text-[#eab308]" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Advanced Mathematics Final</p>
                <p className="text-xs text-slate-500">MATH-401</p>
                <button 
                  onClick={() => navigate('/verification')}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#eab308] mt-1 hover:text-[#ca8a04] transition-colors"
                >
                  Verify now <ChevronRight size={12} />
                </button>
              </div>
            </div>
            <span className="bg-[#eab308] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Pending
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VerificationTab;
