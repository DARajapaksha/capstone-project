import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './layouts/StudentLayout';
import Dashboard from './pages/student/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/student" element={<StudentLayout />}>
          {/* The index route means this shows up first */}
          <Route index element={<Dashboard />} />
          <Route path="available" element={<div>Available Exams Page</div>} />
          <Route path="my-exams" element={<div>My Exams Page</div>} />
          <Route path="activity" element={<div>Activity Page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;