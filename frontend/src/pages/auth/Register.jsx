import { auth } from "../../firebase/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, KeyRound, Cpu, GraduationCap } from 'lucide-react';
import { useProfile } from "../../contexts/ProfileContext";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match! Please check again.");
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert("Please enter an email address");
      return;
    }

    if (!cleanEmail.toLowerCase().endsWith("@gmail.com")) {
      alert("Only Gmail accounts (@gmail.com) are allowed to register.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Verification code sent to your Gmail address! Please check your inbox.");
        setShowOtpModal(true);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("OTP Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      alert("Please enter a valid 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully!");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setShowOtpModal(false);
        navigate("/login");
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Verification Error:", error);
      alert(`Verification Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Enforce account selection popup so students can choose their official university account
      provider.setCustomParameters({ prompt: 'select_account' }); 
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(); // Secure Google ID token

      // Send this Google Token to your custom Node.js Backend to verify/register it
      const response = await fetch('http://localhost:3000/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, isRegister: true })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token); // Save your system's session JWT
        await refreshProfile();
        alert("Account verified and registered successfully!");
        navigate('/student');
      } else {
        alert(data.error || 'Authentication with backend failed');
      }
    } catch (error) {
      console.error("Google registration failed:", error);
      alert('Google registration failed. Please try again.');
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
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-6 md:p-8 border border-white">
            {showOtpModal ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-left">Verify Your Email</h2>
                <p className="text-gray-400 text-left mt-1 mb-4 leading-relaxed">
                  We've sent a 6-digit verification code to <span className="font-semibold text-gray-700">{email}</span>. Please enter it below to complete registration.
                </p>

                <form className="space-y-4 text-left" onSubmit={handleVerifyOTP} autoComplete="off">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Verification Code</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF] tracking-[0.2em] font-mono text-center text-lg font-bold"
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying..." : "Verify & Create Account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="w-full bg-transparent hover:bg-gray-50 text-gray-500 font-semibold py-3 rounded-xl border border-gray-200 transition-all active:scale-[0.98] cursor-pointer text-center"
                  >
                    Back to Sign Up
                  </button>
                </form>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-left">Create Account</h2>
                <p className="text-gray-400 text-left mt-1 mb-4">Quick sign up to get started</p>

                <div className="bg-[#F0F2F5] p-1.5 rounded-2xl flex mb-5">
                  <Link to="/login" className="flex-1 py-3 text-center text-sm font-bold text-gray-500">Login</Link>
                  <button className="flex-1 py-3 rounded-xl text-sm font-bold bg-white shadow-sm text-gray-800">Register</button>
                </div>

                <form className="space-y-4 text-left" onSubmit={handleRegister} autoComplete="off">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required autoComplete="off" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required autoComplete="new-password" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="password" placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#5D5FEF]" required autoComplete="new-password" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Sending Code..." : "Create Account"}
                  </button>
                </form>
              </>
            )}

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">or sign up with google</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Google Provider Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.32 -0.03,-0.64 -0.08,-0.9Z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.27,0.97c-2.33,0 -4.3,-1.57 -5,-3.69H3V15.7c1.48,2.94 4.5,4.9 8,4.9Z" fill="#34A853" />
                  <path d="M7,13.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.1H3V9.6C2.36,10.9 2,12.4 2,14c0,1.6 0.36,3.1 1,4.4L7,15.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7Z" fill="#FBBC05" />
                  <path d="M12,6.8c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,4.09 14.43,3.4 12,3.4c-3.5,0 -6.52,1.96 -8,4.9L7,10.8c0.7,-2.12 2.67,-3.69 5,-3.69Z" fill="#EA4335" />
                </g>
              </svg>
              <span>Sign up with Google</span>
            </button>
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