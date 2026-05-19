import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

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
import ActivityPage from './pages/student/ActivityPage';
import ProfilePage from './pages/student/ProfilePage';


function App() {
  return (
    <Router>
      <Routes>
        {/* Default: redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Public-only Auth Routes (redirect away if already logged in) ── */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* ── Protected: Home / Student Profile ── */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* ── Protected: Identity Verification ── */}
        <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />

        {/* ── Protected: Student Exam Dashboard ── */}
        <Route path="/student" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="available" element={<AvailableExams />} />
          <Route path="my-exams" element={<MyExamsTab />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
