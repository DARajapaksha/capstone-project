import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { ProfileProvider } from './contexts/ProfileContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import VerificationPage from './pages/VerificationPage';
import StudentLayout from './layouts/StudentLayout';
import Dashboard from './pages/student/Dashboard';
import AvailableExams from './pages/student/AvailableExams';
import MyExamsTab from './pages/student/MyExamsTab';
import ActivityPage from './pages/student/ActivityPage';

function App() {
  return (
    <ProfileProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />



          {/* Student Dashboard with sidebar layout */}
          <Route path="/student" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="available" element={<AvailableExams />} />
            <Route path="my-exams" element={<MyExamsTab />} />
            <Route path="activity" element={<ActivityPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ProfileProvider>
  );
}

export default App;