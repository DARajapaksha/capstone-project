import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your new separate page files
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home';
import VerificationPage from './pages/VerificationPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F3F6FF]">
        <Routes>
          {/* 1. When app starts, go to Login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* 2. Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 3. Main Portal Routes */}
          <Route path="/home" element={<Home />} />
          
          {/* 4. Keep your existing Verification Page but give it a route */}
          <Route path="/verification" element={<VerificationPage />} />

          {/* 5. Fallback: if URL is wrong, go back to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;