import { auth, db } from "../../firebase/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, Cpu, GraduationCap, User, CreditCard } from 'lucide-react';
import { useProfile } from "../../contexts/ProfileContext";
import logoImg from '../../assets/logo.jpg';

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [nic, setNic] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();

  useEffect(() => {
    let timer;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  const handleRegister = async (e) => {
    if (e) e.preventDefault();

    const cleanName = name.trim();
    const cleanStudentId = studentId.trim();
    const cleanNic = nic.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanStudentId || !cleanNic || !cleanEmail || !password || !confirmPassword) {
      alert("Please fill in all registration fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match! Please check again.");
      return;
    }

    if (!cleanEmail.toLowerCase().endsWith("@gmail.com")) {
      alert("Only Gmail accounts (@gmail.com) are allowed to register.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/send-otp`, {
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
        alert("Verification code sent to your Gmail address! Please check your inbox (and spam folder).");
        setShowOtpModal(true);
        setCountdown(60); // Reset timer when successfully sent
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
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          password,
          confirmPassword,
          name: name.trim(),
          studentId: studentId.trim(),
          nic: nic.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login: call the login API immediately after registration
        try {
          const loginResponse = await fetch(`http://${window.location.hostname}:5000/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password }),
          });
          const loginData = await loginResponse.json();
          if (loginResponse.ok) {
            localStorage.setItem("token", loginData.token);
            await refreshProfile();
            navigate("/student");
            return;
          }
        } catch (autoLoginErr) {
          console.warn("Auto-login failed, redirecting to login page:", autoLoginErr);
        }
        // Fallback: if auto-login fails for any reason, go to login page
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
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/google-login`, {
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

        {/* RIGHT SIDE */}
        <div className="flex-1 w-full max-w-xl mx-auto lg:mx-0">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-6 md:p-8 border border-white">
            {showOtpModal ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-left">Verify Your Email</h2>
                <p className="text-gray-400 text-left mt-1 mb-4 leading-relaxed">
                  We've sent a 6-digit verification code to <span className="font-semibold text-gray-700">{email}</span>. Please enter it below to complete registration.
                </p>

                <form className="space-y-4 text-left" onSubmit={handleVerifyOTP}>
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
                        className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000] tracking-[0.2em] font-mono text-center text-lg font-bold"
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying..." : "Verify & Create Account"}
                  </button>

                  <div className="text-center mt-4 pb-2">
                    <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleRegister}
                      className="text-[#800000] font-bold text-sm disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                    >
                      {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code"}
                    </button>
                  </div>

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

                <form className="space-y-4 text-left" onSubmit={handleRegister}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Student ID</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="STU-2026-001" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">NIC Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="123456789V" value={nic} onChange={(e) => setNic(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4">
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
      <div className="bg-white rounded-xl shadow-lg shadow-red-200 overflow-hidden w-14 h-14 shrink-0 flex items-center justify-center p-0.5">
        <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <h1 className="text-3xl font-bold leading-tight">Identity Verification System</h1>
        <p className="text-gray-400 font-medium text-left">Blockchain-Enhanced AI Security</p>
      </div>
    </div>

    <div className="space-y-8">
      {/* 1. AI Feature */}
      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-red-700">
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
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-red-800">
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
