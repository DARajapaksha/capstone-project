import { auth } from "../../firebase/firebase";
import { signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../../assets/logo.jpg';
import { Mail, Lock, Cpu, GraduationCap, Loader2 } from 'lucide-react';
import { useProfile } from "../../contexts/ProfileContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Enforce account selection popup so students can choose their official university account
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(); // This is a secure Google ID token

      // Send this Google Token to your custom Node.js Backend to verify it
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, isRegister: false })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token); // Save your system's session JWT
        await refreshProfile();
        navigate('/student');
      } else {
        alert(data.error || 'Authentication with backend failed');
      }
    } catch (error) {
      console.error("Google authentication failed:", error);
      alert('Google authentication failed. Please try again.');
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      alert('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await response.json();
      console.log('Backend Response:', data);

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        
        // Ensure Firebase Auth on the frontend is also signed in, 
        // so that Firebase Realtime Database Security Rules (auth != null) will pass.
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (fbError) {
          console.error("Firebase frontend sign-in failed, but backend succeeded. Db rules might fail.", fbError);
        }

        await refreshProfile();
        navigate('/student');
      } else {
        alert(data.error || 'Authentication with backend failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      const message = error?.message || 'An error occurred during login. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F6FF] p-6 font-sans text-[#1A1A1A]">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12">

        {/* LEFT SIDE: Fixed Position Branding */}
        <div className="flex-1 space-y-10 max-w-xl hidden lg:block text-left">
          <BrandSection />
        </div>

        {/* RIGHT SIDE: Locked Width Card */}
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-6 md:p-8 border border-white">
            <h2 className="text-2xl font-bold text-left">Welcome</h2>
            <p className="text-gray-400 text-left mt-1 mb-4">Login to your account to continue</p>

            <div className="bg-[#F0F2F5] p-1.5 rounded-2xl flex mb-5">
              <button className="flex-1 py-3 rounded-xl text-sm font-bold bg-white shadow-sm text-gray-800">Login</button>
              <Link to="/register" className="flex-1 py-3 text-center text-sm font-bold text-gray-500">Register</Link>
            </div>

            {/* Google Provider Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer mb-5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.32 -0.03,-0.64 -0.08,-0.9Z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.27,0.97c-2.33,0 -4.3,-1.57 -5,-3.69H3V15.7c1.48,2.94 4.5,4.9 8,4.9Z" fill="#34A853" />
                  <path d="M7,13.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.1H3V9.6C2.36,10.9 2,12.4 2,14c0,1.6 0.36,3.1 1,4.4L7,15.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7Z" fill="#FBBC05" />
                  <path d="M12,6.8c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,4.09 14.43,3.4 12,3.4c-3.5,0 -6.52,1.96 -8,4.9L7,10.8c0.7,-2.12 2.67,-3.69 5,-3.69Z" fill="#EA4335" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">or sign in with email</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form className="space-y-4 text-left" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#800000]" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#800000] hover:bg-[#660000] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-red-700">
          <Cpu size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">AI-Powered Verification</h3>
          <p className="text-gray-500 leading-relaxed">Advanced facial recognition with liveness detection ensures secure identity validation</p>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="bg-white p-3 rounded-xl self-start shadow-sm text-purple-500">
          <Lock size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Blockchain Security</h3>
          <p className="text-gray-500 leading-relaxed">Immutable verification records stored on blockchain for maximum transparency</p>
        </div>
      </div>

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

export default Login;
