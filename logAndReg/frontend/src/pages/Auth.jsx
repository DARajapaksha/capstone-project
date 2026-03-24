import React, { useState } from 'react';
import { Shield, Lock, GraduationCap, Mail, KeyRound, User, ShieldCheck } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, both Login and Register will navigate to verification
    onLogin(); 
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F6FF] p-6 font-sans">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Side: Information */}
        <div className="flex-1 space-y-10 max-w-xl hidden md:block">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Shield className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A]">Identity Verification System</h1>
              <p className="text-gray-400 font-medium">Blockchain-Enhanced AI Security</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="bg-blue-50 p-3 rounded-xl self-start">
                <Shield className="text-blue-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">AI-Powered Verification</h3>
                <p className="text-gray-500 leading-relaxed">Advanced facial recognition with liveness detection ensures secure identity validation</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-purple-50 p-3 rounded-xl self-start">
                <Lock className="text-purple-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Blockchain Security</h3>
                <p className="text-gray-500 leading-relaxed">Immutable verification records stored on blockchain for maximum transparency</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-indigo-50 p-3 rounded-xl self-start">
                <GraduationCap className="text-indigo-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Trusted by Universities</h3>
                <p className="text-gray-500 leading-relaxed">Secure online exam enrollment and identity management for educational institutions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-white rounded-[24px] shadow-2xl shadow-indigo-100 p-8 md:p-10 border border-gray-50">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Welcome</h2>
            <p className="text-gray-400 mt-1 mb-8">
              {isLogin ? 'Login to your account to continue' : 'Create an account to get started'}
            </p>

            {/* Tabs */}
            <div className="bg-[#F0F2F5] p-1.5 rounded-xl flex mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Conditional Field: Full Name (Only for Register) */}
              {!isLogin && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Enter your full name" 
                      className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="email" 
                    placeholder="insertyouremail@mail.com" 
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="password" 
                    placeholder="Enter your password" 
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Conditional Field: Confirm Password (Only for Register) */}
              {!isLogin && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="password" 
                      placeholder="Confirm your password" 
                      className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#5C50F1] hover:bg-[#4a3edf] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all mt-4 transform active:scale-[0.98]"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;