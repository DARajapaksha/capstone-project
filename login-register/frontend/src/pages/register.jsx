import { auth } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, KeyRound, Cpu, GraduationCap } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
    alert("Passwords do not match! Please check again.");
    return;
    }

    const cleanEmail = email.trim();

    console.log("Attempting to register with:", `"${cleanEmail}"`);

    if (!cleanEmail) {
      alert("Please enter an email address");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
      alert("Account created successfully!");
      navigate("/login"); // Redirect to login after success
    } catch (error) {
    // Show the specific error code to help us debug
    console.error("Firebase Error Code:", error.code);
    alert(`Registration Error: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F6FF] p-6 font-sans text-[#1A1A1A]">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* LEFT SIDE: Exact same size as Login */}
        <div className="flex-1 space-y-10 max-w-xl hidden lg:block text-left">
          <BrandSection />
        </div>

        {/* RIGHT SIDE: Locked Width Card (MATCHES LOGIN EXACTLY) */}
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-8 md:p-10 border border-white">
            <h2 className="text-2xl font-bold text-left">Create Account</h2>
            <p className="text-gray-400 text-left mt-1 mb-8">Quick sign up to get started</p>

            <div className="bg-[#F0F2F5] p-1.5 rounded-2xl flex mb-8">
              <Link to="/login" className="flex-1 py-3 text-center text-sm font-bold text-gray-500">Login</Link>
              <button className="flex-1 py-3 rounded-xl text-sm font-bold bg-white shadow-sm text-gray-800">Register</button>
            </div>

            <form className="space-y-6 text-left" onSubmit={handleRegister}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" placeholder="example@gmail.com" value={email} onChange ={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Brand Section to ensure 100% same layout
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

export default Register;