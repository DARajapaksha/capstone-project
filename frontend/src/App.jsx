import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth pages (from feature/login-register)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Home dashboard (from feature/login-register)
import Home from './pages/Home';

// Identity Verification (from frontend-verification-ui)
import VerificationPage from './pages/VerificationPage';

// Student exam dashboard (from feature/student-exam-dashboard)
import StudentLayout from './layouts/StudentLayout';
import Dashboard from './pages/student/Dashboard';
import AvailableExams from './pages/student/AvailableExams';
import MyExamsTab from './pages/student/MyExamsTab';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default: redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Auth Routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Home / Student Profile ── */}
        <Route path="/home" element={<Home />} />

        {/* ── Identity Verification (camera + upload) ── */}
        <Route path="/verification" element={<VerificationPage />} />

        {/* ── Student Exam Dashboard ── */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="available" element={<AvailableExams />} />
          <Route path="my-exams" element={<MyExamsTab />} />
          <Route path="activity" element={<div>Activity Page</div>} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;