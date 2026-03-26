import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Cpu, GraduationCap } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F6FF] p-6 font-sans text-[#1A1A1A]">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* LEFT SIDE: Fixed Position Branding */}
        <div className="flex-1 space-y-10 max-w-xl hidden lg:block text-left">
          <BrandSection />
        </div>

        {/* RIGHT SIDE: Locked Width Card */}
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-8 md:p-10 border border-white">
            <h2 className="text-2xl font-bold text-left">Welcome</h2>
            <p className="text-gray-400 text-left mt-1 mb-8">Login to your account to continue</p>

            <div className="bg-[#F0F2F5] p-1.5 rounded-2xl flex mb-8">
              <button className="flex-1 py-3 rounded-xl text-sm font-bold bg-white shadow-sm text-gray-800">Login</button>
              <Link to="/register" className="flex-1 py-3 text-center text-sm font-bold text-gray-500">Register</Link>
            </div>

            <form className="space-y-6 text-left" onSubmit={(e) => { e.preventDefault(); navigate('/home'); }}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" placeholder="Enter your email" className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" placeholder="••••••••" className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Left Side to ensure 100% same size on both pages
const BrandSection = () => (
  <>
    <div className="flex items-center gap-4">
      <div className="bg-gradient-to-br from-[#5D5FEF] to-[#7c3aed] p-3 rounded-xl shadow-lg shadow-indigo-200">
        <Shield className="text-white w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-bold leading-tight">Identity Verification System</h1>
        <p className="text-gray-400 font-medium text-left">Blockchain-Enhanced AI Security</p>
      </div>
    </div>
    
    <div className="space-y-8">
      {/* 1. AI Feature */}
      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-blue-500">
          <Cpu size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">AI-Powered Verification</h3>
          <p className="text-gray-500 leading-relaxed">Advanced facial recognition with liveness detection ensures secure identity validation</p>
        </div>
      </div>

      {/* 2. Blockchain Feature (Was Missing) */}
      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-purple-500">
          <Lock size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Blockchain Security</h3>
          <p className="text-gray-500 leading-relaxed">Immutable verification records stored on blockchain for maximum transparency</p>
        </div>
      </div>

      {/* 3. University Feature */}
      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-indigo-500">
          <GraduationCap size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Trusted by Universities</h3>
          <p className="text-gray-500 leading-relaxed">Secure online exam enrollment and identity management for educational institutions</p>
        </div>
      </div>
    </div>
  </>
);

export default Login;